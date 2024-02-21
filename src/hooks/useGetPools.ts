import { useQuery } from '@tanstack/react-query';
import { PoolInfoRaw } from '../_temp_stableswap_types';
import { fetchNullableWithSessionCache } from '../helpers/fetch';
import { useConnection } from '@solana/wallet-adapter-react';
import { appendReserveAmounts } from '../helpers/reserves';
import useGetPrices from './useGetPrices';
// import { appendPrices } from '../helpers/prices';

export default function useGetPools(formattedNetwork: string) {
    const { connection } = useConnection();
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

            // Get all reserve tokens
            const pools = await appendReserveAmounts(connection, data.pools);

            // Append the prices
            // pools = appendPrices(pools, prices);

            return {
                addresses: data.addresses,
                pools,
            };
        },
        enabled: !!formattedNetwork && !!prices,
    });
}