import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TokenInfo } from '@saberhq/token-utils';
import { createVersionedTransaction } from '../../helpers/transaction';
import useUserGetLPTokenBalance from './useGetLPTokenBalance';
import useQuarryMiner from './useQuarryMiner';
import useProvider from '../useProvider';
import { getClaimIxs } from '../../helpers/claim';

export default function useClaim(lpToken: TokenInfo) {
    const { connection } = useConnection();
    const { wallet } = useWallet();
    const { data: balance } = useUserGetLPTokenBalance(lpToken.address);
    const { data: miner } = useQuarryMiner(lpToken);
    const { saber } = useProvider();

    const claim = async () => {
        if (!miner || !wallet?.adapter.publicKey || !balance || !saber) {
            return;
        }

        const ixs = await getClaimIxs(saber, miner, wallet);

        const vt = await createVersionedTransaction(
            connection,
            ixs,
            wallet.adapter.publicKey,
        );

        const hash = await wallet.adapter.sendTransaction(vt.transaction, connection);
        await connection.confirmTransaction({ signature: hash, ...vt.latestBlockhash }, 'processed');

        return hash;
    };

    return { claim };
}