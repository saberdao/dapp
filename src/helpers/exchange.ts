import { Pair } from '@saberhq/saber-periphery';
import { calculateAmpFactor, IExchangeInfo, calculateVirtualPrice } from '@saberhq/stableswap-sdk';
import { PoolInfo } from '../types';
import { Token, TokenAmount } from '@saberhq/token-utils';

export const getExchange = (pool: PoolInfo, reserves: Record<string, string>, lpTokenAmounts: Record<string, string>) => {
    const ampFactor = calculateAmpFactor(pool.swap.state);
    const exchangeInfo: IExchangeInfo = {
        ampFactor,
        fees: pool.swap.state.fees,
        lpTotalSupply: new TokenAmount(
            new Token(pool.lpToken),
            lpTokenAmounts[pool.lpToken.address.toString()],
        ),
        reserves: [
            {
                reserveAccount: pool.swap.state.tokenA.reserve,
                adminFeeAccount: pool.swap.state.tokenA.adminFeeAccount,
                amount: new TokenAmount(
                    new Token(pool.tokens[0]),
                    reserves[pool.swap.state.tokenA.reserve.toString()],
                ),
            },
            {
                reserveAccount: pool.swap.state.tokenB.reserve,
                adminFeeAccount: pool.swap.state.tokenB.adminFeeAccount,
                amount: new TokenAmount(
                    new Token(pool.tokens[1]),
                    reserves[pool.swap.state.tokenB.reserve.toString()],
                ),
            },
        ],
    };

    const virtualPrice = calculateVirtualPrice(exchangeInfo);
    const pair = Pair.fromStableSwap({
        config: pool.swap.config,
        state: pool.swap.state,
        exchange: exchangeInfo,
    });

    return {
        virtualPrice,
        pair,
        exchangeInfo,
    };
};
