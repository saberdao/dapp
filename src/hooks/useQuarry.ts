import { QuarrySDK } from '@quarryprotocol/quarry-sdk';
import { useQuery } from '@tanstack/react-query';
import useProvider from './useProvider';

export default function useQuarry() {
    const { provider, connected } = useProvider();

    return useQuery({
        queryKey: ['quarry', `${connected}`],
        queryFn: async () => {
            const sdk = QuarrySDK.load({
                provider,
            });

            return {
                sdk,
            };
        },
        enabled: !!provider,
        staleTime: 1000 * 60,
    });
}
