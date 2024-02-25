import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Token, TokenAmount, TokenInfo } from '@saberhq/token-utils';
import { createVersionedTransaction } from '../../helpers/transaction';
import useUserGetLPTokenBalance from './useGetLPTokenBalance';
import BigNumber from 'bignumber.js';
import useQuarryMiner from './useQuarryMiner';

export default function useStake(lpToken: TokenInfo) {
    const { connection } = useConnection();
    const { wallet } = useWallet();
    const { data: balance } = useUserGetLPTokenBalance(lpToken.address);
    const { data: miner } = useQuarryMiner(lpToken);

    const stake = async (amountInput: number) => {
        if (!miner || !wallet?.adapter.publicKey || !balance) {
            return;
        }

        const maxAmount = BigNumber.min(new BigNumber(balance.balance.value.amount), amountInput * 10 ** lpToken.decimals);
        const amount = new TokenAmount(new Token(lpToken), maxAmount.toString());
        const stakeTX = miner.miner.stake(amount);

        const vt = await createVersionedTransaction(connection, stakeTX.instructions, wallet.adapter.publicKey);
        const hash = await wallet.adapter.sendTransaction(vt.transaction, connection);
        await connection.confirmTransaction({ signature: hash, ...vt.latestBlockhash }, 'processed');

        return hash;
    };

    return { stake };
}