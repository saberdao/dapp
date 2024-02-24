import React, { useEffect, useState } from 'react';
import H2 from '../H2';
import Input, { InputType } from '../Input';
import { useForm } from 'react-hook-form';
import Button from '../Button';
import { PoolData } from '../../types';
import useStake from '../../hooks/user/useStake';
import { useMutation } from '@tanstack/react-query';
import useUserGetLPTokenBalance from '../../hooks/user/useGetLPTokenBalance';
import { toast } from 'react-toastify';
import TX from '../TX';

export default function StakeForm (props: { pool: PoolData }) {
    const { register, watch, setValue } = useForm<{ amount: number }>();
    const { stake } = useStake(props.pool.info.lpToken);
    const { refetch, data: balance } = useUserGetLPTokenBalance(props.pool.info.lpToken.address);
    const [lastStakeHash, setLastStakeHash] = useState('');

    const { mutate: execStake, isPending, isSuccess, data: hash } = useMutation({
        mutationKey: ['stake'],
        mutationFn: stake,
    });

    // Do it like this so that when useMutation is called twice, the toast will only show once.
    // But it still works with multiple stake invocations.
    useEffect(() => {
        setTimeout(() => {
            // Wait a bit so the RPC is updated
            refetch();
        }, 2000);

        if (lastStakeHash) {
            toast.success((
                <div className="text-sm">
                    <p>Transaction successful! Your transaction hash:</p>
                    <TX tx={lastStakeHash} />
                </div>
            ));
        }
    }, [lastStakeHash]);
    
    const amount = watch('amount');

    if (isSuccess && hash && lastStakeHash !== hash) {
        setLastStakeHash(hash);
    }

    if (!balance?.balance.value.uiAmount) {
        return null;
    }

    return (
        <div className="w-full" onClick={() => {
        }}>
            <H2>Stake</H2>
            <p className="text-secondary text-sm">Stake USDC-USDT LP tokens to receive farm rewards.</p>
            <Input align="right" register={register('amount')} type={InputType.NUMBER} placeholder="0.00" size="full" />
            <div className="text-white text-xs text-right my-5">
                Balance:{' '}
                <div
                    className="text-saber-light cursor-pointer inline"
                    onClick={() => setValue('amount', balance.balance.value.uiAmount!)}
                >{balance.balance.value.uiAmount}</div>
            </div>
            
            {isPending
                ? <Button disabled size="full">
                    Staking...
                </Button>
                : <Button size="full" onClick={() => execStake(amount)}>
                    Stake
                </Button>}
        </div>
    );
}