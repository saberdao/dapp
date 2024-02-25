import React, { useEffect, useMemo, useState } from 'react';
import H2 from '../H2';
import Input, { InputType } from '../Input';
import { useForm } from 'react-hook-form';
import Button from '../Button';
import { PoolData } from '../../types';
import useQuarryMiner from '../../hooks/user/useQuarryMiner';
import BigNumber from 'bignumber.js';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import TX from '../TX';
import useUnstake from '../../hooks/user/useUnstake';

export default function UnunstakeForm (props: { pool: PoolData }) {
    const { register, watch, setValue } = useForm<{ amount: number }>();
    const { data: miner, refetch } = useQuarryMiner(props.pool.info.lpToken, true);
    const { unstake } = useUnstake(props.pool.info.lpToken);
    const [lastStakeHash, setLastStakeHash] = useState('');

    const { mutate: execUnstake, isPending, isSuccess, data: hash } = useMutation({
        mutationKey: ['unstake', lastStakeHash],
        mutationFn: unstake,
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

    const amount = watch('amount');

    const balance = useMemo(() => {
        if (!miner?.data) {
            return 0;
        }

        const balance = BigNumber(miner.data.balance.toString());
        return balance.div(new BigNumber(10 ** miner.miner.quarry.token.decimals)).toNumber();
    }, [miner]);

    const usdValue = 'TODO'; // @todo update this

    if (isSuccess && hash && lastStakeHash !== hash) {
        setLastStakeHash(hash);
    }

    return (
        <div className="w-full">
            <H2>Unstake</H2>
            <p className="text-secondary text-sm">Unstake your staked liquidity.</p>
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
            
            {isPending
                ? <Button disabled size="full">
                    Unstaking...
                </Button>
                : <Button size="full" onClick={() => execUnstake(amount)}>
                    Unstake
                </Button>}
            
            <div className="text-right text-gray-400 text-xs mt-2">
                ${amount > 0 ? usdValue : '—'}
            </div>
        </div>
    );
}