import React from 'react';
import clsx from 'clsx';

export default function Block (props: { active?: boolean; children: any; className?: string }) {
    return (
        <div className={clsx(
            'bg-slate-900 border p-5 rounded-lg my-3',
            props.className,
            props.active ? 'border-saber-light' : 'border-slate-600',
        )}
        >
            {props.children}
        </div>
    );
}