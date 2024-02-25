import { AssociatedTokenAccount } from '@saberhq/sail';
import { Token, TokenAmount, getATAAddressesSync } from '@saberhq/token-utils';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';

export default function useUserATAs(mints: (Token | null | undefined)[]) {
    const { wallet } = useWallet();
    const { connection } = useConnection();

    return useQuery({
        queryKey: ['userATAs', wallet?.adapter.publicKey, ...mints.map(m => m?.address)],
        queryFn: async (): Promise<AssociatedTokenAccount[]> => {
            if (!wallet?.adapter.publicKey) {
                return [];
            }

            const userAtasObj = getATAAddressesSync({
                mints: mints.filter((x): x is Token => !!x).reduce((acc, mint, i) => {
                    acc[i] = new PublicKey(mint.address);
                    return acc;
                }, {} as Record<number, PublicKey>),
                owner: wallet.adapter.publicKey,
            });
            console.log(userAtasObj);
            const userAtas = mints.filter((x): x is Token => !!x).map((mint, i) => ({
                mint,
                ata: userAtasObj.accounts[i].address,
            }));
            console.log(userAtas);

            const result = await Promise.all(
                userAtas.map(async (acc) => {
                    let balance = '0';
                    let isInitialized = false;
                    try {
                        // @TODO batch and cache this
                        const balanceResult = await connection.getTokenAccountBalance(acc.ata);
                        balance = balanceResult.value.amount;
                        isInitialized = true;
                    } catch (e) {
                        // do nothing.
                    }

                    return {
                        key: acc.ata,
                        isInitialized,
                        balance: new TokenAmount(acc.mint, balance),
                    };
                }),
            );
            return result;
        },
    });
    
}