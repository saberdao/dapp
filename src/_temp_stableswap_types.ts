import { PublicKey } from '@solana/web3.js';
import { Percent } from '@ubeswap/token-math';


/**
 * Known origin chains.
 */
export const ORIGIN_CHAINS = [
    'bitcoin',
    'ethereum',
    'terra',
    'avalanche',
    'binance',
    'celo',
    'polygon',
    'fantom',
    'polygon',
    'heco',
] as const;

/**
 * Known origin chains.
 */
export type OriginChain = typeof ORIGIN_CHAINS[number];

/**
 * TokenExtensions.
 */
export interface SPLTokenExtensions {
    readonly website?: string;
    readonly bridgeContract?: string;
    readonly assetContract?: string;
    readonly address?: string;
    readonly explorer?: string;
    readonly twitter?: string;
    readonly github?: string;
    readonly medium?: string;
    readonly tgann?: string;
    readonly tggroup?: string;
    readonly discord?: string;
    readonly serumV3Usdt?: string;
    readonly serumV3Usdc?: string;
    readonly coingeckoId?: string;
    readonly imageUrl?: string;
    readonly description?: string;
}

/**
 * TokenInfo.
 */
export interface SPLTokenInfo {
    readonly chainId: number;
    readonly address: string;
    readonly name: string;
    readonly decimals: number;
    readonly symbol: string;
    readonly logoURI?: string;
    readonly tags?: string[];
    readonly extensions?: SPLTokenExtensions;
}

/**
 * Token extensions with additional information.
 */
export type TokenExtensions = SPLTokenExtensions & {
    /**
     * Mints of the underlying tokens that make up this token.
     * E.g. a Saber USDC-USDT LP token would use the USDC and USDT mints.
     */
    readonly underlyingTokens?: string[];
    /**
     * The protocol that this token comes from.
     * E.g. `wormhole-v1`, `wormhole-v2`, `allbridge`, `sollet`, `saber`.
     */
    readonly source?: string;

    /*
     ** Link to the source's website where you can acquire this token
     */
    readonly sourceUrl?: string;
    /**
     * The currency code of what this token represents, e.g. BTC, ETH, USD.
     */
    readonly currency?: string;
    /**
     * If this token is a bridged token, this is the chain that the asset originates from.
     */
    readonly originChain?: OriginChain;
};

/**
 * Token info.
 */
export type TokenInfo = Omit<SPLTokenInfo, 'extensions'> & {
    readonly extensions?: TokenExtensions;
};

export interface PoolInfo {
    id: string;
    name: string;
    tokens: readonly [TokenInfo, TokenInfo];
    tokenIcons: readonly [TokenInfo, TokenInfo];
    underlyingIcons: readonly [TokenInfo, TokenInfo];
    currency: CurrencyMarket;
    lpToken: TokenInfo;

    swap: {
        config: StableSwapConfig;
        state: StableSwapState;
    };
    newPoolID?: string;

    /**
     * Optional info on why the pool is deprecated.
     */
    deprecationInfo?: {
        /**
         * The pool that users should migrate their assets to.
         */
        newPoolID?: string;
        /**
         * Message showing why the pool is deprecated.
         */
        message?: string;
        /**
         * Link to more information.
         */
        link?: string;
    };
    tags?: readonly PoolTag[];
    summary: DetailedSwapSummary;
}

type SwapTokenInfoRaw = {
    [K in keyof SwapTokenInfo]: string;
};

export type StableSwapStateRaw = {
    [K in keyof StableSwapState]: StableSwapState[K] extends PublicKey | bigint
    ? string
    : StableSwapState[K] extends SwapTokenInfo
    ? SwapTokenInfoRaw
    : StableSwapState[K];
};

export type PoolInfoRaw = Omit<PoolInfo, 'swap'> & {
    swap: {
        config: {
            swapAccount: string;
            authority: string;
            swapProgramID: string;
            tokenProgramID: string;
        };
        state: StableSwapStateRaw;
    };
    hidden?: boolean;
};

export const POOL_TAGS = {
    'wormhole-v1': 'Contains a Wormhole V1 asset.',
    'wormhole-v2': 'Contains a Wormhole V2 asset.',
};
export type PoolTag = keyof typeof POOL_TAGS;

/**
 * A market
 */
export enum CurrencyMarket {
    USD = 'USD',
    BTC = 'BTC',
    LUNA = 'LUNA',
    FTT = 'FTT',
    SRM = 'SRM',
    SOL = 'SOL',
    SBR = 'SBR',
    ETH = 'ETH',
    EUR = 'EUR',
    TRY = 'TRY',
}

/**
 * Summary of a swap, coming directly from the chain.
 */
export interface SwapSummary {
    /**
     * Addresses of the tokens that back the pool.
     */
    underlyingTokens: readonly [string, string];
    /**
     * Number of decimals this pool's LP token has.
     */
    decimals: number;

    /**
     * Useful addresses to know about the pool.
     */
    addresses: {
        /**
         * The swap account.
         */
        swapAccount: string;
        /**
         * The swap authority.
         */
        swapAuthority: string;
        /**
         * Mint of the LP token.
         */
        lpTokenMint: string;
        /**
         * Token accounts holding the reserves of the LP.
         */
        reserves: readonly [string, string];
        /**
         * The key of the pool's quarry corresponding to the Saber rewarder.
         */
        quarry: string;
        /**
         * The key of the pool's Quarry merge pool.
         */
        mergePool: string;
        /**
         * The pool's admin.
         */
        admin: string;
    };
}

/**
 * Summary of a specific Swap.
 */
export interface DetailedSwapSummary extends SwapSummary {
    /**
     * Unique slug of the pool.
     */
    id: string;
    /**
     * Name of the pool.
     */
    name: string;
    /**
     * The currency of this pool.
     */
    currency: CurrencyMarket;

    /**
     * Addresses of the tokens to be displayed as the pool's underlying tokens.
     * This is also used to derive the pool's name, symbol, and icon.
     */
    displayTokens: readonly [string, string];
    /**
     * Sources of the pool tokens, if applicable.
     */
    sources?: string[];

    /**
     * Tags applicable to the pool.
     */
    tags?: readonly PoolTag[];

    /**
     * If a pool is being migrated, this is the ID of the new pool.
     */
    newPoolID?: string;
    /**
     * More information about when the pool was launched.
     */
    launchPost?: string;

    /**
     * If true, then this pool is verified and should be displayed on the pools list.
     * In other words, the pool ID must exist.
     *
     * One should only route and display verified pools.
     */
    isVerified: boolean;
}

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