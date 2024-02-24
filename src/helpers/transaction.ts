import { Connection, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';

export const createVersionedTransaction = async (
    connection: Connection,
    txs: TransactionInstruction[],
    payerKey: PublicKey,
) => {
    const latestBlockhash = await connection.getLatestBlockhash('finalized');
    const messageV0 = new TransactionMessage({
        payerKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: txs,
    }).compileToV0Message();
    const transaction = new VersionedTransaction(messageV0);
    return { transaction, latestBlockhash };
};
