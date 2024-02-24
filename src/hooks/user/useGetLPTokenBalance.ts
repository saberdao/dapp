import { useQuery } from '@tanstack/react-query';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getATAAddressesSync } from '@saberhq/token-utils';

export default function useUserGetLPTokenBalance(lpToken: string) {
    const { connection } = useConnection();
    const { wallet } = useWallet();

    return useQuery({
        queryKey: ['lpTokenBalance', wallet?.adapter.publicKey?.toString(), lpToken],
        queryFn: async () => {
            if (!wallet?.adapter.publicKey) {
                return null;
            }

            const userAta = getATAAddressesSync({
                mints: {
                    lptoken: new PublicKey(lpToken),
                },
                owner: wallet.adapter.publicKey,
            });

            try {
                const balance = await connection.getTokenAccountBalance(userAta.accounts.lptoken.address, 'processed');
                return { balance };
            } catch (e) {
                // Account not initialised
                return undefined;
            }
        },
        staleTime: 1000 * 60,
        enabled: !!wallet?.adapter.publicKey && !!lpToken,
    });
}