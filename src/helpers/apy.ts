import { Percent } from '@ubeswap/token-math';
import invariant from 'tiny-invariant';
import { PoolData } from '../types';
import { calculateWithdrawAll } from '../hooks/user/useWithdraw/calculateWithdrawAll';
import { Token, TokenAmount } from '@saberhq/token-utils';
import BN from 'bn.js';
import { SBR_INFO } from '../utils/builtinTokens';

const aprToApy = (apr: number) => {
    const apy = (1 + apr / 365) ** 365 - 1;
    return isNaN(apy) ? 0 : apy;
};

export const getFeeApy = (fees: number, volume: number) => {
    const apy = aprToApy((fees / volume) * 365) * 100;
    return isNaN(apy) ? 0 : apy;
};

const getStakedTVL = (pool: PoolData) => {
    invariant(pool.quarryData, 'Pool data is undefined');
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
    return usdValueStaked;
}

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

    const usdValueStaked = getStakedTVL(pool);

    const apr = (sbrPrice * rate.toNumber()) / usdValueStaked;
    return aprToApy(apr) * 100;
};

export const getSecondaryEmissionApy = (pool: PoolData, replica: NonNullable<PoolData['replicaQuarryData']>[number], price: number) => {
    const annualRate = replica.data.annualRewardsRate;
    const rate = annualRate.div(new BN(10 ** replica.info.rewardsToken.decimals));

    if (rate.toNumber() < 365) {
        return 0;
    }

    const usdEmissionPerYear = rate.toNumber() * price;
    const usdValueStaked = getStakedTVL(pool);
    
    const apr = usdEmissionPerYear / usdValueStaked;

    return aprToApy(apr) * 100;
}

export const getApy = (pool: PoolData, fee24h: number, sbrPrice: number) => {
    const apy = getFeeApy(fee24h, pool.metrics?.tvl ?? 0) + getEmissionApy(pool, sbrPrice);
    return isNaN(apy) ? 0 : apy;
};