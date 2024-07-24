import React, { useEffect, useState } from 'react';
import H2 from '../H2';
import Input, { InputType } from '../Input';
import { useForm } from 'react-hook-form';
import Button from '../Button';
import { PoolData } from '../../types';
import useStake from '../../hooks/user/useStake';
import { useMutation } from '@tanstack/react-query';
import useUserGetLPTokenBalance from '../../hooks/user/useGetLPTokenBalance';
import TX from '../TX';
import useQuarryMiner from '../../hooks/user/useQuarryMiner';

export default function StakeForm (props: { pool: PoolData }) {
    const { register, watch, setValue } = useForm<{ amount: number }>();
    const { stake } = useStake(props.pool);
    const { refetch } = useQuarryMiner(props.pool.info.lpToken, true);
    const { data: balance, refetch: refetchLP } = useUserGetLPTokenBalance(props.pool.pair.pool.state.poolTokenMint.toString());

    const { mutate: execStake, isPending, isSuccess, data: hash } = useMutation({
        mutationKey: ['stake'],
        mutationFn: async (amount: number) => {
            if (!amount) {
                return null;
            }

            await stake(amount);
            refetch();
            refetchLP();
        },
    });
    
    const amount = watch('amount');

    return (
        <div className="w-full" onClick={() => {
        }}>
            <H2>Stake</H2>
            <p className="text-secondary text-sm">Stake LP tokens to receive farm rewards.</p>
            <Input align="right" register={register('amount')} type={InputType.NUMBER} placeholder="0.00" size="full" />
            <div className="text-white text-xs text-right my-5">
                Balance:{' '}
                <div
                    className="text-saber-light cursor-pointer inline"
                    onClick={() => setValue('amount', balance?.balance.value.uiAmount ?? 0)}
                >{balance?.balance.value.uiAmount}</div>
            </div>
            
            {isPending
                ? <Button disabled size="full">
                    Staking...
                </Button>
                : <Button size="full" onClick={() => execStake(amount)} disabled={!amount}>
                    Stake
                </Button>}
        </div>
    );
}