import React from 'react';
import type { HeadFC, PageProps } from 'gatsby';
import { FaLongArrowAltRight } from 'react-icons/fa';

import H1 from '../components/H1';
import H2 from '../components/H2';
import Button from '../components/Button';
import Block from '../components/Block';
import Saber from '../svg/saber';
import Address from '../components/Address';
import Input, { InputType } from '../components/Input';
import Table from '../components/Table';

const ComponentsPage: React.FC<PageProps> = () => {
    return (
        <div className="max-w-2xl">
            <div className="flex flex-col gap-5">
                <div className="flex gap-3">
                    <Saber />
                    <Saber className="text-saber-light" />
                    <Saber className="text-saber-dark" />
                </div>
                <H1>This is a H1</H1>
                <H2>This is a H2</H2>
                <p>This is normal text</p>
                <p className="text-secondary text-sm">This is secondary text</p>
                <Button>Primary button</Button>
                <Button type="secondary">Secondary button</Button>
                <Button size="small">Small button</Button>
                <Button size="full">Full sized button</Button>
                <Block className="flex flex-col gap-3">
                    <H2>This is a block</H2>
                    <p>It can contain any text</p>
                    <p className="text-secondary text-sm">Or secondary text</p>
                    <div className="flex gap-3">
                        <Button>And a button</Button>
                        <Button type="secondary">
                            And a secondary
                            <FaLongArrowAltRight />
                        </Button>
                    </div>
                </Block>
                <Block active className="flex flex-col gap-3">
                    <p>Blocks can also be in an active state</p>
                </Block>
                <Block className="flex flex-col gap-3" hover>
                    <p>Blocks can also have a hover effect</p>
                </Block>

                <span>
                    Address (with preferred explorer setting):{' '}
                    <Address address="Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1" />
                </span>

                <div className="flex flex-col">
                    <p>Normal input</p>
                    <Input type={InputType.TEXT} placeholder="Enter something here" />
                </div>

                <div className="flex flex-col">
                    <p>Number input</p>
                    <Input type={InputType.NUMBER} placeholder="0.00" />
                </div>
            </div>
            <Block className="mt-5 flex flex-col gap-5">
                <p>Table in a block</p>
                <Table
                    data={[
                        { rowLink: '', data: ['Column 1', 'Column 2', 'Column 3', ''] },
                        {
                            rowLink: '',
                            data: [
                                'Value 1',
                                123.4,
                                'Something',
                                <Button key="b" size="small">
                                    View
                                </Button>,
                            ],
                        },
                        {
                            rowLink: '',
                            data: [
                                'Value 1',
                                123.4,
                                'Something',
                                <Button type="danger" key="b" size="small">
                                    Withdraw
                                </Button>,
                            ],
                        },
                    ]}
                />
            </Block>
        </div>
    );
};

export default ComponentsPage;

export const Head: HeadFC = () => <title>Saber | Solana AMM</title>;
