import { useQuery } from '@tanstack/react-query';
import { fetchNullableWithSessionCache } from '../helpers/fetch';
import { TokenList } from '@saberhq/token-utils';

export default function useGetTokens(formattedNetwork: string) {
    return useQuery({
        queryKey: ['tokenList'],
        staleTime: 1000 * 60,
        queryFn: async () => {
            const tokens = await fetchNullableWithSessionCache<TokenList>(
                `https://raw.githubusercontent.com/saber-hq/saber-registry-dist/master/data/token-list.${formattedNetwork}.json`,
            );

            if (!tokens) {
                throw Error('Could not find tokens');
            }

            return tokens;
        },
        enabled: !!formattedNetwork,
    });
}