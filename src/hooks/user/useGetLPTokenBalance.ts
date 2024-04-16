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
                return { balance, userAta: userAta.accounts.lptoken.address };
            } catch (e) {
                // Account not initialised
                return null;
            }
        },
        enabled: !!wallet?.adapter.publicKey && !!lpToken,
        refetchInterval: 5000,
    });
}