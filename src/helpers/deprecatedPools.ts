const DEPRECATED_POOL_NAMES = [
    'acUSD-CASH',
    'atUST-CASH',
    'CASH-USDC',
    'aeFEI-CASH',
    'FRAX-CASH',
    'aeMIM-CASH',
    'PAI-CASH',
    'USDH-CASH',
    'UST-CASH',
    'UXD-CASH',
    'NIRV-USDC',
    'NIRV-USDH',
    'NIRV-USDT',
    'NIRV-UST',
    'solUST-UST',
    'solUST-USDH',
    'USDH-UST',
    'wUST_v1-USDC',
    'UST-USDC',
    'aeFEI-UST',
    'FRAX-UST',
    'aeMIM-UST',
    'wLUNA_v1-renLUNA',
    'atLUNA-LUNA',
    'LUNA-renLUNA',
    'xLUNA-LUNA',
];

export const isPoolDeprecated = (poolName: string) => {
    return DEPRECATED_POOL_NAMES.includes(poolName);
};
