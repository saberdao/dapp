import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { Token, TokenInfo } from '@saberhq/token-utils';
import useQuarry from '../useQuarry';
import { SBR_REWARDER } from '@saberhq/saber-periphery';
import useGetSwaps from '../useGetSwaps';
import useNetwork from '../useNetwork';
import { PublicKey } from '@solana/web3.js';
import useGetRewarders from '../useGetRewarders';
import { MergeMiner, MergePool, MinerData } from '@quarryprotocol/quarry-sdk';
import BN from 'bn.js';

export default function useQuarryMiner(lpToken: TokenInfo, fetchData = false) {
    const { wallet } = useWallet();
    const { formattedNetwork, network } = useNetwork();
    const { data: swaps } = useGetSwaps(formattedNetwork);
    const { data: quarry } = useQuarry();
    const { data: rewarders } = useGetRewarders(network);

    return useQuery({
        queryKey: ['miner', wallet?.adapter.publicKey?.toString(), lpToken.address, `${fetchData}`],
        queryFn: async () => {
            if (!quarry || !rewarders) {
                return null;
            }
            const rewarderW = await quarry.sdk.mine.loadRewarderWrapper(SBR_REWARDER);
            const quarryW = await rewarderW.getQuarry(new Token(lpToken));

            if (!wallet?.adapter.publicKey) {
                return { quarry: quarryW };
            }

            const minerW = await quarryW.getMinerActions(wallet.adapter.publicKey);

            let minerData;
            if (fetchData) {
                try {
                    minerData = await minerW.fetchData();
                } catch (e) {
                    minerData = {
                        status: 'not initialised',
                        balance: new BN(0),
                        rewardsPerTokenPaid: new BN(0),
                        rewardsEarned: new BN(0),
                    }
                    // not initialised
                }
            }

            console.log('miner', minerW);
            console.log('quarry', quarryW);

            const addresses = swaps?.find((swap) => swap.addresses.lpTokenMint === lpToken.address);
            const mergePoolAddress = addresses?.addresses.mergePool;
            const replicaInfo = mergePoolAddress && rewarders?.quarries?.find(rewarder => rewarder.mergePool === mergePoolAddress);

            let mergeMiner: MergeMiner | null = null;
            let mergePool: MergePool | null = null;

            let stakedBalance = minerData?.balance ?? new BN(0);
            let stakedBalanceMM = new BN(0);
            const stakedBalanceLegacy = minerData?.balance ?? new BN(0);
            let mergeMinerData: MinerData | null = null;

            if (replicaInfo) {
                try {
                    mergePool = quarry.sdk.mergeMine.loadMP({ mpKey: new PublicKey(replicaInfo.mergePool) });
                    const mmKey = await mergePool.mergeMine.findMergeMinerAddress({
                        owner: wallet.adapter.publicKey,
                        pool: new PublicKey(replicaInfo.mergePool)
                    });
                    mergeMiner = await quarry.sdk.mergeMine.loadMM({
                        mmKey
                    });
                    mergeMinerData = await (await quarryW.getMinerActions(mmKey)).fetchData();

                    stakedBalance = stakedBalance.add(mergeMiner.mm.data.primaryBalance);
                    stakedBalanceMM = mergeMiner.mm.data.primaryBalance;
                } catch (e) {
                    // Do nothing, maybe the miner is not initialised yet
                }
            }

            return {
                miner: minerW,
                quarry: quarryW,
                rewarderW,
                data: fetchData ? minerData : undefined,
                mergeMiner,
                mergeMinerData,
                replicaInfo,
                mergePool,
                stakedBalance,
                stakedBalanceLegacy,
                stakedBalanceMM
            };
        },
        enabled: !!lpToken && !!quarry && !!rewarders,
        refetchInterval: 60000,
    });
}