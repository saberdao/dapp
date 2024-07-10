import invariant from 'tiny-invariant';
import { getReplicaRewards } from '@/src/helpers/replicaRewards';
import { TokenInfo } from '@saberhq/token-utils';
import { useQuery } from '@tanstack/react-query';
import useQuarry from '../useQuarry';
import useQuarryMiner from './useQuarryMiner';
import { useWallet } from '@solana/wallet-adapter-react';

export default function useGetSecondaryPayrolls(lpToken: TokenInfo) {
    const { data: quarry } = useQuarry();
    const { data: miner } = useQuarryMiner(lpToken);
    const { wallet } = useWallet();
    
    return useQuery({
        queryKey: ['secondaryPayrolls', lpToken.address],
        queryFn: async () => {
            invariant(quarry);
            invariant(miner);
            
            if (!miner.mergeMiner || !miner.replicaInfo) {
                return [];
            }

            const replicas = await Promise.all(miner.replicaInfo.replicaQuarries.map(async (replicaQuarryInfo) => {
                invariant(wallet?.adapter.publicKey);
                try {
                    const result = await getReplicaRewards(
                        quarry.sdk,
                        lpToken,
                        replicaQuarryInfo,
                        wallet.adapter.publicKey
                    );
                    return result;
                } catch (e) {
                    return null;
                }
            }));

            return replicas.filter((x): x is Awaited<ReturnType<typeof getReplicaRewards>> => Boolean(x));
        },
        enabled: !!lpToken && !!quarry && !!miner && !!wallet,
        refetchInterval: 60000,
    });
}