import { Saber } from '@saberhq/saber-periphery';
import { SolanaProvider } from '@saberhq/solana-contrib';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';

export default function useProvider() {
    const wallet = useAnchorWallet();
    const { connection } = useConnection();

    if (!wallet) { 
        return {
            provider: null,
        };
    }

    const provider = SolanaProvider.init({
        connection,
        wallet,
    });

    return {
        provider,
        saber: Saber.load({ provider }),
    };
}
