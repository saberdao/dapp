import { PublicKey } from '@solana/web3.js';
import { mapValues } from 'lodash';

export const valuesToKeys = <T extends Record<string, string>>(
    raw: T,
): { [K in keyof T]: PublicKey } => mapValues(raw, (addr) => new PublicKey(addr));
