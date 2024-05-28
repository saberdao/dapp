import { useQuery } from '@tanstack/react-query';
import { fetchNullableWithSessionCache } from '../helpers/fetch';

export default function useGetStats() {
    return useQuery({
        queryKey: ['stats'],
        staleTime: 1000 * 60,
        queryFn: async () => {
            const vesbr = await fetchNullableWithSessionCache<string>(`https://raw.githubusercontent.com/saberdao/data/main/vesbr_supply`);
            const totalSupply = await fetchNullableWithSessionCache<string>(`https://raw.githubusercontent.com/saberdao/data/main/total_supply`);
            const circulatingSupply = await fetchNullableWithSessionCache<string>(`https://raw.githubusercontent.com/saberdao/data/main/circulating_supply`);

            if (!vesbr || !totalSupply || !circulatingSupply) {
                throw Error('Could not find stats');
            }

            return {
                vesbr: parseFloat(vesbr),
                totalSupply: parseFloat(totalSupply),
                circulatingSupply: parseFloat(circulatingSupply),
            };
        },
    });
}