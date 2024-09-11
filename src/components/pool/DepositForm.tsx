import React, { useEffect, useMemo, useState } from 'react';
import H2 from '../H2';
import Input, { InputType } from '../Input';
import { useForm } from 'react-hook-form';
import Button from '../Button';
import { PoolData } from '../../types';
import useUserATA from '../../hooks/user/useUserATA';
import { RAW_SOL_MINT, Token, TokenAmount, WRAPPED_SOL } from '@saberhq/token-utils';
import { toPrecision } from '../../helpers/number';
import TX from '../TX';
import { useDeposit } from '../../hooks/user/useDeposit';
import { useMutation } from '@tanstack/react-query';
import useQuarryMiner from '../../hooks/user/useQuarryMiner';
import useUserGetLPTokenBalance from '../../hooks/user/useGetLPTokenBalance';
import { useStableSwapTokens } from '../../hooks/useStableSwapTokens';
import clsx from 'clsx';
import { getSymbol } from '../../helpers/pool';
import { getMax } from '@/src/helpers/token';
import useNetwork from '@/src/hooks/useNetwork';

export default function DepositForm(props: { pool: PoolData }) {
    const { network } = useNetwork();
    const { register, watch, setValue } = useForm<{
        amountTokenA: number;
        amountTokenB: number;
        noStake: boolean;
    }>();
    const ssTokens = useStableSwapTokens(props.pool);

    const token0 = useMemo(() => {
        return ssTokens?.underlyingTokens?.[0] || props.pool.info.tokens[0];
    }, [props.pool]);

    const token1 = useMemo(() => {
        return ssTokens?.underlyingTokens?.[1] || props.pool.info.tokens[1];
    }, [props.pool]);

    const { data: ataInfo0, refetch: refetchBalances0 } = useUserATA(new Token(token0));
    const { data: ataInfo1, refetch: refetchBalances1 } = useUserATA(new Token(token1));

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
        data: hash,
    } = useMutation({
        mutationKey: ['deposit'],
        mutationFn: async () => {
            if (!amountTokenA && !amountTokenB) {
                return;
            }
            await deposit?.handleDeposit(noStake);
            refetch();
            refetchLP();
            refetchBalances0();
            refetchBalances1();
        },
    });

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
                        onClick={() => setValue('amountTokenA', getMax(ataInfo0?.balance.asNumber ?? 0, ataInfo0?.mint === WRAPPED_SOL[network].address))}
                    >
                        {getMax(ataInfo0?.balance.asNumber ?? 0, ataInfo0?.mint === WRAPPED_SOL[network].address)}
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
                        onClick={() => setValue('amountTokenB', getMax(ataInfo1?.balance.asNumber ?? 0, ataInfo1?.mint === WRAPPED_SOL[network].address))}
                    >
                        {getMax(ataInfo1?.balance.asNumber ?? 0, ataInfo1?.mint === WRAPPED_SOL[network].address)}
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
                    disabled={(!amountTokenA && !amountTokenB) || Math.abs(slippage) > 0.01}
                >
                    {Math.abs(slippage) > 0.01 ? 'Slippage too high' : 'Deposit'}
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
                        {toPrecision((Math.abs(slippage) ?? 0) * 100, 4)}%
                    </div>
                    <div>Price impact</div>
                    <div
                        className={clsx(
                            'text-right',
                            priceImpact > 0.1 && 'text-red-600 font-bold',
                        )}
                    >
                        {toPrecision(Math.abs(slippage) * 100, 4)}%
                    </div>
                </div>
            )}
        </div>
    );
}
