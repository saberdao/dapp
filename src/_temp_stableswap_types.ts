import { PublicKey } from '@solana/web3.js';
import { Percent } from '@ubeswap/token-math';

/**
 * Info about the tokens to swap.
 */
export interface SwapTokenInfo {
    /**
     * The account that admin fees go to.
     */
    adminFeeAccount: PublicKey;
    /**
     * Mint of the token.
     */
    mint: PublicKey;
    /**
     * This swap's token reserves.
     */
    reserve: PublicKey;
}

export interface StableSwapConfig {
    /**
     * The public key identifying this instance of the Stable Swap.
     */
    readonly swapAccount: PublicKey;
    /**
     * Authority
     */
    readonly authority: PublicKey;
    /**
     * Program Identifier for the Swap program
     */
    readonly swapProgramID: PublicKey;
    /**
     * Program Identifier for the Token program
     */
    readonly tokenProgramID: PublicKey;
}

export type Fees = {
    trade: Percent;
    withdraw: Percent;
    adminTrade: Percent;
    adminWithdraw: Percent;
};

/**
 * Info about the tokens to swap.
 */
export interface SwapTokenInfo {
    /**
     * The account that admin fees go to.
     */
    adminFeeAccount: PublicKey;
    /**
     * Mint of the token.
     */
    mint: PublicKey;
    /**
     * This swap's token reserves.
     */
    reserve: PublicKey;
}

/**
 * State of a StableSwap, read from the swap account.
 */
export interface StableSwapState {
    /**
     * Whether or not the swap is initialized.
     */
    isInitialized: boolean;

    /**
     * Whether or not the swap is paused.
     */
    isPaused: boolean;

    /**
     * Nonce used to generate the swap authority.
     */
    nonce: number;

    /**
     * Mint account for pool token
     */
    poolTokenMint: PublicKey;

    /**
     * Admin account
     */
    adminAccount: PublicKey;

    tokenA: SwapTokenInfo;
    tokenB: SwapTokenInfo;

    /**
     * Initial amplification coefficient (A)
     */
    initialAmpFactor: bigint;

    /**
     * Target amplification coefficient (A)
     */
    targetAmpFactor: bigint;

    /**
     * Ramp A start timestamp
     */
    startRampTimestamp: number;

    /**
     * Ramp A start timestamp
     */
    stopRampTimestamp: number;

    /**
     * When the future admin can no longer become the admin, if applicable.
     */
    futureAdminDeadline: number;

    /**
     * The next admin.
     */
    futureAdminAccount: PublicKey;

    /**
     * Fee schedule
     */
    fees: Fees;
}