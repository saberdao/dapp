import { SABER_CODERS, WrappedTokenActions } from '@saberhq/saber-periphery';
import type { Percent } from '@saberhq/token-utils';
import { getOrCreateATAs, Token, TokenAmount } from '@saberhq/token-utils';
import { TransactionInstruction, type Signer } from '@solana/web3.js';
import { useMemo } from 'react';
import invariant from 'tiny-invariant';

import { calculateWithdrawAll } from './calculateWithdrawAll';
import { calculateWithdrawOne } from './calculateWithdrawOne';
import { WrappedToken } from '../../../types/wrapped-token';
import { PoolData } from '../../../types';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import useProvider from '../../useProvider';
import useSettings from '../../useSettings';
import { StableSwap } from '@saberhq/stableswap-sdk';
import useUserGetLPTokenBalance from '../useGetLPTokenBalance';
import { createVersionedTransaction } from '../../../helpers/transaction';
import BigNumber from 'bignumber.js';
import useQuarryMiner from '../useQuarryMiner';
import { getClaimIxs } from '../../../helpers/claim';

export interface IWithdrawal {
    withdrawPoolTokenAmount?: TokenAmount;
    /**
     * If undefined, this is "withdraw all"
     */
    withdrawToken?: WrappedToken;
    /**
     * All wrapped tokens.
     */
    wrappedTokens?: WrappedToken[];

    pool: PoolData;

    actions: {
        unstake: boolean;
        withdraw: boolean;
    };
}

export interface WithdrawCalculationResult {
    estimates: readonly [TokenAmount | undefined, TokenAmount | undefined];
    minimums: readonly [TokenAmount | undefined, TokenAmount | undefined];
    fees: readonly [TokenAmount | undefined, TokenAmount | undefined];
    feePercents: readonly [Percent | undefined, Percent | undefined];
    slippages: readonly [Percent | undefined, Percent | undefined];
}

export interface IUseWithdraw extends WithdrawCalculationResult {
    handleWithdraw: () => Promise<string | undefined>;
    withdrawDisabledReason?: string;
    poolTokenAmount?: TokenAmount;
    withdrawToken?: WrappedToken;
}

const emptyFees = {
    estimates: [undefined, undefined],
    fees: [undefined, undefined],
    feePercents: [undefined, undefined],
    minimums: [undefined, undefined],
    slippages: [undefined, undefined],
} as const;

export const useWithdraw = ({
    withdrawPoolTokenAmount,
    withdrawToken,
    wrappedTokens,
    pool,
    actions,
}: IWithdrawal): IUseWithdraw | undefined => {
    const { wallet } = useWallet();
    const { provider, saber } = useProvider();
    const { connection } = useConnection();
    const { data: miner } = useQuarryMiner(pool.info.lpToken, true);
    const { data: userLP } = useUserGetLPTokenBalance(pool.info.lpToken.address);

    const { maxSlippagePercent } = useSettings();

    const { estimates, fees, feePercents, slippages, minimums } = useMemo(() => {
        if (!withdrawPoolTokenAmount || withdrawPoolTokenAmount.isZero() || !pool.exchangeInfo) {
            return emptyFees;
        }

        // Withdraw all
        if (withdrawToken === undefined) {
            return calculateWithdrawAll({
                poolTokenAmount: withdrawPoolTokenAmount,
                exchangeInfo: pool.exchangeInfo,
                maxSlippagePercent,
            });
        }

        if (!pool.virtualPrice) {
            return emptyFees;
        }

        return calculateWithdrawOne({
            exchangeInfo: pool.exchangeInfo,
            poolTokenAmount: withdrawPoolTokenAmount,
            withdrawToken,
            virtualPrice: pool.virtualPrice,
            maxSlippagePercent,
        });
    }, [
        pool.exchangeInfo,
        maxSlippagePercent,
        pool.virtualPrice,
        withdrawPoolTokenAmount,
        withdrawToken,
    ]);

    if (!provider || !wallet?.adapter.publicKey) {
        return undefined;
    }

    const swap = new StableSwap(pool.info.swap.config, pool.info.swap.state);

    const handleWithdraw = async () => {
        if (!actions.unstake && !actions.withdraw) {
            throw new Error('No actions');
        }
        if (!wallet.adapter.publicKey || !userLP) {
            throw new Error('wallet is null');
        }
        if (!wrappedTokens) {
            throw new Error('No wrapped tokens');
        }
        if (withdrawPoolTokenAmount === undefined) {
            throw new Error('No withdraw percentage');
        }
        if (minimums[0] === undefined || minimums[1] === undefined) {
            throw new Error('missing minimums');
        }

        const withdrawIxs: TransactionInstruction[] = [];

        if (actions.unstake && miner?.data) {
            const maxAmount = BigNumber.min(
                new BigNumber(miner.data.balance.toString()),
                withdrawPoolTokenAmount.raw.toString(),
            );
            const amount = new TokenAmount(new Token(pool.info.lpToken), maxAmount.toString());
            const stakeTX = miner.miner.withdraw(amount);
            withdrawIxs.push(...stakeTX.instructions);

            // Also redeem all SBR earned
            const ixs = await getClaimIxs(saber, miner, wallet);
            withdrawIxs.push(...ixs);
        }

        if (actions.withdraw) {
            if (withdrawToken !== undefined) {
                const minimum = minimums[0].token.equals(withdrawToken.value)
                    ? minimums[0].toString()
                    : minimums[1].toString();

                const txEnv = await saber.router
                    .createWithdrawOneActionFacade({
                        swap,
                        inputAmount: withdrawPoolTokenAmount,
                        minimumAmountOut: new TokenAmount(
                            withdrawToken.isWrapped()
                                ? withdrawToken.value
                                : withdrawToken.underlying,
                            minimum,
                        ),
                        adWithdrawAction: withdrawToken.isWrapped()
                            ? {
                                  action: 'adWithdraw',
                                  underlying: withdrawToken.underlying,
                                  decimals: withdrawToken.value.decimals,
                                  outputToken: withdrawToken.underlying,
                              }
                            : undefined,
                    })
                    .manualSSWithdrawOne();
                invariant(txEnv, 'transaction envelope not found on withdraw one');

                withdrawIxs.push(...txEnv.instructions);
            } else {
                const allInstructions = [];
                const {
                    accounts: { tokenA: userAccountA, tokenB: userAccountB },
                    instructions,
                } = await getOrCreateATAs({
                    provider,
                    mints: {
                        tokenA: pool.exchangeInfo.reserves[0].amount.token.mintAccount,
                        tokenB: pool.exchangeInfo.reserves[1].amount.token.mintAccount,
                    },
                });

                allInstructions.push(...instructions);

                const allSigners: Signer[] = [];
                allInstructions.push(
                    swap.withdraw({
                        userAuthority: wallet.adapter.publicKey!,
                        userAccountA,
                        userAccountB,
                        sourceAccount: userLP.userAta,
                        poolTokenAmount: withdrawPoolTokenAmount.toU64(),
                        minimumTokenA: minimums[0].toU64(),
                        minimumTokenB: minimums[1].toU64(),
                    }),
                );

                await Promise.all(
                    wrappedTokens.map(async (wTok) => {
                        if (wTok.isWrapped()) {
                            const action = await WrappedTokenActions.loadWithActions(
                                provider,
                                SABER_CODERS.AddDecimals.getProgram(provider),
                                wTok.underlying,
                                wTok.value.decimals,
                            );
                            const unwrapTx = await action.unwrapAll();
                            allInstructions.push(...unwrapTx.instructions);
                        }
                    }),
                );

                const txEnv = saber.newTx(allInstructions, allSigners);
                withdrawIxs.push(...txEnv.instructions);
            }
        }

        const vt = await createVersionedTransaction(
            connection,
            withdrawIxs,
            wallet.adapter.publicKey,
        );
        const hash = await wallet.adapter.sendTransaction(vt.transaction, connection);
        await connection.confirmTransaction(
            { signature: hash, ...vt.latestBlockhash },
            'processed',
        );
        return hash;
    };

    const withdrawDisabledReason = !pool
        ? 'Loading...'
        : !wallet
        ? 'Connect wallet'
        : !pool.info.lpToken || (userLP?.balance.value.uiAmount ?? 0) <= 0
        ? 'Insufficient balance'
        : pool.pair.pool.state.isPaused && withdrawToken !== undefined
        ? 'Withdraw one is paused'
        : withdrawPoolTokenAmount === undefined || withdrawPoolTokenAmount.isZero()
        ? 'Enter an amount'
        : slippages[0]?.greaterThan(maxSlippagePercent) ||
          slippages[1]?.greaterThan(maxSlippagePercent)
        ? 'Price impact too high'
        : undefined;

    return {
        handleWithdraw,
        withdrawDisabledReason,
        estimates,
        minimums,
        slippages,
        fees,
        feePercents,
        poolTokenAmount: withdrawPoolTokenAmount,
        withdrawToken,
    };
};
