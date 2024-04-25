import React, { ChangeEvent, useCallback, useMemo, useState } from 'react';
import H1 from '@/src/components/H1';
import { isPoolDeprecated } from '@/src/helpers/deprecatedPools';

import { PoolData } from '@/src/types';
import Tabs from '@/src/components/Tabs';
import Button from '@/src/components/Button';
import DepositForm from '@/src/components/pool/DepositForm';
import WithdrawForm from '@/src/components/pool/WithdrawForm';
import UpArrow from '@/src/svg/up-arrow';
import DownArrow from '@/src/svg/down-arrow';
import clsx from 'clsx';

interface RangeSliderProps {
    min: number;
    max: number;
    value: number;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const RangeSlider = ({ min, max, onChange, value }: RangeSliderProps) => {
    return (
        <div className="relative bg-transparent flex justify-center items-center mt-3">
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={onChange}
                style={{
                    background: `linear-gradient(to right, #3D42CE 0%, #3D42CE ${value}%, #a0a0a0 ${value}%, #a0a0a0 100%)`,
                }}
                className="w-full appearance-none cursor-pointer outline-none h-[10px] z-20 rounded-[40px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[20px] [&::-webkit-slider-thumb]:w-[20px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-saber-light"
            />
        </div>
    );
};

const LiquidityForms = (props: { pool: PoolData }) => {
    const deprecated = isPoolDeprecated(props.pool.info.name);
    const [selectedTab, setSelectedTab] = useState(deprecated ? 'Unstake' : 'Deposit');

    const tabs = [
        !deprecated && { name: 'Deposit', current: selectedTab === 'Deposit' },
        !deprecated && { name: 'Withdraw', current: selectedTab === 'Withdraw' },
    ].filter((x): x is { name: string; current: boolean } => !!x);

    return (
        <>
            <Tabs tabs={tabs} setSelectedTab={setSelectedTab} />
            <div className="p-5">
                {selectedTab === 'Deposit' && <DepositForm pool={props.pool} />}
                {selectedTab === 'Withdraw' && <WithdrawForm pool={props.pool} />}
            </div>
        </>
    );
};

export default function LeverageModel(props: { pool: PoolData }) {
    const [maxRange] = useState<number>(10);
    const [showSlippage, setShowSlippage] = useState<boolean>(false);
    const [slippage, setslippage] = useState<number>(0.1);
    const [customSlip, setCustomSlip] = useState<number>(0);

    const [selectLeverage, setSelectLeverage] = useState<number>(0);

    const selectedLeverage = useMemo(() => {
        return selectLeverage / maxRange;
    }, [selectLeverage]);

    const calculateRange = useMemo(() => {
        return (100 / maxRange) * maxRange;
    }, [maxRange]);

    const handleSelectLeverage = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setSelectLeverage(+e.target.value);
    }, []);

    return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="border-r border-gray-600 p-5">
                <H1>{`Leveraged ${props.pool.info.name} LP`}</H1>
                <div className="leading-8">
                    <span className="text-gray-400 text-sm">Max APY</span>
                    <p className="font-bold text-xl text-gray-300">48.9% APY</p>
                </div>
                <hr className="border-slate-800 my-2" />
                <div className="leading-8 mt-3">
                    <span className="text-gray-400 text-sm">Max Leverage</span>
                    <p className="font-bold text-xl text-gray-300">10x</p>
                </div>
                <hr className="border-slate-800 my-2" />
                <div className="leading-8 mt-3">
                    <span className="text-gray-400 text-sm">Borrow Limit</span>
                    <p className="font-bold text-xl text-gray-300">$12.20</p>
                </div>
                <hr className="border-slate-800 my-2" />
                <div className="leading-8 mt-3">
                    <span className="text-gray-400 text-sm">Liquidation Threshold</span>
                    <p className="font-bold text-xl text-gray-300">$22.2220</p>
                </div>
                <hr className="border-slate-800 my-2" />
                <div className="leading-8 mt-3">
                    <span className="text-gray-400 text-sm">LTV</span>
                    <p className="font-bold text-xl text-gray-300">$42.40</p>
                </div>
                <hr className="border-slate-800 my-2" />
                <div className="leading-8 mt-3">
                    <span className="text-gray-400 text-sm">Collateral</span>
                    <p className="font-bold text-xl text-gray-300">$42.40</p>
                </div>
                <hr className="border-slate-800 my-2" />
                <div className="leading-8 mt-3">
                    <span className="text-gray-400 text-sm">Borrowed</span>
                    <p className="font-bold text-xl text-gray-300">$42.40</p>
                </div>
                <hr className="border-slate-800 mt-2" />
            </div>
            <div className="py-5 px-4">
                <LiquidityForms pool={props.pool} />
                <div className="border-t-[1px] border-slate-800">
                    <p className="text-white text-lg mt-4">
                        Select Your Leverage: {selectedLeverage}x
                    </p>
                    <RangeSlider
                        max={calculateRange}
                        min={1}
                        onChange={handleSelectLeverage}
                        value={selectLeverage}
                    />
                </div>
                <hr className="border-slate-800 my-4" />
                <div
                    className="flex items-center  gap-3 cursor-pointer"
                    onClick={() => setShowSlippage(!showSlippage)}
                >
                    <p className="text-white text-lg">
                        Slippage Tolerance ({isNaN(slippage) ? 0 : slippage}%)
                    </p>
                    {showSlippage ? <UpArrow /> : <DownArrow />}
                </div>
                {showSlippage && (
                    <>
                        <span className="text-gray-400 text-sm">
                            Applied to repaying your SOL borrow via Jupiter swap
                        </span>
                        <div className="mt-5">
                            <div className="flex gap-2 mt-4">
                                <Button
                                    size="full"
                                    type={slippage === 0.1 ? 'primary' : 'secondary'}
                                    onClick={() => setslippage(0.1)}
                                >
                                    0.1%
                                </Button>
                                <Button
                                    size="full"
                                    type={slippage === 0.5 ? 'primary' : 'secondary'}
                                    onClick={() => setslippage(0.5)}
                                >
                                    0.5%
                                </Button>
                                <Button
                                    size="full"
                                    type={slippage === 1 ? 'primary' : 'secondary'}
                                    onClick={() => setslippage(1)}
                                >
                                    1.0%
                                </Button>
                                <div className="flex items-center justify-end">
                                    <input
                                        min={0}
                                        max={100}
                                        value={customSlip}
                                        type="number"
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            if (Number(e.target.value) > 100) {
                                                setslippage(100);
                                                setCustomSlip(100);
                                                return;
                                            } else {
                                                setslippage(parseFloat(e.target.value));
                                                setCustomSlip(parseFloat(e.target.value));
                                            }
                                        }}
                                        className={clsx(
                                            'relative w-16 z-1  p-1 bg-transparent rounded-l-lg border border-slate-600 text-base text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none',
                                        )}
                                    />
                                    <div
                                        className={clsx(
                                            'border border-slate-600 px-4 p-1 rounded-r-lg text-base',
                                            slippage === 0.1 || slippage === 0.5 || slippage === 1
                                                ? null
                                                : 'bg-saber-dark',
                                        )}
                                    >
                                        %
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
