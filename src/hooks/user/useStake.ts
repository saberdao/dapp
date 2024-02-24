import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import useQuarry from '../useQuarry';
import { Token, TokenAmount, TokenInfo } from '@saberhq/token-utils';
import { SBR_REWARDER } from '@saberhq/saber-periphery';
import { createVersionedTransaction } from '../../helpers/transaction';
import useUserGetLPTokenBalance from './useGetLPTokenBalance';
import BigNumber from 'bignumber.js';

export default function useStake(lpToken: TokenInfo) {
    const { connection } = useConnection();
    const { wallet } = useWallet();
    const { data: quarry } = useQuarry();
    const { data: balance } = useUserGetLPTokenBalance(lpToken.address);

    const stake = async (amountInput: number) => {
        if (!quarry?.sdk || !wallet?.adapter.publicKey || !balance) {
            return;
        }

        const authority = wallet.adapter.publicKey;
        const rewarderW = await quarry.sdk.mine.loadRewarderWrapper(SBR_REWARDER);
        const quarryW = await rewarderW.getQuarry(new Token(lpToken));
        const minerW = await quarryW.getMinerActions(authority);

        const maxAmount = BigNumber.min(new BigNumber(balance.balance.value.amount), amountInput * 10 ** lpToken.decimals);
        const amount = new TokenAmount(new Token(lpToken), maxAmount.toString());
        const stakeTX = minerW.stake(amount);

        const vt = await createVersionedTransaction(connection, stakeTX.instructions, wallet.adapter.publicKey);
        const hash = await wallet.adapter.sendTransaction(vt.transaction, connection);
        await connection.confirmTransaction({ signature: hash, ...vt.latestBlockhash }, 'processed');

        return hash;
    };

    return { stake };
}