import React, { useEffect, useState } from 'react';
import type { HeadFC } from 'gatsby';
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

const AboutBlock = (props: {}) => {
    return (
        <Block className="">
            <H2>About USDC</H2>
            <p className="text-gray-400">Some text about USDC here. Plus logo, audit status and link to protocol page</p>
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

const LiquidityForms = () => {
    const [selectedTab, setSelectedTab] = useState(0);

    const tabs = [
        { name: 'Deposit', current: selectedTab === 0 },
        { name: 'Withdraw', current: selectedTab === 1 },
        { name: 'Stake', current: selectedTab === 2 },
        { name: 'Unstake', current: selectedTab === 3 },
    ];

    return (
        <>
            <Tabs tabs={tabs} setSelectedTab={setSelectedTab} />
            <div className="p-5">
                {selectedTab === 0 && <DepositForm />}
                {selectedTab === 1 && <WithdrawForm />}
                {selectedTab === 2 && <StakeForm />}
                {selectedTab === 3 && <UnstakeForm />}
            </div>
        </>
    );
};

const LiquidityBlock = () => {
    return (
        <>
            <Block className="">
                <H2>Your Liquidity</H2>
                <InfoPanel data={[
                    ['Staked', `$${(Math.random() * 1000).toFixed(2)}`],
                    ['LP tokens in wallet (if >0)', `${(Math.random() * 1000000).toFixed(2)}`],
                    ['Farm rewards', <FarmRewards key="f" />],
                    ['', <Button size="small" key="g">Claim</Button>],
                ]} />
            </Block>

            <Block className="mt-5" noPadding>
                <LiquidityForms />
            </Block></>
    );
};

const PoolPage = (props: { params: { id: string }}) => {
    const poolData = [
        ['---'],
        ['Token A deposits + logo', `$${(Math.random() * 1000).toFixed(2)}`],
        ['Token B deposits + logo', `$${(Math.random() * 1000).toFixed(2)}`],
        ['---'],
        ['24h volume', `$${(Math.random() * 1000).toFixed(2)}`],
        ['24h fees', `$${(Math.random() * 100).toFixed(2)}`],
        ['---'],
        ['Virtual price', `${(Math.random() * 10).toFixed(2)}`],
        ['Concentration coefficient', `${(Math.random() * 1000).toFixed(0)}`],
        ['---'],
        ['Trade fee', `${(Math.random() * 10).toFixed(2)}%`],
        ['Withdraw fee', `${(Math.random() * 10).toFixed(2)}%`],
    ];

    const addressData = [
        ['Swap account', <Address key={0} address='Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1' />],
        ['Pool token address', <Address key={1} address='Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1' />],
        ['Token A mint', <Address key={2} address='Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1' />],
        ['Token B mint', <Address key={3} address='Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1' />],
        ['Token B reserve', <Address key={4} address='Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1' />],
        ['Token B reserve', <Address key={5} address='Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1' />],
    ];

    return (
        <div>
            <H1>Pool name + logo</H1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="col-span-2">
                    <Block className="">
                        <div className="grid grid-cols-2">
                            <div>
                                <p className="text-gray-400">Total deposits</p>
                                <p className="text-2xl font-bold text-gray-300">${(Math.random() * 1000).toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <p className="text-gray-400">APY</p>
                                <div className="flex flex-col justify-center gap-1 text-lg font-bold text-gray-300">
                                    <div className="flex items-center gap-1 justify-end">
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
                                    </div>
                                </div>
                            </div>
                        </div>
                        <InfoPanel data={poolData} />
                    </Block>

                    <div className="block lg:hidden mt-5">
                        <LiquidityBlock />
                    </div>

                    <div className="grid sm:grid-cols-2 mt-5 gap-5 text-sm">
                        <AboutBlock />
                        <AboutBlock />
                    </div>

                    <Block className="mt-5">
                        <H2>Addresses</H2>
                        <InfoPanel data={addressData} />
                    </Block>
                </div>
                <div className="lg:block hidden">
                    <LiquidityBlock />
                </div>
            </div>
        </div>
    );
};

export default dapp(PoolPage);

export const Head: HeadFC = () => <title>Saber Pool | Solana AMM</title>;
