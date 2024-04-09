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
import { useWithdraw } from '../../hooks/user/useWithdraw';
import { Token, TokenAmount } from '@saberhq/token-utils';
import { useStableSwapTokens } from '../../hooks/useStableSwapTokens';
import { calculateWithdrawAll } from '../../hooks/user/useWithdraw/calculateWithdrawAll';
import useSettings from '../../hooks/useSettings';
import { toPrecision } from '../../helpers/number';
import useUserGetLPTokenBalance from '../../hooks/user/useGetLPTokenBalance';

export default function UnunstakeForm (props: { pool: PoolData }) {
    const { register, watch, setValue } = useForm<{ amount: number; noWithdraw: boolean }>();
    const { data: miner, refetch } = useQuarryMiner(props.pool.info.lpToken, true);
    const { refetch: refetchLP } = useUserGetLPTokenBalance(props.pool.pair.pool.state.poolTokenMint.toString());
    const [lastStakeHash, setLastStakeHash] = useState('');
    const tokens = useStableSwapTokens(props.pool);
    const { maxSlippagePercent } = useSettings();

    const amount = watch('amount');

    const withdraw = useWithdraw({
        withdrawPoolTokenAmount: TokenAmount.parse(new Token(props.pool.info.lpToken), amount ? `${amount}` : '0'),
        withdrawToken: undefined, // Always do a balanced withdraw. We can optionally later swap to one using Jup for better price
        wrappedTokens: tokens?.wrappedTokens,
        pool: props.pool,
        actions: {
            withdraw: false,
            unstake: true,
        },
    });

    const { mutate: execUnstake, isPending, isSuccess, data: hash } = useMutation({
        mutationKey: ['unstake', lastStakeHash],
        mutationFn: async () => {
            if (!amount) {
                return;
            }
            const hash = await withdraw?.handleWithdraw();
            return hash;
        },
    });

    const stakedUsdValue = useMemo(() => {
        if (!miner?.data) {
            return 0;
        }

        const values = calculateWithdrawAll({
            poolTokenAmount: TokenAmount.parse(new Token(props.pool.info.lpToken), (amount ?? 0).toString()),
            maxSlippagePercent,
            exchangeInfo: props.pool.exchangeInfo,
        });

        const valueA = values.estimates[0] ? values.estimates[0].asNumber : 0;
        const valueB = values.estimates[1] ? values.estimates[1].asNumber : 0;
        
        const usdValue = valueA * props.pool.usdPrice.tokenA + valueB * props.pool.usdPrice.tokenB;
        return usdValue;
    }, [miner, amount]);

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

    const balance = useMemo(() => {
        if (!miner?.data) {
            return 0;
        }

        const balance = BigNumber(miner.data.balance.toString());
        return balance.div(new BigNumber(10 ** miner.miner.quarry.token.decimals)).toNumber();
    }, [miner]);

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

            {/* <Input register={register('noWithdraw')} type={InputType.CHECKBOX} label="Receive LP tokens instead" size="full" />

            <div className="mt-5" /> */}
            
            {isPending
                ? <Button disabled size="full">
                    Unstaking...
                </Button>
                : <Button size="full" onClick={() => execUnstake()} disabled={!amount}>
                    Unstake
                </Button>}
            
            <div className="text-right text-gray-400 text-xs mt-2">
                ${amount > 0 ? toPrecision(stakedUsdValue, 4) : '—'}
            </div>
        </div>
    );
}