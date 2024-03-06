import React, { useEffect, useState } from 'react';
import H2 from '../H2';
import Input, { InputType } from '../Input';
import { useForm } from 'react-hook-form';
import Button from '../Button';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import useUserGetLPTokenBalance from '../../hooks/user/useGetLPTokenBalance';
import { PoolData } from '../../types';
import TX from '../TX';
import { useWithdraw } from '../../hooks/user/useWithdraw';
import { Token, TokenAmount } from '@saberhq/token-utils';
import { useStableSwapTokens } from '../../hooks/useStableSwapTokens';
import useQuarryMiner from '../../hooks/user/useQuarryMiner';

export default function WithdrawForm (props: { pool: PoolData }) {
    const { register, watch, setValue } = useForm<{ amount: number }>();
    const { refetch } = useQuarryMiner(props.pool.info.lpToken, true);
    const { data: balance, refetch: refetchLP } = useUserGetLPTokenBalance(props.pool.pair.pool.state.poolTokenMint.toString());
    const [lastStakeHash, setLastStakeHash] = useState('');
    const tokens = useStableSwapTokens(props.pool);

    const amount = watch('amount');

    const withdraw = useWithdraw({
        withdrawPoolTokenAmount: TokenAmount.parse(new Token(props.pool.info.lpToken), amount ? `${amount}` : '0'),
        withdrawToken: undefined, // Always do a balanced withdraw. We can optionally later swap to one using Jup for better price
        wrappedTokens: tokens?.wrappedTokens,
        pool: props.pool,
        actions: {
            withdraw: true,
            unstake: false,
        },
    });

    const { mutate: execWithdraw, isPending, isSuccess, data: hash } = useMutation({
        mutationKey: ['withdraw', lastStakeHash],
        mutationFn: async () => {
            const hash = withdraw?.handleWithdraw();
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
                onClose: () => {
                    refetch();
                    refetchLP();
                },
            });
        }
    }, [lastStakeHash]);

    if (isSuccess && hash && lastStakeHash !== hash) {
        setLastStakeHash(hash);
    }

    if (!balance?.balance.value.uiAmount) {
        return null;
    }

    return (
        <div className="w-full">
            <H2>Withdraw</H2>
            <p className="text-secondary text-sm">Withdraw USDC-USDT LP tokens to receive the underlying tokens.</p>
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
                    Withdrawing...
                </Button>
                : <Button size="full" onClick={() => execWithdraw()}>
                    Withdraw
                </Button>}
        </div>
    );
}