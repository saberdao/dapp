import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Token, TokenAmount, TokenInfo } from '@saberhq/token-utils';
import invariant from 'tiny-invariant';
import { executeMultipleTxs, sendTransaction } from '../../helpers/transaction';
import useUserGetLPTokenBalance from './useGetLPTokenBalance';
import useQuarryMiner from './useQuarryMiner';
import useProvider from '../useProvider';
import { getClaimIxs } from '../../helpers/claim';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import useQuarry from '../useQuarry';
import useNetwork from '../useNetwork';
import BN from 'bn.js';
import { getReplicaRewards } from '@/src/helpers/replicaRewards';

export default function useClaim(lpToken: TokenInfo) {
    const { connection } = useConnection();
    const { wallet } = useWallet();
    const { data: balance } = useUserGetLPTokenBalance(lpToken.address);
    const { data: miner } = useQuarryMiner(lpToken);
    const { data: quarry } = useQuarry();
    const { saber } = useProvider();

    const claim = async () => {
        if (!miner || !quarry || !wallet?.adapter.publicKey || !balance || !saber) {
            return;
        }

        const allTxsToExecute: { txs: TransactionInstruction[]; description: string }[] = [];

        // Primary rewards
        const ixs = await getClaimIxs(saber, miner, wallet);
        allTxsToExecute.push({
            txs: ixs,
            description: 'Claim rewards'
        });
        
        // Secondary rewards
        if (miner.mergeMiner && miner.replicaInfo) {
            await Promise.all(miner.replicaInfo.replicaQuarries.map(async (replicaQuarryInfo) => {
                invariant(miner.mergeMiner);
                invariant(miner.mergePool);
                invariant(wallet.adapter.publicKey);

                const T = await miner.mergeMiner.claimReplicaRewards(new PublicKey(replicaQuarryInfo.rewarder));

                try {
                    // Get the amount to claim. If <=0, skip.
                    const { payroll, replicaMinerData } = await getReplicaRewards(
                        quarry.sdk,
                        lpToken,
                        replicaQuarryInfo,
                        wallet.adapter.publicKey
                    );    
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
                    if (reward <= 0) {
                        throw Error('Not enough rewards');
                    }
                } catch (e) {
                    // No rewards
                    return;
                }

                allTxsToExecute.push({
                    txs: [...T.instructions],
                    description: 'Claim replica rewards'
                });
            }));
        }
        
        await executeMultipleTxs(connection, allTxsToExecute, wallet);
    };

    return { claim };
}
