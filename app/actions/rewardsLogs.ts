/// app\actions\rewardLogs.ts

"use server";

import { prisma } from "@/lib/prisma/client";

import type {
    Prisma,
    RewardsLog,
    Quest,
    Poll,
    PollLog,
    Asset,
} from "@prisma/client";

export type RewardLog = RewardsLog & {
    quest?: Quest | null;
    poll?: Poll | null;
    pollLog?: PollLog | null;
    asset?: Asset | null;
};

export interface GetRewardsLogsInput {
    playerId?: string;
    assetId?: string;
    questId?: string;
    pollId?: string;
    reason?: string;
    tweetAuthorId?: string;
    tweetIds?: string[];
}

export async function getRewardsLogs({
    input,
}: {
    input?: GetRewardsLogsInput;
}): Promise<RewardLog[]> {
    if (!input) {
        return [];
    }

    try {
        const where: Prisma.RewardsLogWhereInput = {
            playerId: input.playerId,
        };

        if (input.assetId) {
            where.assetId = input.assetId;
        }

        if (input.questId) {
            where.questId = input.questId;
        }

        if (input.pollId) {
            where.pollId = input.pollId;
        }

        if (input.reason) {
            where.reason = input.reason;
        }

        if (input.tweetAuthorId) {
            where.tweetAuthorId = input.tweetAuthorId;
        }

        if (input.tweetIds) {
            where.tweetIds = {
                hasSome: input.tweetIds,
            };
        }

        const result = await prisma.rewardsLog.findMany({
            where,
            include: {
                asset: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return result;
    } catch (error) {
        console.error(error);
        return [];
    }
}
