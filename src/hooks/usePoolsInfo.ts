import { PoolInfoRaw, DetailedSwapSummary } from '../_temp_stableswap_types';
import { useQuery } from '@tanstack/react-query';
import useGetSwaps from './useGetSwaps';
import useGetPools from './useGetPools';
import useNetwork from './useNetwork';
import { valuesToKeys } from '../helpers/keys';
import { parseRawSwapState } from '../helpers/state';

export default function () {
    const { formattedNetwork } = useNetwork();
    const { data: swaps } = useGetSwaps(formattedNetwork);
    const { data: pools } = useGetPools(formattedNetwork);

    return useQuery({
        queryKey: ['registryPoolsInfo'],
        queryFn: async () => {
            // Only run when we have the dependent info
            // Note these are also in the enabled boolean,
            // and that they are cached in localStorage to 
            // prevent re-fetching on every page load.
            // Especially for the reverse balances this
            // saves a ton of RPC calls.
            if (!swaps || !pools) {
                return;
            }

            return {
                addresses: valuesToKeys(pools.addresses),
                pools: pools.pools.map((poolRaw: unknown) => {
                    const pool = poolRaw as PoolInfoRaw;
                    const swap: DetailedSwapSummary | null =
                        (swaps.find(
                            (s: DetailedSwapSummary) => s.id === pool.id,
                        ) as DetailedSwapSummary) ?? null;
                    if (!swap) {
                        throw new Error('swap not found');
                    }
                    return {
                        ...pool,
                        summary: swap,
                        swap: {
                            config: valuesToKeys(pool.swap.config),
                            state: parseRawSwapState(pool.swap.state),
                        },
                    };
                }),
            };
        },
        enabled: !!swaps && !!pools,
    });
}
