import { DetailedSwapSummary, PoolInfoRaw } from '../_temp_stableswap_types';
import { fetchNullableWithSessionCache } from './fetch';

export const getSwaps = async (formattedNetwork: string) => {
    const swaps = await fetchNullableWithSessionCache<
        readonly DetailedSwapSummary[]
    >(
        `https://raw.githubusercontent.com/saber-hq/saber-registry-dist/master/data/swaps.${formattedNetwork}.json`,
    );

    if (!swaps) {
        throw Error('Could not find swaps');
    }

    return swaps;
};

export const getPoolsInfo = async (formattedNetwork: string) => {
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
};
