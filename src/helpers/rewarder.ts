import { fetchNullableWithSessionCache } from "@saberhq/sail";
import { TokenInfo } from "@saberhq/token-utils";

export type ReplicaQuarryInfo = {
    displayRewardsToken: TokenInfo;
    quarry: string;
    rewarder: string;
    rewardsToken: {
      decimals: number;
      mint: string;
    };
    slug: string;
}

export type QuarryRewarderInfo = {
    index: number;
    isReplica: boolean;
    mergePool: string;
    primaryQuarries: string[];
    primaryToken: {
      decimals: number;
      mint: string
    };
    primaryTokenInfo: TokenInfo;
    quarry: string;
    replicaMint: string;
    replicaQuarries: ReplicaQuarryInfo[];
    slug: string;
    stakedToken: {
      decimals: number;
      mint: string;
    }
}

const cache: Record<string, QuarryRewarderInfo[]> = {}

export const getRewarder = async (network: string, rewarder: string) => {
    if (cache[`${network}|${rewarder}`]) {
        return cache[`${network}|${rewarder}`];
    }

    const rewarders = await fetchNullableWithSessionCache<{ quarries: QuarryRewarderInfo[] }>(
        `https://raw.githubusercontent.com/QuarryProtocol/rewarder-list-build/master/${network}/rewarders/${rewarder}/full.json`,
    );

    if (!rewarders) {
        throw Error('Could not find rewarders');
    }

    cache[`${network}|${rewarder}`] = rewarders.quarries;

    return cache[`${network}|${rewarder}`];
}