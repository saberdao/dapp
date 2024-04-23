const FEATURED_POOL_NAMES = [
    'mSOL-SOL',
    'UXD-USDC',
    'USDT-USDC',
    'SOL-bSOL',
    'USDH-USDC',
    'scnSOL-SOL',
    'SOL-zSOL',
    'MDS-USDC',
    'SOL-vSOL',
];

export const isPoolFeatured = (poolName: string) => {
    return FEATURED_POOL_NAMES.includes(poolName);
};
