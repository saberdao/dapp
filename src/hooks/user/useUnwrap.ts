import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WRAPPED_SOL } from '@saberhq/token-utils';
import { createVersionedTransaction } from '../../helpers/transaction';
import {  TransactionInstruction } from '@solana/web3.js';
import useUserATAs from './useUserATAs';
import useNetwork from '../useNetwork';
import { TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';

export default function useUnwrap() {
    const { connection } = useConnection();
    const { network } = useNetwork();
    const { data: ata } = useUserATAs([WRAPPED_SOL[network]], true);
    const { wallet } = useWallet();

    const unwrap = async () => {
        if (!wallet?.adapter.publicKey || !ata?.[0]) {
            return;
        }

        const instructions: TransactionInstruction[] = [];
        instructions.push(Token.createCloseAccountInstruction(
            TOKEN_PROGRAM_ID,
            ata[0].key,
            wallet.adapter.publicKey,
            wallet.adapter.publicKey,
            [],
        ));
        
        const vt = await createVersionedTransaction(
            connection,
            instructions,
            wallet.adapter.publicKey,
        );

        const hash = await wallet.adapter.sendTransaction(vt.transaction, connection);
        await connection.confirmTransaction({ signature: hash, ...vt.latestBlockhash }, 'processed');

        return hash;
    };

    return { unwrap };
}