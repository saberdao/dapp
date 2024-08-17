import { useQuery } from '@tanstack/react-query';
import { fetchNullableWithSessionCache } from '../helpers/fetch';

type Info = {
    twitter: string;
    website: string;
    discord: string;
    other: string[];
}

export default function useGetPoolInfo() {
    return useQuery({
        queryKey: ['poolInfo'],
        staleTime: 1000 * 60,
        queryFn: async () => {
            const data = await fetchNullableWithSessionCache<Record<string, Info>>(
                `https://raw.githubusercontent.com/saberdao/info/main/poolInfo.json`,
            );

            if (!data) {
                throw Error('Could not find pool data');
            }

            return data;
        },
    });
}