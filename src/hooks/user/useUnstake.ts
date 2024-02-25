import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Token, TokenAmount, TokenInfo } from '@saberhq/token-utils';
import { createVersionedTransaction } from '../../helpers/transaction';
import BigNumber from 'bignumber.js';
import useQuarryMiner from './useQuarryMiner';

export default function useUnstake(lpToken: TokenInfo) {
    const { connection } = useConnection();
    const { wallet } = useWallet();
    const { data: miner } = useQuarryMiner(lpToken, true);

    const unstake = async (amountInput: number) => {
        if (!miner || !wallet?.adapter.publicKey || !miner.data) {
            return;
        }

        const maxAmount = BigNumber.min(new BigNumber(miner.data.balance.toString()), amountInput * 10 ** lpToken.decimals);
        const amount = new TokenAmount(new Token(lpToken), maxAmount.toString());
        const stakeTX = miner.miner.withdraw(amount);

        const vt = await createVersionedTransaction(connection, stakeTX.instructions, wallet.adapter.publicKey);
        const hash = await wallet.adapter.sendTransaction(vt.transaction, connection);
        await connection.confirmTransaction({ signature: hash, ...vt.latestBlockhash }, 'processed');

        return hash;
    };

    return { unstake };
}