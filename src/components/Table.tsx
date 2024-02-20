import React from 'react';
import Block from './Block';
import clsx from 'clsx';
import { Link } from 'gatsby';

export default function Table (props: { data: { data: any[]; rowLink: string }[]; blockView?: boolean }) {
    const header = props.data?.[0].data;

    return (
        <>
            <div className={clsx(
                !props.blockView && 'lg:hidden',
                props.blockView && 'md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-5',
            )}>
                {props.data.slice(1).map((row, i) => (
                    <Link to={row.rowLink} key={i}>
                        <Block className="grid grid-cols-2 gap-1 text-sm mb-5 lg:mb-0 h-full" hover>
                            {row.data.map((item, j) => (
                                header[j]
                                    ? <React.Fragment key={`${i}-${j}`}>
                                        <div className="font-bold">{header[j]}</div>
                                        <div className="flex justify-end text-gray-300">{item}</div>
                                    </React.Fragment>
                                    : <div key={`${i}-${j}`} className="col-span-2">{item}</div>
                            ))}
                        </Block>
                    </Link>
                ))}
            </div>
            {!props.blockView && <div className="hidden lg:block rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left text-slate-400">
                    <thead className="text-xs uppercase bg-gradient-to-tr from-gray-950 to-slate-700 text-slate-200">
                        <tr className="">
                            {header.map((header, i) => 
                                <th className="px-3 py-2" key={i}>{header}</th>)}
                        </tr>
                    </thead>
                    <tbody className="">
                        {props.data.slice(1).map((row, i) => (
                            <tr key={i} className=" bg-gradient-to-b from-gray-800 via-gray-800 to-gray-900 bg-opacity-50">
                                {row.data.map((item, j) => (
                                    <td colSpan={j !== row.data.length - 1 ? 1 : props.data?.[0].data.length - row.data.length + 1} className="px-3 py-2" key={`${i}-${j}`}>{item}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>}
        </>
    );
}