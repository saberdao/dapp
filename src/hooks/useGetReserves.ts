import { useQuery } from '@tanstack/react-query';
import { chunk } from 'lodash';
import { useConnection } from '@solana/wallet-adapter-react';
import { PoolInfoRaw } from '../types';
import { ParsedAccountData, PublicKey } from '@solana/web3.js';
import throat from 'throat';
import useNetwork from './useNetwork';

export default function useGetReserves(pools?: readonly PoolInfoRaw[]) {
    const { connection } = useConnection();
    const { endpoint } = useNetwork();

    return useQuery({
        queryKey: ['reserves', endpoint, (pools ?? []).length > 0 ? 'y' : 'n'],
        queryFn: async () => {
            if (!pools || pools.length === 0) {
                return null;
            }

            // First get all reserve token accounts we need to fetch info for
            const accounts = pools.map((pool) => ([pool.swap.state.tokenA.reserve, pool.swap.state.tokenB.reserve])).flat();

            // Chunk them in sets of 100
            const chunks = chunk(accounts, 100);

            // Ask the RPC to execute this
            const tokenAmounts = await Promise.all(chunks.map(throat(10, async (chunk) => {
                const result = await connection.getMultipleParsedAccounts(
                    chunk.map((account) => new PublicKey(account)),
                );
                return result.value.map((item, i) => {
                    return {
                        address: chunk[i],
                        amount: (item?.data as ParsedAccountData).parsed.info.tokenAmount.amount,
                    };
                });
            })));

            // Create object from the result
            const tokenAmountsObject = tokenAmounts.flat().reduce((acc, item) => {
                acc[item.address] = item.amount;
                return acc;
            }, {} as Record<string, string>);

            return tokenAmountsObject;
        },
        staleTime: 1000 * 60,
    });
}