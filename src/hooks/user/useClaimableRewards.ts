import { useState } from 'react';
import { Token, TokenAmount, TokenInfo } from '@saberhq/token-utils';
import BN from 'bn.js';

import useQuarryMiner from '@/src/hooks/user/useQuarryMiner';
import { createQuarryPayroll } from '@/src/helpers/quarry';
import { SBR_INFO } from '@/src/utils/builtinTokens';

export default function useClaim(lpToken: TokenInfo) {
    const { data: miner } = useQuarryMiner(lpToken, true);
    const [rewardsT0, setRewardsT0] = useState(0);
    const [timeT0, setTimeT0] = useState(0);

    const claimableRewards = () => {
        if (!miner?.data) {
            return null;
        }

        const time = Date.now();

        const timeInSec = Math.floor(time / 1000);
        const payroll = createQuarryPayroll(miner.miner.quarry.quarryData);
        const rewards = new TokenAmount(
            new Token(SBR_INFO),
            payroll.calculateRewardsEarned(
                new BN(timeInSec),
                miner.data.balance,
                miner.data.rewardsPerTokenPaid,
                miner.data.rewardsEarned,
            ),
        );

        const reward = rewards.asNumber;

        if (!rewardsT0) {
            setRewardsT0(reward);
            setTimeT0(timeInSec);
        } else {
            // Calculate millisecond precision
            const extraMs = time - timeInSec * 1000;

            // Calculate reward per millisecond
            const rewardPerMilliSec = (reward - rewardsT0) / (timeInSec - timeT0) / 1000;

            // Add to reward
            return reward + rewardPerMilliSec * extraMs;
        }

        return reward;
    };

    const reset = () => {
        setRewardsT0(0);
        setTimeT0(0);
    };

    return { claimableRewards, reset };
}
