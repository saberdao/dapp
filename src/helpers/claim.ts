import invariant from 'tiny-invariant';
import { SABER_IOU_MINT, SBR_MINT, SBR_REWARDER, Saber } from '@saberhq/saber-periphery';
import { Token, TokenAmount, TokenInfo, getOrCreateATAs } from '@saberhq/token-utils';
import { Wallet } from '@solana/wallet-adapter-react';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import useQuarryMiner from '../hooks/user/useQuarryMiner';
import { QuarrySDK, findMergeMinerAddress, findReplicaMintAddress } from '@quarryprotocol/quarry-sdk';
import { findMergePoolAddress, getReplicaRewards } from './replicaRewards';
import BN from 'bn.js';
import { createQuarryPayroll } from './quarry';
import { ReplicaQuarryInfo } from './rewarder';
import { SBR_INFO } from '../utils/builtinTokens';
import { saberQuarryInfo } from '../constants';
import { PoolData } from '../types';

const getClaimReplicaIx = async (
    quarry: QuarrySDK,
    miner: ReturnType<typeof useQuarryMiner>['data'],
    lpToken: TokenInfo,
    replicaQuarryInfo: ReplicaQuarryInfo,
    wallet: Wallet,
) => {
    invariant(wallet.adapter.publicKey);
    invariant(miner?.mergeMiner);

    // Get the amount to claim. If <=0, skip.
    const replicaRewards = await getReplicaRewards(
        quarry,
        lpToken,
        replicaQuarryInfo,
        wallet.adapter.publicKey
    );

    if (!replicaRewards) {
        return { instructions: [] };
    }
    
    const { payroll, replicaMinerData } = replicaRewards;
    
    const rewards = new TokenAmount(new Token({
        ...replicaQuarryInfo.rewardsToken,
        symbol: 'R',
        chainId: 103,
        address: replicaQuarryInfo.rewardsToken.mint,
        name: 'Reward token'
    }), payroll.calculateRewardsEarned(
        new BN(Math.floor(Date.now() / 1000)),
        replicaMinerData.balance,
        replicaMinerData.rewardsPerTokenPaid,
        replicaMinerData.rewardsEarned,
    ));

    const reward = rewards.asNumber;
    if (reward > 0) {
        const T = await miner.mergeMiner.claimReplicaRewards(new PublicKey(replicaQuarryInfo.rewarder));
        return { instructions: T.instructions, reward: rewards.toU64() };
    }

    return { instructions: [], reward: rewards.toU64() };
}

const getClaimPrimaryIx = async (
    quarry: QuarrySDK,
    miner: ReturnType<typeof useQuarryMiner>['data'],
    lpToken: TokenInfo,
    replicaQuarryInfo: Pick<ReplicaQuarryInfo, 'rewardsToken'>,
    wallet: Wallet,
) => {
    invariant(wallet.adapter.publicKey);
    invariant(miner?.mergePool);

    const mergePoolAddress = findMergePoolAddress({
        primaryMint: new PublicKey(lpToken.address),
    });
    const [mmAddress] = await findMergeMinerAddress({
        pool: mergePoolAddress,
        owner: wallet.adapter.publicKey,
    })

    const replicaMiner = await miner.quarry.getMinerActions(mmAddress);
    const replicaMinerData = await replicaMiner.fetchData()

    const payroll = createQuarryPayroll(replicaMiner.quarry.quarryData);
    const rewards = new TokenAmount(new Token({
        ...replicaQuarryInfo.rewardsToken,
        symbol: 'R',
        chainId: 103,
        address: replicaQuarryInfo.rewardsToken.mint,
        name: 'Reward token'
    }), payroll.calculateRewardsEarned(
        new BN(Math.floor(Date.now() / 1000)),
        replicaMinerData.balance,
        replicaMinerData.rewardsPerTokenPaid,
        replicaMinerData.rewardsEarned,
    ));
    const reward = rewards.asNumber;
    if (reward > 0) {
        const T2 = await miner.mergePool.claimPrimaryRewards(SBR_REWARDER, mmAddress);
        return T2.instructions;
    }

    return [];
}

export const getClaimIxs = async (
    saber: Saber,
    quarry: QuarrySDK,
    miner: ReturnType<typeof useQuarryMiner>['data'],
    pool: PoolData,
    wallet: Wallet,
) => {
    console.log(pool)
    invariant(wallet.adapter.publicKey);
    invariant(miner?.miner);

    const txToExecute: {
        txs: TransactionInstruction[],
        description: string
    }[] = [];

    // Calculate actual legacy rewards, as we can't trust the quarry miner data rewardsEarned.
    const payroll = createQuarryPayroll(miner.miner.quarry.quarryData);
    const legacyRewards = new TokenAmount(new Token(SBR_INFO), payroll.calculateRewardsEarned(
        new BN(Math.floor(Date.now() / 1000)),
        miner.stakedBalanceLegacy,
        miner.data?.rewardsPerTokenPaid ?? new BN(0),
        miner.data?.rewardsEarned ?? new BN(0),
    ));

    if (legacyRewards.asNumber > 0) {
        const claimTx = await miner.miner.claim();
        txToExecute.push({
            txs: [...claimTx.instructions],
            description: 'Claim rewards'
        });
    }

    // Calculate MM rewards from primary miner
    if (miner.mergeMinerData) {
        const payrollMM = createQuarryPayroll(miner.miner.quarry.quarryData);
        const mmRewards = new TokenAmount(new Token(SBR_INFO), payrollMM.calculateRewardsEarned(
            new BN(Math.floor(Date.now() / 1000)),
            miner.stakedBalanceMM,
            miner.mergeMinerData.rewardsPerTokenPaid,
            miner.mergeMinerData.rewardsEarned,
        ));

        if (mmRewards.asNumber > 0) {
            txToExecute.push({
                txs: [...await getClaimPrimaryIx(
                    quarry,
                    miner,
                    pool.info.lpToken,
                    saberQuarryInfo,
                    wallet
                )],
                description: 'Claim rewards'
            });
        }
    }
    

    // Secondary rewards
    if (miner.mergeMiner && miner.replicaInfo) {
        try {
            await Promise.all(miner.replicaInfo.replicaQuarries.map(async (replicaQuarryInfo, i) => {
                invariant(miner.mergeMiner);
                invariant(miner.mergePool);
                invariant(wallet.adapter.publicKey);

                const instructions1: TransactionInstruction[] = [];
                const instructions2: TransactionInstruction[] = [];

                // Add replica claim
                const replicaClaim = await getClaimReplicaIx(
                    quarry,
                    miner,
                    pool.info.lpToken,
                    replicaQuarryInfo,
                    wallet
                );
                instructions1.push(...replicaClaim.instructions);
                
                // Maybe redeem
                if (pool.replicaQuarryData?.[i].info.redeemer && replicaClaim?.reward) {
                    const redeemer = await quarry.loadRedeemer({
                        iouMint: new PublicKey(pool.replicaQuarryData?.[i].info.rewardsToken.mint),
                        redemptionMint: new PublicKey(pool.replicaQuarryData?.[i].info.redeemer.underlyingToken),
                    });
                    const { accounts, instructions } = await getOrCreateATAs({
                        provider: saber.provider,
                        mints: {
                            iou: redeemer.data.iouMint,
                            redemption: redeemer.data.redemptionMint,
                        },
                        owner: wallet.adapter.publicKey,
                    });
                
                    const redeemTx = await redeemer.redeemTokensIx({
                        tokenAmount: replicaClaim.reward,
                        sourceAuthority: wallet.adapter.publicKey,
                        iouSource: accounts.iou,
                        redemptionDestination: accounts.redemption,
                    });

                    instructions1.push(...instructions, redeemTx);
                }

                // Add primary claim
                instructions2.push(...await getClaimPrimaryIx(
                    quarry,
                    miner,
                    pool.info.lpToken,
                    replicaQuarryInfo,
                    wallet
                ));

                txToExecute.push({
                    txs: instructions1,
                    description: 'Claim replica rewards (1 / 2)'
                });

                txToExecute.push({
                    txs: instructions2,
                    description: 'Claim replica rewards (2 / 2)'
                });
            }));
        } catch (e) {
            // Do nothing
        }
    }
    console.log('here')

    // Redeem tx
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

    txToExecute.push({
        txs: [...instructions, redeemTx],
        description: 'Redeem IOU'
    });

    return txToExecute;
};
