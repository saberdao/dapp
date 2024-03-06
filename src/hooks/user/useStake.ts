import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Token, TokenAmount, TokenInfo } from '@saberhq/token-utils';
import { createVersionedTransaction } from '../../helpers/transaction';
import useUserGetLPTokenBalance from './useGetLPTokenBalance';
import BigNumber from 'bignumber.js';
import useQuarryMiner from './useQuarryMiner';
import useProvider from '../useProvider';
import { ComputeBudgetProgram, Signer, TransactionInstruction } from '@solana/web3.js';

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

        allInstructions.push(ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 100000,
        }));

        const maxAmount = BigNumber.min(new BigNumber(balance.balance.value.amount), amountInput * 10 ** lpToken.decimals);
        const amount = new TokenAmount(new Token(lpToken), maxAmount.toString());
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
        
        const vt = await createVersionedTransaction(connection, allInstructions, wallet.adapter.publicKey);

        vt.transaction.sign(signers);

        console.log(Buffer.from(vt.transaction.serialize()).toString('base64'));
        const hash = await wallet.adapter.sendTransaction(vt.transaction, connection);
        await connection.confirmTransaction({ signature: hash, ...vt.latestBlockhash }, 'processed');

        return hash;
    };

    return { stake };
}