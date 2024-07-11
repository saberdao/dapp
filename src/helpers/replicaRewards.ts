import { findMergeMinerAddress, QUARRY_ADDRESSES, QuarrySDK } from "@quarryprotocol/quarry-sdk";
import { isPublicKey } from "@saberhq/solana-contrib";
import { PublicKey } from "@solana/web3.js";
import { ReplicaQuarryInfo } from "./rewarder";
import { Token, TokenInfo } from "@saberhq/token-utils";
import { createQuarryPayroll } from "./quarry";

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

    const replicaQuarry = await replicaRewarder.getQuarry(new Token({
        ...replicaQuarryInfo.rewardsToken,
        symbol: 'R',
        chainId: 103,
        address: findReplicaMintAddress({ primaryMint: new PublicKey(lpToken.address) }).toString(),
        name: 'Reward token'
    }));
    const replicaMiner = await replicaQuarry.getMinerActions(mmAddress);
    const replicaMinerData = await replicaMiner.fetchData()

    const payroll = createQuarryPayroll(replicaMiner.quarry.quarryData);

    return { payroll, replicaMinerData };
}