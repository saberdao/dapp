import React from 'react';

export default function ActiveText(props: { children: any }) {
    return (
        <div className="flex">
            <div className="group relative">
                <div className="text-slate-200 bg-slate-800  z-1 relative px-3 cursor-pointer rounded-lg flex gap-1 justify-center items-center transition-colors">
                    {props.children}
                </div>
            </div>
        </div>
    );
}
