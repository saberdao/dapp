import clsx from 'clsx';
import React from 'react';
import { BsGridFill } from 'react-icons/bs';
import { FaList } from 'react-icons/fa';
import { useLocalStorage } from 'usehooks-ts';

export enum PoolsView {
    GRID = 'GRID',
    LIST = 'LIST',
}

export default function PoolSwitch () {
    const [poolsView, setPoolsView] = useLocalStorage<PoolsView>('poolsView', PoolsView.LIST);

    const toggle = () => {
        const newSelected = poolsView === PoolsView.LIST ? PoolsView.GRID : PoolsView.LIST;
        setPoolsView(newSelected);
    };

    return (
        <div
            className="flex items-center text-lg rounded-lg overflow-hidden cursor-pointer text-slate-200"
            onClick={() => toggle()}
        >
            <div
                className={clsx(
                    'py-2 px-2',
                    poolsView === PoolsView.LIST ? 'bg-gradient-to-r from-saber-dark to-saber-light' : 'bg-slate-800',
                )}
            >
                <FaList />
            </div>
            <div
                className={clsx(
                    'py-2 px-2',
                    poolsView === PoolsView.GRID ? 'bg-gradient-to-r from-saber-dark to-saber-light' : 'bg-slate-800',
                )}
            >
                <BsGridFill />
            </div>
        </div>
    );
}
