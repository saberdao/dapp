import { PublicKey } from '@solana/web3.js';
import { Percent } from '@ubeswap/token-math';
import { StableSwapState } from '@saberhq/stableswap-sdk';
import { u64 } from '@saberhq/token-utils';

import { StableSwapStateRaw } from '@/src/types/global';
import { valuesToKeys } from '@/src/helpers/keys';

export const parseRawSwapState = (state: StableSwapStateRaw): StableSwapState => {
    const initialAmpFactor = new u64(state.initialAmpFactor, 'hex');
    const targetAmpFactor = new u64(state.targetAmpFactor, 'hex');

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

        initialAmpFactor,
        targetAmpFactor,
        startRampTimestamp: state.startRampTimestamp,
        stopRampTimestamp: state.stopRampTimestamp,

        fees: {
            trade: new Percent(
                state.fees.trade.numerator ?? state.fees.trade.numeratorStr,
                state.fees.trade.denominator ?? state.fees.trade.denominatorStr,
            ),
            adminTrade: new Percent(
                state.fees.adminTrade.numerator ?? state.fees.adminTrade.numeratorStr,
                state.fees.adminTrade.denominator ?? state.fees.adminTrade.denominatorStr,
            ),
            withdraw: new Percent(
                state.fees.withdraw.numerator ?? state.fees.withdraw.numeratorStr,
                state.fees.withdraw.denominator ?? state.fees.withdraw.denominatorStr,
            ),
            adminWithdraw: new Percent(
                state.fees.adminWithdraw.numerator ?? state.fees.adminWithdraw.numeratorStr,
                state.fees.adminWithdraw.denominator ?? state.fees.adminWithdraw.denominatorStr,
            ),
        },
    };
};
