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
    const CUs = simulation.value.unitsConsumed ? Math.ceil(1.1 * simulation.value.unitsConsumed) : 1.4e6;
    return 1.4e6;
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
