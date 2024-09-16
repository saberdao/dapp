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
    const { provider } = useProvider();
    const { data: balance } = useUserGetLPTokenBalance(pool.info.lpToken.address);
    const { data } = useQuarryMiner(pool.info.lpToken);

    const stake = async (amountInput: number, returnTxs = false) => {
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

        // Check if the mergePool exists, otherwise use legacy stake
        try {
            await mergePool.data();
            if (data.replicaInfo && data.replicaInfo.replicaQuarries.length === 0) {
                throw Error('No replica quarries');
            }
        } catch (e) {
            const stakeTX = data.miner.stake(amount);

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

            if (returnTxs) {
                return [{
                    txs: allInstructions,
                    description: 'Stake'
                }];
            }

            await executeMultipleTxs(connection, [{
                txs: allInstructions,
                description: 'Stake'
            }], wallet);
            return;
        }

        // Primary deposit
        const txs: { txs: TransactionInstruction[], signers: Signer[], description: string }[] = [];

        const txEnv = await mergePool.deposit({
            rewarder: pool.quarryData.rewarder,
            amount,
        });

        allInstructions.push(...txEnv.instructions);
        signers.push(...txEnv.signers);

        // Replica deposit
        if (data.replicaInfo) {
            await Promise.all(data.replicaInfo.replicaQuarries.map(async (replica, i) => {
                try {
                    invariant(wallet.adapter.publicKey);

                    if (replica.rewarder === 'BKhCscLJiaWRPzuSDDtJ8xStMS5y5iUrBwPHDg1Aa1XJ') {
                        // This is broken vault rewarder
                        return;
                    }
                
                    const [mmAddress] = await findMergeMinerAddress({
                        pool: mergePoolAddress,
                        owner: wallet.adapter.publicKey,
                    })

                    const tx = await mergePool.stakeReplicaMiner(
                        new PublicKey(replica.rewarder),
                        mmAddress,
                    );
                    
                    if (i === 0) {
                        txs.push({
                            txs: [...allInstructions, ...tx.instructions],
                            signers: [...signers, ...tx.signers],
                            description: 'Stake replica miner'
                        });
                    } else {
                        txs.push({
                            txs: tx.instructions,
                            signers: tx.signers,
                            description: 'Stake replica miner'
                        });
                    }
                    
                    return;
                } catch (e) {
                    // Do nothing
                }
            }))
        }
    
        if (returnTxs) {
            return txs;
        }

            await executeMultipleTxs(connection, txs, wallet);
    };

    return { stake };
}
