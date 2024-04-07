import invariant from 'tiny-invariant';
import { SABER_IOU_MINT, SBR_MINT, Saber } from '@saberhq/saber-periphery';
import { getOrCreateATAs } from '@saberhq/token-utils';
import { Wallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import useQuarryMiner from '../hooks/user/useQuarryMiner';

export const getClaimIxs = async (
    saber: Saber,
    miner: ReturnType<typeof useQuarryMiner>['data'],
    wallet: Wallet,
) => {
    invariant(wallet.adapter.publicKey);

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

    invariant(miner?.miner);

    const claimTx = await miner.miner.claim();
    const claimIX = claimTx.instructions[claimTx.instructions.length - 1];

    // redeem tx
    const redeemTx = await redeemer.redeemAllTokensFromMintProxyIx({
        iouSource: accounts.iou,
        redemptionDestination: accounts.redemption,
        sourceAuthority: wallet.adapter.publicKey,
    });

    return [
        ...instructions,
        claimIX,
        redeemTx,
    ];
};
