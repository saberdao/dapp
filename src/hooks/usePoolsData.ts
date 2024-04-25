import { useQuery } from '@tanstack/react-query';

import { SABER_DATA_REPO } from '@/src/constants';

export type PoolMetricInfo = {
    poolId: string;
    token1Id: string;
    token2Id: string;
    volumeInTok1: number;
    volumeInTok2: number;
    volumeInUSD: number;
    priceTok1: number;
    '24hFeeInUsd': number;
    priceTok2: number;
    amtToken1: number;
    amtToken2: number;
    tvlInUsd: number;
};

const keys = [
    'poolId',
    'token1Id',
    'token2Id',
    'volumeInTok1',
    'volumeInTok2',
    'volumeInUSD',
    'priceTok1',
    '24hFeeInUsd',
    'priceTok2',
    'amtToken1',
    'amtToken2',
    'tvlInUsd',
] as const;

export default function usePoolsData() {
    return useQuery({
        queryKey: ['poolsData'],
        staleTime: 1000 * 60 * 60,
        queryFn: async () => {
            // Get LATEST record
            const data = await fetch(`${SABER_DATA_REPO}/LATEST`);
            const latest = await data?.text();

            // Take that record
            const response = await fetch(`${SABER_DATA_REPO}/${latest.split(':')[1]}`);
            const text = await response.text();

            // Parse it
            const lines = text.split('\n');
            const pools: PoolMetricInfo[] = lines.slice(1).map((line) => {
                const pool: Partial<PoolMetricInfo> = {};

                const values = line.split(',');
                keys.forEach((key, i) => {
                    // @ts-expect-error
                    pool[key] = i > 2 ? parseFloat(values[i]) : values[i];
                });
                return pool as PoolMetricInfo;
            });

            return pools;
        },
    });
}
