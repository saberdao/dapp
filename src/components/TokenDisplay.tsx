import React from 'react';

export const TokenDisplay = (props: { mint: string }) => {
    if (props.mint === 'vPtS4ywrbEuufwPkBXsCYkeTBfpzCd6hF52p8kJGt9b') {
        return 'Vault points'
    }
    return `${props.mint.slice(0, 4)}...`;
}

export const TokenLogo = (props: { mint: string; className?: string }) => {
    if (props.mint === 'vPtS4ywrbEuufwPkBXsCYkeTBfpzCd6hF52p8kJGt9b') {
        return <img className={props.className} src="https://thevault.finance/images/tokens/vpts.svg" />
    }
    return `${props.mint.slice(0, 4)}...`;
}