import { useQuery } from '@tanstack/react-query';
import { fetchNullableWithSessionCache } from '../helpers/fetch';
import { TokenInfo, TokenList } from '@saberhq/token-utils';
import { SBR_REWARDER } from '@saberhq/saber-periphery';

type ReplicaQuarryInfo = {
    displayRewardsToken: TokenInfo;
    quarry: string;
    rewarder: string;
    rewardsToken: {
      decimals: number;
      mint: string;
    };
    slug: string;
}

type QuarryRewarderInfo = {
    index: number;
    isReplica: boolean;
    mergePool: string;
    primaryQuarries: string[];
    primaryToken: {
      decimals: number;
      mint: string
    };
    primaryTokenInfo: TokenInfo;
    quarry: string;
    replicaMint: string;
    replicaQuarries: ReplicaQuarryInfo[];
    slug: string;
    stakedToken: {
      decimals: number;
      mint: string;
    }
}

export default function useGetRewarders(network: string) {
    return useQuery({
        queryKey: ['quarryRewarders', network],
        staleTime: 1000 * 60,
        queryFn: async () => {
            const rewarders = await fetchNullableWithSessionCache<{ quarries: QuarryRewarderInfo[] }>(
                `https://raw.githubusercontent.com/QuarryProtocol/rewarder-list-build/master/${network}/rewarders/${SBR_REWARDER}/full.json`,
            );

            if (!rewarders) {
                throw Error('Could not find rewarders');
            }

            return rewarders.quarries;
        },
        enabled: !!network,
    });
}