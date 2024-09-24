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

export type RewarderInfo = {
    quarries: QuarryRewarderInfo[];
    info: {
      redeemer?: {
        redeemerKey: string;
        underlyingToken: string;
      }
    }
}

const cache: Record<string, RewarderInfo> = {}

export const getRewarder = async (network: string, rewarder: string) => {
    if (cache[`${network}|${rewarder}`]) {
        return cache[`${network}|${rewarder}`];
    }

    const rewarders = await fetchNullableWithSessionCache<RewarderInfo>(
        `https://raw.githubusercontent.com/QuarryProtocol/rewarder-list-build/master/${network}/rewarders/${rewarder}/full.json`,
    );

    if (!rewarders) {
        throw Error('Could not find rewarders');
    }

    cache[`${network}|${rewarder}`] = rewarders;

    return cache[`${network}|${rewarder}`];
}