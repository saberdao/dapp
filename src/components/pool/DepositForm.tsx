import React from 'react';
import H2 from '../H2';
import Input, { InputType } from '../Input';
import { useForm } from 'react-hook-form';
import Button from '../Button';

export default function DepositForm () {
    const { register, watch, setValue } = useForm<{ amountTokenA: number, amountTokenB: number }>();

    const amountTokenA = watch('amountTokenA');
    const amountTokenB = watch('amountTokenB');

    const balanceTokenA = 12.34; // @todo update this
    const balanceTokenB = 8.74; // @todo update this
    const usdValue = 16.78; // @todo update this

    return (
        <div className="w-full">
            <H2>Deposit</H2>
            <p className="text-secondary text-sm">Deposit USDC-USDT LP tokens to receive the underlying tokens. Only display when # farmed LP tokens nonzero</p>

            <div className="mt-3" />

            <div className="font-bold text-sm flex items-center gap-2 mt-3">
                <div className="flex-grow">USDC</div>
                <span className="text-white text-xs font-normal">
                    Balance:{' '}
                    <span
                        className="text-saber-light cursor-pointer"
                        onClick={() => setValue('amountTokenA', balanceTokenA)}
                    >{balanceTokenA}</span>
                </span>
            </div>
            <Input register={register('amountTokenA')} type={InputType.NUMBER} placeholder="0.00" size="full" />
            

            <div className="font-bold text-sm flex items-center gap-2 mt-3">
                <div className="flex-grow">USDT</div>
                <span className="text-white text-xs font-normal">
                    Balance:{' '}
                    <span
                        className="text-saber-light cursor-pointer"
                        onClick={() => setValue('amountTokenB', balanceTokenB)}
                    >{balanceTokenB}</span>
                </span>
            </div>
            <Input register={register('amountTokenB')} type={InputType.NUMBER} placeholder="0.00" size="full" />

            <div className="mt-3" />

            <Input type={InputType.CHECKBOX} label="Receive LP tokens instead" size="full" />

            <div className="mt-3" />
            
            <Button size="full">
                Deposit
            </Button>
            
            <div className="text-right text-gray-400 text-xs mt-2">
                ${amountTokenA > 0 ? usdValue : '—'}
            </div>
        </div>
    );
}