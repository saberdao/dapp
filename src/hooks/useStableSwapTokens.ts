import { useMemo } from 'react';
import type { AssociatedTokenAccount } from '@saberhq/sail';
import { Token } from '@saberhq/token-utils';
import * as Sentry from '@sentry/react';

import { WrappedToken } from '@/src/services/wrapped-token';
import useGetTokens from '@/src/hooks/useGetTokens';
import useNetwork from '@/src/hooks/useNetwork';
import { PoolData } from '@/src/types/global';
import { rawSOLOverride } from '@/src/helpers/rawSOL';
import { Tags } from '@/src/enums/tags.enum';
import useUserATAs from '@/src/hooks/user/useUserATAs';

interface ExchangeTokens {
    tokens?: readonly [Token, Token];
    underlyingTokens?: Token[];
    wrappedTokens: WrappedToken[];
    poolTokenAccount?: AssociatedTokenAccount | null;
    tokenAccounts: readonly (AssociatedTokenAccount | null | undefined)[];
    underlyingTokenAccounts: readonly (AssociatedTokenAccount | null | undefined)[];
}

export const useStableSwapTokens = (pool: PoolData): ExchangeTokens | undefined => {
    const { formattedNetwork } = useNetwork();
    const { data: allTokens } = useGetTokens(formattedNetwork);

    // tokensRaw may still be in wrapped form
    const tokens = [new Token(pool.info?.tokens[0]), new Token(pool.info?.tokens[1])] as const;

    // tokens are normalized
    const result = useMemo(() => {
        if (!allTokens) {
            return undefined;
        }

        const underlyingTokens = tokens?.map((tok) => {
            if (tok.info.tags?.includes(Tags.DecimalWrapped)) {
                const realTok = allTokens.tokens.find(
                    (t) => t.address === tok.info.extensions?.assetContract,
                );
                if (!realTok) {
                    const err = new Error('Missing decimal wrapper underlying in token list.');
                    Sentry.captureException(err, {
                        extra: {
                            tokenInfo: JSON.stringify(tok.info, null, 2),
                            underlying: tok.info.extensions?.assetContract,
                            tokenList: JSON.stringify(
                                allTokens.tokens.map((t) => t.address),
                                null,
                                2,
                            ),
                        },
                    });
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

    const { data: tokenAccounts } = useUserATAs(
        [
            new Token(pool.info.lpToken),
            ...(tokens ?? []),
            ...(result?.newUnderlyingTokens.map((tok) => new Token(tok)) ?? []),
        ].map(rawSOLOverride),
    );
    const { data: underlyingTokenAccounts } = useUserATAs(
        result?.underlyingTokens?.map((tok) => rawSOLOverride(new Token(tok))) ?? [],
    );

    if (!result) {
        return undefined;
    }

    return {
        tokens,
        underlyingTokens: result.underlyingTokens.map((tok) => new Token(tok)),
        wrappedTokens: result.wrappedTokens,
        poolTokenAccount: tokenAccounts?.[0],
        tokenAccounts: tokenAccounts?.slice(1) ?? [],
        underlyingTokenAccounts: underlyingTokenAccounts ?? [],
    };
};
