import { useQuery } from '@tanstack/react-query';
import { fetchNullableWithSessionCache } from '../helpers/fetch';
import { DetailedSwapSummary } from '../types';

export default function useDeprecatedPools() {
    return useQuery({
        queryKey: ['deprecatedPools'],
        staleTime: 1000 * 60,
        queryFn: async () => {
            const swaps = await fetchNullableWithSessionCache<
                readonly string[]
            >(
                `https://raw.githubusercontent.com/saberdao/info/main/deprecatedPools.json`,
            );

            if (!swaps) {
                throw Error('Could not find file');
            }

            return swaps;
        },
    });
}