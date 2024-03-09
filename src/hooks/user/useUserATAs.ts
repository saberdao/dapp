import { AssociatedTokenAccount } from '@saberhq/sail';
import { RAW_SOL_MINT, Token, TokenAmount, WRAPPED_SOL, getATAAddressesSync } from '@saberhq/token-utils';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import useNetwork from '../useNetwork';

export default function useUserATAs(
    mints: (Pick<Token, 'address'> | null | undefined)[],
    ignoreWrap = false,
) {
    const { wallet } = useWallet();
    const { connection } = useConnection();
    const { network } = useNetwork();

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
            const userAtas = mints.filter((x): x is Token => !!x).map((mint, i) => ({
                mint,
                ata: userAtasObj.accounts[i].address,
            }));

            const result = await Promise.all(
                userAtas.map(async (acc) => {
                    let balance = '0';
                    let isInitialized = false;
                    try {
                        // @TODO batch and cache this
                        if (!ignoreWrap && (acc.mint.address === RAW_SOL_MINT.toString() || acc.mint.address === WRAPPED_SOL[network].address)) {
                            const solBalance = await connection.getBalance(wallet.adapter.publicKey!);
                            balance = solBalance.toString();
                            isInitialized = true;
                        } else {
                            const balanceResult = await connection.getTokenAccountBalance(acc.ata);
                            balance = balanceResult.value.amount;
                            isInitialized = true;
                        }
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