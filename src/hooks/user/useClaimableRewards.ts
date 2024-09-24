import { Token, TokenAmount, TokenInfo } from '@saberhq/token-utils';
import useQuarryMiner from './useQuarryMiner';
import { createQuarryPayroll } from '../../helpers/quarry';
import BN from 'bn.js';
import { useMemo, useState } from 'react';
import { SBR_INFO } from '../../utils/builtinTokens';
import useGetSecondaryPayrolls from './useGetSecondaryPayrolls';

export default function useClaim(lpToken: TokenInfo) {
    const { data: miner } = useQuarryMiner(lpToken, true);
    const { data: secondaryPayrolls } = useGetSecondaryPayrolls(lpToken);
    const [rewardsT0, setRewardsT0] = useState({ primary: 0, secondary: [] as number[] });
    const [timeT0, setTimeT0] = useState(0);

    const claimableRewards = useMemo(() => () => {
        if (!miner?.data || !miner.stakedBalance || !secondaryPayrolls) {
            return null;
        }

        const time = Date.now();

        const timeInSec = Math.floor(time / 1000);

        // Primary
        const payroll = createQuarryPayroll(miner.miner.quarry.quarryData);
        let rewards = new TokenAmount(new Token(SBR_INFO), payroll.calculateRewardsEarned(
            new BN(timeInSec),
            miner.stakedBalanceLegacy,
            miner.data.rewardsPerTokenPaid,
            miner.data.rewardsEarned,
        ));
        if (miner.mergeMinerData && secondaryPayrolls.length === 0) {
            rewards = rewards.add(new TokenAmount(new Token(SBR_INFO), payroll.calculateRewardsEarned(
                new BN(timeInSec),
                miner.stakedBalanceMM,
                miner.mergeMinerData.rewardsPerTokenPaid,
                miner.mergeMinerData.rewardsEarned,
            )))
        }

        // Secondary
        const secondaryRewards = secondaryPayrolls.map((secondaryPayroll) => {
            if (!secondaryPayroll) {
                return 0;
            }

            rewards = rewards.add(new TokenAmount(new Token(SBR_INFO), payroll.calculateRewardsEarned(
                new BN(timeInSec),
                secondaryPayroll.primaryMinerData.balance,
                secondaryPayroll.primaryMinerData.rewardsPerTokenPaid,
                secondaryPayroll.primaryMinerData.rewardsEarned,
            )))

            return (new TokenAmount(secondaryPayroll.rewardsToken, secondaryPayroll.payroll.calculateRewardsEarned(
                new BN(timeInSec),
                secondaryPayroll.replicaMinerData.balance,
                secondaryPayroll.replicaMinerData.rewardsPerTokenPaid,
                secondaryPayroll.replicaMinerData.rewardsEarned,
            ))).asNumber;
        })

        const reward = { primary: rewards.asNumber, secondary: secondaryRewards };

        if (!rewardsT0.primary) {
            setRewardsT0(reward);
            setTimeT0(timeInSec);
        } else {
            // Calculate millisecond precision
            const extraMs = time - timeInSec * 1000;

            // Calculate primary reward per millisecond
            const rewardPerMilliSec = timeInSec - timeT0 > 0 ? ((reward.primary - rewardsT0.primary) / (timeInSec - timeT0)) / 1000 : 0;

            // Calculate secondary reward per millisecond
            const secondaryRewardPerMilliSec = secondaryRewards
                .map((secondaryReward, i) => timeInSec - timeT0 > 0 ? ((secondaryReward - rewardsT0.secondary[i]) / (timeInSec - timeT0)) / 1000 : 0)

            // Add to reward
            return {
                primary: reward.primary + rewardPerMilliSec * extraMs,
                secondary: secondaryRewards.map((secondaryReward, i) => secondaryReward + secondaryRewardPerMilliSec[i] * extraMs)
            };
        }

        return reward;
    }, [miner?.data, secondaryPayrolls, timeT0]);

    const reset = () => {
        setRewardsT0({ primary: 0, secondary: [] });
        setTimeT0(0);
    };

    return { claimableRewards, reset };
}