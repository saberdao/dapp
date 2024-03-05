import { Saber } from '@saberhq/saber-periphery';
import { SignerWallet, SolanaProvider } from '@saberhq/solana-contrib';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Keypair } from '@solana/web3.js';
import { useMemo } from 'react';

export default function useProvider() {
    const wallet = useAnchorWallet();
    const { connection } = useConnection();

    const provider = useMemo(() => {
        return SolanaProvider.init({
            connection,
            wallet: wallet ?? new SignerWallet(Keypair.generate()),
        });
    }, [wallet]);

    return {
        provider,
        saber: Saber.load({ provider }),
    };
}
