const FEATURED_POOL_NAMES = [
    'EUROe-EURC',
    'MDS-USDC',
    'scnSOL-JSOL',
    'mSOL-JSOL',
    'JSOL-SOL',
    'USDCet-USDC',
    'USDTet-USDT',
    'daoSOL-SOL',
    'SOL-zSOL',
    'scnSOL-SOL',
    'USDH-USDC',
    'SOL-bSOL',
    'SOL-vSOL',
    'stSOL-SOL',
    'UXD-USDC',
    'USDT-USDC',
    'mSOL-SOL'
];

export const isPoolFeatured = (poolName: string) => {
    return FEATURED_POOL_NAMES.includes(poolName);
};
