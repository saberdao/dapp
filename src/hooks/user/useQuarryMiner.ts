import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { Token, TokenInfo } from '@saberhq/token-utils';
import useQuarry from '../useQuarry';
import { SBR_REWARDER } from '@saberhq/saber-periphery';

export default function useQuarryMiner(lpToken: TokenInfo, fetchData = false) {
    const { wallet } = useWallet();
    const { data: quarry } = useQuarry();

    return useQuery({
        queryKey: ['miner', wallet?.adapter.publicKey?.toString(), lpToken.address, `${fetchData}`],
        queryFn: async () => {
            if (!quarry || !wallet?.adapter.publicKey) {
                return null;
            }

            const rewarderW = await quarry.sdk.mine.loadRewarderWrapper(SBR_REWARDER);
            const quarryW = await rewarderW.getQuarry(new Token(lpToken));
            const minerW = await quarryW.getMinerActions(wallet.adapter.publicKey);

            let minerData;
            if (fetchData) {
                try {
                    minerData = await minerW.fetchData();
                } catch (e) {
                    // not initialised
                }
            }

            return {
                miner: minerW,
                quarry: quarryW,
                data: fetchData ? minerData : undefined,
            };
        },
        enabled: !!wallet?.adapter.publicKey && !!lpToken && !!quarry,
    });
}