import { useQuery } from 'react-query';
import useNetwork from './useNetwork';
import { PublicKey } from '@saberhq/solana-contrib';
import { Percent } from '@ubeswap/token-math';
import { mapValues } from 'lodash';
import { StableSwapStateRaw, StableSwapState, PoolInfoRaw, DetailedSwapSummary } from '../_temp_stableswap_types';
import { getPoolsInfo, getSwaps } from '../helpers/pools';


const valuesToKeys = <T extends Record<string, string>>(
    raw: T,
): { [K in keyof T]: PublicKey } => mapValues(raw, (addr) => new PublicKey(addr));


const parseRawSwapState = (state: StableSwapStateRaw): StableSwapState => {
    return {
        isInitialized: state.isInitialized,
        isPaused: state.isPaused,
        nonce: state.nonce,

        futureAdminDeadline: state.futureAdminDeadline,
        futureAdminAccount: new PublicKey(state.futureAdminAccount),
        poolTokenMint: new PublicKey(state.poolTokenMint),
        adminAccount: new PublicKey(state.adminAccount),

        tokenA: valuesToKeys(state.tokenA),
        tokenB: valuesToKeys(state.tokenB),

        initialAmpFactor: BigInt(`0x${state.initialAmpFactor}`),
        targetAmpFactor: BigInt(`0x${state.targetAmpFactor}`),
        startRampTimestamp: state.startRampTimestamp,
        stopRampTimestamp: state.stopRampTimestamp,

        fees: {
            trade: new Percent(
                state.fees.trade.numerator ?? state.fees.trade.numeratorStr,
                state.fees.trade.denominator ?? state.fees.trade.denominatorStr,
            ),
            adminTrade: new Percent(
                state.fees.adminTrade.numerator ?? state.fees.adminTrade.numeratorStr,
                state.fees.adminTrade.denominator ??
                state.fees.adminTrade.denominatorStr,
            ),
            withdraw: new Percent(
                state.fees.withdraw.numerator ?? state.fees.withdraw.numeratorStr,
                state.fees.withdraw.denominator ?? state.fees.withdraw.denominatorStr,
            ),
            adminWithdraw: new Percent(
                state.fees.adminWithdraw.numerator ??
                state.fees.adminWithdraw.numeratorStr,
                state.fees.adminWithdraw.denominator ??
                state.fees.adminWithdraw.denominatorStr,
            ),
        },
    };
};

export default function () {
    const { formattedNetwork } = useNetwork();

    return useQuery('registryPoolsInfo', async () => {
        const swaps = await getSwaps(formattedNetwork);
        const data = await getPoolsInfo(formattedNetwork);

        return {
            addresses: valuesToKeys(data.addresses),
            pools: data.pools.map((poolRaw: unknown) => {
                const pool = poolRaw as PoolInfoRaw;
                const swap: DetailedSwapSummary | null =
                    (swaps.find(
                        (s: DetailedSwapSummary) => s.id === pool.id,
                    ) as DetailedSwapSummary) ?? null;
                if (!swap) {
                    throw new Error('swap not found');
                }
                return {
                    ...pool,
                    summary: swap,
                    swap: {
                        config: valuesToKeys(pool.swap.config),
                        state: parseRawSwapState(pool.swap.state),
                    },
                };
            }),
        };
    }, { staleTime: 1000 * 3600 });
}
