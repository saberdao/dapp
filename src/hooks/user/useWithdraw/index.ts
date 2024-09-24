import { SABER_CODERS, SABER_IOU_MINT, SBR_MINT, SBR_REWARDER, Saber, WrappedTokenActions } from '@saberhq/saber-periphery';
import type { Percent } from '@saberhq/token-utils';
import { getOrCreateATAs, Token, TokenAmount } from '@saberhq/token-utils';
import { PublicKey, TransactionInstruction, VersionedTransaction, type Signer } from '@solana/web3.js';
import { useMemo } from 'react';
import invariant from 'tiny-invariant';

import { calculateWithdrawAll } from './calculateWithdrawAll';
import { calculateWithdrawOne } from './calculateWithdrawOne';
import { WrappedToken } from '../../../types/wrappedToken';
import { PoolData } from '../../../types';
import { Wallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import useProvider from '../../useProvider';
import useSettings from '../../useSettings';
import { StableSwap } from '@saberhq/stableswap-sdk';
import useUserGetLPTokenBalance from '../useGetLPTokenBalance';
import { createVersionedTransaction, executeMultipleTxs } from '../../../helpers/transaction';
import BigNumber from 'bignumber.js';
import useQuarryMiner from '../useQuarryMiner';
import { getClaimIxs } from '../../../helpers/claim';
import { findMergePoolAddress, getReplicaRewards } from '@/src/helpers/replicaRewards';
import { findMergeMinerAddress } from '@quarryprotocol/quarry-sdk';
import useQuarry from '../../useQuarry';
import BN from 'bn.js';
import { SolanaProvider, TransactionEnvelope } from '@saberhq/solana-contrib';

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
        unstake: boolean,
        withdraw: boolean,
    }
}

export interface WithdrawCalculationResult {
  estimates: readonly [TokenAmount | undefined, TokenAmount | undefined];
  minimums: readonly [TokenAmount | undefined, TokenAmount | undefined];
  fees: readonly [TokenAmount | undefined, TokenAmount | undefined];
  feePercents: readonly [Percent | undefined, Percent | undefined];
  slippages: readonly [Percent | undefined, Percent | undefined];
}

export interface IUseWithdraw extends WithdrawCalculationResult {
  handleWithdraw: () => Promise<void>;
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

const getWithdrawIxs = async (
    provider: SolanaProvider,
    saber: Saber,
    wallet: Wallet,
    userAta: PublicKey,
    pool: PoolData,
    withdrawToken: WrappedToken | undefined,
    minimums: readonly [TokenAmount | undefined, TokenAmount | undefined],
    wrappedTokens: WrappedToken[],
    withdrawPoolTokenAmount: TokenAmount,
) => {
    const swap = new StableSwap(pool.info.swap.config, pool.info.swap.state);

    if (minimums[0] === undefined || minimums[1] === undefined) {
        throw new Error('missing minimums');
    }

    const withdrawIxs: TransactionInstruction[] = [];
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
                sourceAccount: userAta,
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

    return {
        txs: withdrawIxs,
        description: 'Withdraw'
    }
}

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
    const { data: quarry} = useQuarry()

    const { maxSlippagePercent } = useSettings();

    const { estimates, fees, feePercents, slippages, minimums } = useMemo(() => {
        if (
            !withdrawPoolTokenAmount ||
            withdrawPoolTokenAmount.isZero() ||
            !pool.exchangeInfo
        ) {
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

    const handleWithdraw = async () => {
        if (!actions.unstake && !actions.withdraw) {
            throw new Error('No actions');
        }
        if (!wallet.adapter.publicKey) {
            throw new Error('wallet is null');
        }
        if (!wrappedTokens) {
            throw new Error('No wrapped tokens');
        }
        if (withdrawPoolTokenAmount === undefined) {
            throw new Error('No withdraw percentage');
        }
        invariant(quarry);

        const allTxsToExecute: { txs: TransactionInstruction[]; description: string }[] = [];
        let amountUnstakedFromMM = new BN(0);

        if (actions.unstake && miner?.data) {
            // Merge miner withdraw IXs
            console.log(miner)
            if (miner.mergeMiner && miner.replicaInfo) {
                const maxAmount = BigNumber.min(new BigNumber(miner.stakedBalanceMM.toString()), withdrawPoolTokenAmount.raw.toString());
                const amount = new TokenAmount(new Token(pool.info.lpToken), maxAmount.toString());

                const unstakeReplicaTx: TransactionInstruction[] = [];
                const mergePoolAddress = findMergePoolAddress({
                    primaryMint: new PublicKey(pool.info.lpToken.address),
                });
                const mergePool = miner.quarry.sdk.mergeMine.loadMP({
                    mpKey: mergePoolAddress,
                });
                const [mmAddress] = await findMergeMinerAddress({
                    pool: mergePoolAddress,
                    owner: wallet.adapter.publicKey,
                })

                await Promise.all(miner.replicaInfo.replicaQuarries.map(async (replica) => {
                    invariant(wallet.adapter.publicKey);
                    invariant(miner.mergeMiner);
                    try {
                        // Only unstake if there is balance in this MM
                        const [mmAddress] = await findMergeMinerAddress({
                            pool: mergePool.key,
                            owner: wallet.adapter.publicKey,
                        })
                        const mergeMiner = await quarry.sdk.mergeMine.loadMM({
                            mmKey: mmAddress
                        });

                        if (mergeMiner.mm.data.replicaBalance.eq(new BN(0))) {
                            return;
                        }

                        const ixs = await mergePool.unstakeAllReplica(
                            new PublicKey(replica.rewarder),
                            mmAddress,
                        );
                        unstakeReplicaTx.push(...ixs.instructions);
                        return;
                    } catch (e) {
                        // Do nothing
                    }
            }))

                if (unstakeReplicaTx.length > 0) {
                    allTxsToExecute.push({
                        txs: unstakeReplicaTx,
                        description: 'Unstake replicas'
                    });
                }

                // Claim Saber
                const claimSaberIxs: TransactionInstruction[] = [];
                const withdrawSbr = await mergePool.withdraw({ amount, rewarder: SBR_REWARDER, mergeMiner: mmAddress });
                claimSaberIxs.push(...withdrawSbr.instructions);

                allTxsToExecute.push({
                    txs: claimSaberIxs,
                    description: 'Unstake LP'
                });

                // If not unstaking everything, restake replicas
                // Compare strings because the types are BigNumber and JSBI
                const replicaDepositTxs: TransactionEnvelope[] = [];
                if (withdrawPoolTokenAmount.raw.toString() !== miner.stakedBalance.toString()) {
                    // Need restake replica
                    replicaDepositTxs.push(
                        ...(await Promise.all(
                            miner.replicaInfo.replicaQuarries.map(async (replica) => {
                                invariant(miner.mergeMiner, 'merge miner');
                                return await mergePool.stakeReplicaMiner(
                                    new PublicKey(replica.rewarder),
                                    mmAddress,
                                );
                            }),
                        )),
                    );
                    allTxsToExecute.push({
                        txs: replicaDepositTxs.map(t => t.instructions).flat(),
                        description: 'Redeposit replicas'
                    });
                }
                amountUnstakedFromMM = new BN(amount.raw.toString());
            } 

            if (miner.stakedBalanceLegacy.gt(new BN(0))) {
                const amountLeftToUnstake = new BigNumber(withdrawPoolTokenAmount.raw.toString())
                    .minus(amountUnstakedFromMM.toNumber())

                const maxAmount = BigNumber
                    .min(new BigNumber(miner.stakedBalanceLegacy.toString()), amountLeftToUnstake)
                if (maxAmount.gt(0)) {
                    const amount = new TokenAmount(new Token(pool.info.lpToken), maxAmount.toString());
                    const legacyUnstakeTx: TransactionInstruction[] = [];

                    const {
                        instructions,
                    } = await getOrCreateATAs({
                        provider,
                        mints: {
                            lptoken: new PublicKey(pool.info.lpToken.address),
                        },
                    });

                    // For legacy
                    const stakeTX = miner.miner.withdraw(amount);
                    legacyUnstakeTx.push(...instructions, ...stakeTX.instructions);

                    allTxsToExecute.push({
                        txs: legacyUnstakeTx,
                        description: 'Legacy unstake'
                    });
                }
            }

            // Add claim
            invariant(quarry);
            if (!miner.data) {
                await miner.miner.fetchData();
            }
            const claimTxs = await getClaimIxs(saber, quarry.sdk, miner, pool, wallet)
            allTxsToExecute.push(...claimTxs);
        }

        if (actions.withdraw) {
            invariant(userLP)
;            allTxsToExecute.push(await getWithdrawIxs(
                provider,
                saber,
                wallet,
                userLP.userAta,
                pool,
                withdrawToken,
                minimums,
                wrappedTokens,
                withdrawPoolTokenAmount
            ));
        }

        await executeMultipleTxs(connection, allTxsToExecute, wallet);
    };

    const withdrawDisabledReason = !pool
        ? 'Loading...'
        : !wallet
            ? 'Connect wallet'
            : !pool.info.lpToken || (userLP?.balance.value.uiAmount ?? 0) <= 0
                ? 'Insufficient balance'
                : pool.pair.pool.state.isPaused && withdrawToken !== undefined
                    ? 'Withdraw one is paused'
                    : withdrawPoolTokenAmount === undefined ||
              withdrawPoolTokenAmount.isZero()
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
