import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HeadFC } from 'gatsby';
import { Token, TokenAmount, TokenInfo } from '@saberhq/token-utils';
import { FaDiscord, FaGithub, FaGlobe, FaMedium, FaTelegram } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { IconType } from 'react-icons';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-toastify';
import BN from 'bn.js';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';

import Saber from '../../svg/saber';
import { PoolData } from '../../types';
import dapp from '../../hoc/dapp';
import { toPrecision } from '../../helpers/number';
import { isPoolDeprecated } from '../../helpers/deprecatedPools';
import { SBR_INFO } from '../../utils/builtinTokens';

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
import LeverageModel from '../../components/models/leverage-model';

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
            <H2>{props.token.symbol}</H2>
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
            </div>
        </Block>
    );
};

const FarmCounter = (props: { pool: PoolData }) => {
    const { claimableRewards } = useClaimableRewards(props.pool.info.lpToken);
    const [amounts, setAmounts] = useState<number | null>(null);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (claimableRewards?.()) {
            setStarted(true);
        }
    }, [claimableRewards]);

    useEffect(() => {
        let playing = true;
        const doFrame = () => {
            setAmounts(claimableRewards() ?? 0);
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
        return amounts && Math.max(0, Math.min(8, 8 - Math.ceil(Math.log10(amounts ?? 1))));
    }, [amounts]);

    if (amounts && digits) {
        return <p>{amounts.toFixed(digits)}</p>;
    }

    return 0;
};

const FarmRewards = (props: { pool: PoolData }) => {
    return (
        <div className="grid grid-cols-2 gap-1 w-full">
            <div className="flex justify-end">
                <Saber className="rounded-full p-1 text-saber-dark bg-black border border-saber-dark" />
            </div>
            <div className="text-right font-mono">
                <FarmCounter pool={props.pool} />
            </div>
        </div>
    );
};

const LiquidityForms = (props: { pool: PoolData }) => {
    const deprecated = isPoolDeprecated(props.pool.info.name);
    const [selectedTab, setSelectedTab] = useState(deprecated ? 'Unstake' : 'Deposit');

    const tabs = [
        !deprecated && { name: 'Deposit', current: selectedTab === 'Deposit' },
        !deprecated && { name: 'Withdraw', current: selectedTab === 'Withdraw' },
        { name: 'Stake', current: selectedTab === 'Stake' },
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

const LiquidityBlock = (props: { pool: PoolData; handleOpenModel?: () => void }) => {
    const { wallet } = useWallet();
    const [lastStakeHash, setLastStakeHash] = useState('');
    const { data: miner, refetch } = useQuarryMiner(props.pool.info.lpToken, true);
    const { data: lpTokenBalance } = useUserGetLPTokenBalance(
        props.pool.pair.pool.state.poolTokenMint.toString(),
    );
    const { maxSlippagePercent } = useSettings();
    const { dailyRewards, refetch: refetchRewards } = useDailyRewards(props.pool.info.lpToken);

    const stakedUsdValue = useMemo(() => {
        if (!miner?.data) {
            return 0;
        }

        const values = calculateWithdrawAll({
            poolTokenAmount: new TokenAmount(
                new Token(props.pool.info.lpToken),
                miner.data.balance,
            ),
            maxSlippagePercent,
            exchangeInfo: props.pool.exchangeInfo,
        });

        const valueA = values.estimates[0] ? values.estimates[0].asNumber : 0;
        const valueB = values.estimates[1] ? values.estimates[1].asNumber : 0;

        const usdValue = valueA * props.pool.usdPrice.tokenA + valueB * props.pool.usdPrice.tokenB;
        return usdValue;
    }, [miner]);

    const { claim } = useClaim(props.pool.info.lpToken);
    const { reset } = useClaimableRewards(props.pool.info.lpToken);
    const {
        mutate: execClaim,
        isPending,
        isSuccess,
        data: hash,
    } = useMutation({
        mutationKey: ['deposit', lastStakeHash],
        mutationFn: async () => {
            const hash = await claim();
            return hash;
        },
    });

    // Do it like this so that when useMutation is called twice, the toast will only show once.
    // But it still works with multiple stake invocations.
    useEffect(() => {
        if (lastStakeHash) {
            toast.success(
                <div className="text-sm">
                    <p>Transaction successful! Your transaction hash:</p>
                    <TX tx={lastStakeHash} />
                </div>,
                {
                    onClose: () => {
                        reset();
                        refetch();
                        refetchRewards();
                    },
                },
            );
        }
    }, [lastStakeHash]);

    if (isSuccess && hash && lastStakeHash !== hash) {
        setLastStakeHash(hash);
    }

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
                        ['Staked', `$${toPrecision(stakedUsdValue, 4)}`],
                        lpTokenBalance && lpTokenBalance.balance.value.uiAmount
                            ? [
                                  'LP token balance',
                                  `${toPrecision(lpTokenBalance.balance.value.uiAmount, 4)}`,
                              ]
                            : [],
                        ['SBR Rewards', <FarmRewards key="f" pool={props.pool} />],
                    ].filter((x) => x.length !== 0)}
                />

                {miner?.data?.balance.gt(new BN(0)) &&
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
            </Block>
            {props.pool?.info?.name === 'bSOL-SOL' ||
                (props.pool?.info?.name === 'mSOL-SOL' && (
                    <Button size="full" onClick={props.handleOpenModel}>
                        Boost your APY up to 70%!
                    </Button>
                ))}
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

const PoolPage = (props: { params: { id: string } }) => {
    const pools = usePoolsInfo();

    const leveragedRef = useRef<Ref>();

    const pool = useMemo(() => {
        return pools?.data?.pools?.find((x) => x.info.id === props.params.id);
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
        return null;
    }

    const poolData = [
        ['---'],
        ['SBR emission rate', pool ? <EmissionRate pool={pool} /> : null],
        ['---'],
        [
            <div key={`${token0.address}-deposits`} className="flex items-center gap-1">
                <img src={token0.logoURI} className="w-5 h-5" />
                <p>{token0.symbol}</p>
            </div>,
            `$${toPrecision(
                pool.exchangeInfo.reserves[0].amount.asNumber * pool.usdPrice.tokenA,
                4,
            )}`,
        ],
        [
            <div key={`${token1.address}-deposits`} className="flex items-center gap-1">
                <img src={token1.logoURI} className="w-5 h-5" />
                <p>{token1.symbol}</p>
            </div>,
            `$${toPrecision(
                pool.exchangeInfo.reserves[1].amount.asNumber * pool.usdPrice.tokenB,
                4,
            )}`,
        ],
        ['---'],
        ['24h volume', `$${toPrecision(pool.metricInfo?.volumeInUSD ?? 0)}`],
        ['24h fees', `$${toPrecision(pool.metricInfo?.['24hFeeInUsd'] ?? 0)}`],
        ['---'],
        [
            'Virtual price',
            `${pool.virtualPrice ? toPrecision(pool.virtualPrice.asNumber, 4) : '...'}`,
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
            'Token B reserve',
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
                    <LeverageModel pool={pool} />
                </div>
            </UniversalPopover>
            <div>
                <H1>{pool.info.name}</H1>
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
                                            {toPrecision(pool.metrics?.totalApy ?? 0, 4)}%
                                        </div>
                                        <div className="flex gap-1 text-xs font-normal">
                                            <div className="flex items-center gap-1 justify-start sm:justify-end">
                                                {toPrecision(pool.metrics?.emissionApy ?? 0, 4)}%
                                                <Saber className="text-saber-dark bg-black border border-saber-dark rounded-full p-1 w-5 h-5" />
                                                +
                                            </div>
                                            <div className="flex items-center gap-1 justify-start sm:justify-end">
                                                {toPrecision(pool.metrics?.feeApy ?? 0, 4)}%
                                                <div className="flex gap-2">
                                                    <img
                                                        className="w-4 h-4 rounded-full"
                                                        src={pool.info.tokenIcons[0].logoURI}
                                                    />
                                                    <img
                                                        className="-ml-4 w-4 h-4 rounded-full"
                                                        src={pool.info.tokenIcons[1].logoURI}
                                                    />
                                                </div>
                                            </div>
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

export default dapp(PoolPage);

export const Head: HeadFC = () => <title>Saber Pool | Solana AMM</title>;
