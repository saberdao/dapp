import React, { useMemo } from 'react';
import type { HeadFC, PageProps } from 'gatsby';
import { ImCross } from 'react-icons/im';
import dapp from '../hoc/dapp';
import H1 from '../components/H1';
import usePoolsInfo, { CurrencyMarket } from '../hooks/usePoolsInfo';
import Table from '../components/Table';
import LoadingText from '../components/LoadingText';
import Button from '../components/Button';
import Input, { InputType } from '../components/Input';
import { useForm } from 'react-hook-form';

const KNOWN_GROUPS = [
    CurrencyMarket.USD,
    CurrencyMarket.BTC,
    CurrencyMarket.SOL,
] as const;

const IndexPage: React.FC<PageProps> = () => {
    const pools = usePoolsInfo();
    const { watch, register, resetField } = useForm<{ filterText: string; filterCurrency: CurrencyMarket }>();

    const header = ['Name', 'Your deposits', 'TVL', 'Volume 24h', 'APY', ''];

    const filterText = watch('filterText');
    const filterCurrency = watch('filterCurrency');

    const data = useMemo(() => {
        if (pools.data) {
            return [
                header,
                ...pools.data.pools
                    .filter((pool) => {
                        if (filterText && !pool.name.toLowerCase().includes(filterText.toLowerCase())) {
                            return false;
                        }

                        if (filterCurrency && pool.currency !== filterCurrency) {
                            return false;
                        }

                        return true;
                    })
                    .map((pool) => ([
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
            <div className="flex items-center mb-3">
                <div className="flex-grow"><H1>Pools</H1></div>
                <div className="flex items-center gap-1">
                    {!filterCurrency
                        ? <Input
                            type={InputType.DROPDOWN}
                            register={register('filterCurrency')}
                            placeholder="Currency"
                            values={Object.values(KNOWN_GROUPS).map((group) => {
                                // Return as [key, human readable value]
                                return [group, group];
                            })}
                        />
                        : <div
                            className="cursor-pointer bg-slate-800 text-slate-200 rounded-lg text-sm py-2 px-3 flex items-center gap-1 group transition-colors"
                            onClick={() => resetField('filterCurrency')}
                        >
                            {filterCurrency}
                            <ImCross className="group-hover:text-slate-600 transition-colors" />
                        </div>}
                    <Input type={InputType.TEXT} register={register('filterText')} placeholder="Filter pool..." />
                </div>
            </div>
            <Table data={data} />
        </div>
    );
};

export default dapp(IndexPage);

export const Head: HeadFC = () => <title>Saber | Solana AMM</title>;
