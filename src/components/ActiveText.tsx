import React from 'react';

export default function ActiveText(props: { children: any }) {
    return (
        <div className="flex">
            <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r rounded-lg blur opacity-50 group-hover:opacity-100 -mx-0.5 from-saber-dark to-saber-light"></div>
                <div className="text-slate-200 bg-slate-800  z-1 relative px-3 cursor-pointer rounded-lg flex gap-1 justify-center items-center transition-colors">
                    {props.children}
                </div>
            </div>
        </div>
    );
}