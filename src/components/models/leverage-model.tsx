import React, { ChangeEvent, useCallback, useMemo, useState } from 'react';
import H1 from '../H1';
import { isPoolDeprecated } from '../../helpers/deprecatedPools';

import { PoolData } from '../../types';
import Tabs from '../Tabs';
import DepositForm from '../pool/DepositForm';
import WithdrawForm from '../pool/WithdrawForm';

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
        <div className="grid grid-cols-2 gap-3">
            <div className="border-r border-gray-600 p-5">
                <H1>{`Leveraged ${props.pool.info.name} LP`}</H1>
                <div className="leading-8">
                    <span className="text-gray-400 text-sm">Max APY</span>
                    <p className="font-bold text-xl text-gray-300">48.9% APY</p>
                </div>
                <div className="leading-8 mt-3">
                    <span className="text-gray-400 text-sm">Max Leverage</span>
                    <p className="font-bold text-xl text-gray-300">10x</p>
                </div>
                <div className="leading-8 mt-3">
                    <span className="text-gray-400 text-sm">Borrow Limit</span>
                    <p className="font-bold text-xl text-gray-300">$12.20</p>
                </div>
                <div className="leading-8 mt-3">
                    <span className="text-gray-400 text-sm">Liquidation Threshold</span>
                    <p className="font-bold text-xl text-gray-300">$22.2220</p>
                </div>
                <div className="leading-8 mt-3">
                    <span className="text-gray-400 text-sm">LTV</span>
                    <p className="font-bold text-xl text-gray-300">$42.40</p>
                </div>
            </div>
            <div className="p-5">
                <LiquidityForms pool={props.pool} />
                <div className="px-4 border-t-[1px] border-gray-600">
                    <p className="text-white text-lg mt-4">
                        Select Your Leverage: {selectedLeverage}x
                    </p>
                    <div className="relative bg-transparent flex justify-center items-center mt-3">
                        <input
                            type="range"
                            min={1}
                            max={calculateRange}
                            value={selectLeverage}
                            onChange={handleSelectLeverage}
                            style={{
                                background: `linear-gradient(to right, #3D42CE 0%, #3D42CE ${selectLeverage}%, #d4d4d4 ${selectLeverage}%, #d4d4d4 100%)`,
                            }}
                            className="w-full appearance-none cursor-pointer outline-none h-[10px] z-20 rounded-[40px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[20px] [&::-webkit-slider-thumb]:w-[20px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-saber-light"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
