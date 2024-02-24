import React, { useEffect, useMemo, useState } from 'react';
import type { HeadFC } from 'gatsby';
import { TokenInfo } from '@saberhq/token-utils';
import { FaDiscord, FaGithub, FaGlobe, FaMedium, FaTelegram } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import dapp from '../../hoc/dapp';
import H2 from '../../components/H2';
import H1 from '../../components/H1';
import Block from '../../components/Block';
import Address from '../../components/Address';
import Saber from '../../svg/saber';
import Button from '../../components/Button';
import Tabs from '../../components/Tabs';
import StakeForm from '../../components/pool/StakeForm';
import WithdrawForm from '../../components/pool/WithdrawForm';
import UnstakeForm from '../../components/pool/UnstakeForm';
import DepositForm from '../../components/pool/DepositForm';
import usePoolsInfo from '../../hooks/usePoolsInfo';
import { toPrecision } from '../../helpers/number';
import { IconType } from 'react-icons';
import { useWallet } from '@solana/wallet-adapter-react';
import useUserGetLPTokenBalance from '../../hooks/user/useGetLPTokenBalance';
import { PoolData } from '../../types';

const InfoPanel = (props: { data: any[][] }) => {
    return (
        <div className="grid grid-cols-2 text-sm gap-1 text-gray-200">
            {props.data.map((item, i) => (
                item[0] === '---'
                    ? <div key={i} className="col-span-2 text-gray-400">
                        <hr className="border-gray-400 my-1" />
                    </div>
                    : <React.Fragment key={i}>
                        <div className="text-gray-400">{item[0]}</div>
                        <div className="flex justify-end">{item[1]}</div>
                    </React.Fragment>
            ))}
        </div>
    );
};

const ExternalLink = (props: { href?: string, icon: IconType }) => {
    if (!props.href) {
        return null;
    }

    return (
        <a href={props.href} target="_blank" rel="noreferrer" className="flex items-center justify-center w-8 h-8 bg-saber-dark hover:bg-saber-light transition-colors rounded-full text-white">
            <props.icon />
        </a>
    );
};

const AboutBlock = (props: { token: TokenInfo }) => {
    return (
        <Block className="w-full h-full">
            <H2>{props.token.symbol}</H2>
            {props.token.extensions?.description ? <div className="mb-3 text-secondary">
                {props.token.extensions?.description}
            </div> : null}
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

const FarmRewards = () => {
    const [farmRewards, setFarmRewards] = useState(0);

    const digits = Math.max(0, Math.min(4, 4 - Math.ceil(Math.log10(farmRewards))));

    const startFarmLoop = () => {
        setInterval(() => {
            setFarmRewards(x => x + 0.00013);
        }, 1);
    };

    useEffect(() => {
        startFarmLoop();
    }, []);

    return <div className="grid grid-cols-2 gap-1 w-full">
        <div className="flex justify-end">
            <Saber className="rounded-full p-1 text-saber-dark bg-white" />
        </div>
        <div className="text-right font-mono">{farmRewards.toFixed(digits)}</div>
    </div>;
};

const LiquidityForms = (props: { pool: PoolData }) => {
    const [selectedTab, setSelectedTab] = useState(0);
    const { data: lpTokenBalance } = useUserGetLPTokenBalance(props.pool.pair.pool.state.poolTokenMint.toString());

    const tabs = [
        { name: 'Deposit', current: selectedTab === 0 },
        lpTokenBalance?.balance && { name: 'Withdraw', current: selectedTab === 1 },
        lpTokenBalance?.balance && { name: 'Stake', current: selectedTab === 2 },
        { name: 'Unstake', current: selectedTab === 3 },
    ].filter((x): x is { name: string, current: boolean } => !!x);

    return (
        <>
            <Tabs tabs={tabs} setSelectedTab={setSelectedTab} />
            <div className="p-5">
                {selectedTab === 0 && <DepositForm />}
                {selectedTab === 1 && <WithdrawForm />}
                {selectedTab === 2 && <StakeForm pool={props.pool} />}
                {selectedTab === 3 && <UnstakeForm />}
            </div>
        </>
    );
};

const LiquidityBlock = (props: { pool: PoolData }) => {
    const { wallet } = useWallet();
    const { data: lpTokenBalance } = useUserGetLPTokenBalance(props.pool.pair.pool.state.poolTokenMint.toString());

    if (!wallet?.adapter.publicKey) {
        return (
            <Block className="">
                <H2>Your Liquidity</H2>
                <p className="text-secondary">
                    Connect wallet to view and manage your liquidity.
                </p>
            </Block>
        );
    }

    return (
        <>
            <Block className="">
                <H2>Your Liquidity</H2>
                <InfoPanel data={[
                    ['Staked', `$${(Math.random() * 1000).toFixed(2)}`],
                    lpTokenBalance && lpTokenBalance.balance.value.uiAmount ?  ['LP token balance', `${toPrecision(lpTokenBalance.balance.value.uiAmount, 4)}`] : [],
                    ['Farm rewards', <FarmRewards key="f" />],
                    ['', <Button size="small" key="g">Claim</Button>],
                ].filter(x => x.length !== 0)} />
            </Block>

            <Block className="mt-5" noPadding>
                <LiquidityForms pool={props.pool} />
            </Block></>
    );
};

const PoolPage = (props: { params: { id: string }}) => {
    const pools = usePoolsInfo();
    const pool = useMemo(() => {
        return pools?.data?.pools?.find(x => x.info.id === props.params.id);
    }, [props.params.id, pools]);

    if (!pool) {
        return null;
    }

    const poolData = [
        ['---'],
        [
            <div key={`${pool.info.tokens[0].address}-deposits`} className="flex items-center gap-1">
                <img src={pool.info.tokens[0].logoURI} className="w-5 h-5" />
                <p>{pool.info.tokens[0].symbol}</p>
            </div>,
            `$${toPrecision(pool.exchangeInfo.reserves[0].amount.asNumber * pool.usdPrice.tokenA, 4)}`,
        ],
        [
            <div key={`${pool.info.tokens[1].address}-deposits`} className="flex items-center gap-1">
                <img src={pool.info.tokens[1].logoURI} className="w-5 h-5" />
                <p>{pool.info.tokens[1].symbol}</p>
            </div>,
            `$${toPrecision(pool.exchangeInfo.reserves[1].amount.asNumber * pool.usdPrice.tokenB, 4)}`,
        ],
        ['---'],
        ['24h volume', 'TODO'],
        ['24h fees', 'TODO'],
        ['---'],
        ['Virtual price', `${pool.virtualPrice ? toPrecision(pool.virtualPrice.asNumber, 4) : '...'}`],
        ['Concentration coefficient', `${pool.pair.pool.exchange.ampFactor}x`],
        ['---'],
        ['Trade fee', `${pool.pair.pool.exchange.fees.trade.asNumber * 100}%`],
        ['Withdraw fee', `${pool.pair.pool.exchange.fees.withdraw.asNumber * 100}%`],
    ];

    const addressData = [
        ['Swap account', <Address key={0} address={pool.pair.pool.config.swapAccount.toString()} />],
        ['Pool token address', <Address key={1} address={pool.pair.pool.state.poolTokenMint.toString()} />],
        ['Token A mint', <Address key={2} address={pool.pair.pool.state.tokenA.mint.toString()} />],
        ['Token B mint', <Address key={3} address={pool.pair.pool.state.tokenB.mint.toString()} />],
        ['Token B reserve', <Address key={4} address={pool.pair.pool.state.tokenA.reserve.toString()} />],
        ['Token B reserve', <Address key={5} address={pool.pair.pool.state.tokenB.reserve.toString()} />],
    ];

    console.log(pool);

    return (
        <div>
            <H1>{pool.info.name}</H1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="col-span-2">
                    <Block className="">
                        <div className="grid grid-cols-2">
                            <div>
                                <p className="text-gray-400">Total deposits</p>
                                <p className="text-2xl font-bold text-gray-300">${toPrecision(pool.metrics.tvl, 4)}</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <p className="text-gray-400">Staking APY</p>
                                <div className="flex flex-col justify-center gap-1 text-lg font-bold text-gray-300">
                                    todo
                                    {/* <div className="flex items-center gap-1 justify-end">
                                        {(Math.random() * 10).toFixed(2)}%
                                        <Saber className="text-saber-dark bg-white rounded-full p-1" />+
                                    </div>
                                    <div className="flex items-center gap-1 justify-end">
                                        {(Math.random() * 10).toFixed(2)}%
                                        <div className="flex gap-2">
                                            <img className="w-6 h-6" src="https://cdn.jsdelivr.net/gh/saber-hq/spl-token-icons@master/icons/101/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB.svg" />
                                            <img className="-ml-4 w-6 h-6" src="https://cdn.jsdelivr.net/gh/saber-hq/spl-token-icons@master/icons/101/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png" />
                                        </div>+
                                    </div>
                                    <div className="flex items-center gap-1 justify-end">
                                        {(Math.random() * 10).toFixed(2)}%
                                        <img className="w-6 h-6" src="https://cdn.jsdelivr.net/gh/saber-hq/spl-token-icons@master/icons/101/Fd8xyHHRjTvxfZrBirb6MaxSmrZYw99gRSqFUKdFwFvw.png" />
                                    </div> */}
                                </div>
                            </div>
                        </div>
                        <InfoPanel data={poolData} />
                    </Block>

                    <div className="block lg:hidden mt-5">
                        <LiquidityBlock pool={pool} />
                    </div>

                    <div className="grid sm:grid-cols-2 mt-5 gap-5 text-sm">
                        <AboutBlock token={pool.info.tokens[0]} />
                        <AboutBlock token={pool.info.tokens[1]} />
                    </div>

                    <Block className="mt-5">
                        <H2>Addresses</H2>
                        <InfoPanel data={addressData} />
                    </Block>
                </div>
                <div className="lg:block hidden">
                    <LiquidityBlock pool={pool} />
                </div>
            </div>
        </div>
    );
};

export default dapp(PoolPage);

export const Head: HeadFC = () => <title>Saber Pool | Solana AMM</title>;
