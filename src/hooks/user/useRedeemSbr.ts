import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { executeMultipleTxs } from '../../helpers/transaction';
import {  PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import useUserATA from './useUserATA';
import { getOrCreateATAs, Token } from '@saberhq/token-utils';
import useProvider from '../useProvider';
import { SABER_IOU_MINT, SBR_MINT } from '@saberhq/saber-periphery';

export default function useRedeemSbr() {
    const { connection } = useConnection();
    const { saber } = useProvider();
    const { wallet } = useWallet();

    const redeem = async () => {
        if (!wallet?.adapter.publicKey) {
            return;
        }

        const redeemer = await saber.loadRedeemer({
            iouMint: SABER_IOU_MINT,
            redemptionMint: new PublicKey(SBR_MINT),
        });
    
        const { accounts, instructions } = await getOrCreateATAs({
            provider: saber.provider,
            mints: {
                iou: redeemer.data.iouMint,
                redemption: redeemer.data.redemptionMint,
            },
            owner: wallet.adapter.publicKey,
        });
    
        const redeemTx = await redeemer.redeemAllTokensFromMintProxyIx({
            iouSource: accounts.iou,
            redemptionDestination: accounts.redemption,
            sourceAuthority: wallet.adapter.publicKey,
        });
        
        await executeMultipleTxs(connection, [{
            txs: [...instructions, redeemTx],
            description: 'Redeem SOL'
        }], wallet);
    };

    return { redeem };
}