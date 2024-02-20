import React from 'react';
import H2 from '../H2';
import Input, { InputType } from '../Input';
import { useForm } from 'react-hook-form';
import Button from '../Button';

export default function UnunstakeForm () {
    const { register, watch, setValue } = useForm<{ amount: number }>();

    const amount = watch('amount');

    const balance = 12.34; // @todo update this
    const usdValue = 16.78; // @todo update this

    return (
        <div className="w-full">
            <H2>Unstake</H2>
            <p className="text-secondary text-sm">Unstake USDC-USDT LP tokens to receive the underlying tokens. Only display when # farmed LP tokens nonzero</p>
            <Input align="right" register={register('amount')} type={InputType.NUMBER} placeholder="0.00" size="full" />
            <div className="text-white text-xs text-right my-5">
                Balance:{' '}
                <div
                    className="text-saber-light cursor-pointer inline"
                    onClick={() => setValue('amount', balance)}
                >{balance}</div>
            </div>

            <Input type={InputType.CHECKBOX} label="Receive LP tokens instead" size="full" />

            <div className="mt-5" />
            
            <Button size="full">
                Unstake
            </Button>
            
            <div className="text-right text-gray-400 text-xs mt-2">
                ${amount > 0 ? usdValue : '—'}
            </div>
        </div>
    );
}