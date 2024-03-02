import { Payroll, QuarryData } from '@quarryprotocol/quarry-sdk';

export const createQuarryPayroll = (quarryData: QuarryData) =>
    new Payroll(
        quarryData.famineTs,
        quarryData.lastUpdateTs,
        quarryData.annualRewardsRate,
        quarryData.rewardsPerTokenStored,
        quarryData.totalTokensDeposited,
    );