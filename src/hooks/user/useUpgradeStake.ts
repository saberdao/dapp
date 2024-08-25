import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import invariant from 'tiny-invariant';
import { Token, TokenAmount } from '@saberhq/token-utils';
import { executeMultipleTxs } from '../../helpers/transaction';
import useQuarryMiner from './useQuarryMiner';
import useProvider from '../useProvider';
import useQuarry from '../useQuarry';
import { Signer, TransactionInstruction } from '@solana/web3.js';
import useStake from './useStake';
import { PoolData } from '@/src/types';

export default function useUpgradeStake(pool: PoolData) {
    const { connection } = useConnection();
    const { wallet } = useWallet();
    const { data: miner } = useQuarryMiner(pool.info.lpToken, true);
    const { data: quarry } = useQuarry();
    const { saber } = useProvider();
    const { stake } = useStake(pool);

    const upgradeStake = async () => {
        if (!miner || !quarry || !wallet?.adapter.publicKey || !saber) {
            return;
        }

        if (!miner.stakedBalanceLegacy || miner.stakedBalanceLegacy.isZero()) {
            return;
        }

        const allTxsToExecute: { txs: TransactionInstruction[], signers: Signer[], description: string }[] = [];

        // Legacy unstake
        const amount = new TokenAmount(new Token(pool.info.lpToken), miner.stakedBalanceLegacy.toString());
        const legacyUnstakeTx: TransactionInstruction[] = [];
        const stakeTX = miner.miner.withdraw(amount);
        legacyUnstakeTx.push(...stakeTX.instructions);

        allTxsToExecute.push({
            txs: legacyUnstakeTx,
            signers: stakeTX.signers,
            description: 'Legacy unstake'
        });

        // Stake in merge miner
        const stakeTxs = await stake(amount.asNumber, true);
        invariant(stakeTxs, 'No stake instructions');
        
        await executeMultipleTxs(connection, [...allTxsToExecute, ...stakeTxs], wallet);
    };

    return { upgradeStake };
}
