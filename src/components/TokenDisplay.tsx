import React from 'react';

export const TokenDisplay = (props: { name?: string; mint: string }) => {
    if (props.mint === 'vPtS4ywrbEuufwPkBXsCYkeTBfpzCd6hF52p8kJGt9b') {
        return 'Vault points'
    }

    if (props.name) {
        return props.name;
    }

    return `${props.mint.slice(0, 4)}...`;
}

export const TokenLogo = (props: { img?: string; mint: string; className?: string }) => {
    if (props.mint === 'vPtS4ywrbEuufwPkBXsCYkeTBfpzCd6hF52p8kJGt9b') {
        return <img className={props.className} src="https://thevault.finance/images/tokens/vpts.svg" />
    }

    if (props.img) {
        return <img className={props.className} src={props.img} />
    }

    return `${props.mint.slice(0, 4)}...`;
}