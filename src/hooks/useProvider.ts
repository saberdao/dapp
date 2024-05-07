import { Saber } from '@saberhq/saber-periphery';
import { SignerWallet, SolanaProvider } from '@saberhq/solana-contrib';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Keypair } from '@solana/web3.js';
import { useMemo } from 'react';
import useNetwork from './useNetwork';

export default function useProvider() {
    const wallet = useAnchorWallet();
    const { connection } = useConnection();
    const { endpoint } = useNetwork();

    const randomSigner = useMemo(() => {
        return new SignerWallet(Keypair.generate());
    }, []);

    const provider = useMemo(() => {
        return SolanaProvider.init({
            connection,
            wallet: wallet ?? randomSigner,
        });
    }, [wallet, endpoint]);

    return {
        connected: !!wallet,
        provider,
        saber: Saber.load({ provider }),
    };
}
