import { useQuery } from '@tanstack/react-query';
import { fetchNullableWithSessionCache } from '../helpers/fetch';
import useGetPrices from './useGetPrices';
import { PoolInfoRaw } from '../types';

export default function useGetPools(formattedNetwork: string) {
    const { data: prices } = useGetPrices();

    return useQuery({
        queryKey: ['pools'],
        staleTime: 1000 * 60,
        queryFn: async () => {
            if (!prices) { 
                return;
            }

            const data = await fetchNullableWithSessionCache<{
                addresses: {
                    landlord: string;
                    landlordBase: string;
                };
                pools: readonly PoolInfoRaw[];
            }>(
                `https://raw.githubusercontent.com/saber-hq/saber-registry-dist/master/data/pools-info.${formattedNetwork}.json`,
            );

            if (!data) {
                throw Error('Could not find pool data');
            }

            return data;
        },
        enabled: !!formattedNetwork && !!prices,
    });
}