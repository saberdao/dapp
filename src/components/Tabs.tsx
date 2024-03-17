import clsx from 'clsx';
import React from 'react';

export default function Tabs(props: {
    tabs: { name: string, current: boolean }[],
    setSelectedTab: (tab: string) => void,
}) {
    const { tabs } = props;

    return (
        <div>
            <nav className="isolate flex divide-x divide-gray-700 rounded-lg shadow" aria-label="Tabs">
                {tabs.map((tab, tabIdx) => (
                    <button
                        key={tab.name}
                        onClick={() => props.setSelectedTab(tab.name)}
                        className={clsx(
                            tab.current ? 'text-white from-saber-dark to-saber-light' : 'text-white hover:from-saber-dark/50 hover:to-saber-light/50 from-slate-900 to-slate-800',
                            tabIdx === 0 ? 'rounded-tl-lg' : '',
                            tabIdx === tabs.length - 1 ? 'rounded-tr-lg' : '',
                            'group relative min-w-0 flex-1 overflow-hidden py-2 px-2 text-center text-sm font-medium focus:z-10',
                            'bg-gradient-to-t',
                            tabs.length === 1 && 'cursor-default',
                        )}
                        aria-current={tab.current ? 'page' : undefined}
                    >
                        <span>{tab.name}</span>
                        <span
                            aria-hidden="true"
                            className={clsx(
                                tab.current ? 'bg-saber-light' : 'bg-gray-800',
                                'absolute inset-x-0 bottom-0 h-0.5',
                            )}
                        />
                    </button>
                ))}
            </nav>
        </div>
    );
}
