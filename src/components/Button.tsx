import React from 'react';
import clsx from 'clsx';

export default function Button (props: {
    children: any;
    type?: 'primary' | 'secondary' | 'danger';
    size?: 'large' | 'small',
    className?: string,
}) { 
    return (
        <button
            className={clsx(
                'text-slate-200 px-3 cursor-pointer rounded-lg flex gap-1 justify-center items-center transition-colors',
                (!props.type || props.type === 'primary') && 'bg-saber-dark hover:bg-saber-light',
                props.type === 'secondary' && 'bg-slate-900 hover:bg-slate-800',
                props.type === 'danger' && 'bg-red-800 hover:bg-red-700',
                props.size === 'small' ? 'py-1 leading-3 text-xs' : 'py-2 text-sm',
                props.className,
            )}
        >
            {props.children}
        </button>
    );
}