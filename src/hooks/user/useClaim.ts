import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TokenInfo } from '@saberhq/token-utils';
import invariant from 'tiny-invariant';
import { createVersionedTransaction, sendTransaction } from '../../helpers/transaction';
import useUserGetLPTokenBalance from './useGetLPTokenBalance';
import useQuarryMiner from './useQuarryMiner';
import useProvider from '../useProvider';
import { getClaimIxs } from '../../helpers/claim';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import useQuarry from '../useQuarry';

export default function useClaim(lpToken: TokenInfo, onSuccess: (tx: string) => void) {
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

        // Primary rewards
        const ixs = await getClaimIxs(saber, miner, wallet);
        await sendTransaction(
            connection,
            ixs,
            wallet,
            onSuccess,
        )

        // Secondary rewards
        if (miner.mergeMiner && miner.replicaInfo && miner.mergePool) {
            await Promise.all(miner.replicaInfo.replicaQuarries.map(async (replicaQuarry) => {
                invariant(miner.mergeMiner);
                invariant(miner.mergePool);

                // Only if we have >0 tokens as reward
                // const data = replicaQuarry.rewarder

                const T = await miner.mergeMiner.claimReplicaRewards(new PublicKey(replicaQuarry.rewarder));
            
                await sendTransaction(
                    connection,
                    T.instructions,
                    wallet,
                    onSuccess,
                )
            }));

        }
    };

    return { claim };
}