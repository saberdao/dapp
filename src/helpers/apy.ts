import { Percent } from '@ubeswap/token-math';
import { Token, TokenAmount } from '@saberhq/token-utils';
import BN from 'bn.js';

import { SBR_INFO } from '@/src/utils/builtinTokens';
import { PoolData } from '@/src/types';
import { calculateWithdrawAll } from '@/src/hooks/user/useWithdraw/calculateWithdrawAll';

const aprToApy = (apr: number) => {
    const apy = (1 + apr / 365) ** 365 - 1;
    return isNaN(apy) ? 0 : apy;
};

export const getFeeApy = (fees: number, volume: number) => {
    const apy = aprToApy((fees / volume) * 365) * 100;
    return isNaN(apy) ? 0 : apy;
};

export const getEmissionApy = (pool: PoolData, sbrPrice: number) => {
    if (!pool.quarryData) {
        return 0;
    }

    // Get emissions per day
    const annualRate = pool.quarryData.annualRewardsRate;
    const rate = annualRate.div(new BN(10 ** SBR_INFO.decimals));

    if (rate.toNumber() < 365) {
        return 0;
    }

    // Get staked TVL
    const stakedTokens = pool.quarryData.totalTokensDeposited.toString();
    const values = calculateWithdrawAll({
        poolTokenAmount: new TokenAmount(new Token(pool.info.lpToken), stakedTokens),
        maxSlippagePercent: new Percent(1, 10_000),
        exchangeInfo: pool.exchangeInfo,
    });

    const valueA = values.estimates[0] ? values.estimates[0].asNumber : 0;
    const valueB = values.estimates[1] ? values.estimates[1].asNumber : 0;
    const usdValueStaked = valueA * pool.usdPrice.tokenA + valueB * pool.usdPrice.tokenB;

    const apr = (sbrPrice * rate.toNumber()) / usdValueStaked;
    return aprToApy(apr) * 100;
};

export const getApy = (pool: PoolData, fee24h: number, sbrPrice: number) => {
    const apy = getFeeApy(fee24h, pool.metrics?.tvl ?? 0) + getEmissionApy(pool, sbrPrice);
    return isNaN(apy) ? 0 : apy;
};
