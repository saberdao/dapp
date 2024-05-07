import { ComputeBudgetProgram, Connection, LAMPORTS_PER_SOL, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';

const getCUsForTx = async (
    connection: Connection,
    latestBlockhash: Awaited<ReturnType<typeof connection.getLatestBlockhash>>,
    txs: TransactionInstruction[],
    payerKey: PublicKey,
) => {
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
    const latestBlockhash = await connection.getLatestBlockhash('finalized');
    const CUs = await getCUsForTx(connection, latestBlockhash, txs, payerKey);

    const priorityFeeLS = parseFloat(localStorage.getItem('priorityFee') ?? '');
    const priorityFee = (priorityFeeLS || 0) * LAMPORTS_PER_SOL * 1e6;

    txs.unshift(ComputeBudgetProgram.setComputeUnitLimit({
        units: CUs + 1000, // +1000 for safety and the CU limit ix itself
    }));
    txs.unshift(ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: Math.ceil(priorityFee / (CUs + 1000)), // +1000 for safety and the CU limit ix itself
    }));
    const messageV0 = new TransactionMessage({
        payerKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: txs,
    }).compileToV0Message();
    const transaction = new VersionedTransaction(messageV0);

    console.log(Buffer.from(transaction.serialize()).toString('base64'));

    return { transaction, latestBlockhash };
};
