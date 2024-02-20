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
            {props.active
                ? <div className={clsx(
                    'absolute inset-0 bg-gradient-to-r from-saber-dark to-saber-light rounded-lg blur opacity-100 -mx-0.5',
                    !props.noPadding && 'p-5',
                )}></div>
                : <div className={clsx(
                    'absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-500 rounded-lg blur-sm opacity-100',
                    props.hover && 'group-hover:from-saber-dark group-hover:to-saber-light',
                    !props.noPadding && 'p-5',
                )}></div>}
            <div className={clsx(
                'relative z-1 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black rounded-lg',
                props.className,
                props.hover && 'group-hover:opacity-90',
                !props.noPadding && 'p-5',
            )}
            >
                {props.children}
            </div>
        </div>
    );
}