import { useQuery } from '@tanstack/react-query';
import { fetchNullableWithSessionCache } from '../helpers/fetch';
import { DetailedSwapSummary } from '../types';

export default function useGetSwaps(formattedNetwork: string) {
    return useQuery({
        queryKey: ['swaps'],
        staleTime: 1000 * 60,
        queryFn: async () => {
            const swaps = await fetchNullableWithSessionCache<
                readonly DetailedSwapSummary[]
            >(
                `https://raw.githubusercontent.com/saber-hq/saber-registry-dist/master/data/swaps.${formattedNetwork}.json`,
            );

            if (!swaps) {
                throw Error('Could not find swaps');
            }

            return swaps;
        },
        enabled: !!formattedNetwork,
    });
}