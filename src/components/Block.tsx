import React from 'react';
import clsx from 'clsx';

export default function Block (props: {
    active?: boolean;
    children: any;
    className?: string;
    hover?: boolean;
    noPadding?: boolean;
}) {
    return (
        <div className={clsx('relative transition-all', props.hover && 'group cursor-pointer')}>

            <div className={clsx(
                'relative z-1 transition-colors bg-slate-950 border border-saber-darker rounded-lg text-slate-200',
                props.className,
                props.active && 'bg-saber-darker',
                props.hover && 'group-hover:bg-saber-darker',
                !props.noPadding && 'p-5',
            )}
            >
                {props.children}
            </div>
        </div>
    );
}