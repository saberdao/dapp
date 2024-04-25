import { useEffect, useState } from 'react';
import { Token, TokenAmount, TokenInfo } from '@saberhq/token-utils';
import BN from 'bn.js';

import { SBR_INFO } from '@/src/utils/builtinTokens';
import { createQuarryPayroll } from '@/src/helpers/quarry';
import useQuarryMiner from '@/src/hooks/user/useQuarryMiner';

export default function useDailyRewards(lpToken: TokenInfo) {
    const { data: miner, refetch } = useQuarryMiner(lpToken, true);
    const [dailyRewards, setDailyRewards] = useState(0);

    useEffect(() => {
        if (!miner?.data) {
            return;
        }

        const timeInSecT0 = Math.floor(Date.now() / 1000);
        const payroll = createQuarryPayroll(miner.miner.quarry.quarryData);
        const rewardsT0 = new TokenAmount(
            new Token(SBR_INFO),
            payroll.calculateRewardsEarned(
                new BN(timeInSecT0),
                miner.data.balance,
                miner.data.rewardsPerTokenPaid,
                miner.data.rewardsEarned,
            ),
        );

        const timeInSecT1 = Math.floor(Date.now() / 1000) + 86400;
        const rewardsT1 = new TokenAmount(
            new Token(SBR_INFO),
            payroll.calculateRewardsEarned(
                new BN(timeInSecT1),
                miner.data.balance,
                miner.data.rewardsPerTokenPaid,
                miner.data.rewardsEarned,
            ),
        );

        setDailyRewards(
            ((rewardsT1.asNumber - rewardsT0.asNumber) / (timeInSecT1 - timeInSecT0)) * 86400,
        );
    }, [miner]);

    return { dailyRewards, refetch };
}
