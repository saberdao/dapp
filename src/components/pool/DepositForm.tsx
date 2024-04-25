import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Token, TokenAmount } from '@saberhq/token-utils';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import clsx from 'clsx';

import { PoolData } from '@/src/types';
import { toPrecision } from '@/src/helpers/number';
import Input, { InputType } from '../Input';
import Button from '@/src/components/Button';
import H2 from '@/src/components/H2';
import useUserATAs from '@/src/hooks/user/useUserATAs';
import TX from '@/src/components/TX';
import { useDeposit } from '@/src/hooks/user/useDeposit';
import useQuarryMiner from '@/src/hooks/user/useQuarryMiner';
import useUserGetLPTokenBalance from '@/src/hooks/user/useGetLPTokenBalance';
import { useStableSwapTokens } from '@/src/hooks/useStableSwapTokens';
import { getSymbol } from '@/src/helpers/pool';

export default function DepositForm(props: { pool: PoolData }) {
    const { register, watch, setValue } = useForm<{
        amountTokenA: number;
        amountTokenB: number;
        noStake: boolean;
    }>();
    const [lastStakeHash, setLastStakeHash] = useState('');
    const ssTokens = useStableSwapTokens(props.pool);

    const token0 = useMemo(() => {
        return ssTokens?.underlyingTokens?.[0] || props.pool.info.tokens[0];
    }, [props.pool]);

    const token1 = useMemo(() => {
        return ssTokens?.underlyingTokens?.[1] || props.pool.info.tokens[1];
    }, [props.pool]);

    const { data: ataInfo, refetch: refetchBalances } = useUserATAs([
        new Token(token0),
        new Token(token1),
    ]);
    const { refetch } = useQuarryMiner(props.pool.info.lpToken, true);
    const { refetch: refetchLP } = useUserGetLPTokenBalance(
        props.pool.pair.pool.state.poolTokenMint.toString(),
    );

    const amountTokenA = watch('amountTokenA');
    const amountTokenB = watch('amountTokenB');
    const noStake = watch('noStake');
    const usdValue = useMemo(() => {
        return (
            amountTokenA * props.pool.usdPrice.tokenA + amountTokenB * props.pool.usdPrice.tokenB
        );
    }, [amountTokenA, amountTokenB]);

    const tokenAmounts = useMemo(() => {
        return [
            TokenAmount.parse(new Token(token0), amountTokenA ? `${amountTokenA}` : '0'),
            TokenAmount.parse(new Token(token1), amountTokenB ? `${amountTokenB}` : '0'),
        ];
    }, [amountTokenA, amountTokenB]);

    const deposit = useDeposit({
        tokenAmounts,
        pool: props.pool,
    });

    const slippage = useMemo(() => {
        return deposit.estimatedDepositSlippage?.asNumber ?? 0;
    }, [deposit]);

    const priceImpact = useMemo(() => {
        return deposit.priceImpact?.asNumber ?? 0;
    }, [deposit]);

    const {
        mutate: execDeposit,
        isPending,
        isSuccess,
        data: hash,
    } = useMutation({
        mutationKey: ['deposit', lastStakeHash],
        mutationFn: async () => {
            if (!amountTokenA && !amountTokenB) {
                return;
            }
            const hash = await deposit?.handleDeposit(noStake);
            return hash;
        },
    });

    // Do it like this so that when useMutation is called twice, the toast will only show once.
    // But it still works with multiple stake invocations.
    useEffect(() => {
        if (lastStakeHash) {
            toast.success(
                <div className="text-sm">
                    <p>Transaction successful! Your transaction hash:</p>
                    <TX tx={lastStakeHash} />
                </div>,
                {
                    onClose: () => {
                        refetch();
                        refetchLP();
                        refetchBalances();
                    },
                },
            );
        }
    }, [lastStakeHash]);

    if (isSuccess && hash && lastStakeHash !== hash) {
        setLastStakeHash(hash);
    }

    return (
        <div className="w-full">
            <H2>Deposit</H2>
            <p className="text-secondary text-sm">Deposit and stake tokens to earn yield.</p>

            <div className="mt-3" />

            <div className="font-bold text-sm flex items-center gap-2 mt-3">
                <div className="flex-grow">{getSymbol(token0.symbol)}</div>
                <span className="text-white text-xs font-normal">
                    Balance:{' '}
                    <span
                        className="text-saber-light cursor-pointer"
                        onClick={() => setValue('amountTokenA', ataInfo?.[0].balance.asNumber ?? 0)}
                    >
                        {ataInfo?.[0].balance.asNumber ?? 0}
                    </span>
                </span>
            </div>
            <Input
                register={register('amountTokenA')}
                type={InputType.NUMBER}
                placeholder="0.00"
                size="full"
            />

            <div className="font-bold text-sm flex items-center gap-2 mt-3">
                <div className="flex-grow">{getSymbol(token1.symbol)}</div>
                <span className="text-white text-xs font-normal">
                    Balance:{' '}
                    <span
                        className="text-saber-light cursor-pointer"
                        onClick={() => setValue('amountTokenB', ataInfo?.[1].balance.asNumber ?? 0)}
                    >
                        {ataInfo?.[1].balance.asNumber ?? 0}
                    </span>
                </span>
            </div>
            <Input
                register={register('amountTokenB')}
                type={InputType.NUMBER}
                placeholder="0.00"
                size="full"
            />

            <div className="mt-3" />

            {/* <Input register={register('noStake')} type={InputType.CHECKBOX} label="Receive LP tokens instead" size="full" />

            <div className="mt-3" /> */}

            {isPending ? (
                <Button disabled size="full">
                    Depositing...
                </Button>
            ) : (
                <Button
                    size="full"
                    onClick={() => execDeposit()}
                    disabled={!amountTokenA && !amountTokenB}
                >
                    Deposit
                </Button>
            )}

            {usdValue > 0 && (
                <div className="text-gray-400 text-xs grid grid-cols-2 w-full mt-2 gap-1">
                    <div>Estimated USD value</div>
                    <div className="text-right">${toPrecision(usdValue, 4)}</div>
                    <div>LP tokens received</div>
                    <div className="text-right">
                        {deposit.estimatedMint?.mintAmount.asNumber
                            ? toPrecision(deposit.estimatedMint?.mintAmount.asNumber, 4)
                            : ''}
                    </div>
                    <div>Slippage</div>
                    <div className={clsx('text-right', slippage > 0.1 && 'text-red-600 font-bold')}>
                        {toPrecision((slippage ?? 0) * 100, 4)}%{slippage < 0 ? ' (bonus!)' : ''}
                    </div>
                    <div>Price impact</div>
                    <div
                        className={clsx(
                            'text-right',
                            priceImpact > 0.1 && 'text-red-600 font-bold',
                        )}
                    >
                        {toPrecision(priceImpact * 100, 4)}%{priceImpact < 0 ? ' (bonus!)' : ''}
                    </div>
                </div>
            )}
        </div>
    );
}
