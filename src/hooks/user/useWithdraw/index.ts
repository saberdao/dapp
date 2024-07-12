import { SABER_CODERS, SABER_IOU_MINT, SBR_MINT, SBR_REWARDER, WrappedTokenActions } from '@saberhq/saber-periphery';
import type { Percent } from '@saberhq/token-utils';
import { getOrCreateATAs, Token, TokenAmount } from '@saberhq/token-utils';
import { PublicKey, TransactionInstruction, VersionedTransaction, type Signer } from '@solana/web3.js';
import { useMemo } from 'react';
import invariant from 'tiny-invariant';

import { calculateWithdrawAll } from './calculateWithdrawAll';
import { calculateWithdrawOne } from './calculateWithdrawOne';
import { WrappedToken } from '../../../types/wrappedToken';
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
import { findMergePoolAddress, getReplicaRewards } from '@/src/helpers/replicaRewards';
import { findMergeMinerAddress } from '@quarryprotocol/quarry-sdk';
import useQuarry from '../../useQuarry';
import BN from 'bn.js';
import { showTxSuccessMessage } from '@/src/components/TX';
import { TransactionEnvelope } from '@saberhq/solana-contrib';

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
    const { wallet, signAllTransactions } = useWallet();
    const { provider, saber } = useProvider();
    const { connection } = useConnection();
    const { data: miner } = useQuarryMiner(pool.info.lpToken, true);
    const { data: userLP } = useUserGetLPTokenBalance(pool.info.lpToken.address);
    const {data: quarry} = useQuarry()

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
            const maxAmount = BigNumber.min(new BigNumber(miner.stakedBalance.toString()), withdrawPoolTokenAmount.raw.toString());
            const amount = new TokenAmount(new Token(pool.info.lpToken), maxAmount.toString());
            const stakeTX = miner.miner.withdraw(amount);
            withdrawIxs.push(...stakeTX.instructions);

            // Has secondary rewards
            if (miner.replicaInfo && miner.replicaInfo.replicaQuarries) {
                const claimReplicaTx: TransactionInstruction[] = [];
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
                    const ixs = await mergePool.unstakeAllReplica(
                        new PublicKey(replica.rewarder),
                        mmAddress,
                    );
                    unstakeReplicaTx.push(...ixs.instructions);

                    try {
                        // Get the amount to claim. If <=0, skip.
                        const { payroll, replicaMinerData } = await getReplicaRewards(
                            quarry!.sdk,
                            pool.info.lpToken,
                            replica,
                            wallet.adapter.publicKey
                        );    
                        const rewards = new TokenAmount(new Token({
                            ...replica.rewardsToken,
                            symbol: 'R',
                            chainId: 103,
                            address: replica.rewardsToken.mint,
                            name: 'Reward token'
                        }), payroll.calculateRewardsEarned(
                            new BN(Math.floor(Date.now() / 1000)),
                            replicaMinerData.balance,
                            replicaMinerData.rewardsPerTokenPaid,
                            replicaMinerData.rewardsEarned,
                        ));
    
                        const reward = rewards.asNumber;
                        if (reward <= 0) {
                            throw Error('Not enough rewards');
                        }
                    } catch (e) {
                        // No rewards
                        return;
                    }

                    const T = await miner.mergeMiner.claimReplicaRewards(new PublicKey(replica.rewarder));
                    claimReplicaTx.push(...T.instructions);
                }));

                // Execute these separately because it doesn't fit in 1 TX
                const vt1 = await createVersionedTransaction(connection, claimReplicaTx, wallet.adapter.publicKey);
                const hash1 = await wallet.adapter.sendTransaction(vt1.transaction, connection);
                await connection.confirmTransaction({ signature: hash1, ...vt1.latestBlockhash }, 'processed');
                showTxSuccessMessage(hash1);

                const vt2 = await createVersionedTransaction(connection, unstakeReplicaTx, wallet.adapter.publicKey);
                const hash2 = await wallet.adapter.sendTransaction(vt2.transaction, connection);
                await connection.confirmTransaction({ signature: hash2, ...vt2.latestBlockhash }, 'processed');
                showTxSuccessMessage(hash2);

                // Claim Saber
                const claimSaberIxs: TransactionInstruction[] = [];
                const claimSbr = await mergePool.claimPrimaryRewards(SBR_REWARDER, mmAddress);
                const withdrawSbr = await mergePool.withdraw({ amount, rewarder: SBR_REWARDER, mergeMiner: mmAddress });
                // const unstakeSbr = await mergePool.unstakePrimaryMiner(SBR_REWARDER, mmAddress, amount);
                claimSaberIxs.push(...claimSbr.instructions);
                // claimSaberIxs.push(...unstakeSbr.instructions);
                claimSaberIxs.push(...withdrawSbr.instructions);
                const redeemer = await saber.loadRedeemer({
                    iouMint: SABER_IOU_MINT,
                    redemptionMint: new PublicKey(SBR_MINT),
                });
                const { accounts, instructions } = await getOrCreateATAs({
                    provider: saber.provider,
                    mints: {
                        iou: redeemer.data.iouMint,
                        redemption: redeemer.data.redemptionMint,
                    },
                    owner: wallet.adapter.publicKey,
                });
                const redeemTx = await redeemer.redeemAllTokensFromMintProxyIx({
                    iouSource: accounts.iou,
                    redemptionDestination: accounts.redemption,
                    sourceAuthority: wallet.adapter.publicKey,
                });
                claimSaberIxs.push(...instructions);
                claimSaberIxs.push(redeemTx);

                const vt3 = await createVersionedTransaction(connection, claimSaberIxs, wallet.adapter.publicKey, 250000);
                const hash3 = await wallet.adapter.sendTransaction(vt3.transaction, connection);
                await connection.confirmTransaction({ signature: hash3, ...vt3.latestBlockhash }, 'processed');
                showTxSuccessMessage(hash3);

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
                    const vt4 = await createVersionedTransaction(connection, replicaDepositTxs.map(t => t.instructions).flat(), wallet.adapter.publicKey, 250000);
                    vt4.transaction.sign(replicaDepositTxs.map(t => t.signers).flat())
                    const hash4 = await wallet.adapter.sendTransaction(vt4.transaction, connection);
                    await connection.confirmTransaction({ signature: hash4, ...vt4.latestBlockhash }, 'processed');
                    showTxSuccessMessage(hash4);
                }

                return hash3;
            } else {
                // Also redeem all SBR earned
                const ixs = await getClaimIxs(saber, miner, wallet);
                withdrawIxs.push(...ixs);
            }
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


        const vt4 = await createVersionedTransaction(connection, withdrawIxs, wallet.adapter.publicKey);
        const hash4 = await wallet.adapter.sendTransaction(vt4.transaction, connection);
        await connection.confirmTransaction({ signature: hash4, ...vt4.latestBlockhash }, 'processed');
        showTxSuccessMessage(hash4);

        return hash4;
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
