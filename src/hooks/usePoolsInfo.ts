import { useQuery } from '@tanstack/react-query';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import invariant from 'tiny-invariant';
import useGetSwaps from './useGetSwaps';
import useGetPools from './useGetPools';
import useNetwork from '../hooks/useNetwork';
import { valuesToKeys } from '../helpers/keys';
import { parseRawSwapState } from '../helpers/state';
import { DetailedSwapSummary, PoolData, PoolInfo, PoolInfoRaw } from '../types';
import useGetPrices from './useGetPrices';
import useGetReserves from './useGetReserves';
import useGetLPTokenAmounts from './useGetLPTokenAmounts';
import { getExchange } from '../helpers/exchange';
import { getPoolTVL, getPoolTokenPercentages, getPrice } from '../helpers/prices';
import { ParsedAccountData, PublicKey } from '@solana/web3.js';
import { QUARRY_ADDRESSES, QuarrySDK, findMergeMinerAddress, findReplicaMintAddress } from '@quarryprotocol/quarry-sdk';
import { chunk } from 'lodash';
import throat from 'throat';
import { Percent, Token, TokenAmount, getATAAddressSync, getATAAddressesSync } from '@saberhq/token-utils';
import { calculateWithdrawAll } from './user/useWithdraw/calculateWithdrawAll';
import useSettings from './useSettings';
import useQuarry from './useQuarry';
import { getEmissionApy, getFeeApy, getSecondaryEmissionApy } from '../helpers/apy';
import usePoolsData from './usePoolsData';
import { SBR_ADDRESS } from '@saberhq/saber-periphery';
import useGetRewarders from './useGetRewarders';
import { findMergePoolAddress } from '../helpers/replicaRewards';
import BN from 'bn.js';
import { getRewarder, QuarryRewarderInfo } from '../helpers/rewarder';
import useGetStakePoolAPY from './useGetStakePoolAPY';
import useGetPoolInfo from './useGetPoolnfo';

function encode(input: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(input);
}

const calculateUsdValue = (pool: PoolData, balance: string, maxSlippagePercent: Percent) => {
    const values = calculateWithdrawAll({
        poolTokenAmount: new TokenAmount(new Token(pool.info.lpToken), balance),
        maxSlippagePercent,
        exchangeInfo: pool.exchangeInfo,
    });

    const valueA = values.estimates[0] ? values.estimates[0].asNumber : 0;
    const valueB = values.estimates[1] ? values.estimates[1].asNumber : 0;

    const usdValue = valueA * pool.usdPrice.tokenA + valueB * pool.usdPrice.tokenB;

    return usdValue;
};

const getStakedBalanceAta = (
    owner: PublicKey,
    quarry: PublicKey,
    lpTokenAddress: PublicKey,
) => {
    const k = PublicKey.findProgramAddressSync(
        [
            Buffer.from(encode('Miner')),
            quarry.toBytes(),
            owner.toBytes(),
        ],
        new PublicKey(QUARRY_ADDRESSES.Mine),
    );
    const ata = getATAAddressSync({
        mint: new PublicKey(lpTokenAddress),
        owner: k[0],
    });

    return {
        ata,
        lpTokenAddress,
    };
};

const getQuarryInfo = async (quarry: QuarrySDK, rewarders: QuarryRewarderInfo[], pools: PoolData[]) => {
    // Get quarry info
    const infos = pools.map((pool) => pool.info.quarry);
    const chunks = chunk(infos, 100);

    // Ask the RPC to execute this
    const rewarderInfo = (await Promise.all(chunks.map(throat(10, async (chunk) => {
        const result: Awaited<ReturnType<typeof quarry.programs.Mine.account.quarry.fetch>>[] = await quarry.programs.Mine.account.quarry.fetchMultiple(chunk) as any;
        return result;
    })))).flat();
    
    // Merge in pool
    pools.forEach(pool => {
        pool.quarryData = rewarderInfo.find((info) => info?.tokenMintKey.toString() === pool.info.lpToken.address);
    });

    const poolChunks = chunk(pools, 100);

    // Get all replica infos
    const replicaInfos = (await Promise.all(poolChunks.map(throat(10, async (chunk) => {
        const addressesToFetch: string[] = [];
        await Promise.all(chunk.map(async pool => {
            const mergePoolAddress = pool.info.summary.addresses.mergePool;
            const replicaInfo = mergePoolAddress && rewarders?.find(rewarder => rewarder.mergePool === mergePoolAddress);
            if (replicaInfo) {
                // There are replicas, for every replica we need to constract a call that fetches the info
                addressesToFetch.push(...replicaInfo.replicaQuarries.map(q => q.quarry));
            }
        }))

        const result: Awaited<ReturnType<typeof quarry.programs.Mine.account.quarry.fetch>>[] = await quarry.programs.Mine.account.quarry.fetchMultiple(addressesToFetch) as any;
        return result;
    })))).flat();

    // Merge replica stuff into pools
    pools.forEach(pool => {
        if (!pool.replicaQuarryData) {
            pool.replicaQuarryData = [];
        }

        const mergePoolAddress = pool.info.summary.addresses.mergePool;
        const replicaInfo = mergePoolAddress && rewarders?.find(rewarder => rewarder.mergePool === mergePoolAddress);
        if (!replicaInfo) {
            return;
        }

        pool.replicaQuarryData = replicaInfos
            .filter(info => {
                return info.tokenMintKey.toString() === replicaInfo.replicaMint;
            })
            .map(data => ({
                data,
                info: replicaInfo.replicaQuarries.filter(replica => replica.rewarder.toString() === data.rewarder.toString())?.[0],
            }));
    });
};

export default function () {
    const { formattedNetwork, network, endpoint } = useNetwork();
    const { data: swaps } = useGetSwaps(formattedNetwork);
    const { data: pools } = useGetPools(formattedNetwork);
    const { data: poolInfo } = useGetPoolInfo();
    const { data: prices } = useGetPrices();
    const { data: reserves } = useGetReserves(pools?.pools);
    const { data: poolsInfo } = usePoolsData();
    const { data: lpTokenAmounts } = useGetLPTokenAmounts(pools?.pools);
    const { data: quarry } = useQuarry();
    const { data: rewarders } = useGetRewarders(network);
    const { data: stakePoolApy } = useGetStakePoolAPY(network);
    const { connection } = useConnection();
    const { maxSlippagePercent } = useSettings();
    const { wallet } = useWallet();

    return useQuery({
        queryKey: ['registryPoolsInfo', endpoint, wallet?.adapter.publicKey ? 'connected' : 'disconnected'],
        queryFn: async () => {
            // Only run when we have the dependent info
            // Note these are also in the enabled boolean,
            // and that they are cached in localStorage to 
            // prevent re-fetching on every page load.
            // Especially for the reverse balances this
            // saves a ton of RPC calls.
            if (!swaps || !pools || !prices || !reserves || !lpTokenAmounts || !quarry || !poolsInfo || !rewarders || !stakePoolApy || !poolInfo) {
                return;
            }

            const data = {
                addresses: valuesToKeys(pools.addresses),
                pools: pools.pools.map((poolRaw): PoolData => {
                    const pool = poolRaw as PoolInfoRaw;
                    const swap: DetailedSwapSummary | null =
                        (swaps.find(
                            (s: DetailedSwapSummary) => s.id === pool.id,
                        ) as DetailedSwapSummary) ?? null;
                    if (!swap) {
                        throw new Error('swap not found');
                    }
                    const info: PoolInfo = {
                        ...pool,
                        summary: swap,
                        swap: {
                            config: valuesToKeys(pool.swap.config),
                            state: parseRawSwapState(pool.swap.state),
                        },
                        tokens: [
                            {
                                ...pool.tokens[0],
                                extensions: {
                                    ...pool.tokens[0].extensions,
                                    ...poolInfo[pool.tokens[0].address],
                                }
                            },
                            {
                                ...pool.tokens[1],
                                extensions: {
                                    ...pool.tokens[1].extensions,
                                    ...poolInfo[pool.tokens[1].address],
                                }
                            },
                        ]
                    };

                    const data = {
                        info,
                        ...getExchange(info, reserves, lpTokenAmounts),
                        usdPrice: {
                            tokenA: prices[pool.swap.state.tokenA.mint.toString()] ?? 0,
                            tokenB: prices[pool.swap.state.tokenB.mint.toString()] ?? 0,
                        },
                    };
                    return {
                        ...data,
                    };
                }),
            };
            await getQuarryInfo(quarry.sdk, rewarders.quarries, data.pools);

            // Update the replicaQuarryData to handle decimals (for now, to be removed) and redeemer logic
            await Promise.all(data.pools.map(async (pool) => {
                if (pool.replicaQuarryData) {
                    if (pool.info.name === 'SOL-bSOL')
                        console.log(pool)
                    await Promise.all(pool.replicaQuarryData.map(async (replica) => {
                        if (replica.data.annualRewardsRate.lte(new BN(0 ))) {
                            return 0;
                        }

                        // Check if there is a redeemer for this token
                        const rewarder = await getRewarder(network, replica.info.rewarder);
                        const redeemer = rewarder.info.redeemer;
                        if (redeemer) {
                            // Set up the redeemer token information
                            const tokenInfo = await (await (await fetch(`https://tokens.jup.ag/token/${redeemer.underlyingToken}`)).json());
                            replica.info.redeemer = { ...redeemer, tokenInfo };
                        }

                    }));
                }
            }));


            await Promise.all(data.pools.map(async (pool) => {
                const metricInfo = poolsInfo[pool.info.swap.config.swapAccount.toString()] ?? { v: 0, feesUsd: 0 };

                // Update volume and fees because they are prices in token0
                try{
                    pool.metricInfo = {
                        v: metricInfo.v * pool.usdPrice.tokenA,
                        feesUsd: metricInfo.feesUsd * pool.usdPrice.tokenA,
                    };
                } catch (e) {
                    pool.metricInfo = {
                        v: 0,
                        feesUsd: 0,
                    };
                }

                // Get prices of secondary rewards
                let secondaryApy: number[] = [];
                if (pool.replicaQuarryData) {
                    secondaryApy = await Promise.all(pool.replicaQuarryData.map(async (replica) => {
                        if (replica.data.annualRewardsRate.lte(new BN(0 ))) {
                            return 0;
                        }

                        const price = await getPrice(
                            replica.info.redeemer?.tokenInfo.address ?? replica.info.rewardsToken.mint,
                            replica.info.redeemer?.tokenInfo.decimals ?? replica.info.rewardsToken.decimals
                        );
                        console.log(replica.info.redeemer?.tokenInfo.address,price, getSecondaryEmissionApy(pool, replica, price))
                        return getSecondaryEmissionApy(pool, replica, price);
                    }));
                }

                const tvl = getPoolTVL(pool);
                const feeApy = getFeeApy(metricInfo?.feesUsd ?? 0, tvl ?? 0);
                const emissionApy = getEmissionApy(pool, prices[SBR_ADDRESS.toString()]);
                const tokenPercentages = getPoolTokenPercentages(pool);
                const stakePoolApyToken0 = 100 * (stakePoolApy[pool.info.swap.state.tokenA.mint.toString()] ?? 0) * tokenPercentages.tokenA;
                const stakePoolApyToken1 = 100 * (stakePoolApy[pool.info.swap.state.tokenB.mint.toString()] ?? 0) * tokenPercentages.tokenB;
                pool.metrics = {
                    tvl,
                    feeApy,
                    emissionApy,
                    secondaryApy: pool.replicaQuarryData?.map((_, i) => secondaryApy[i] ?? 0) ?? [],
                    stakePoolApyToken0,
                    stakePoolApyToken1,
                    totalApy: feeApy + emissionApy + secondaryApy.reduce((acc, val) => acc + val, 0) + stakePoolApyToken0 + stakePoolApyToken1,
                };
            }));
            if (wallet?.adapter.publicKey) {                
                // LP token balances
                const lpTokenBalances = data.pools.map((pool) => {
                    invariant(wallet.adapter.publicKey);
                    return {
                        ata: getATAAddressSync({
                                mint: new PublicKey(pool.info.lpToken.address),
                                owner: wallet.adapter.publicKey,
                        }),
                        lpTokenAddress: new PublicKey(pool.info.lpToken.address),
                    }
                });

                // Also add all legacy staked balances
                const legacyMinerBalances = data.pools.map((pool) => {
                    return getStakedBalanceAta(
                        wallet.adapter.publicKey!,
                        new PublicKey(pool.info.quarry),
                        new PublicKey(pool.info.lpToken.address),
                    );
                });

                // And all merge miner balances
                const mergeMinerBalances = await Promise.all(data.pools.map(async (pool) => {
                    invariant(wallet.adapter.publicKey);

                    const mergePool = findMergePoolAddress({
                        primaryMint: new PublicKey(pool.info.lpToken.address),
                    });
                    const [mmAddress] = await findMergeMinerAddress({
                        pool: mergePool,
                        owner: wallet.adapter.publicKey,
                    })

                    return getStakedBalanceAta(
                        mmAddress,
                        new PublicKey(pool.info.quarry),
                        new PublicKey(pool.info.lpToken.address),
                    );
                }));

                // Now we need to fetch the balances of all these addresses, we can do that in chunks of 100
                const chunks = chunk(lpTokenBalances.concat(legacyMinerBalances).concat(mergeMinerBalances), 100);
                
                // Ask the RPC to execute this
                const tokenAmounts = (await Promise.all(chunks.map(throat(10, async (chunk) => {
                    const result = await connection.getMultipleParsedAccounts(
                        chunk.map((account) => new PublicKey(account.ata)),
                    );
                    return result.value.map((item, i) => {
                        return {
                            address: chunk[i].ata,
                            lpTokenAddress: chunk[i].lpTokenAddress,
                            amount: (item?.data as ParsedAccountData)?.parsed.info.tokenAmount.amount,
                        };
                    });
                })))).flat();
                // Merge into pools by updating by reference
                tokenAmounts.map((amount) => {
                    if (amount.amount) {
                        const pool = data.pools.find((pool) => pool.info.lpToken.address === amount.lpTokenAddress.toString());
                        if (pool) {
                            if (!pool.userInfo) {
                                pool.userInfo = {
                                    stakedBalance: '0',
                                    stakedUsdValue: 0,
                                };
                            }

                            pool.userInfo.stakedBalance = new BN(pool.userInfo.stakedBalance).add(new BN(amount.amount)).toString();
                            pool.userInfo.stakedUsdValue = calculateUsdValue(pool, pool.userInfo.stakedBalance.toString(), maxSlippagePercent);
                        }
                    }
                });
            }

            return data;
        },
        enabled: !!swaps && !!pools && !!prices && !!reserves && !!lpTokenAmounts && !!quarry && !!poolsInfo && !!rewarders && !!stakePoolApy && !!poolInfo,
    });
}
