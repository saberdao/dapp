import React, { useMemo } from 'react';
import { Link, type HeadFC, type PageProps } from 'gatsby';
import { ImCross } from 'react-icons/im';
import dapp from '../hoc/dapp';
import H1 from '../components/H1';
import usePoolsInfo from '../hooks/usePoolsInfo';
import Table from '../components/Table';
import LoadingText from '../components/LoadingText';
import Button from '../components/Button';
import Input, { InputType } from '../components/Input';
import { useForm } from 'react-hook-form';
import ActiveText from '../components/ActiveText';
import { isPoolDeprecated } from '../helpers/deprecatedPools';
import PoolSwitch, { PoolsView } from '../components/PoolSwitch';
import { useReadLocalStorage } from 'usehooks-ts';
import { CurrencyMarket } from '../_temp_stableswap_types';

const KNOWN_GROUPS = [
    CurrencyMarket.USD,
    CurrencyMarket.BTC,
    CurrencyMarket.SOL,
    CurrencyMarket.ETH,
] as const;

const IndexPage: React.FC<PageProps> = () => {
    const pools = usePoolsInfo();
    const { watch, register, resetField } = useForm<{
        filterText: string;
        filterCurrency: CurrencyMarket;
        filterDeprecated: boolean;
        poolView: string;
    }>();
    const poolsView = useReadLocalStorage<PoolsView>('poolsView');

    const header = { data: ['Name', 'Your deposits', 'TVL', 'Volume 24h', 'APY', ''] };

    const filterText = watch('filterText');
    const filterCurrency = watch('filterCurrency');
    const filterDeprecated = watch('filterDeprecated');

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

                        if (!filterDeprecated && isPoolDeprecated(pool.name)) {
                            return false;
                        }

                        return true;
                    })
                    .map((pool) => ({
                        rowLink: poolsView !== PoolsView.LIST && `/pools/${pool.id}`,
                        data: [
                            <div key={pool.id} className="flex items-center gap-2">
                                <img className="w-5 h-5" src={pool.tokenIcons[0].logoURI} />
                                <img className="-ml-3 w-5 h-5" src={pool.tokenIcons[1].logoURI} />
                                {isPoolDeprecated(pool.name) ? <p className="line-through">{pool.name}</p> : pool.name}
                            </div>,
                            '$todo',
                            `$${pool.summary.underlyingTokens[0]}`,
                            `$${(Math.random()*10000).toFixed(2)}`,
                            `${(Math.random()*100).toFixed(2)}%`,
                            <>
                                {poolsView === PoolsView.LIST && (
                                    <Link to={`/pools/${pool.id}`}>
                                        <Button className="hidden lg:inline-block" size="small" key="button">View</Button>
                                    </Link>
                                )}
                            </>,
                        ]})),
            ];
        }

        return [
            header,
            ...new Array(5).fill({ data: new Array(5).fill(<LoadingText />) }),
        ];
    }, [pools]);

    return (
        <div>
            <div className="block lg:flex items-center mb-3">
                <div className="flex-grow"><H1>Pools</H1></div>
                <div className="flex flex-wrap justify-end items-center gap-3">
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
                        : <ActiveText>
                            <div
                                className="cursor-pointer text-slate-200 rounded-lg text-sm py-2 px-3 flex items-center gap-1 group transition-colors"
                                onClick={() => resetField('filterCurrency')}
                            >
                                {filterCurrency}
                                <ImCross className="group-hover:text-saber-light transition-colors" />
                            </div>
                        </ActiveText>}
                    <Input type={InputType.TEXT} register={register('filterText')} placeholder="Filter pool..." />
                    <Input type={InputType.CHECKBOX} register={register('filterDeprecated')} label="Deprecated" />
                    <div className="hidden lg:block"><PoolSwitch /></div>
                </div>
            </div>
            <Table data={data} blockView={poolsView === PoolsView.GRID} />
        </div>
    );
};

export default dapp(IndexPage);

export const Head: HeadFC = () => <title>Saber | Solana AMM</title>;
