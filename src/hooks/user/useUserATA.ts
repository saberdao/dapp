import { AssociatedTokenAccount } from '@saberhq/sail';
import { RAW_SOL_MINT, Token, TokenAmount, WRAPPED_SOL, getATAAddressesSync } from '@saberhq/token-utils';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, ParsedAccountData, PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import useNetwork from '../useNetwork';
import { memoize } from 'lodash';
import { create, windowScheduler } from '@yornaath/batshit';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

const batcherFn = memoize((connection: Connection, owner: PublicKey) => create({
    name: 'userATA',
    fetcher: async (query: { mint: (Pick<Token, 'address'> | null | undefined), ignoreWrap: boolean }[]) => {
        const userAtasObj = getATAAddressesSync({
            mints: query.filter((x): x is { mint: Token; ignoreWrap: boolean } => !!x).reduce((acc, mint, i) => {
                acc[i] = new PublicKey(mint.mint.address);
                return acc;
            }, {} as Record<number, PublicKey>),
            owner,
        });

        const userAtas = query.filter((x): x is { mint: Token; ignoreWrap: boolean } => !!x).map((mint, i) => ({
            mint,
            ata: userAtasObj.accounts[i].address,
        }));

        const result = await connection.getMultipleParsedAccounts(
            userAtas.map((account) => account.ata),
        );

        const data = await Promise.all(result.value.map(async (item, i) => {
            try {
                if (!userAtas[i].mint.ignoreWrap && (userAtas[i].mint.mint.address === RAW_SOL_MINT.toString() || userAtas[i].mint.mint.address === WRAPPED_SOL['mainnet-beta'].address)) {
                    const solBalance = await connection.getBalance(owner);
                    return {
                        mint: userAtas[i].mint.mint.address,
                        ignoreWrap: userAtas[i].mint.ignoreWrap,
                        key: userAtas[i].ata,
                        balance: new TokenAmount(userAtas[i].mint.mint, solBalance.toString()),
                        isInitialized: true,
                    };
                }

                return {
                    mint: userAtas[i].mint.mint.address,
                    ignoreWrap: userAtas[i].mint.ignoreWrap,
                    key: userAtas[i].ata,
                    balance: new TokenAmount(userAtas[i].mint.mint, (item?.data as ParsedAccountData).parsed.info.tokenAmount.amount),
                    isInitialized: true,
                };
            } catch (e) {
                return {
                    mint: userAtas[i].mint.mint.address,
                    ignoreWrap: userAtas[i].mint.ignoreWrap,
                    key: userAtas[i].ata,
                    balance: new TokenAmount(userAtas[i].mint.mint, 0),
                    isInitialized: false,
                };
            }
        }));


        return data;
    },
    resolver: (atas, query) => {
        return atas?.find(ata => ata.mint === query?.mint?.address && ata.ignoreWrap === query.ignoreWrap) ?? null;
    },
    scheduler: windowScheduler(500),
  }));

type TokenAta = {
    mint: string;
    ignoreWrap: boolean;
    key: PublicKey;
    balance: TokenAmount;
    isInitialized?: boolean;
}

let batcher: ReturnType<typeof batcherFn> | null = null;

export default function useUserATA(
    mint: (Pick<Token, 'address'> | null | undefined),
    ignoreWrap = false,
) {
    const { wallet } = useWallet();
    const { connection } = useConnection();

    return useQuery({
        queryKey: ['userATA', wallet?.adapter.publicKey, mint?.address, ignoreWrap],
        queryFn: async (): Promise<TokenAta | null> => {
            if (!wallet?.adapter.publicKey) {
                return null;
            }

            if (!batcher) {
                batcher = batcherFn(connection, wallet.adapter.publicKey);
            }

            return batcher.fetch({ mint, ignoreWrap });
        },
        refetchInterval: 5000,
        enabled: !!connection && !!wallet?.adapter.publicKey,
    });
    
}