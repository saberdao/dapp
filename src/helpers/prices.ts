import { Pair } from "@saberhq/saber-periphery";
import { PoolInfoRawWithReserves, PoolInfoRawWithReservesAndPrices, ReferencePrice } from "../types";
import { valuesToKeys } from "./keys";
import { parseRawSwapState } from "./state";
import { calculateAmpFactor } from "@saberhq/stableswap-sdk";

const findPrice = (pools: readonly PoolInfoRawWithReservesAndPrices[], pool: PoolInfoRawWithReservesAndPrices, key: 'tokenA' | 'tokenB'): number | null => {
    const otherKey = key === 'tokenA' ? 'tokenB' : 'tokenA';
    const currentIndex = key === 'tokenA' ? 0 : 1;

    if (!pool.tokenPrices[otherKey]) {
        // Both are unknown, try to fetch one of them from another pool
        let priceFromOtherPool: number | null = null;
        pools.forEach((_pool) => {
            // Check matching contract addresses (when wrapped differently)
            if (_pool.tokens[currentIndex].extensions?.assetContract === pool.tokens[0].extensions?.assetContract && _pool.tokenPrices.tokenA) {
                priceFromOtherPool = _pool.tokenPrices.tokenA;
            }

            if (_pool.tokens[currentIndex].extensions?.assetContract === pool.tokens[1].extensions?.assetContract && _pool.tokenPrices.tokenB) {
                priceFromOtherPool = _pool.tokenPrices.tokenB;
            }
        });
        return priceFromOtherPool;
    }

    // const unitPrice = Pair.fromStableSwap({
    //     config: valuesToKeys(pool.swap.config),
    //     state,
    //     exchange: {
    //         ampFactor: calculateAmpFactor(state),
    //         fees: state.fees
    //         lpTotalSupply: TokenAmount;
    //         reserves: readonly[IReserve, IReserve];
    //     },
    // }).token1Price

    return parseInt(pool.swap.reserves[key]) / parseInt(pool.swap.reserves[otherKey]) * pool.tokenPrices[otherKey]!;
};

const recursivelyAppendPrices = (pools: readonly PoolInfoRawWithReservesAndPrices[], i = 0) => {
    pools.forEach((pool) => {
        if (!pool.tokenPrices.tokenA) {
            pool.tokenPrices.tokenA = findPrice(pools, pool, 'tokenA');
        }
        if (!pool.tokenPrices.tokenB) {
            pool.tokenPrices.tokenB = findPrice(pools, pool, 'tokenB');
        }
    });

    // Check if we have any unknown prices
    const unknownPrices = pools.filter((pool) => pool.tokenPrices.tokenA === null || pool.tokenPrices.tokenB === null);
    
    if (unknownPrices.length > 0 && i < 5) {
        recursivelyAppendPrices(pools,i+1);
    } else if (unknownPrices.length > 0) {
        console.log('Failed to get all prices. Give the rest a price of 0');
        console.log('Missing oracle prices for:', unknownPrices.map((pool) => pool.name).join(', '));
        unknownPrices.forEach((pool) => {
            pool.tokenPrices.tokenA = 0;
            pool.tokenPrices.tokenB = 0;
        });
    }
};

export const appendPrices = (poolsWithoutPrices: readonly PoolInfoRawWithReserves[], prices: ReferencePrice): PoolInfoRawWithReservesAndPrices[] => {
    const pools = [...poolsWithoutPrices] as PoolInfoRawWithReservesAndPrices[];
    const priceMints = Object.values(prices).reduce((acc, val) => {
        acc[val.referenceMint] = val.price;
        return acc;
    }, {} as Record<string, number>);

    // First add all reference prices to the pools
    pools.forEach((pool) => {
        pool.tokenPrices = { tokenA: null, tokenB: null };
        pool.tokens.forEach((token, i) => {
            const key = i === 0 ? 'tokenA' : 'tokenB';
            // Direct
            if (priceMints[token.address]) {
                pool.tokenPrices[key] = priceMints[token.address];
            }

            // Saber wrapped token
            if (priceMints[token.extensions?.assetContract ?? '']) {
                pool.tokenPrices[key] = priceMints[token.extensions?.assetContract!];
            }
        });
    });

    // Recursively calculate the price of every other token
    recursivelyAppendPrices(pools);

    return pools;
};
