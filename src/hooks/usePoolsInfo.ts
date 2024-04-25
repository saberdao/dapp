import { useQuery } from '@tanstack/react-query';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ParsedAccountData, PublicKey } from '@solana/web3.js';
import { QUARRY_ADDRESSES, QuarrySDK } from '@quarryprotocol/quarry-sdk';
import { chunk } from 'lodash';
import throat from 'throat';
import { Percent, Token, TokenAmount, getATAAddressSync } from '@saberhq/token-utils';
import { SBR_ADDRESS } from '@saberhq/saber-periphery';

import { DetailedSwapSummary, PoolData, PoolInfo, PoolInfoRaw } from '@/src/types';
import useGetPrices from '@/src/hooks/useGetPrices';
import useGetReserves from '@/src/hooks/useGetReserves';
import useGetLPTokenAmounts from '@/src/hooks/useGetLPTokenAmounts';
import { getExchange } from '@/src/helpers/exchange';
import { getPoolTVL } from '@/src/helpers/prices';
import useGetSwaps from '@/src/hooks/useGetSwaps';
import useGetPools from '@/src/hooks/useGetPools';
import useNetwork from '@/src/hooks/useNetwork';
import { valuesToKeys } from '@/src/helpers/keys';
import { parseRawSwapState } from '@/src/helpers/state';
import useSettings from '@/src/hooks/useSettings';
import useQuarry from '@/src/hooks/useQuarry';
import { getEmissionApy, getFeeApy } from '@/src/helpers/apy';
import usePoolsData from '@/src/hooks/usePoolsData';
import { calculateWithdrawAll } from '@/src/hooks/user/useWithdraw/calculateWithdrawAll';

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

const getStakedBalanceAta = (owner: PublicKey, quarry: PublicKey, lpTokenAddress: PublicKey) => {
    const k = PublicKey.findProgramAddressSync(
        [Buffer.from(encode('Miner')), quarry.toBytes(), owner.toBytes()],
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

const getQuarryInfo = async (quarry: QuarrySDK, pools: PoolData[]) => {
    // Get quarry info
    const rewarders = pools.map((pool) => pool.info.quarry);

    const chunks = chunk(rewarders, 100);

    // Ask the RPC to execute this
    const rewarderInfo = (
        await Promise.all(
            chunks.map(
                throat(10, async (chunk) => {
                    const result: Awaited<
                        ReturnType<typeof quarry.programs.Mine.account.quarry.fetch>
                    >[] = (await quarry.programs.Mine.account.quarry.fetchMultiple(chunk)) as any;
                    return result;
                }),
            ),
        )
    ).flat();

    // Merge in pool
    pools.forEach((pool) => {
        pool.quarryData = rewarderInfo.find(
            (info) => info?.tokenMintKey.toString() === pool.info.lpToken.address,
        );
    });
};

export default function () {
    const { formattedNetwork } = useNetwork();
    const { data: swaps } = useGetSwaps(formattedNetwork);
    const { data: pools } = useGetPools(formattedNetwork);
    const { data: prices } = useGetPrices();
    const { data: reserves } = useGetReserves(pools?.pools);
    const { data: poolsInfo } = usePoolsData();
    const { data: lpTokenAmounts } = useGetLPTokenAmounts(pools?.pools);
    const { data: quarry } = useQuarry();
    const { connection } = useConnection();
    const { maxSlippagePercent } = useSettings();
    const { wallet } = useWallet();

    return useQuery({
        queryKey: ['registryPoolsInfo', wallet?.adapter.publicKey ? 'connected' : 'disconnected'],
        queryFn: async () => {
            // Only run when we have the dependent info
            // Note these are also in the enabled boolean,
            // and that they are cached in localStorage to
            // prevent re-fetching on every page load.
            // Especially for the reverse balances this
            // saves a ton of RPC calls.
            if (
                !swaps ||
                !pools ||
                !prices ||
                !reserves ||
                !lpTokenAmounts ||
                !quarry ||
                !poolsInfo
            ) {
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

            await getQuarryInfo(quarry.sdk, data.pools);

            data.pools.forEach((pool) => {
                const metricInfo = poolsInfo?.find(
                    (info) => info.poolId === pool.info.swap.config.swapAccount.toString(),
                );
                pool.metricInfo = metricInfo;

                const tvl = getPoolTVL(pool);
                const feeApy = getFeeApy(metricInfo?.['24hFeeInUsd'] ?? 0, tvl ?? 0);
                const emissionApy = getEmissionApy(pool, prices[SBR_ADDRESS.toString()]);
                pool.metrics = {
                    tvl,
                    feeApy,
                    emissionApy,
                    totalApy: feeApy + emissionApy,
                };
            });

            if (wallet?.adapter.publicKey) {
                // Also add all staked balances
                const balanceAddresses = data.pools.map((pool) => {
                    return getStakedBalanceAta(
                        wallet.adapter.publicKey!,
                        new PublicKey(pool.info.quarry),
                        new PublicKey(pool.info.lpToken.address),
                    );
                });

                // Now we need to fetch the balances of all these addresses, we can do that in chunks of 100
                const chunks = chunk(balanceAddresses, 100);

                // Ask the RPC to execute this
                const tokenAmounts = (
                    await Promise.all(
                        chunks.map(
                            throat(10, async (chunk) => {
                                const result = await connection.getMultipleParsedAccounts(
                                    chunk.map((account) => new PublicKey(account.ata)),
                                );
                                return result.value.map((item, i) => {
                                    return {
                                        address: chunk[i].ata,
                                        lpTokenAddress: chunk[i].lpTokenAddress,
                                        amount: (item?.data as ParsedAccountData)?.parsed.info
                                            .tokenAmount.amount,
                                    };
                                });
                            }),
                        ),
                    )
                ).flat();

                // Merge into pools by updating by reference
                tokenAmounts.map((amount) => {
                    if (amount.amount) {
                        const pool = data.pools.find(
                            (pool) =>
                                pool.info.lpToken.address === amount.lpTokenAddress.toString(),
                        );
                        if (pool) {
                            pool.userInfo = {
                                stakedBalance: amount.amount,
                                stakedUsdValue: calculateUsdValue(
                                    pool,
                                    amount.amount,
                                    maxSlippagePercent,
                                ),
                            };
                        }
                    }
                });
            }

            return data;
        },
        enabled:
            !!swaps &&
            !!pools &&
            !!prices &&
            !!reserves &&
            !!lpTokenAmounts &&
            !!quarry &&
            !!poolsInfo,
    });
}
