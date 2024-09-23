import { useQuery } from '@tanstack/react-query';

export type PoolsMetricInfo = Record<string, {
    c: number;
    o: number;
    h: number;
    l: number;
    v: number;
    fees: number;
    feesUsd: number;
}>

export default function usePoolsData() {
    return useQuery({
        queryKey: ['poolsMetricsData'],
        staleTime: 1000 * 60 * 60,
        queryFn: async () => {
            // Get LATEST record
            const data = await fetch('https://raw.githubusercontent.com/saberdao/birdeye-data/refs/heads/main/volume.json');
            const pools = await data?.json();

            return pools as PoolsMetricInfo;
        },
    });
}