import { useQuery } from '@tanstack/react-query';
import useGetSwaps from './useGetSwaps';
import useGetPools from './useGetPools';
import useNetwork from '../hooks/useNetwork';
import { valuesToKeys } from '../helpers/keys';
import { parseRawSwapState } from '../helpers/state';
import { DetailedSwapSummary, PoolData, PoolInfo, PoolInfoRaw } from '../types';
import useGetPrices from './useGetPrices';
import useGetReserves from './useGetReserves';
import useGetLPTokenAmounts from './useGetLPTokenAmounts';
import { getExchange } from '../helpers/exchange';
import { getPoolTVL } from '../helpers/prices';

export default function () {
    const { formattedNetwork } = useNetwork();
    const { data: swaps } = useGetSwaps(formattedNetwork);
    const { data: pools } = useGetPools(formattedNetwork);
    const { data: prices } = useGetPrices(pools?.pools);
    const { data: reserves } = useGetReserves(pools?.pools);
    const { data: lpTokenAmounts } = useGetLPTokenAmounts(pools?.pools);

    return useQuery({
        queryKey: ['registryPoolsInfo'],
        queryFn: async () => {
            // Only run when we have the dependent info
            // Note these are also in the enabled boolean,
            // and that they are cached in localStorage to 
            // prevent re-fetching on every page load.
            // Especially for the reverse balances this
            // saves a ton of RPC calls.
            if (!swaps || !pools || !prices || !reserves || !lpTokenAmounts) {
                return;
            }

            const data = {
                addresses: valuesToKeys(pools.addresses),
                pools: pools.pools.map((poolRaw): PoolData => {
                    const pool = poolRaw as PoolInfoRaw;
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
                        },
                    };

                    const data = {
                        info,
                        ...getExchange(info, reserves, lpTokenAmounts),
                        usdPrice: {
                            tokenA: prices[pool.swap.state.tokenA.mint.toString()] ?? 0,
                            tokenB: prices[pool.swap.state.tokenB.mint.toString()] ?? 0,
                        },
                    };
                    return {
                        ...data,
                        metrics: {
                            tvl: getPoolTVL(data),
                        },
                    };
                }),
            };

            return data;
        },
        enabled: !!swaps && !!pools && !!prices && !!reserves && !!lpTokenAmounts,
    });
}
