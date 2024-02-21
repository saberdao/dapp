// import { PoolInfoRaw, TokenInfo } from '../_temp_stableswap_types';
// import { ReferencePrice } from '../types';

// const findPrice = (pools: readonly PoolInfoRaw[], pool: PoolInfoRaw, token: TokenInfo): number => {
//     const otherToken = pool.tokens.find((t) => t.address !== token.address);
//     if (!otherToken) {
//         return 0;
//     }

//     const otherPool = pools.find((p) => {
//         return p.tokens.find((t) => t.address === otherToken.address);
//     });

//     if (!otherPool) {
//         return 0;
//     }

//     const otherTokenPrice = otherToken.price ?? findPrice(pools, otherPool, otherToken);
//     const otherTokenReserve = otherPool.swap.state.tokenAReserveAmount;
//     const thisTokenReserve = otherPool.swap.state.tokenBReserveAmount;

//     Pair.fromStableSwap({
//         config: valuesToKeys(pool.swap.config),
//         state: pool.swap.state,
//         exchange: pool,
//     }).token1Price

//     return otherTokenPrice * (otherTokenReserve / thisTokenReserve);
// };

// const recursivelyAppendPrices = (pools: readonly PoolInfoRaw[]) => {
//     pools.forEach((pool) => {
//         pool.tokens.forEach((token) => {
//             if (!token.price) {
//                 // If current pool other token has a price we can use that
//                 const price = findPrice(pools, pool, token);
//                 console.log(token.symbol, price);
//             }
//         });
//     });
// };

// export const appendPrices = (pools: readonly PoolInfoRaw[], prices: ReferencePrice) => {
//     const priceMints = Object.values(prices).reduce((acc, val) => {
//         acc[val.referenceMint] = val.price;
//         return acc;
//     }, {} as Record<string, number>);

//     // First add all reference prices to the pools
//     pools.forEach((pool) => {
//         pool.tokens.forEach((token) => {
//             // Direct
//             if (priceMints[token.address]) {
//                 token.price = priceMints[token.address];
//             }

//             // Saber wrapped token
//             if (priceMints[token.extensions?.assetContract ?? '']) {
//                 token.price = priceMints[token.extensions?.assetContract!];
//             }
//         });
//     });

//     // Recursively calculate the price of every other token
//     recursivelyAppendPrices(pools);


//     console.log(pools)
//     return pools;
// };
