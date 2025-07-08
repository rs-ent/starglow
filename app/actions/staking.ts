/// app/actions/staking.ts

"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma/client";

import { lockTokens, unlockTokens } from "./collectionContracts";
import { batchUpdatePlayerAsset } from "@/app/actions/playerAssets/actions";

import type {
    Prisma,
    Asset,
    StakeReward,
    NFT,
    StakeRewardLog,
    CollectionContract,
    Player,
} from "@prisma/client";

export interface StakeInput {
    userId: string;
    collectionAddress: string;
    tokenIds: number[];
    unStakeScheduledAt?: Date;
    isAdmin?: boolean;
}

export interface StakeResult {
    success: boolean;
    message?: string;
    transactionHash?: string;
}

export async function stake(input: StakeInput): Promise<StakeResult> {
    const { userId, collectionAddress, tokenIds, unStakeScheduledAt } = input;

    if (!userId || !collectionAddress || !tokenIds || tokenIds.length === 0) {
        return { success: false, message: "Invalid input parameters." };
    }

    try {
        const lockResult = await lockTokens({
            userId,
            collectionAddress,
            tokenIds,
            unlockScheduledAt: unStakeScheduledAt
                ? Math.floor(unStakeScheduledAt.getTime() / 1000)
                : 0,
            isStaking: true,
            isAdmin: input.isAdmin,
        });

        if (!lockResult.success) {
            return { success: false, message: lockResult.error };
        }

        revalidatePath(`/user/${userId}`);

        return {
            success: true,
            message: "Stake set successfully.",
            transactionHash: lockResult.transactionHash,
        };
    } catch (error) {
        console.error("Error staking:", error);
        return { success: false, message: "Error setting stake." };
    }
}

export interface UnstakeInput {
    userId: string;
    collectionAddress: string;
    tokenIds: number[];
    unClaimedStakeRewardLogs?: StakeRewardLog[];
    isAdmin?: boolean;
}

export interface UnstakeResult {
    success: boolean;
    message?: string;
    transactionHash?: string;
}

export async function unstake(input: UnstakeInput): Promise<UnstakeResult> {
    const {
        userId,
        collectionAddress,
        tokenIds,
        unClaimedStakeRewardLogs,
        isAdmin,
    } = input;

    if (!userId || !collectionAddress || !tokenIds || tokenIds.length === 0) {
        return { success: false, message: "Invalid input parameters." };
    }

    try {
        const unlockResult = await unlockTokens({
            userId,
            collectionAddress,
            tokenIds,
            isUnstaking: true,
            isAdmin,
        });

        if (!unlockResult.success) {
            return { success: false, message: unlockResult.error };
        }

        if (unClaimedStakeRewardLogs && unClaimedStakeRewardLogs.length > 0) {
            await prisma.stakeRewardLog.updateMany({
                where: {
                    id: { in: unClaimedStakeRewardLogs.map((log) => log.id) },
                },
                data: { isDistributed: false },
            });
        }

        revalidatePath(`/user/${userId}`);

        return {
            success: true,
            message: "Unstake set successfully.",
            transactionHash: unlockResult.transactionHash,
        };
    } catch (error) {
        console.error("Error unstaking:", error);
        return { success: false, message: "Error unstaking." };
    }
}

export interface GetUserStakingTokensInput {
    userId: string;
}

export type StakingToken = NFT & {
    stakeRewardLogs: StakeRewardLog[];
};

export async function getUserStakingTokens(
    input?: GetUserStakingTokensInput
): Promise<StakingToken[]> {
    if (!input || !input?.userId) {
        return [];
    }

    try {
        const wallets = await prisma.wallet.findMany({
            where: {
                userId: input.userId,
            },
            select: {
                address: true,
            },
        });

        const tokens = await prisma.nFT.findMany({
            where: {
                currentOwnerAddress: {
                    in: wallets.map((w: any) => w.address),
                },
                isStaked: true,
            },
            include: {
                stakeRewardLogs: true,
            },
        });
        return tokens;
    } catch (error) {
        console.error("Error getting user staking tokens:", error);
        return [];
    }
}

export interface CreateStakeRewardInput {
    asset: Asset;
    amount: number;
    stakeDuration: bigint;
    collectionAddress: string;
}

export async function createStakeReward(
    input: CreateStakeRewardInput
): Promise<StakeReward | null> {
    const { asset, amount, stakeDuration, collectionAddress } = input;

    if (!asset || !amount || !stakeDuration) {
        console.error("Invalid input parameters.");
        return null;
    }

    try {
        const stakeReward = await prisma.stakeReward.create({
            data: {
                assetId: asset.id,
                amount,
                stakeDuration,
                collectionAddress,
            },
        });

        return stakeReward;
    } catch (error) {
        console.error("Error creating stake reward:", error);
        return null;
    }
}

export interface GetStakeRewardInput {
    assetId?: string;
    amount?: number;
    stakeDuration?: bigint;
    stakeDurationIndicator?: "lte" | "gte" | "equal";
    collectionAddress?: string;
}

type StakeRewardWithAsset = StakeReward & {
    asset: Asset;
    collection: CollectionContract;
};

export async function getStakeRewards(
    input?: GetStakeRewardInput
): Promise<StakeRewardWithAsset[]> {
    try {
        const where: Prisma.StakeRewardWhereInput = {};

        if (input?.assetId) {
            where.assetId = input.assetId;
        }

        if (input?.amount) {
            where.amount = {
                equals: input.amount,
            };
        }

        if (input?.collectionAddress) {
            where.collectionAddress = input.collectionAddress;
        }

        if (input?.stakeDuration) {
            if (input.stakeDurationIndicator === "lte") {
                where.stakeDuration = {
                    lte: input.stakeDuration,
                };
            } else if (input.stakeDurationIndicator === "gte") {
                where.stakeDuration = {
                    gte: input.stakeDuration,
                };
            } else {
                where.stakeDuration = input.stakeDuration;
            }
        }

        const stakeRewards = (await prisma.stakeReward.findMany({
            where,
            orderBy: {
                stakeDuration: "asc",
            },
            include: {
                asset: true,
                collection: true,
            },
        })) as StakeRewardWithAsset[];

        return stakeRewards;
    } catch (error) {
        console.error("Error getting stake rewards:", error);
        return [];
    }
}

export interface UpdateStakeRewardInput {
    stakeRewardId: string;
    assetId?: string;
    amount?: number;
    stakeDuration?: bigint;
    collectionAddress?: string;
}

export async function updateStakeReward(
    input: UpdateStakeRewardInput
): Promise<StakeReward | null> {
    try {
        const stakeReward = await prisma.stakeReward.update({
            where: { id: input.stakeRewardId },
            data: {
                assetId: input.assetId,
                amount: input.amount,
                stakeDuration: input.stakeDuration,
                collectionAddress: input.collectionAddress,
            },
        });

        return stakeReward;
    } catch (error) {
        console.error("Error updating stake reward:", error);
        return null;
    }
}

export interface DeleteStakeRewardInput {
    stakeRewardId: string;
}

export async function deleteStakeReward(
    input: DeleteStakeRewardInput
): Promise<boolean> {
    try {
        await prisma.stakeReward.delete({
            where: { id: input.stakeRewardId },
        });
        return true;
    } catch (error) {
        console.error("Error deleting stake reward:", error);
        return false;
    }
}

export interface GetUserStakeRewardLogsInput {
    userId: string | null;
    isDistributed?: boolean;
    isClaimed?: boolean;
}

export async function getUserStakeRewardLogs(
    input?: GetUserStakeRewardLogsInput
): Promise<StakeRewardLog[]> {
    if (!input || !input?.userId) {
        return [];
    }

    try {
        const wallets = await prisma.wallet.findMany({
            where: {
                userId: input.userId,
            },
            select: {
                address: true,
            },
        });

        const tokens = await prisma.nFT.findMany({
            where: {
                currentOwnerAddress: {
                    in: wallets.map((w: any) => w.address),
                },
            },
            select: {
                id: true,
            },
        });

        const where: Prisma.StakeRewardLogWhereInput = {};
        where.nftId = { in: tokens.map((t: any) => t.id) };

        if (input?.isDistributed) {
            where.isDistributed = input.isDistributed;
        }

        if (input?.isClaimed) {
            where.isClaimed = input.isClaimed;
        }

        const stakeRewardLogs = await prisma.stakeRewardLog.findMany({
            where,
        });

        return stakeRewardLogs;
    } catch (error) {
        console.error("Error getting user stake reward logs:", error);
        return [];
    }
}

export interface FindRewardableStakeTokensResult {
    token: NFT;
    reward: StakeReward;
}

export async function findRewardableStakeTokens(): Promise<
    FindRewardableStakeTokensResult[]
> {
    try {
        const collections = await prisma.collectionContract.findMany({
            select: { id: true, address: true },
        });
        if (!collections.length) return [];

        const stakeRewards = await prisma.stakeReward.findMany({
            where: {
                collectionAddress: {
                    in: collections.map((c: any) => c.address),
                },
            },
        });
        if (!stakeRewards.length) return [];

        const now = new Date().getTime();
        const results: FindRewardableStakeTokensResult[] = [];
        const logsToCreate: Prisma.StakeRewardLogCreateManyInput[] = [];

        for (const stakeReward of stakeRewards) {
            const collection = collections.find(
                (c: any) => c.address === stakeReward.collectionAddress
            );
            if (!collection) continue;

            const eligibleTokens = await prisma.nFT.findMany({
                where: {
                    collectionId: collection.id,
                    isStaked: true,
                    stakedAt: { not: null },
                    stakeRewardLogs: {
                        none: { stakeRewardId: stakeReward.id },
                    },
                },
                include: { stakeRewardLogs: true },
            });

            for (const token of eligibleTokens) {
                if (
                    token.stakedAt &&
                    BigInt(now - token.stakedAt.getTime()) >=
                        stakeReward.stakeDuration
                ) {
                    results.push({
                        token: token as NFT,
                        reward: stakeReward,
                    });
                    logsToCreate.push({
                        stakeRewardId: stakeReward.id,
                        nftId: token.id,
                        assetId: stakeReward.assetId,
                        amount: stakeReward.amount,
                        isDistributed: true,
                        distributedAt: new Date(),
                    });
                }
            }
        }

        if (logsToCreate.length > 0) {
            await prisma.stakeRewardLog.createMany({
                data: logsToCreate,
                skipDuplicates: true,
            });
        }

        revalidatePath("/user");

        return results;
    } catch (error) {
        console.error("Error finding rewardable stake:", error);
        return [];
    }
}

export interface ClaimStakeRewardInput {
    player: Player;
    stakeRewardLogs: StakeRewardLog[];
}

export interface ClaimStakeRewardResult {
    rewardedAssets: {
        asset: Asset | null;
        amount: number;
    }[];
    totalRewardAmount: number;
    error?: string;
}

export async function claimStakeReward(
    input: ClaimStakeRewardInput
): Promise<ClaimStakeRewardResult> {
    const { player, stakeRewardLogs } = input;

    if (!player || !stakeRewardLogs || stakeRewardLogs.length === 0) {
        return {
            rewardedAssets: [],
            totalRewardAmount: 0,
            error: "Invalid input parameters",
        };
    }

    try {
        const invalidLogs = stakeRewardLogs.filter(
            (log) => log.isClaimed || !log.isDistributed
        );

        if (invalidLogs.length > 0) {
            console.error(
                `Invalid stake reward logs: ${invalidLogs
                    .map((l) => l.id)
                    .join(", ")}`
            );
            return {
                rewardedAssets: [],
                totalRewardAmount: 0,
                error: "Invalid stake reward logs",
            };
        }

        const assetMap = new Map<string, number>();
        for (const log of stakeRewardLogs) {
            if (!assetMap.has(log.assetId)) {
                assetMap.set(log.assetId, 0);
            }
            assetMap.set(log.assetId, assetMap.get(log.assetId)! + log.amount);
        }

        const txs = Array.from(assetMap.entries()).map(([assetId, amount]) => ({
            playerId: player.id,
            assetId,
            amount,
            operation: "ADD" as const,
            reason: "STAKE_REWARD",
        }));

        await batchUpdatePlayerAsset({ txs });

        await prisma.stakeRewardLog.updateMany({
            where: { id: { in: stakeRewardLogs.map((l) => l.id) } },
            data: { isClaimed: true, claimedAt: new Date() },
        });

        revalidatePath(`/user/${player.userId}`);

        const assets = await prisma.asset.findMany({
            where: { id: { in: txs.map(({ assetId }) => assetId) } },
        });

        return {
            rewardedAssets: txs.map(({ assetId, amount }) => ({
                asset: assets.find((a) => a.id === assetId) ?? null,
                amount,
            })),
            totalRewardAmount: txs.reduce((sum, tx) => sum + tx.amount, 0),
        };
    } catch (error) {
        console.error("Error claiming reward:", error);
        return {
            rewardedAssets: [],
            totalRewardAmount: 0,
            error: "Error claiming reward",
        };
    }
}
