import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import invariant from 'tiny-invariant';
import { getOrCreateATAs, Token, TokenAmount } from '@saberhq/token-utils';
import { executeMultipleTxs } from '../../helpers/transaction';
import useQuarryMiner from './useQuarryMiner';
import useProvider from '../useProvider';
import useQuarry from '../useQuarry';
import { PublicKey, Signer, TransactionInstruction } from '@solana/web3.js';
import useStake from './useStake';
import { PoolData } from '@/src/types';

export default function useUpgradeStake(pool: PoolData) {
    const { connection } = useConnection();
    const { wallet } = useWallet();
    const { data: miner } = useQuarryMiner(pool.info.lpToken, true);
    const { data: quarry } = useQuarry();
    const { saber } = useProvider();
    const { stake } = useStake(pool);
    const { provider } = useProvider();

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

        const {
            instructions,
        } = await getOrCreateATAs({
            provider,
            mints: {
                lptoken: new PublicKey(pool.info.lpToken.address),
            },
        });

        allTxsToExecute.push({
            txs: [...instructions, ...legacyUnstakeTx],
            signers: stakeTX.signers,
            description: 'Legacy unstake'
        });
    
        await executeMultipleTxs(connection, allTxsToExecute, wallet);
    };

    return { upgradeStake };
}
