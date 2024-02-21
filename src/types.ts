import { Pair, StableSwapPool } from '@saberhq/saber-periphery';
import { IExchangeInfo, StableSwapConfig, StableSwapState, SwapTokenInfo } from '@saberhq/stableswap-sdk';
import { Fraction, TokenInfo, u64 } from '@saberhq/token-utils';
import { PublicKey } from '@solana/web3.js';

export enum Explorer {
    SOLSCAN = 'SOLSCAN'
}

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

export type OraclePrice = {
    [x in string]: number;
}

export const POOL_TAGS = {
    'wormhole-v1': 'Contains a Wormhole V1 asset.',
    'wormhole-v2': 'Contains a Wormhole V2 asset.',
};
export type PoolTag = keyof typeof POOL_TAGS;

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

export interface PoolsInfoData {
    addresses: {
        landlord: PublicKey;
        landlordBase: PublicKey;
    };
    pools: PoolInfo[];
}

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

type SwapTokenInfoRaw = {
    [K in keyof SwapTokenInfo]: string;
};

export type StableSwapStateRaw = {
    [K in keyof StableSwapState]: StableSwapState[K] extends PublicKey | u64
    ? string
    : StableSwapState[K] extends SwapTokenInfo
    ? SwapTokenInfoRaw
    : StableSwapState[K];
};

export type PoolData = {
    info: PoolInfo;
    exchangeInfo: IExchangeInfo;
    virtualPrice: Fraction | null;
    pair: Pair<StableSwapPool>
    usdPrice: {
        tokenA: number;
        tokenB: number;
    };
    metrics: {
        tvl: number;
    }
};
