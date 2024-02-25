import React, { useEffect, useMemo, useState } from 'react';
import H2 from '../H2';
import Input, { InputType } from '../Input';
import { useForm } from 'react-hook-form';
import Button from '../Button';
import { PoolData } from '../../types';
import useUserATAs from '../../hooks/user/useUserATAs';
import { Token, TokenAmount } from '@saberhq/token-utils';
import { toPrecision } from '../../helpers/number';
import TX from '../TX';
import { toast } from 'react-toastify';
import { useDeposit } from '../../hooks/user/useDeposit';
import { useMutation } from '@tanstack/react-query';

export default function DepositForm (props: { pool: PoolData }) {
    const { register, watch, setValue } = useForm<{ amountTokenA: number, amountTokenB: number }>();
    const [lastStakeHash, setLastStakeHash] = useState('');
    const { data: ataInfo, refetch } = useUserATAs([
        new Token(props.pool.info.tokens[0]),
        new Token(props.pool.info.tokens[1]),
    ]);

    const amountTokenA = watch('amountTokenA');
    const amountTokenB = watch('amountTokenB');
    const usdValue = useMemo(() => {
        return amountTokenA * props.pool.usdPrice.tokenA + amountTokenB * props.pool.usdPrice.tokenB;
    }, [amountTokenA, amountTokenB]);

    const tokenAmounts = useMemo(() => {
        return [
            TokenAmount.parse(new Token(props.pool.info.tokens[0]), amountTokenA ? `${amountTokenA}` : '0'),
            TokenAmount.parse(new Token(props.pool.info.tokens[1]), amountTokenB ? `${amountTokenB}` : '0'),
        ];
    }, [amountTokenA, amountTokenB]);

    const deposit = useDeposit({
        tokenAmounts,
        pool: props.pool,
    });

    const { mutate: execDeposit, isPending, isSuccess, data: hash } = useMutation({
        mutationKey: ['deposit', lastStakeHash],
        mutationFn: async () => {
            const hash = await deposit?.handleDeposit();
            return hash;
        },
    });

    // Do it like this so that when useMutation is called twice, the toast will only show once.
    // But it still works with multiple stake invocations.
    useEffect(() => {
        if (lastStakeHash) {
            toast.success((
                <div className="text-sm">
                    <p>Transaction successful! Your transaction hash:</p>
                    <TX tx={lastStakeHash} />
                </div>
            ), {
                onClose: () => refetch(),
            });
        }
    }, [lastStakeHash]);

    if (isSuccess && hash && lastStakeHash !== hash) {
        setLastStakeHash(hash);
    }

    return (
        <div className="w-full">
            <H2>Deposit</H2>
            <p className="text-secondary text-sm">
                Deposit and stake tokens to earn yield.
            </p>

            <div className="mt-3" />

            <div className="font-bold text-sm flex items-center gap-2 mt-3">
                <div className="flex-grow">{props.pool.info.tokens[0].symbol}</div>
                <span className="text-white text-xs font-normal">
                    Balance:{' '}
                    <span
                        className="text-saber-light cursor-pointer"
                        onClick={() => setValue('amountTokenA', ataInfo?.[0].balance.asNumber ?? 0)}
                    >{ataInfo?.[0].balance.asNumber ?? 0}</span>
                </span>
            </div>
            <Input register={register('amountTokenA')} type={InputType.NUMBER} placeholder="0.00" size="full" />

            <div className="font-bold text-sm flex items-center gap-2 mt-3">
                <div className="flex-grow">{props.pool.info.tokens[1].symbol}</div>
                <span className="text-white text-xs font-normal">
                    Balance:{' '}
                    <span
                        className="text-saber-light cursor-pointer"
                        onClick={() => setValue('amountTokenB', ataInfo?.[1].balance.asNumber ?? 0)}
                    >{ataInfo?.[1].balance.asNumber ?? 0}</span>
                </span>
            </div>
            <Input register={register('amountTokenB')} type={InputType.NUMBER} placeholder="0.00" size="full" />

            <div className="mt-3" />

            <Input type={InputType.CHECKBOX} label="Receive LP tokens instead" size="full" />

            <div className="mt-3" />
            
            {isPending
                ? <Button disabled size="full">
                    Depositing...
                </Button>
                : <Button size="full" onClick={() => execDeposit()}>
                    Deposit
                </Button>}
            
            <div className="text-right text-gray-400 text-xs mt-2">
                ${usdValue > 0 ? toPrecision(usdValue, 4) : '—'}
            </div>
        </div>
    );
}