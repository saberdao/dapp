import { QuarrySDK } from '@quarryprotocol/quarry-sdk';
import { SolanaProvider } from '@saberhq/solana-contrib';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';

export default function useQuarry() {
    const wallet = useAnchorWallet();
    const { connection } = useConnection();

    return useQuery({
        queryKey: ['quarry'],
        queryFn: async () => {
            if (!wallet) {
                return null;
            }

            const provider = SolanaProvider.load({
                connection,
                sendConnection: connection,
                wallet,
            });
            const sdk = QuarrySDK.load({
                provider,
            });

            return {
                sdk,
            };
        },
    });
}
