import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Token, TokenAmount, TokenInfo } from '@saberhq/token-utils';
import invariant from 'tiny-invariant';
import { createVersionedTransaction, executeMultipleTxs } from '../../helpers/transaction';
import useUserGetLPTokenBalance from './useGetLPTokenBalance';
import BigNumber from 'bignumber.js';
import useQuarryMiner from './useQuarryMiner';
import useProvider from '../useProvider';
import { PublicKey, Signer, TransactionInstruction } from '@solana/web3.js';
import { SBR_REWARDER } from '@saberhq/saber-periphery';
import { findMergeMinerAddress } from '@quarryprotocol/quarry-sdk';
import { findMergePoolAddress } from '@/src/helpers/replicaRewards';
import { PoolData } from '@/src/types';

export default function useStake(pool: PoolData) {
    const { connection } = useConnection();
    const { wallet } = useWallet();
    const { data: balance } = useUserGetLPTokenBalance(pool.info.lpToken.address);
    const { data } = useQuarryMiner(pool.info.lpToken);

    const stake = async (amountInput: number) => {
        if (!data || !wallet?.adapter.publicKey || !balance) {
            return;
        }

        const allInstructions: TransactionInstruction[] = [];

        const maxAmount = BigNumber.min(new BigNumber(balance.balance.value.amount), amountInput * 10 ** pool.info.lpToken.decimals);
        const amount = new TokenAmount(new Token(pool.info.lpToken), maxAmount.toString());

        invariant(data.miner);

        const signers: Signer[] = [];

        invariant(pool.quarryData?.rewarder);

        const mergePoolAddress = findMergePoolAddress({
            primaryMint: new PublicKey(pool.info.lpToken.address),
        });
        const mergePool = data.quarry.sdk.mergeMine.loadMP({
            mpKey: mergePoolAddress,
        });
        
        // Primary deposit 
        const txEnv = await mergePool.deposit({
            rewarder: pool.quarryData.rewarder,
            amount,
        });

        allInstructions.push(...txEnv.instructions);
        signers.push(...txEnv.signers);

        // Replica deposit
        if (data.replicaInfo) {
            await Promise.all(data.replicaInfo.replicaQuarries.map(async (replica) => {
                invariant(wallet.adapter.publicKey);
            
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

        await executeMultipleTxs(connection, [{
            txs: allInstructions,
            description: 'Stake'
        }], wallet);
    };

    return { stake };
}
