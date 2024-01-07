import React from 'react';
import Block from './Block';

export default function Table (props: { data: any[][] }) {
    const header = props.data?.[0];

    return (
        <>
            <div className="lg:hidden">
                {props.data.slice(1).map((row, i) => (
                    <Block key={i} className="grid grid-cols-2 gap-1">
                        {row.map((item, j) => (
                            <React.Fragment key={`${i}-${j}`}>
                                <div className="font-bold">{header[j]}</div>
                                <div>{item}</div>
                            </React.Fragment>
                        ))}
                    </Block>
                ))}
            </div>
            <div className="hidden lg:block rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left text-slate-400">
                    <thead className="text-xs uppercase bg-slate-700 text-slate-400">
                        <tr className="">
                            {header.map((header, i) => 
                                <th className="px-3 py-2" key={i}>{header}</th>)}
                        </tr>
                    </thead>
                    <tbody className="">
                        {props.data.slice(1).map((row, i) => (
                            <tr key={i} className="border-b bg-slate-800 border-slate-700">
                                {row.map((item, j) => (
                                    <td colSpan={j !== row.length - 1 ? 1 : props.data?.[0].length - row.length + 1} className="px-3 py-2" key={`${i}-${j}`}>{item}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}