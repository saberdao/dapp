import { useQuery } from '@tanstack/react-query';
import { SBR_REWARDER } from '@saberhq/saber-periphery';
import { getRewarder } from '../helpers/rewarder';

export default function useGetRewarders(network: string) {
    return useQuery({
        queryKey: ['quarryRewarders', network],
        staleTime: 1000 * 60,
        queryFn: async () => {
            return getRewarder(network, SBR_REWARDER.toString());
        },
        enabled: !!network,
    });
}