import React from 'react';
import H2 from '../H2';
import Input, { InputType } from '../Input';
import { useForm } from 'react-hook-form';
import Button from '../Button';

export default function WithdrawForm () {
    const { register, watch, setValue } = useForm<{ amount: number }>();

    const amount = watch('amount');

    const balance = 12.34; // @todo update this
    const usdValue = 16.78; // @todo update this

    return (
        <div className="w-full">
            <H2>Withdraw</H2>
            <p className="text-secondary text-sm">Withdraw USDC-USDT LP tokens to receive the underlying tokens. Only display when #LP tokens nonzero</p>
            <Input align="right" register={register('amount')} type={InputType.NUMBER} placeholder="0.00" size="full" />
            <div className="text-white text-xs text-right my-5">
                Balance:{' '}
                <div
                    className="text-saber-light cursor-pointer inline"
                    onClick={() => setValue('amount', balance)}
                >{balance}</div>
            </div>
            
            <Button size="full">
                Withdraw
            </Button>
            
            <div className="text-right text-gray-400 text-xs mt-2">
                ${amount > 0 ? usdValue : '—'}
            </div>
        </div>
    );
}