import { AssociatedTokenAccount } from '@saberhq/sail';
import { RAW_SOL_MINT, Token, TokenAmount, WRAPPED_SOL, getATAAddressesSync } from '@saberhq/token-utils';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ParsedAccountData, PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import useNetwork from '../useNetwork';
import { chunk } from 'lodash';
import throat from 'throat';

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

            const chunks = chunk(userAtas, 100);
            const tokenAmounts = (await Promise.all(chunks.map(throat(10, async (chunk) => {
                const result = await connection.getMultipleParsedAccounts(
                    chunk.map((account) => account.ata),
                );
                return await Promise.all(result.value.map(async (item, i) => {
                    try {
                        return {
                            key: chunk[i].ata,
                            balance: new TokenAmount(chunk[i].mint, (item?.data as ParsedAccountData).parsed.info.tokenAmount.amount),
                            isInitialized: true,
                        };
                    } catch (e) {
                        // Might look a bit strange this is in the error state, but it doesn't cost an extra RPC call
                        // and don't have to extract this case from the atas array above this way - easier.
                        if (!ignoreWrap && (chunk[i].mint.address === RAW_SOL_MINT.toString() || chunk[i].mint.address === WRAPPED_SOL[network].address)) {
                            const solBalance = await connection.getBalance(wallet.adapter.publicKey!);
                            return {
                                key: chunk[i].ata,
                                balance: new TokenAmount(chunk[i].mint, solBalance.toString()),
                                isInitialized: true,
                            };
                        }
                        return null;
                    }
                }));
            })))).flat().filter((x): x is { key: PublicKey, balance: TokenAmount, isInitialized: boolean } => !!x);
            return tokenAmounts;
        },
        refetchInterval: 5000,
    });
    
}