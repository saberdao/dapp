import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TokenInfo, getOrCreateATAs } from '@saberhq/token-utils';
import { createVersionedTransaction } from '../../helpers/transaction';
import useUserGetLPTokenBalance from './useGetLPTokenBalance';
import useQuarryMiner from './useQuarryMiner';
import useProvider from '../useProvider';
import { SABER_IOU_MINT, SBR_MINT } from '@saberhq/saber-periphery';
import { PublicKey } from '@solana/web3.js';

export default function useClaim(lpToken: TokenInfo) {
    const { connection } = useConnection();
    const { wallet } = useWallet();
    const { data: balance } = useUserGetLPTokenBalance(lpToken.address);
    const { data: miner } = useQuarryMiner(lpToken);
    const { saber } = useProvider();

    const claim = async () => {
        if (!miner || !wallet?.adapter.publicKey || !balance || !saber) {
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

        const claimTx = await miner.miner.claim();
        const claimIX = claimTx.instructions[claimTx.instructions.length - 1];

        // redeem tx
        const redeemTx = await redeemer.redeemAllTokensFromMintProxyIx({
            iouSource: accounts.iou,
            redemptionDestination: accounts.redemption,
            sourceAuthority: wallet.adapter.publicKey,
        });

        const vt = await createVersionedTransaction(
            connection,
            [
                ...instructions,
                claimIX,
                redeemTx,
            ],
            wallet.adapter.publicKey,
        );

        const hash = await wallet.adapter.sendTransaction(vt.transaction, connection);
        await connection.confirmTransaction({ signature: hash, ...vt.latestBlockhash }, 'processed');

        return hash;
    };

    return { claim };
}