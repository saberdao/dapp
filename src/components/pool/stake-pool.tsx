import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import H2 from '@/src/layout/h2';
import Input, { InputType } from '@/src/layout/Input';
import Button from '@/src/layout/button';
import { PoolData } from '@/src/types/global';
import useStake from '@/src/hooks/user/useStake';
import useUserGetLPTokenBalance from '@/src/hooks/user/useGetLPTokenBalance';
import TX from '@/src/components/TX';
import useQuarryMiner from '@/src/hooks/user/useQuarryMiner';

export default function StakePool(props: { pool: PoolData }) {
  const { register, watch, setValue } = useForm<{ amount: number }>();
  const { stake } = useStake(props.pool.info.lpToken);
  const { refetch } = useQuarryMiner(props.pool.info.lpToken, true);
  const { data: balance, refetch: refetchLP } = useUserGetLPTokenBalance(
    props.pool.pair.pool.state.poolTokenMint.toString(),
  );
  const [lastStakeHash, setLastStakeHash] = useState('');

  const {
    mutate: execStake,
    isPending,
    isSuccess,
    data: hash,
  } = useMutation({
    mutationKey: ['stake', lastStakeHash],
    mutationFn: async (amount: number) => {
      if (!amount) {
        return null;
      }

      return stake(amount);
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
          },
        },
      );
    }
  }, [lastStakeHash]);

  const amount = watch('amount');

  if (isSuccess && hash && lastStakeHash !== hash) {
    setLastStakeHash(hash);
  }

  return (
    <div className="w-full" onClick={() => {}}>
      <H2>Stake</H2>
      <p className="text-secondary text-sm">Stake LP tokens to receive farm rewards.</p>
      <Input
        align="right"
        register={register('amount')}
        type={InputType.NUMBER}
        placeholder="0.00"
        size="full"
      />
      <div className="text-white text-xs text-right my-5">
        Balance:{' '}
        <div
          className="text-saber-light cursor-pointer inline"
          onClick={() => setValue('amount', balance?.balance.value.uiAmount ?? 0)}
        >
          {balance?.balance.value.uiAmount}
        </div>
      </div>

      {isPending ? (
        <Button disabled size="full">
          Staking...
        </Button>
      ) : (
        <Button size="full" onClick={() => execStake(amount)} disabled={!amount}>
          Stake
        </Button>
      )}
    </div>
  );
}
