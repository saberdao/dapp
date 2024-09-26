import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import invariant from 'tiny-invariant';
import type { HeadFC } from 'gatsby';
import { Token, TokenAmount, TokenInfo } from '@saberhq/token-utils';
import { FaDiscord, FaGithub, FaGlobe, FaMedium, FaTelegram } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { IconType } from 'react-icons';
import { useWallet } from '@solana/wallet-adapter-react';
import BN from 'bn.js';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';

import Saber from '../../svg/saber';
import { PoolData } from '../../types';

import { toAPY, toPrecision } from '../../helpers/number';
import { SBR_INFO } from '../../utils/builtinTokens';
import { getLogo, getPoolId, getPoolName, getSymbol } from '../../helpers/pool';

import useClaim from '../../hooks/user/useClaim';
import usePoolsInfo from '../../hooks/usePoolsInfo';
import useUserGetLPTokenBalance from '../../hooks/user/useGetLPTokenBalance';
import useQuarryMiner from '../../hooks/user/useQuarryMiner';
import useClaimableRewards from '../../hooks/user/useClaimableRewards';
import { calculateWithdrawAll } from '../../hooks/user/useWithdraw/calculateWithdrawAll';
import useSettings from '../../hooks/useSettings';
import useDailyRewards from '../../hooks/user/useDailyRewards';

import H2 from '../../components/H2';
import H1 from '../../components/H1';
import Block from '../../components/Block';
import Address from '../../components/Address';
import Button from '../../components/Button';
import Tabs from '../../components/Tabs';
import StakeForm from '../../components/pool/StakeForm';
import WithdrawForm from '../../components/pool/WithdrawForm';
import UnstakeForm from '../../components/pool/UnstakeForm';
import DepositForm from '../../components/pool/DepositForm';
import TX from '../../components/TX';
import UniversalPopover, { Ref } from '../../components/models/universal-popover';
import ModelHeader from '../../components/models/model-header';
import { toast } from 'sonner';
import { TokenDisplay, TokenLogo } from '@/src/components/TokenDisplay';
import useUpgradeStake from '@/src/hooks/user/useUpgradeStake';
import useDeprecatedPools from '@/src/hooks/useDeprecatedPools';
import BigNumber from 'bignumber.js';

const InfoPanel = (props: { data: any[][] }) => {
    return (
        <div className="grid grid-cols-2 text-sm gap-1 text-gray-200">
            {props.data.map((item, i) =>
                item[0] === '---' ? (
                    <div key={i} className="col-span-2 text-gray-400">
                        <hr className="border-slate-800 my-3" />
                    </div>
                ) : (
                    <React.Fragment key={i}>
                        <div className="text-gray-400">{item[0]}</div>
                        <div className="flex justify-end">{item[1]}</div>
                    </React.Fragment>
                ),
            )}
        </div>
    );
};

const ExternalLink = (props: { href?: string; icon: IconType }) => {
    if (!props.href) {
        return null;
    }

    return (
        <a
            href={props.href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center w-8 h-8 bg-saber-dark hover:bg-saber-light transition-colors rounded-full text-white"
        >
            <props.icon />
        </a>
    );
};

const AboutBlock = (props: { token: TokenInfo }) => {
    return (
        <Block className="w-full h-full">
            <H2>{getSymbol(props.token.symbol)}</H2>
            {props.token.extensions?.description ? (
                <div className="mb-3 text-secondary">{props.token.extensions?.description}</div>
            ) : null}
            <div className="flex items-center gap-1">
                <ExternalLink href={props.token.extensions?.website} icon={FaGlobe} />
                <ExternalLink href={props.token.extensions?.discord} icon={FaDiscord} />
                <ExternalLink href={props.token.extensions?.github} icon={FaGithub} />
                <ExternalLink href={props.token.extensions?.medium} icon={FaMedium} />
                <ExternalLink href={props.token.extensions?.twitter} icon={FaXTwitter} />
                <ExternalLink href={props.token.extensions?.tggroup} icon={FaTelegram} />
                {/* @ts-ignore */}
                {props.token.extensions?.other?.map((link, i) => (
                    <ExternalLink key={i} href={link} icon={FaGlobe} />
                ))}
            </div>
        </Block>
    );
};

const FarmCounter = (props: { pool: PoolData }) => {
    const { claimableRewards } = useClaimableRewards(props.pool.info.lpToken);
    const { data: miner } = useQuarryMiner(props.pool.info.lpToken, true);
    const [amounts, setAmounts] = useState<{ primary: number, secondary: number[] } | null>(null);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (claimableRewards?.()?.primary) {
            setStarted(true);
        }
    }, [claimableRewards]);

    useEffect(() => {
        if (started === false) {
            return;
        }

        let playing = true;
        const doFrame = () => {
            setAmounts(claimableRewards?.() ?? { primary: 0, secondary: [] });
            if (playing) {
                requestAnimationFrame(doFrame);
            }
        };
        doFrame();
        return () => {
            playing = false;
        };
    }, [started]);

    const digits = useMemo(() => {
        if (!amounts) {
            return undefined;
        }
        return {
            primary: Math.max(0, Math.min(8, 8 - Math.ceil(Math.log10(amounts.primary ?? 1)))),
            secondary: amounts.secondary.map(secondaryAmount => Math.max(0, Math.min(8, 8 - Math.ceil(Math.log10(secondaryAmount ?? 1)))))
        };
    }, [amounts]);

    if (amounts && digits) {
        return (
            <>
                {amounts.primary > 0 ? <>
                    <div className="flex justify-end">
                        <Saber className="rounded-full p-1 text-saber-dark bg-black border border-saber-dark" />
                    </div>
                    <div className="text-right font-mono">
                        {isNaN(amounts.primary) ? '0' : amounts.primary.toFixed(digits.primary)}
                    </div>
                </>
                : null}
                {amounts.secondary.map((secondaryAmount, i) => {
                    if (secondaryAmount === 0) {
                        return null;
                    }
                    invariant(miner?.replicaInfo);
                    return (
                        <React.Fragment key={i}>
                            <div className="flex justify-end">
                                <TokenLogo
                                    className="w-5 h-5"
                                    mint={props.pool.replicaQuarryData?.[i].info.rewardsToken.mint ?? props.pool.replicaQuarryData![i].info.rewardsToken.mint}
                                    img={props.pool.replicaQuarryData?.[i].info.redeemer?.tokenInfo.logoURI}
                                />
                            </div>
                            <div className="text-right font-mono">
                                {isNaN(secondaryAmount) ? '0' : secondaryAmount.toFixed(digits.secondary[i])}
                            </div>
                        </React.Fragment>
                    )
                })}
            </>
        );
    }

    return null;
};

const FarmRewards = (props: { pool: PoolData }) => {
    return (
        <div className="grid grid-cols-2 gap-1 w-full">
            <FarmCounter pool={props.pool} />
        </div>
    );
};

const LiquidityForms = (props: { pool: PoolData }) => {
    const { data: deprecatedPools } = useDeprecatedPools();
    const deprecated = deprecatedPools?.includes(props.pool.info.name);
    const [selectedTab, setSelectedTab] = useState(deprecated ? 'Unstake' : 'Deposit');

    const tabs = [
        !deprecated && { name: 'Deposit', current: selectedTab === 'Deposit' },
        { name: 'Withdraw', current: selectedTab === 'Withdraw' },
        !deprecated && { name: 'Stake', current: selectedTab === 'Stake' },
        { name: 'Unstake', current: selectedTab === 'Unstake' },
    ].filter((x): x is { name: string; current: boolean } => !!x);

    return (
        <>
            <Tabs tabs={tabs} setSelectedTab={setSelectedTab} />
            <div className="p-5">
                {selectedTab === 'Deposit' && <DepositForm pool={props.pool} />}
                {selectedTab === 'Withdraw' && <WithdrawForm pool={props.pool} />}
                {selectedTab === 'Stake' && <StakeForm pool={props.pool} />}
                {selectedTab === 'Unstake' && <UnstakeForm pool={props.pool} />}
            </div>
        </>
    );
};

const UpgradeStakeButton = (props: { pool: PoolData}) => {
    const { upgradeStake } = useUpgradeStake(props.pool);

    const {
        mutate: execUpgradeStake,
        isPending,
    } = useMutation({
        mutationKey: ['deposit'],
        mutationFn: async () => {
            await upgradeStake();
        },
    });

    return null;

    return (
        <button
            className="bg-yellow-600 cursor-pointer hover:bg-yellow-800 text-center text-xs text-slate-200 z-1 relative p-2 rounded-lg flex gap-1 justify-center items-center transition-colors"
            onClick={() => execUpgradeStake()}
            disabled={isPending}
        >
            {isPending ? 'Unstaking...' : 'You have staked your LP tokens in our legacy miner. Click here to withdraw, then stake again to upgrade stake.'}
        </button>
    )
}

const LiquidityBlock = (props: { pool: PoolData; handleOpenModel?: () => void }) => {
    const { wallet } = useWallet();
    const { data: miner, refetch } = useQuarryMiner(props.pool.info.lpToken, true);
    const { claimableRewards, reset } = useClaimableRewards(props.pool.info.lpToken);
    const { data: lpTokenBalance } = useUserGetLPTokenBalance(
        props.pool.pair.pool.state.poolTokenMint.toString(),
    );
    const { maxSlippagePercent } = useSettings();
    const { dailyRewards, refetch: refetchRewards } = useDailyRewards(props.pool.info.lpToken);
    
    const token0 = useMemo(() => {
        return props.pool?.info.tokens[0];
    }, [props.pool]);

    const token1 = useMemo(() => {
        return props.pool?.info.tokens[1];
    }, [props.pool]);
    const rewards = useMemo(() => {
        return claimableRewards?.() ?? { primary: 0, secondary: [] };
    }, [claimableRewards]);

    const stakedValue = useMemo(() => {
        if (!miner?.data || !miner.stakedBalance) {
            return { valueA: 0, valueB: 0, usdValue: 0 };
        }

        const values = calculateWithdrawAll({
            poolTokenAmount: new TokenAmount(
                new Token(props.pool.info.lpToken),
                miner.stakedBalance,
            ),
            maxSlippagePercent,
            exchangeInfo: props.pool.exchangeInfo,
        });

        const valueA = values.estimates[0] ? values.estimates[0].asNumber : 0;
        const valueB = values.estimates[1] ? values.estimates[1].asNumber : 0;

        const usdValue = valueA * props.pool.usdPrice.tokenA + valueB * props.pool.usdPrice.tokenB;
        return { valueA, valueB, usdValue };
    }, [miner]);

    const { claim } = useClaim(props.pool);
    const {
        mutate: execClaim,
        isPending,
    } = useMutation({
        mutationKey: ['claim'],
        mutationFn: async () => {
            await claim();
            reset();
        },
    });

    if (!wallet?.adapter.publicKey) {
        return (
            <Block className="">
                <H2>Your Liquidity</H2>
                <p className="text-secondary">Connect wallet to view and manage your liquidity.</p>
            </Block>
        );
    }

    return (
        <>
            <Block className="flex flex-col gap-1 mb-4">
                <H2>Your Liquidity</H2>
                <InfoPanel
                    data={[
                        [
                            'Staked', 
                            <div key={`${token0.address}-deposits`} className="flex items-center gap-1">
                                <img src={getLogo(token0.symbol, token0.logoURI)} className="w-5 h-5" />
                                <p>{getSymbol(token0.symbol)}</p>
                                <p>{toPrecision(stakedValue.valueA, 4)}</p>
                            </div>
                        ],
                        [
                            '',
                            <div key={`${token1.address}-deposits`} className="flex items-center gap-1">
                                <img src={getLogo(token1.symbol, token1.logoURI)} className="w-5 h-5" />
                                <p>{getSymbol(token1.symbol)}</p>
                                <p>{toPrecision(stakedValue.valueB, 4)}</p>
                            </div>
                        ],
                        ['Staked USD value', `$${toPrecision(stakedValue.usdValue, 4)}`],
                        lpTokenBalance && lpTokenBalance.balance.value.uiAmount
                            ? [
                                  'LP token balance',
                                  `${toPrecision(lpTokenBalance.balance.value.uiAmount, 4)}`,
                              ]
                            : [],
                        ['Farm Rewards', <FarmRewards key="f" pool={props.pool} />],
                    ].filter((x) => x.length !== 0)}
                />

                {(rewards.primary + rewards.secondary.reduce((a, b) => a + b, 0) > 0) &&
                    (isPending ? (
                        <Button size="full" disabled key="g">
                            Claiming...
                        </Button>
                    ) : (
                        <Button size="full" key="g" onClick={execClaim}>
                            Claim
                        </Button>
                    ))}

                {dailyRewards > 0 && (
                    <div
                        key="daily-rewards"
                        className="flex items-center justify-end gap-1 text-xs text-gray-500 font-mono"
                    >
                        You are farming
                        <Saber className="rounded-full p-1 text-saber-dark bg-black border border-saber-dark" />
                        {toPrecision(dailyRewards, 4)} / day
                    </div>
                )}

                {miner?.stakedBalanceLegacy?.gt(new BN(0))
                    && miner.replicaInfo
                    && miner.replicaInfo.replicaQuarries.length > 0
                    && <UpgradeStakeButton pool={props.pool} />}
            </Block>
            <Block noPadding className="mt-4">
                <LiquidityForms pool={props.pool} />
            </Block>
        </>
    );
};

const EmissionRate = (props: { pool: PoolData }) => {
    const { data: miner } = useQuarryMiner(props.pool.info.lpToken);

    const emissionRate = useMemo(() => {
        if (!miner) {
            return 0;
        }

        const annualRate = miner.quarry.quarryData.annualRewardsRate;
        const dailyRate = annualRate.div(new BN(365));
        const rate = dailyRate.div(new BN(10 ** SBR_INFO.decimals));

        return rate.toNumber();
    }, [miner]);

    return (
        <div key="sbr-emission-rate" className="flex gap-1">
            <Saber className="text-saber-dark bg-black border border-saber-dark rounded-full p-1 w-5 h-5" />
            {toPrecision(emissionRate, 4)} / day
        </div>
    );
};

const ReplicaEmissionRate = (props: { replica: NonNullable<PoolData['replicaQuarryData']>[number] }) => {
    const emissionRate = useMemo(() => {
        const annualRate = props.replica.data.annualRewardsRate;
        const dailyRate = new BigNumber(annualRate.div(new BN(365)).toString());
        const rate = dailyRate.div(new BigNumber(10 ** props.replica.info.rewardsToken.decimals));

        return rate.toNumber();
    }, [props.replica]);

    if (emissionRate === 0) {
        return null;
    }

    return (
        <div key="sbr-emission-rate" className="flex gap-1">
            <TokenLogo className="w-5 h-5" mint={props.replica.info.rewardsToken.mint} img={props.replica.info.redeemer?.tokenInfo.logoURI} />
            {toPrecision(emissionRate, 4)} / day
        </div>
    );
};

const PoolPage = (props: { params: { id: string } }) => {
    const pools = usePoolsInfo();

    const leveragedRef = useRef<Ref>();

    const pool = useMemo(() => {
        return pools?.data?.pools?.find((x) => getPoolId(x.info.id) === getPoolId(props.params.id));
    }, [props.params.id, pools]);

    const token0 = useMemo(() => {
        return pool?.info.tokens[0];
    }, [pool]);

    const token1 = useMemo(() => {
        return pool?.info.tokens[1];
    }, [pool]);

    const handleModelClose = useCallback(() => {
        leveragedRef.current?.close();
    }, []);

    const handleOpenModel = useCallback(() => {
        leveragedRef.current?.open();
    }, []);

    if (!pool || !token0 || !token1) {
        return <p>Loading pool...</p>;
    }

    const poolData = [
        ['---'],
        ['SBR emission rate', pool ? <EmissionRate pool={pool} /> : null],
        ...(pool.replicaQuarryData ? pool.replicaQuarryData.map((replica) => {
            if (replica.data.annualRewardsRate.toString() === '0') {
                return [];
            }
            return [<div>
                <TokenDisplay name={replica.info.redeemer?.tokenInfo.symbol} mint={replica.info.rewardsToken.mint} /> emission rate
            </div>, <ReplicaEmissionRate replica={replica} />];
        }) : []),
        ['---'],
        [
            <div key={`${token0.address}-deposits`} className="flex items-center gap-1">
                <img src={getLogo(token0.symbol, token0.logoURI)} className="w-5 h-5 rounded-full" />
                <p>{getSymbol(token0.symbol)}</p>
            </div>,
            `${toPrecision(
                pool.exchangeInfo.reserves[0].amount.asNumber,
                4,
            )} (${toPrecision(
                100 * pool.exchangeInfo.reserves[0].amount.asNumber / (pool.exchangeInfo.reserves[0].amount.asNumber + pool.exchangeInfo.reserves[1].amount.asNumber),
                4,
            )}%)`,
        ],
        [
            <div key={`${token1.address}-deposits`} className="flex items-center gap-1">
                <img src={getLogo(token1.symbol, token1.logoURI)} className="w-5 h-5 rounded-full" />
                <p>{getSymbol(token1.symbol)}</p>
            </div>,
            `${toPrecision(
                pool.exchangeInfo.reserves[1].amount.asNumber,
                4,
            )} (${toPrecision(
                100 * pool.exchangeInfo.reserves[1].amount.asNumber / (pool.exchangeInfo.reserves[0].amount.asNumber + pool.exchangeInfo.reserves[1].amount.asNumber),
                4,
            )}%)`,
        ],
        ['Pool USD value', `$${toPrecision(
            pool.exchangeInfo.reserves[0].amount.asNumber * pool.usdPrice.tokenA +
            pool.exchangeInfo.reserves[1].amount.asNumber * pool.usdPrice.tokenB,
            4,
        )}`],
        ['---'],
        ['24h volume', `$${toPrecision(pool.metricInfo?.v ?? 0)}`],
        ['24h fees', `$${toPrecision(pool.metricInfo?.feesUsd ?? 0)}`],
        ['---'],
        [
            'Virtual price',
            `${pool.virtualPrice ? toPrecision(pool.virtualPrice.asNumber, 7) : '...'}`,
        ],
        ['Concentration coefficient', `${pool.pair.pool.exchange.ampFactor}x`],
        ['---'],
        ['Trade fee', `${pool.pair.pool.exchange.fees.trade.asNumber * 100}%`],
        ['Withdraw fee', `${pool.pair.pool.exchange.fees.withdraw.asNumber * 100}%`],
    ];

    const addressData = [
        [
            'Swap account',
            <Address key={0} address={pool.pair.pool.config.swapAccount.toString()} />,
        ],
        [
            'Pool token address',
            <Address key={1} address={pool.pair.pool.state.poolTokenMint.toString()} />,
        ],
        ['Token A mint', <Address key={2} address={pool.pair.pool.state.tokenA.mint.toString()} />],
        ['Token B mint', <Address key={3} address={pool.pair.pool.state.tokenB.mint.toString()} />],
        [
            'Token A reserve',
            <Address key={4} address={pool.pair.pool.state.tokenA.reserve.toString()} />,
        ],
        [
            'Token B reserve',
            <Address key={5} address={pool.pair.pool.state.tokenB.reserve.toString()} />,
        ],
    ];

    return (
        <>
            <UniversalPopover ref={leveragedRef} onClose={handleModelClose}>
                <div
                    className={clsx(
                        'bg-saber-modelBg max-w-4xl w-full m-2 sm:m-2 md:m-2 bg-darkblue border  border-gray-600 shadow-3xl rounded-xl z-[1000] transition-opacity',
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* <ModelHeader
                        handleClose={handleModelClose}
                        title={`Leveraged ${pool.info.name} LP`}
                    /> */}
                </div>
            </UniversalPopover>
            <div>
                <H1>{getPoolName(pool.info.name)}</H1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="col-span-2">
                        <Block>
                            <div className="grid grid-cols-1 sm:grid-cols-2">
                                <div>
                                    <p className="text-gray-400">Total deposits</p>
                                    <p className="text-2xl font-bold text-gray-300">
                                        ${toPrecision(pool.metrics?.tvl ?? 0, 4)}
                                    </p>
                                </div>
                                <div className="flex flex-col items-start sm:items-end mt-5 sm:mt-0">
                                    <p className="text-gray-400">Staking APY</p>
                                    <div className="flex flex-col justify-center text-lg font-bold text-gray-300">
                                        <div className="text-left sm:text-right">
                                            {toAPY(pool.metrics?.totalApy ?? 0, 4)}%
                                        </div>
                                        <div className="flex gap-1 text-xs font-normal">
                                            <div className="flex items-center gap-1 justify-start sm:justify-end">
                                                {toAPY(pool.metrics?.emissionApy ?? 0, 4)}%
                                                <Saber className="text-saber-dark bg-black border border-saber-dark rounded-full p-1 w-5 h-5" />
                                                +
                                            </div>
                                            <div className="flex items-center gap-1 justify-start sm:justify-end">
                                                {toAPY(pool.metrics?.feeApy ?? 0, 4)}%
                                                <div className="flex gap-2">
                                                    <img
                                                        className="w-4 h-4 rounded-full"
                                                        src={getLogo(
                                                            pool.info.tokens[0].symbol,
                                                            pool.info.tokenIcons[0].logoURI,
                                                        )}
                                                    />
                                                    <img
                                                        className="-ml-4 w-4 h-4 rounded-full"
                                                        src={getLogo(
                                                            pool.info.tokens[1].symbol,
                                                            pool.info.tokenIcons[1].logoURI,
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            {pool.metrics?.secondaryApy.map((apy, i) => (
                                                apy > 0 ? <div key={i} className="flex items-center gap-1">
                                                    + <TokenLogo
                                                        className="w-4 h-4"
                                                        mint={pool.replicaQuarryData?.[i].info.redeemer?.tokenInfo.address ?? pool.replicaQuarryData![i].info.rewardsToken.mint}
                                                        img={pool.replicaQuarryData?.[i].info.redeemer?.tokenInfo.logoURI}
                                                    />{' '}
                                                    {toAPY(apy, 4)}%
                                                </div> : null
                                            ))}
                                            {(pool.metrics?.stakePoolApyToken0) ?? 0 > 0 ?
                                                <div className="flex items-center gap-1">
                                                    + <img
                                                        className="w-4 h-4 rounded-full"
                                                        src={getLogo(
                                                            pool.info.tokens[0].symbol,
                                                            pool.info.tokenIcons[0].logoURI,
                                                        )}
                                                    />{' '}
                                                    {toAPY(pool.metrics?.stakePoolApyToken0 ?? 0, 4)}%
                                                </div> : null
                                            }
                                            {(pool.metrics?.stakePoolApyToken1) ?? 0 > 0 ?
                                                <div className="flex items-center gap-1">
                                                    + <img
                                                        className="w-4 h-4 rounded-full"
                                                        src={getLogo(
                                                            pool.info.tokens[1].symbol,
                                                            pool.info.tokenIcons[1].logoURI,
                                                        )}
                                                    />{' '}
                                                    {toAPY(pool.metrics?.stakePoolApyToken1 ?? 0, 4)}%
                                                </div> : null
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <InfoPanel data={poolData} />
                        </Block>
                        <div className="block lg:hidden mt-5">
                            <LiquidityBlock pool={pool} handleOpenModel={handleOpenModel} />
                        </div>
                        <div className="grid sm:grid-cols-2 mt-5 gap-5 text-sm">
                            <AboutBlock token={token0} />
                            <AboutBlock token={token1} />
                        </div>
                        <Block className="mt-5">
                            <H2>Addresses</H2>
                            <InfoPanel data={addressData} />
                        </Block>
                    </div>
                    <div className="lg:block hidden">
                        <LiquidityBlock pool={pool} handleOpenModel={handleOpenModel} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default PoolPage;

export const Head: HeadFC = () => <title>Saber Pool | Solana AMM</title>;
