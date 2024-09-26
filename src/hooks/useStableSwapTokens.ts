import type { AssociatedTokenAccount } from '@saberhq/sail';
import { Token } from '@saberhq/token-utils';
import * as Sentry from '@sentry/react';
import { useMemo } from 'react';

import { WrappedToken } from '../types/wrappedToken';
import useGetTokens from './useGetTokens';
import useNetwork from './useNetwork';
import { PoolData } from '../types';
import { rawSOLOverride } from '../helpers/rawSOL';
import { Tags } from '../utils/builtinTokens';
import useUserATA from './user/useUserATA';

interface ExchangeTokens {
    tokens?: readonly [Token, Token];
    underlyingTokens?: Token[];
    wrappedTokens: WrappedToken[];
    poolTokenAccount?: Token | null;
    tokenAccounts: readonly (Token | null | undefined)[];
    underlyingTokenAccounts: readonly (
        | Token
        | null
        | undefined
    )[];
}

export const useStableSwapTokens = (pool: PoolData): ExchangeTokens | undefined => {
    const { formattedNetwork } = useNetwork();
    const { data: allTokens } = useGetTokens(formattedNetwork);

    // tokensRaw may still be in wrapped form
    const tokens = [
        new Token(pool.info?.tokens[0]),
        new Token(pool.info?.tokens[1]),
    ] as const;

    // tokens are normalized
    const result =
        useMemo(() => {
            if (!allTokens) { 
                return undefined;
            }

            const underlyingTokens = tokens?.map((tok) => {
                if (tok.info.tags?.includes(Tags.DecimalWrapped)) {
                    const realTok = allTokens.tokens.find(
                        (t) => t.address === tok.info.extensions?.assetContract,
                    );
                    if (!realTok) {
                        const err = new Error(
                            'Missing decimal wrapper underlying in token list.',
                        );
                        throw err;
                    }
                    return realTok;
                }
                return tok;
            });
            const newUnderlyingTokens = underlyingTokens?.filter(
                (tok) => !tokens?.find((t) => t.address === tok?.address),
            );
            const wrappedTokens =
                tokens?.map((tok, i) => {
                    return new WrappedToken(tok, new Token(underlyingTokens?.[i]));
                }) ?? [];

            return { underlyingTokens, newUnderlyingTokens, wrappedTokens };
        }, [allTokens, tokens]);

    if (!result) {
        return undefined;
    }

    const tokenAccounts = [
        new Token(pool.info.lpToken),
        ...(tokens ?? []),
        ...(result?.newUnderlyingTokens.map(tok => new Token(tok)) ?? []),
    ].map(rawSOLOverride);

    const underlyingTokenAccounts = (result?.underlyingTokens?.map(tok => rawSOLOverride(new Token(tok))) ?? []);

    return {
        tokens,
        underlyingTokens: result.underlyingTokens.map(tok => new Token(tok)),
        wrappedTokens: result.wrappedTokens,
        poolTokenAccount: tokenAccounts?.[0],
        tokenAccounts: tokenAccounts?.slice(1) ?? [],
        underlyingTokenAccounts: underlyingTokenAccounts ?? [],
    };
};
