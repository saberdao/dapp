import React from 'react';
import clsx from 'clsx';

export default function Button (props: {
    children: any;
    type?: 'primary' | 'secondary' | 'danger';
    size?: 'full' | 'large' | 'small',
    className?: string,
    onClick?: () => void,
    disabled?: boolean,
}) { 
    return (
        <div className={clsx('flex', props.size === 'full' && 'w-full')} onClick={props.onClick}>
            <div className={clsx('group relative', props.size === 'full' && 'w-full')}>
                <button
                    className={clsx(
                        'text-slate-200 z-1 relative px-3 rounded-lg flex gap-1 justify-center items-center transition-colors',
                        (!props.type || props.type === 'primary') && 'bg-saber-dark',
                        props.type === 'secondary' && 'bg-slate-900 group-hover:bg-slate-800',
                        props.type === 'danger' && 'bg-red-800 group-hover:bg-red-700',
                        props.size === 'small' ? 'py-1 leading-3 text-xs' : 'py-2 text-sm',
                        props.size === 'full' && 'w-full',
                        props.className,
                        props.disabled ? 'opacity-50' : 'cursor-pointer group-hover:bg-saber-light',
                    )}
                >
                    {props.children}
                </button>
            </div>
        </div>
    );
}