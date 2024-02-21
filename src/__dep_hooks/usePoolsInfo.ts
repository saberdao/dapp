import { useQuery } from '@tanstack/react-query';
import useGetSwaps from './useGetSwaps';
import useGetPools from './useGetPools';
import useNetwork from '../hooks/useNetwork';
import { valuesToKeys } from './keys';
import { parseRawSwapState } from './state';
import { DetailedSwapSummary, PoolInfo, PoolInfoRawWithReservesAndPrices } from '../types';
import useGetPrices from './useGetPrices';
import { appendPrices } from './prices';

export default function () {
    const { formattedNetwork } = useNetwork();
    const { data: swaps } = useGetSwaps(formattedNetwork);
    const { data: pools } = useGetPools(formattedNetwork);
    const { data: prices } = useGetPrices();

    return useQuery({
        queryKey: ['registryPoolsInfo'],
        queryFn: async () => {
            // Only run when we have the dependent info
            // Note these are also in the enabled boolean,
            // and that they are cached in localStorage to 
            // prevent re-fetching on every page load.
            // Especially for the reverse balances this
            // saves a ton of RPC calls.
            if (!swaps || !pools || !prices) {
                return;
            }

            // Append the prices
            const poolsWithPrices: PoolInfoRawWithReservesAndPrices[] = appendPrices(pools.pools, prices);

            return {
                addresses: valuesToKeys(pools.addresses),
                pools: poolsWithPrices.map((poolRaw) => {
                    const pool = poolRaw as PoolInfoRawWithReservesAndPrices;
                    const swap: DetailedSwapSummary | null =
                        (swaps.find(
                            (s: DetailedSwapSummary) => s.id === pool.id,
                        ) as DetailedSwapSummary) ?? null;
                    if (!swap) {
                        throw new Error('swap not found');
                    }
                    const info: PoolInfo = {
                        ...pool,
                        summary: swap,
                        swap: {
                            config: valuesToKeys(pool.swap.config),
                            state: parseRawSwapState(pool.swap.state),
                            reserves: pool.swap.reserves,
                        },
                    };
                    return info;
                }),
            };
        },
        enabled: !!swaps && !!pools && !!prices,
    });
}
