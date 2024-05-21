import React, { useEffect, useMemo, useState } from 'react';
import { type HeadFC, type PageProps } from 'gatsby';
import { ImCross } from 'react-icons/im';
import { useWallet } from '@solana/wallet-adapter-react';
import { useForm } from 'react-hook-form';
import { useReadLocalStorage } from 'usehooks-ts';
import { FaSort, FaSortDown, FaSortUp } from 'react-icons/fa';

import { getLogo, getPoolName } from '@/src/helpers/pool';
import H1 from '@/src/layout/h1';
import usePoolsInfo from '@/src/hooks/usePoolsInfo';
import Table from '@/src/components/table';
import LoadingText from '@/src/components/common/loading-text';
import Button from '@/src/layout/button';
import Input, { InputType } from '@/src/layout/Input';
import ActiveText from '@/src/components/active-text';
import { isPoolDeprecated } from '@/src/helpers/deprecated-pools';
import PoolSwitch, { PoolsView } from '@/src/components/pool-switch';
import { PoolData } from '@/src/types/global';
import { CurrencyMarket } from '@/src/enums/currency.enum';
import { toPrecision } from '@/src/helpers/number';
import useGetPrices from '@/src/hooks/useGetPrices';

const KNOWN_GROUPS = [
  CurrencyMarket.USD,
  CurrencyMarket.BTC,
  CurrencyMarket.SOL,
  CurrencyMarket.ETH,
] as const;

enum SORTS {
  'DEFAULT' = 'DEFAULT',
  'VOLUME_ASC' = 'VOLUME_ASC',
  'VOLUME_DESC' = 'VOLUME_DESC',
  'APY_ASC' = 'APY_ASC',
  'APY_DESC' = 'APY_DESC',
  'TVL_ASC' = 'TVL_ASC',
  'TVL_DESC' = 'TVL_DESC',
}

const sortReadable = {
  [SORTS.DEFAULT]: 'Default',
  [SORTS.VOLUME_DESC]: 'Volume (desc)',
  [SORTS.VOLUME_ASC]: 'Volume (asc)',
  [SORTS.TVL_DESC]: 'TVL (desc)',
  [SORTS.TVL_ASC]: 'TVL (asc)',
  [SORTS.APY_DESC]: 'APY (desc)',
  [SORTS.APY_ASC]: 'APY (asc)',
} as const;

const sortFunctions = {
  [SORTS.DEFAULT]: (a: PoolData, b: PoolData) => {
    if ((a.userInfo?.stakedUsdValue ?? 0) > (b.userInfo?.stakedUsdValue ?? 0)) {
      return -1;
    }

    if ((a.userInfo?.stakedUsdValue ?? 0) < (b.userInfo?.stakedUsdValue ?? 0)) {
      return 1;
    }

    return (a.metrics?.tvl ?? 0) - (b.metrics?.tvl ?? 0) > 0 ? -1 : 1;
  },
  [SORTS.VOLUME_DESC]: (a: PoolData, b: PoolData) => {
    return (a.metricInfo?.volumeInUSD ?? 0) > (b.metricInfo?.volumeInUSD ?? 0)
      ? -1
      : 1;
  },
  [SORTS.VOLUME_ASC]: (a: PoolData, b: PoolData) => {
    return (a.metricInfo?.volumeInUSD ?? 0) > (b.metricInfo?.volumeInUSD ?? 0)
      ? 1
      : -1;
  },
  [SORTS.TVL_DESC]: (a: PoolData, b: PoolData) => {
    return (a.metrics?.tvl ?? 0) > (b.metrics?.tvl ?? 0) ? -1 : 1;
  },
  [SORTS.TVL_ASC]: (a: PoolData, b: PoolData) => {
    return (a.metrics?.tvl ?? 0) > (b.metrics?.tvl ?? 0) ? 1 : -1;
  },
  [SORTS.APY_DESC]: (a: PoolData, b: PoolData) => {
    return (a.metrics?.totalApy ?? 0) > (b.metrics?.totalApy ?? 0) ? -1 : 1;
  },
  [SORTS.APY_ASC]: (a: PoolData, b: PoolData) => {
    return (a.metrics?.totalApy ?? 0) > (b.metrics?.totalApy ?? 0) ? 1 : -1;
  },
} as const;

const IndexPage: React.FC<PageProps> = () => {
  const pools = usePoolsInfo();
  const { data: price } = useGetPrices();
  const { wallet } = useWallet();
  const [sort, setSort] = useState(SORTS.DEFAULT);

  const { watch, register, resetField } = useForm<{
    filterText: string;
    filterCurrency: CurrencyMarket;
    filterDeprecated: boolean;
    filterMyPools: boolean;
    poolView: string;
    sortDropdown: SORTS;
    sortDropdownMobile: SORTS;
  }>();

  const poolsView = useReadLocalStorage<PoolsView>('poolsView');

  const header = {
    data: [
      'Name',
      wallet?.adapter.publicKey ? (
        <div key="header-volume" className="flex items-center">
          <div className="flex-grow">Your deposits</div>
          {poolsView !== PoolsView.GRID && (
            <div className="hidden lg:block">
              {sort !== SORTS.DEFAULT && (
                <FaSort
                  className="cursor-pointer"
                  onClick={() => setSort(SORTS.DEFAULT)}
                />
              )}
              {sort == SORTS.DEFAULT && <FaSortDown />}
            </div>
          )}
        </div>
      ) : undefined,
      <div key="header-volume" className="flex items-center">
        <div className="flex-grow">TVL</div>
        {poolsView !== PoolsView.GRID && (
          <div className="cursor-pointer hidden lg:block">
            {sort !== SORTS.TVL_ASC && sort !== SORTS.TVL_DESC && (
              <FaSort onClick={() => setSort(SORTS.TVL_DESC)} />
            )}
            {sort == SORTS.TVL_DESC && (
              <FaSortDown onClick={() => setSort(SORTS.TVL_ASC)} />
            )}
            {sort == SORTS.TVL_ASC && (
              <FaSortUp onClick={() => setSort(SORTS.TVL_DESC)} />
            )}
          </div>
        )}
      </div>,
      <div key="header-volume" className="flex items-center">
        <div className="flex-grow">Volume 24h</div>
        {poolsView !== PoolsView.GRID && (
          <div className="cursor-pointer hidden lg:block">
            {sort !== SORTS.VOLUME_ASC && sort !== SORTS.VOLUME_DESC && (
              <FaSort onClick={() => setSort(SORTS.VOLUME_DESC)} />
            )}
            {sort == SORTS.VOLUME_DESC && (
              <FaSortDown onClick={() => setSort(SORTS.VOLUME_ASC)} />
            )}
            {sort == SORTS.VOLUME_ASC && (
              <FaSortUp onClick={() => setSort(SORTS.VOLUME_DESC)} />
            )}
          </div>
        )}
      </div>,
      <div key="header-volume" className="flex items-center">
        <div className="flex-grow">APY</div>
        {poolsView !== PoolsView.GRID && (
          <div className="cursor-pointer hidden lg:block">
            {sort !== SORTS.APY_ASC && sort !== SORTS.APY_DESC && (
              <FaSort onClick={() => setSort(SORTS.APY_DESC)} />
            )}
            {sort == SORTS.APY_DESC && (
              <FaSortDown onClick={() => setSort(SORTS.APY_ASC)} />
            )}
            {sort == SORTS.APY_ASC && (
              <FaSortUp onClick={() => setSort(SORTS.APY_DESC)} />
            )}
          </div>
        )}
      </div>,
      ' ',
    ].filter(Boolean),
  };

  const filterText = watch('filterText');
  const filterCurrency = watch('filterCurrency');
  const filterDeprecated = watch('filterDeprecated');
  const filterMyPools = watch('filterMyPools');
  const sortDropdown = watch('sortDropdown');
  const sortDropdownMobile = watch('sortDropdownMobile');

  useEffect(() => {
    setSort(sortDropdown || sortDropdownMobile);
  }, [sortDropdown, sortDropdownMobile]);

  const data = useMemo(() => {
    if (pools.data && price) {
      return [
        header,
        ...pools.data.pools
          .filter((pool) => {
            if (
              filterText &&
              !pool.info.name.toLowerCase().includes(filterText.toLowerCase())
            ) {
              return false;
            }

            if (filterCurrency && pool.info.currency !== filterCurrency) {
              return false;
            }

            if (!filterDeprecated && isPoolDeprecated(pool.info.name)) {
              return false;
            }

            if (
              filterMyPools &&
              wallet?.adapter.publicKey &&
              (pool.userInfo?.stakedUsdValue ?? 0) === 0
            ) {
              return false;
            }

            return true;
          })
          .sort(sortFunctions[sort || SORTS.DEFAULT])
          .map((pool) => {
            return {
              rowLink: `/pools/${pool.info.id}`,
              data: [
                <div key={pool.info.id} className="flex items-center gap-2">
                  <img
                    className="w-5 h-5 rounded-full"
                    src={getLogo(
                      pool.info.tokens[0].symbol,
                      pool.info.tokenIcons[0].logoURI,
                    )}
                  />
                  <img
                    className="-ml-3 w-5 h-5 rounded-full"
                    src={getLogo(
                      pool.info.tokens[1].symbol,
                      pool.info.tokenIcons[1].logoURI,
                    )}
                  />
                  {isPoolDeprecated(pool.info.name) ? (
                    <p className="line-through">
                      {getPoolName(pool.info.name)}
                    </p>
                  ) : (
                    getPoolName(pool.info.name)
                  )}
                </div>,
                wallet?.adapter.publicKey && pool.userInfo?.stakedUsdValue
                  ? `$${toPrecision(pool.userInfo.stakedUsdValue, 4)}`
                  : wallet?.adapter.publicKey
                  ? ' '
                  : '',
                `$${toPrecision(pool.metrics?.tvl ?? 0, 4)}`,
                pool.metricInfo?.volumeInUSD
                  ? `$${toPrecision(pool.metricInfo.volumeInUSD, 4)}`
                  : '$0',
                `${toPrecision(pool.metrics?.totalApy ?? 0, 4)}%`,
                <>
                  {poolsView !== PoolsView.GRID && (
                    <div className="flex justify-end">
                      <Button className="hidden lg:inline-block" key="button">
                        View
                      </Button>
                    </div>
                  )}
                </>,
              ].filter(Boolean),
            };
          }),
      ];
    }

    return [
      header,
      ...new Array(5).fill({ data: new Array(5).fill(<LoadingText />) }),
    ];
  }, [pools, wallet]);

  const stats = useMemo(() => {
    return {
      tvl:
        pools.data?.pools.reduce((acc, pool) => {
          return acc + (pool.metrics?.tvl ?? 0);
        }, 0) ?? 0,
      volume:
        pools.data?.pools.reduce((acc, pool) => {
          return acc + (pool.metricInfo?.volumeInUSD ?? 0);
        }, 0) ?? 0,
      fee:
        pools.data?.pools.reduce((acc, pool) => {
          return acc + (pool.metricInfo?.['24hFeeInUsd'] ?? 0);
        }, 0) ?? 0,
    };
  }, [pools]);

  return (
    <>
      <div>
        <div className="mt-3 mb-6">
          <H1>Saber global stats</H1>
          <div className="grid grid-cols-2 lg:grid-cols-6 bg-saber-dark/20 rounded-lg p-3 gap-1">
            <div className="font-bold">TVL</div>
            <div>{`$${toPrecision(stats.tvl, 4)}`}</div>
            <div className="font-bold">24h volume</div>
            <div>{`$${toPrecision(stats.volume, 4)}`}</div>
            <div className="font-bold">24h fees</div>
            <div>{`$${toPrecision(stats.fee, 4)}`}</div>
          </div>
        </div>
        <div className="block lg:flex items-center mb-3">
          <div className="flex-grow">
            <H1>Pools</H1>
          </div>
          <div className="flex flex-wrap justify-end items-center gap-3">
            {poolsView === PoolsView.GRID && (
              <Input
                type={InputType.DROPDOWN}
                register={register('sortDropdown')}
                placeholder="Sort by"
                values={Object.values(SORTS).map((group) => {
                  // Return as [key, human readable value]
                  return [group, sortReadable[group]];
                })}
              />
            )}
            {/* Always show on mobile */}
            <div className="block lg:hidden">
              <Input
                type={InputType.DROPDOWN}
                register={register('sortDropdownMobile')}
                placeholder="Sort by"
                values={Object.values(SORTS).map((group) => {
                  // Return as [key, human readable value]
                  return [group, sortReadable[group]];
                })}
              />
            </div>
            {!filterCurrency ? (
              <Input
                type={InputType.DROPDOWN}
                register={register('filterCurrency')}
                placeholder="Currency"
                values={Object.values(KNOWN_GROUPS).map((group) => {
                  // Return as [key, human readable value]
                  return [group, group];
                })}
              />
            ) : (
              <ActiveText>
                <div
                  className="cursor-pointer text-slate-200 rounded-lg text-sm py-2 px-3 flex items-center gap-1 group transition-colors"
                  onClick={() => resetField('filterCurrency')}
                >
                  {filterCurrency}
                  <ImCross className="group-hover:text-saber-light transition-colors" />
                </div>
              </ActiveText>
            )}
            <Input
              type={InputType.TEXT}
              register={register('filterText')}
              placeholder="Filter pool..."
            />
            {wallet?.adapter.publicKey && (
              <Input
                type={InputType.CHECKBOX}
                register={register('filterMyPools')}
                label="My deposits"
              />
            )}
            <Input
              type={InputType.CHECKBOX}
              register={register('filterDeprecated')}
              label="Deprecated"
            />
            <div className="hidden lg:block">
              <PoolSwitch />
            </div>
          </div>
        </div>
        <Table data={data} blockView={poolsView === PoolsView.GRID} />
      </div>
    </>
  );
};

export default IndexPage;

export const Head: HeadFC = () => <title>Saber | Solana AMM</title>;
