import { QuarrySDK } from '@quarryprotocol/quarry-sdk';
import { useQuery } from '@tanstack/react-query';
import useProvider from './useProvider';

export default function useQuarry() {
    const { provider } = useProvider();

    return useQuery({
        queryKey: ['quarry'],
        queryFn: async () => {
            if (!provider) {
                return null;
            }

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
