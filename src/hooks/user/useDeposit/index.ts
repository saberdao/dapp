import {
    SABER_CODERS,
    WrappedTokenActions,
} from '@saberhq/saber-periphery';
import type { TransactionEnvelope } from '@saberhq/solana-contrib';
import { IExchangeInfo, StableSwap } from '@saberhq/stableswap-sdk';
import {
    calculateEstimatedMintAmount,
    calculateVirtualPrice,
} from '@saberhq/stableswap-sdk';
import {
    Fraction,
    getOrCreateATAs,
    NATIVE_MINT,
    Percent,
    TokenAmount,
    ZERO,
} from '@saberhq/token-utils';
import type { PublicKey } from '@solana/web3.js';
import { Keypair } from '@solana/web3.js';
import { useCallback, useMemo } from 'react';
import invariant from 'tiny-invariant';
import { PoolData } from '../../../types';
import { useStableSwapTokens } from '../../useStableSwapTokens';
import useSettings from '../../useSettings';
import { calculateDepositSlippage } from './calculateDepositSlippage';
import { createEphemeralWrappedSolAccount } from '../../../utils/wrappedSol';
import useProvider from '../../useProvider';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { createVersionedTransaction, executeMultipleTxs } from '../../../helpers/transaction';
import useUserATA from '../useUserATA';

interface IDeposit {
  tokenAmounts: readonly TokenAmount[];
  pool: PoolData
}

export interface IUseDeposit {
    handleDeposit: (noStake: boolean) => Promise<void>;
    depositDisabledReason?: string;
    priceImpact: Percent | null;
    estimatedDepositSlippage: Percent | null;
    estimatedMint: ReturnType<typeof calculateEstimatedMintAmount> | null;
}

export const useDeposit = ({ tokenAmounts, pool }: IDeposit): IUseDeposit => {
    const { wallet } = useWallet();
    const { saber } = useProvider();
    const { connection } = useConnection();

    // tokens may still be in wrapped form
    const ssTokens = useStableSwapTokens(pool);

    const { maxSlippagePercent } = useSettings();
    const swap = new StableSwap(pool.info.swap.config, pool.info.swap.state);

    // token amounts wrapped back to their wrapped token
    const tokenAmountsWrapped = useMemo(() => {
        return tokenAmounts.map((amount, i) => {
            return ssTokens?.wrappedTokens[i]?.wrappedAmount(amount) ?? amount;
        });
    }, [tokenAmounts, ssTokens]);

    // estimated number of tokens minted from a deposit
    const estimatedMint = useMemo(() => {
        if (!pool.exchangeInfo) {
            return null;
        }

        const [amountA, amountB] = tokenAmountsWrapped;
        try {
            return calculateEstimatedMintAmount(
                pool.exchangeInfo,
                amountA?.raw ?? ZERO,
                amountB?.raw ?? ZERO,
            );
        } catch (e) {
            console.warn('Ignoring mint estimation calculation error', e);
        }

        return null;
    }, [pool.exchangeInfo, tokenAmountsWrapped]);

    // price impact is the % change on price you'll be getting
    // compared to the expected price, which is 1 LP = 1 token
    const priceImpact: Percent | null = useMemo(() => {
        if (!pool.exchangeInfo || !estimatedMint) {
            return null;
        }

        // total tokens to swap
        const totalTokens = tokenAmountsWrapped.reduce(
            (acc, amt) => acc.add(amt.asFraction),
            new Fraction(0),
        );
        if (totalTokens.isZero()) {
            return new Percent(0);
        }

        // pool token virtual price
        const virtualPrice = calculateVirtualPrice(pool.exchangeInfo);

        // estimated mint amount if there were no slippage
        const expectedMint = virtualPrice
            ? totalTokens.divide(virtualPrice)
            : new Fraction(0);

        return new Percent(1).subtract(
            estimatedMint.mintAmount.asFraction.divide(expectedMint),
        );
    }, [estimatedMint, pool.exchangeInfo, tokenAmountsWrapped]);

    const estimatedDepositSlippage = useMemo(() => {
        if (!pool.exchangeInfo) {
            return null;
        }

        const [amountA, amountB] = tokenAmountsWrapped;
        return calculateDepositSlippage(
            pool.exchangeInfo,
            amountA?.raw ?? ZERO,
            amountB?.raw ?? ZERO,
        );
    }, [pool.exchangeInfo, tokenAmountsWrapped]);

    const depositDisabledReason = !swap
        ? 'Loading...'
        : !wallet
            ? 'Connect wallet'
            : swap.state.isPaused
                ? 'Pool is paused'
                    : tokenAmounts.every((amount) => amount.isZero()) ||
              tokenAmounts.length === 0
                        ? 'Enter an amount'
                        : estimatedDepositSlippage?.greaterThan(maxSlippagePercent)
                            ? 'Price impact too high'
                            : undefined;

    const handleSolDeposit = useCallback(
        async (
            swap: StableSwap,
            exchangeInfo: IExchangeInfo,
            mints: {
                lp: PublicKey;
                tokenA: PublicKey;
                tokenB: PublicKey;
            },
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            noStake: boolean,
        ): Promise<void> => {
            const allInstructions = [];
            // create ATAs if they don't exist
            const result = await getOrCreateATAs({
                provider: saber.provider,
                mints,
            });
            if (result.createAccountInstructions.lp) {
                allInstructions.push(result.createAccountInstructions.lp);
            }
            if (result.createAccountInstructions.tokenA) {
                allInstructions.push(result.createAccountInstructions.tokenA);
            }
            if (result.createAccountInstructions.tokenB) {
                allInstructions.push(result.createAccountInstructions.tokenB);
            }

            const [amountA, amountB] = tokenAmountsWrapped;
            invariant(amountA && amountB, 'amounts missing');

            invariant(wallet?.adapter.publicKey);

            const [amountAInput, amountBInput] = tokenAmounts;
            invariant(amountAInput && amountBInput, 'input amounts missing');

            // Create an ephemeral account for wrapped SOL
            const ephemeralAccount = Keypair.generate();
            const { init, accountKey, close } = await createEphemeralWrappedSolAccount({
                provider: saber.provider,
                amount: mints.tokenA.equals(NATIVE_MINT) ? amountA : amountB,
                accountKP: ephemeralAccount,
            });
            allInstructions.push(...init.instructions);

            let minimumPoolTokenAmount = new TokenAmount(
                exchangeInfo.lpTotalSupply.token,
                0,
            );
            try {
                const estimatedMint = calculateEstimatedMintAmount(
                    exchangeInfo,
                    amountA.raw,
                    amountB.raw,
                );

                // minimum lp token amount to receive from the deposit, considering slippage
                minimumPoolTokenAmount = estimatedMint.mintAmount.reduceBy(maxSlippagePercent);
            } catch (e) {
                //
            }

            invariant(estimatedMint, 'minimumPoolTokenAmount is null');

            allInstructions.push(
                swap.deposit({
                    userAuthority: saber.provider.wallet.publicKey,
                    sourceA: mints.tokenA.equals(NATIVE_MINT)
                        ? accountKey
                        : result.accounts.tokenA,
                    sourceB: mints.tokenB.equals(NATIVE_MINT)
                        ? accountKey
                        : result.accounts.tokenB,
                    poolTokenAccount: result.accounts.lp,
                    tokenAmountA: amountA.toU64(),
                    tokenAmountB: amountB.toU64(),
                    minimumPoolTokenAmount: minimumPoolTokenAmount.toU64(),
                }),
            );

            // Close the ephemeral account for wrapped SOL
            allInstructions.push(...close.instructions);

            const txEnv: TransactionEnvelope = saber.newTx(allInstructions, [
                ephemeralAccount,
            ]);

            await executeMultipleTxs(connection, [{
                txs: txEnv.instructions,
                signers: [ephemeralAccount],
                description: 'Deposit'
            }], wallet);
        },
        [maxSlippagePercent, tokenAmounts, tokenAmountsWrapped],
    );

    const handleDeposit = useCallback(
        async (noStake: boolean): Promise<void> => {
            if (!swap || !pool.exchangeInfo) {
                throw new Error('swap or wallet or exchangeInfo is null');
            }
            invariant(saber, 'provider');

            const mints = {
                lp: pool.exchangeInfo.lpTotalSupply.token.mintAccount,
                tokenA: pool.exchangeInfo.reserves[0].amount.token.mintAccount,
                tokenB: pool.exchangeInfo.reserves[1].amount.token.mintAccount,
            };

            if (
                mints.tokenA.equals(NATIVE_MINT) ||
                mints.tokenB.equals(NATIVE_MINT)
            ) {
                return await handleSolDeposit(
                    swap,
                    pool.exchangeInfo,
                    mints,
                    noStake,
                );
            }

            const allInstructions = [];

            // create pool token account if it doesn't exist
            const result = await getOrCreateATAs({
                provider: saber.provider,
                mints,
            });
            if (result.createAccountInstructions.lp) {
                allInstructions.push(result.createAccountInstructions.lp);
            }

            const [amountA, amountB] = tokenAmountsWrapped;
            invariant(amountA && amountB, 'amounts missing');
            invariant(wallet?.adapter.publicKey, 'wallet not connected');

            const [amountAInput, amountBInput] = tokenAmounts;
            invariant(amountAInput && amountBInput, 'input amounts missing');

            if (!amountA.isZero() && !amountA.token.equals(amountAInput.token)) {
                const aWrapped = await WrappedTokenActions.loadWithActions(
                    saber.provider,
                    SABER_CODERS.AddDecimals.getProgram(saber.provider),
                    amountAInput.token,
                    amountA.token.decimals,
                );
                const doWrap = await aWrapped.wrap(amountAInput);
                allInstructions.push(...doWrap.instructions);
            } else if (result.createAccountInstructions.tokenA) {
                allInstructions.push(result.createAccountInstructions.tokenA);
            }

            if (!amountB.isZero() && !amountB.token.equals(amountBInput.token)) {
                const bWrapped = await WrappedTokenActions.loadWithActions(
                    saber.provider,
                    SABER_CODERS.AddDecimals.getProgram(saber.provider),
                    amountBInput.token,
                    amountB.token.decimals,
                );
                const doWrap = await bWrapped.wrap(amountBInput);
                allInstructions.push(...doWrap.instructions);
            } else if (result.createAccountInstructions.tokenB) {
                allInstructions.push(result.createAccountInstructions.tokenB);
            }

            let minimumPoolTokenAmount = new TokenAmount(
                pool.exchangeInfo.lpTotalSupply.token,
                0,
            );
            try {
                const estimatedMint = calculateEstimatedMintAmount(
                    pool.exchangeInfo,
                    amountA.raw,
                    amountB.raw,
                );

                // minimum lp token amount to receive from the deposit, considering slippage
                minimumPoolTokenAmount = estimatedMint.mintAmount.reduceBy(maxSlippagePercent);
            } catch (e) {
                //
            }


            invariant(estimatedMint, 'minimumPoolTokenAmount is null');

            allInstructions.push(
                swap.deposit({
                    userAuthority: saber.provider.wallet.publicKey,
                    sourceA: result.accounts.tokenA,
                    sourceB: result.accounts.tokenB,
                    poolTokenAccount: result.accounts.lp,
                    tokenAmountA: amountA.toU64(),
                    tokenAmountB: amountB.toU64(),
                    minimumPoolTokenAmount: minimumPoolTokenAmount.toU64(),
                }),
            );

            const txEnv: TransactionEnvelope = saber.newTx(allInstructions);

            await executeMultipleTxs(connection, [{
                txs: txEnv.instructions,
                description: 'Deposit'
            }], wallet);
        },
        [
            pool.exchangeInfo,
            handleSolDeposit,
            maxSlippagePercent,
            swap,
            tokenAmounts,
            tokenAmountsWrapped,
        ],
    );

    return {
        handleDeposit,
        depositDisabledReason,
        priceImpact,
        estimatedMint,
        estimatedDepositSlippage,
    };
};
