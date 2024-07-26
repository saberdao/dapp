import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import invariant from 'tiny-invariant';
import { Token, TokenAmount, TokenInfo } from '@saberhq/token-utils';
import { executeMultipleTxs, sendTransaction } from '../../helpers/transaction';
import useUserGetLPTokenBalance from './useGetLPTokenBalance';
import useQuarryMiner from './useQuarryMiner';
import useProvider from '../useProvider';
import { getClaimIxs } from '../../helpers/claim';
import useQuarry from '../useQuarry';
import { TransactionInstruction } from '@solana/web3.js';
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

        const allTxsToExecute: { txs: TransactionInstruction[], description: string }[] = [];

        // Legacy unstake
        const amount = new TokenAmount(new Token(pool.info.lpToken), miner.stakedBalanceLegacy.toString());
        const legacyUnstakeTx: TransactionInstruction[] = [];
        const stakeTX = miner.miner.withdraw(amount);
        legacyUnstakeTx.push(...stakeTX.instructions);

        allTxsToExecute.push({
            txs: legacyUnstakeTx,
            description: 'Legacy unstake'
        });

        // Stake in merge miner
        const stakeIxs = await stake(amount.asNumber, true);
        invariant(stakeIxs, 'No stake instructions');
        allTxsToExecute.push({
            txs: stakeIxs,
            description: 'Stake in merge mienr',
        })
        
        await executeMultipleTxs(connection, allTxsToExecute, wallet);
    };

    return { upgradeStake };
}
