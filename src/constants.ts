import { PublicKey } from '@solana/web3.js';
import { Explorer } from './types';

export const explorers = {
    [Explorer.SOLSCAN]: {
        address: 'https://solscan.io/address/',
        tx: 'https://solscan.io/tx/',
    },
};

/**
 * Quarry program addresses.
 */
export const QUARRY_ADDRESSES = {
    MergeMine: new PublicKey("QMMD16kjauP5knBwxNUJRZ1Z5o3deBuFrqVjBVmmqto"),
    Mine: new PublicKey("QMNeHCGYnLVDn1icRAfQZpjPLBNkfGbSKRB83G5d8KB"),
    MintWrapper: new PublicKey("QMWoBmAyJLAsA1Lh9ugMTw2gciTihncciphzdNzdZYV"),
    Operator: new PublicKey("QoP6NfrQbaGnccXQrMLUkog2tQZ4C1RFgJcwDnT8Kmz"),
    Redeemer: new PublicKey("QRDxhMw1P2NEfiw5mYXG79bwfgHTdasY2xNP76XSea9"),
    Registry: new PublicKey("QREGBnEj9Sa5uR91AV8u3FxThgP5ZCvdZUW2bHAkfNc"),
  };

export const saberQuarryInfo = {
    "displayRewardsToken": {
        "address": "Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1",
        "chainId": 103,
        "decimals": 6,
        "extensions": {},
        "logoURI": "https://registry.saber.so/token-icons/sbr.svg",
        "name": "Saber Protocol Token",
        "symbol": "SBR",
        "tags": []
    },
    rewardsToken: {
        mint: 'iouQcQBAiEXe6cKLS85zmZxUqaCqBdeHFpqKoSz615u',
        decimals: 6,
    }
}