import { ComputeBudgetProgram, Connection, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';

const getCUsForTx = async (
    connection: Connection,
    txs: TransactionInstruction[],
    payerKey: PublicKey
) => {
    const latestBlockhash = await connection.getLatestBlockhash('finalized');
    const messageV0 = new TransactionMessage({
        payerKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: txs,
    }).compileToV0Message();
    const transaction = new VersionedTransaction(messageV0);
    const simulation = await connection.simulateTransaction(transaction);
    const CUs = simulation.value.unitsConsumed ?? 1.4e6;
    return CUs;
};

export const createVersionedTransaction = async (
    connection: Connection,
    txs: TransactionInstruction[],
    payerKey: PublicKey,
) => {
    const CUs = await getCUsForTx(connection, txs, payerKey);

    txs.unshift(ComputeBudgetProgram.setComputeUnitLimit({
        units: CUs + 1000, // +1000 for safety and the CU limit ix itself
    }));
    const latestBlockhash = await connection.getLatestBlockhash('finalized');
    const messageV0 = new TransactionMessage({
        payerKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: txs,
    }).compileToV0Message();
    const transaction = new VersionedTransaction(messageV0);
    return { transaction, latestBlockhash };
};
