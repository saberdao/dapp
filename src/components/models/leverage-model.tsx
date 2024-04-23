import React, { useState } from 'react';
import H1 from '../H1';
import { isPoolDeprecated } from '../../helpers/deprecatedPools';

import { PoolData } from '../../types';
import Tabs from '../Tabs';
import DepositForm from '../pool/DepositForm';

const LiquidityForms = (props: { pool: PoolData }) => {
    const deprecated = isPoolDeprecated(props.pool.info.name);
    const [selectedTab, setSelectedTab] = useState(deprecated ? 'Unstake' : 'Deposit');

    const tabs = [!deprecated && { name: 'Deposit', current: selectedTab === 'Deposit' }].filter(
        (x): x is { name: string; current: boolean } => !!x,
    );

    return (
        <>
            <Tabs tabs={tabs} setSelectedTab={setSelectedTab} />
            <div className="p-5">
                {selectedTab === 'Deposit' && <DepositForm pool={props.pool} />}
            </div>
        </>
    );
};

export default function LeverageModel(props: { pool: PoolData }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="border-r border-gray-500 p-5">
                <H1>{`Leveraged ${props.pool.info.name} LP`}</H1>
                <div className="leading-8">
                    <span className="text-gray-400 text-sm">Max APY</span>
                    <p className="font-bold text-xl">48.9% APY</p>
                </div>
                <div className="leading-8 mt-3">
                    <span className="text-gray-400 text-sm">Max Leverage</span>
                    <p className="font-bold text-xl">10x</p>
                </div>
            </div>
            <div className="p-5">
                <LiquidityForms pool={props.pool} />
            </div>
        </div>
    );
}
