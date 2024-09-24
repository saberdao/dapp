import { findMergeMinerAddress, QUARRY_ADDRESSES, QuarrySDK } from "@quarryprotocol/quarry-sdk";
import { isPublicKey } from "@saberhq/solana-contrib";
import { PublicKey } from "@solana/web3.js";
import { ReplicaQuarryInfo } from "./rewarder";
import { Token, TokenInfo } from "@saberhq/token-utils";
import { createQuarryPayroll } from "./quarry";
import { SBR_MINT, SBR_REWARDER } from "@saberhq/saber-periphery";
import BN from "bn.js";

const findPDASync = (
    seeds: (string | Uint8Array | Buffer | PublicKey)[],
    programId: PublicKey,
): PublicKey => {
    const [addr] = PublicKey.findProgramAddressSync(
        seeds.map((seed) => {
            if (typeof seed === 'string') {
                return Buffer.from(seed, 'utf-8');
            } else if (isPublicKey(seed)) {
                return seed.toBytes();
            } else {
                return seed;
            }
        }),
        programId,
    );
    return addr;
};

export const findMergePoolAddress = ({
    programId = QUARRY_ADDRESSES.MergeMine,
    primaryMint,
}: {
    programId?: PublicKey;
    primaryMint: PublicKey;
}): PublicKey => {
    return findPDASync(['MergePool', primaryMint], programId);
};

const findReplicaMintAddress = ({
    programId = QUARRY_ADDRESSES.MergeMine,
    primaryMint,
}: {
    programId?: PublicKey;
    primaryMint: PublicKey;
}): PublicKey => {
    const pool = findMergePoolAddress({ programId, primaryMint });
    return findPDASync(['ReplicaMint', pool], programId);
};

export const getReplicaRewards = async (quarry: QuarrySDK, lpToken: TokenInfo, replicaQuarryInfo: ReplicaQuarryInfo, wallet: PublicKey) => {
    const replicaRewarder = await quarry.mine.loadRewarderWrapper(new PublicKey(replicaQuarryInfo.rewarder));
    const mergePool = findMergePoolAddress({
        primaryMint: new PublicKey(lpToken.address),
    });
    const [mmAddress] = await findMergeMinerAddress({
        pool: mergePool,
        owner: wallet,
    })

    const rewardsToken = new Token({
        ...replicaQuarryInfo.rewardsToken,
        symbol: 'R',
        chainId: 103,
        address: findReplicaMintAddress({ primaryMint: new PublicKey(lpToken.address) }).toString(),
        name: 'Reward token'
    });
    const replicaQuarry = await replicaRewarder.getQuarry(rewardsToken);
    const replicaMiner = await replicaQuarry.getMinerActions(mmAddress);
    const replicaMinerData = await replicaMiner.fetchData()

    const annualRewardsRate = replicaMiner.quarry.computeAnnualRewardsRate()
    if (annualRewardsRate.eq(new BN(0))) {
        return undefined;
    }

    const payroll = createQuarryPayroll(replicaMiner.quarry.quarryData);

    // Get the miner data of the primary for this mergeminer
    const primaryRewarder = await quarry.mine.loadRewarderWrapper(SBR_REWARDER);
    const primaryQuarry = await primaryRewarder.getQuarry(new Token({
        decimals: lpToken.decimals,
        symbol: lpToken.symbol,
        chainId: 103,
        address: lpToken.address,
        name: lpToken.name
    }));
    const primaryMiner = await primaryQuarry.getMinerActions(mmAddress);
    const primaryMinerData = await primaryMiner.fetchData()

    return { payroll, replicaMinerData, primaryMinerData, rewardsToken };
}