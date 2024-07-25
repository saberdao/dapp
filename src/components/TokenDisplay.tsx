export const TokenDisplay = (props: { mint: string }) => {
    return `${props.mint.slice(0, 4)}...`;
}