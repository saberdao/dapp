import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WRAPPED_SOL } from '@saberhq/token-utils';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';

import useUserATAs from '@/src/hooks/user/useUserATAs';
import useNetwork from '@/src/hooks/useNetwork';
import { createVersionedTransaction } from '@/src/helpers/transaction';

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
        instructions.push(
            Token.createCloseAccountInstruction(
                TOKEN_PROGRAM_ID,
                ata[0].key,
                wallet.adapter.publicKey,
                wallet.adapter.publicKey,
                [],
            ),
        );

        const vt = await createVersionedTransaction(
            connection,
            instructions,
            wallet.adapter.publicKey,
        );

        const hash = await wallet.adapter.sendTransaction(vt.transaction, connection);
        await connection.confirmTransaction(
            { signature: hash, ...vt.latestBlockhash },
            'processed',
        );

        return hash;
    };

    return { unwrap };
}
