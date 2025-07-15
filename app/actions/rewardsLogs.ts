/// app\actions\rewardLogs.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

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

// Pagination interfaces
export interface Pagination {
    currentPage: number;
    itemsPerPage: number;
}

export interface PaginationOutput {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
}

export interface GetRewardsLogsOutput extends PaginationOutput {
    rewardsLogs: RewardLog[];
}

// 기존 함수 - 하위 호환성 유지
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
            cacheStrategy: getCacheStrategy("realtime"),
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

// 새로운 pagination 지원 함수
export async function getRewardsLogsPaginated(
    input?: GetRewardsLogsInput,
    pagination?: Pagination
): Promise<GetRewardsLogsOutput> {
    try {
        const currentPage = pagination?.currentPage || 1;
        const itemsPerPage = pagination?.itemsPerPage || 15;

        const where: Prisma.RewardsLogWhereInput = {};

        if (input?.playerId) {
            where.playerId = input.playerId;
        }

        if (input?.assetId) {
            where.assetId = input.assetId;
        }

        if (input?.questId) {
            where.questId = input.questId;
        }

        if (input?.pollId) {
            where.pollId = input.pollId;
        }

        if (input?.reason) {
            where.reason = input.reason;
        }

        if (input?.tweetAuthorId) {
            where.tweetAuthorId = input.tweetAuthorId;
        }

        if (input?.tweetIds) {
            where.tweetIds = {
                hasSome: input.tweetIds,
            };
        }

        const [rewardsLogs, totalItems] = await Promise.all([
            prisma.rewardsLog.findMany({
                cacheStrategy: getCacheStrategy("realtime"),
                where,
                include: {
                    asset: true,
                },
                skip: (currentPage - 1) * itemsPerPage,
                take: itemsPerPage,
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma.rewardsLog.count({
                cacheStrategy: getCacheStrategy("realtime"),
                where,
            }),
        ]);

        return {
            rewardsLogs: rewardsLogs as RewardLog[],
            totalItems,
            totalPages: Math.ceil(totalItems / itemsPerPage),
            currentPage,
            itemsPerPage,
        };
    } catch (error) {
        console.error("Failed to get rewards logs:", error);
        return {
            rewardsLogs: [],
            totalItems: 0,
            totalPages: 0,
            currentPage: 1,
            itemsPerPage: 15,
        };
    }
}
