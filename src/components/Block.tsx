import React from 'react';
import clsx from 'clsx';

export default function Block(props: {
    active?: boolean;
    children: any;
    className?: string;
    hover?: boolean;
    noPadding?: boolean;
}) {
    return (
        <div className={clsx('relative transition-all', props.hover && 'group cursor-pointer')}>
            <div
                className={clsx(
                    'relative z-1 transition-colors bg-gray-900 border border-gray-700 rounded-lg text-gray-200',
                    props.className,
                    props.active && 'bg-saber-darker',
                    props.hover && 'group-hover:bg-saber-dark/20',
                    !props.noPadding && 'p-5',
                )}
            >
                {props.children}
            </div>
        </div>
    );
}
