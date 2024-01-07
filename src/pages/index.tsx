import React, { useMemo } from 'react';
import type { HeadFC, PageProps } from 'gatsby';
import dapp from '../hoc/dapp';
import H1 from '../components/H1';
import usePoolsInfo from '../hooks/usePoolsInfo';
import Table from '../components/Table';
import LoadingText from '../components/LoadingText';
import Button from '../components/Button';

const IndexPage: React.FC<PageProps> = () => {
    const pools = usePoolsInfo();

    const header = ['Name', 'Your deposits', 'TVL', 'Volume 24h', 'APY', ''];

    const data = useMemo(() => {
        if (pools.data) {
            return [
                header,
                ...pools.data.pools.map((pool) => ([
                    <div key={pool.id} className="flex items-center gap-2">
                        <img className="w-5 h-5" src={pool.tokenIcons[0].logoURI} />
                        <img className="-ml-3 w-5 h-5" src={pool.tokenIcons[1].logoURI} />
                        {pool.name}
                    </div>,
                    `$${(Math.random()*1000).toFixed(2)}`,
                    `$${(Math.random()*100000).toFixed(2)}`,
                    `$${(Math.random()*10000).toFixed(2)}`,
                    `${(Math.random()*100).toFixed(2)}%`,
                    <Button size="small" key="button">View</Button>,
                ])),
            ];
        }

        return [
            header,
            ...new Array(5).fill(new Array(5).fill(<LoadingText />)),
        ];
    }, [pools]);

    return (
        <div>
            <H1>Pools</H1>
            <Table data={data} />
        </div>
    );
};

export default dapp(IndexPage);

export const Head: HeadFC = () => <title>Saber | Solana AMM</title>;
