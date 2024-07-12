import { Wallet } from '@solana/wallet-adapter-react';
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

    // Add 25K + 10% leeway here because the simulation of a stake right after deposit takes some time (>10-20 secs) to update to the correct
    // number of CUs used (and maybe other TXs as well). Just 10% is not enough for very low CU TXs (like quarry stake).
    const CUs = simulation.value.unitsConsumed ? Math.ceil(1.1 * simulation.value.unitsConsumed + 75000) : 1.4e6;
    return CUs;
};

export const createVersionedTransaction = async (
    connection: Connection,
    txs: TransactionInstruction[],
    payerKey: PublicKey,
    minCU = 0,
) => {
    const latestBlockhash = await connection.getLatestBlockhash('finalized');
    const CUs = Math.max(minCU, await getCUsForTx(connection, latestBlockhash, txs, payerKey));
    console.log(CUs)

    const priorityFeeLS = parseFloat(localStorage.getItem('priorityFee') ?? '');
    const priorityFee = (priorityFeeLS || 0) * LAMPORTS_PER_SOL * 1e6;

    txs.unshift(ComputeBudgetProgram.setComputeUnitLimit({
        units: CUs,
    }));
    txs.unshift(ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: Math.ceil(priorityFee / (CUs)),
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

export const sendTransaction = async (
    connection: Connection,
    txs: TransactionInstruction[],
    wallet: Wallet,
    onSuccess: (tx: string) => void,
) => {
    if (!wallet.adapter.publicKey) {
        return;
    }

    const vt = await createVersionedTransaction(
        connection,
        txs,
        wallet.adapter.publicKey,
    );

    const hash = await wallet.adapter.sendTransaction(vt.transaction, connection);
    await connection.confirmTransaction({ signature: hash, ...vt.latestBlockhash }, 'processed');

    // Add toast
    onSuccess(hash);
};
