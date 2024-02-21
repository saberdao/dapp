import { CurrencyMarket } from './_temp_stableswap_types';

export enum Explorer {
    SOLSCAN = 'SOLSCAN'
}

export type ReferencePrice = {
    [k in CurrencyMarket]: {
        referenceMint: string;
        price: number;
    }
}
