import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Token, TokenAmount, TokenInfo } from '@saberhq/token-utils';
import invariant from 'tiny-invariant';
import { createVersionedTransaction } from '../../helpers/transaction';
import useUserGetLPTokenBalance from './useGetLPTokenBalance';
import BigNumber from 'bignumber.js';
import useQuarryMiner from './useQuarryMiner';
import useProvider from '../useProvider';
import { PublicKey, Signer, TransactionInstruction } from '@solana/web3.js';
import { SBR_REWARDER } from '@saberhq/saber-periphery';
import { findMergeMinerAddress } from '@quarryprotocol/quarry-sdk';
import { findMergePoolAddress } from '@/src/helpers/replicaRewards';

export default function useStake(lpToken: TokenInfo) {
    const { connection } = useConnection();
    const { wallet } = useWallet();
    const { data: balance } = useUserGetLPTokenBalance(lpToken.address);
    const { data } = useQuarryMiner(lpToken);

    const { provider } = useProvider();

    const stake = async (amountInput: number) => {
        if (!data || !wallet?.adapter.publicKey || !balance) {
            return;
        }

        const allInstructions: TransactionInstruction[] = [];

        const maxAmount = BigNumber.min(new BigNumber(balance.balance.value.amount), amountInput * 10 ** lpToken.decimals);
        const amount = new TokenAmount(new Token(lpToken), maxAmount.toString());

        invariant(data.miner);

        const stakeTX = data.miner.stake(amount);

        const signers: Signer[] = [];

        if (!(await provider.getAccountInfo(data.miner.minerKey))) {
            const newMiner = await data.quarry.createMiner();
            allInstructions.push(...newMiner.tx.instructions);
            signers.push(...newMiner.tx.signers);
        }

        const ataTX = await data.miner.createATAIfNotExists();
        if (ataTX) {
            allInstructions.push(...ataTX.instructions);
            signers.push(...ataTX.signers);
        }

        allInstructions.push(...stakeTX.instructions);
        signers.push(...stakeTX.signers);

        // Add secondary rewards
        if (data.replicaInfo && data.replicaInfo.replicaQuarries) {
            await Promise.all(data.replicaInfo.replicaQuarries.map(async (replica) => {
                invariant(wallet.adapter.publicKey);
                const mergePoolAddress = findMergePoolAddress({
                    primaryMint: new PublicKey(lpToken.address),
                });
                const mergePool = data.quarry.sdk.mergeMine.loadMP({
                    mpKey: mergePoolAddress,
                });
                const [mmAddress] = await findMergeMinerAddress({
                    pool: mergePoolAddress,
                    owner: wallet.adapter.publicKey,
                })

                const tx = await mergePool.stakeReplicaMiner(
                    new PublicKey(replica.rewarder),
                    mmAddress,
                );
                allInstructions.push(...tx.instructions);
                signers.push(...tx.signers);
                return;
            }))
        }

        const vt = await createVersionedTransaction(connection, allInstructions, wallet.adapter.publicKey);

        vt.transaction.sign(signers);

        const hash = await wallet.adapter.sendTransaction(vt.transaction, connection);
        await connection.confirmTransaction({ signature: hash, ...vt.latestBlockhash }, 'processed');

        return hash;
    };

    return { stake };
}
