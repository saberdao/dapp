import { useWallet } from '@solana/wallet-adapter-react';
import React, { useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { BasicActions } from '../../../sdk/sbrsol-ts/packages/saber-client/lib/client';

const Wallet = () => {
  const wallet = useWallet();

  const handleDepsoit = useCallback(() => {
    const USDC_MINT = new PublicKey(
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    );

    const connection = new Connection(
      'https://ingunna-fyrb7w-fast-mainnet.helius-rpc.com/',
      'confirmed',
    );

    const basicActions = new BasicActions(connection, wallet);

    basicActions.deposit(2, USDC_MINT);
  }, [wallet]);

  return <button onClick={handleDepsoit}>Deposit</button>;
};

export default Wallet;
