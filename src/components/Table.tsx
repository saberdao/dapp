import React from 'react';
import clsx from 'clsx';
import { Link } from 'gatsby';

import Block from '@/src/components/Block';
import { ConditionalWrapper } from '@/src/components/ConditionalWrapper';

export default function Table(props: {
    data: { data: any[]; rowLink: string }[];
    blockView?: boolean;
}) {
    const header = props.data?.[0].data;

    return (
        <>
            <div
                className={clsx(
                    !props.blockView && 'lg:hidden',
                    props.blockView && 'md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-5',
                )}
            >
                {props.data.slice(1).map((row, i) => (
                    <ConditionalWrapper
                        condition={!!row.rowLink}
                        key={`wrapper-${i}`}
                        wrapper={(children: any) => (
                            <Link to={row.rowLink} key={i}>
                                {children}
                            </Link>
                        )}
                    >
                        <Block className="grid grid-cols-2 gap-1 text-sm mb-5 lg:mb-0 h-full" hover>
                            {row.data.map((item, j) =>
                                header[j] ? (
                                    <React.Fragment key={`${i}-${j}`}>
                                        <div className="font-bold">{header[j]}</div>
                                        <div className="flex justify-end text-gray-300">{item}</div>
                                    </React.Fragment>
                                ) : (
                                    <div key={`${i}-${j}`} className="col-span-2">
                                        {item}
                                    </div>
                                ),
                            )}
                        </Block>
                    </ConditionalWrapper>
                ))}
            </div>

            {!props.blockView && (
                <div className="hidden lg:block rounded-lg overflow-hidden">
                    <div className="grid gap-3 w-full">
                        <div className="flex bg-black py-3 px-5 rounded-lg">
                            {header.map((header, i) => (
                                <div className="font-bold pr-5 flex-1" key={i}>
                                    {header}
                                </div>
                            ))}
                        </div>

                        {props.data.slice(1).map((row, i) => (
                            <ConditionalWrapper
                                condition={!!row.rowLink}
                                key={`wrapper-${i}`}
                                wrapper={(children: any) => (
                                    <Link to={row.rowLink} key={i}>
                                        {children}
                                    </Link>
                                )}
                            >
                                <div className="flex hover:bg-saber-dark/20 transition-colors py-3 items-center rounded-lg px-3">
                                    {row.data.map((item, j) => (
                                        <div className="flex-1" key={`${i}-${j}`}>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </ConditionalWrapper>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
