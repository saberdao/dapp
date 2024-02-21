import { Connection, ParsedAccountData, PublicKey } from '@solana/web3.js';
import throat from 'throat';
import { chunk } from 'lodash';
import { PoolInfoRaw, PoolInfoRawWithReserves } from '../types';

export const appendReserveAmounts = async (connection: Connection, data: readonly PoolInfoRaw[]): Promise<PoolInfoRawWithReserves[]> => {
    // First get all reserve token accounts we need to fetch info for
    const accounts = data.map((pool) => ([pool.swap.state.tokenA.reserve, pool.swap.state.tokenB.reserve])).flat();

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

    return data.map((pool) => {
        return {
            ...pool,
            swap: {
                ...pool.swap,
                reserves: {
                    tokenA: tokenAmountsObject[pool.swap.state.tokenA.reserve],
                    tokenB: tokenAmountsObject[pool.swap.state.tokenB.reserve],
                },
            },
        };
    });
};
