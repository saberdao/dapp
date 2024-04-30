import { PoolData } from '../types/global';

export const getPoolTVL = (pool: Omit<PoolData, 'metrics'>) => {
    // Get amount token A and B, and their USD prices, and calculate TVL
    const amountTokenA = pool.exchangeInfo.reserves[0].amount;
    const amountTokenB = pool.exchangeInfo.reserves[1].amount;

    const usdPriceA = pool.usdPrice.tokenA;
    const usdPriceB = pool.usdPrice.tokenB;

    const tvl = amountTokenA.asNumber * usdPriceA + amountTokenB.asNumber * usdPriceB;
    return tvl;
};
