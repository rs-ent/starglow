/// app/actions/quests.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { Prisma, Quest, Asset, Player, QuestLog, User } from "@prisma/client";
import { updatePlayerAsset } from "./playerAssets";
import { tokenGate } from "./blockchain";
import { formatWaitTime } from "@/lib/utils/format";

export type PaginationInput = {
    currentPage: number;
    itemsPerPage: number;
    totalItems?: number;
    totalPages?: number;
};

export interface CreateQuestInput {
    title: string;
    description?: string;
    url?: string;
    icon?: string;
    imgUrl?: string;
    youtubeUrl?: string;
    rewardAssetId?: string;
    rewardAmount?: number;
    startDate?: Date;
    endDate?: Date;
    permanent?: boolean;
    repeatable?: boolean;
    repeatableCount?: number;
    repeatableInterval?: number;
    isActive?: boolean;
    order?: number;
    effects?: string;
    type?: string;
    artistId?: string;
    needToken?: boolean;
    needTokenAddress?: string;
}

export async function createQuest(input: CreateQuestInput) {
    const rewardAsset = await prisma.asset.findUnique({
        where: {
            id: input.rewardAssetId,
        },
    });

    if (!rewardAsset || !rewardAsset.isActive) {
        throw new Error("Reward asset not found");
    }

    const quest = await prisma.quest.create({
        data: {
            ...input,
            permanent: input.permanent || false,
            isActive: input.isActive || true,
            order: input.order || 0,
        },
    });

    return quest;
}

export interface GetQuestsInput {
    startDate?: Date;
    startDateIndicator?: "before" | "after" | "on";
    endDate?: Date;
    endDateIndicator?: "before" | "after" | "on";
    permanent?: boolean;
    isActive?: boolean;
    type?: string;
    rewardAssetId?: string;
    repeatable?: boolean;
    repeatableCount?: number;
    repeatableInterval?: number;
    artistId?: string;
    isPublic?: boolean;
}

export async function getQuests({
    input,
    pagination,
}: {
    input?: GetQuestsInput;
    pagination?: PaginationInput;
}): Promise<{
    items: Quest[];
    totalItems: number;
    totalPages: number;
}> {
    try {
        if (!pagination) {
            pagination = {
                currentPage: 1,
                itemsPerPage: Number.MAX_SAFE_INTEGER,
            };
        }

        if (!input) {
            const items = await prisma.quest.findMany({
                orderBy: {
                    order: "asc",
                },
                include: {
                    artist: true,
                    rewardAsset: true,
                },
                skip: (pagination.currentPage - 1) * pagination.itemsPerPage,
                take: pagination.itemsPerPage,
            });

            return {
                items,
                totalItems: items.length,
                totalPages: Math.ceil(items.length / pagination.itemsPerPage),
            };
        }

        const where: Prisma.QuestWhereInput = {};

        if (input.startDate && input.startDateIndicator) {
            if (input.startDateIndicator === "before") {
                where.startDate = {
                    lte: input.startDate,
                };
            } else if (input.startDateIndicator === "after") {
                where.startDate = {
                    gte: input.startDate,
                };
            } else if (input.startDateIndicator === "on") {
                where.startDate = {
                    equals: input.startDate,
                };
            }
        }

        if (input.endDate && input.endDateIndicator) {
            if (input.endDateIndicator === "before") {
                where.endDate = {
                    lte: input.endDate,
                };
            } else if (input.endDateIndicator === "after") {
                where.endDate = {
                    gte: input.endDate,
                };
            } else if (input.endDateIndicator === "on") {
                where.endDate = {
                    equals: input.endDate,
                };
            }
        }

        if (input.permanent) {
            where.permanent = input.permanent;
        }

        if (input.isActive) {
            where.isActive = input.isActive;
        }

        if (input.type) {
            where.type = input.type;
        }

        if (input.rewardAssetId) {
            where.rewardAssetId = input.rewardAssetId;
        }

        if (input.repeatable) {
            where.repeatable = input.repeatable;
        }

        if (input.repeatableCount) {
            where.repeatableCount = input.repeatableCount;
        }

        if (input.repeatableInterval) {
            where.repeatableInterval = input.repeatableInterval;
        }

        if (input.artistId) {
            where.artistId = input.artistId;
        }

        if (input.isPublic) {
            where.artistId = null;
            where.needToken = false;
            where.needTokenAddress = null;
        }

        const [items, totalItems] = await Promise.all([
            prisma.quest.findMany({
                where,
                orderBy: {
                    order: "asc",
                },
                skip: (pagination.currentPage - 1) * pagination.itemsPerPage,
                take: pagination.itemsPerPage,
                include: {
                    artist: true,
                    rewardAsset: true,
                },
            }),
            prisma.quest.count({ where }),
        ]);

        const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);

        return {
            items,
            totalItems,
            totalPages,
        };
    } catch (error) {
        console.error(error);
        return {
            items: [],
            totalItems: 0,
            totalPages: 0,
        };
    }
}

export interface GetQuestInput {
    id?: string;
    title?: string;
}

export async function getQuest(input?: GetQuestInput): Promise<Quest | null> {
    if (!input) {
        return null;
    }

    try {
        if (input.id) {
            return await prisma.quest.findUnique({
                where: { id: input.id },
            });
        }

        if (input.title) {
            return await prisma.quest.findFirst({
                where: { title: input.title },
            });
        }

        return null;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export interface UpdateQuestInput {
    id: string;
    title?: string;
    description?: string;
    url?: string;
    icon?: string;
    imgUrl?: string;
    youtubeUrl?: string;
    rewardAssetId?: string;
    rewardAmount?: number;
    startDate?: Date;
    endDate?: Date;
    permanent?: boolean;
    repeatable?: boolean;
    repeatableCount?: number;
    repeatableInterval?: number;
    isActive?: boolean;
    order?: number;
    effects?: string;
    type?: string;
    artistId?: string;
    needToken?: boolean;
    needTokenAddress?: string;
}

export async function updateQuest(
    input: UpdateQuestInput
): Promise<Quest | null> {
    try {
        const quest = await prisma.quest.update({
            where: { id: input.id },
            data: input,
        });

        return quest;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export interface DeleteQuestInput {
    id: string;
}

export async function deleteQuest(input: DeleteQuestInput): Promise<boolean> {
    try {
        await prisma.quest.delete({ where: { id: input.id } });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export interface TokenGatingInput {
    quest: Quest;
    user: User;
}

export interface TokenGatingResult {
    success: boolean;
    data?: {
        hasToken: boolean;
        tokenCount: number;
        ownerWallets: string[];
    };
    error?: string;
}

export async function tokenGating(
    input?: TokenGatingInput
): Promise<TokenGatingResult> {
    try {
        const { quest, user } = input || {};

        if (!quest || !user) {
            return {
                success: true,
                data: {
                    hasToken: false,
                    tokenCount: 0,
                    ownerWallets: [],
                },
            };
        }

        if (!quest.needToken || !quest.needTokenAddress) {
            return {
                success: true,
                data: {
                    hasToken: true,
                    tokenCount: 0,
                    ownerWallets: [],
                },
            };
        }

        const result = await tokenGate({
            userId: user.id,
            tokenType: "Collection",
            tokenAddress: quest.needTokenAddress,
        });

        if (!result.success) {
            return {
                success: false,
                error: result.error,
                data: result.data || {
                    hasToken: false,
                    tokenCount: 0,
                    ownerWallets: [],
                },
            };
        }

        return {
            success: true,
            data: result.data,
            error: result.error,
        };
    } catch (error) {
        console.error("Error in token gating:", error);
        return {
            success: false,
            error: "Failed to check token ownership",
        };
    }
}

export interface CompleteQuestInput {
    quest: Quest;
    player: Player;
    tokenGating?: TokenGatingResult;
}

export interface CompleteQuestResult {
    success: boolean;
    data?: QuestLog;
    error?: string;
}

export async function completeQuest(
    input: CompleteQuestInput
): Promise<CompleteQuestResult> {
    try {
        if (!input.quest || !input.player) {
            return {
                success: false,
                error: "Quest or player not found",
            };
        }

        if (input.quest.needToken && input.quest.needTokenAddress) {
            if (!input.tokenGating)
                return {
                    success: false,
                    error: "Token gating required. Please try again or contact technical support.",
                };
            if (
                !input.tokenGating.success ||
                !input.tokenGating.data?.hasToken
            ) {
                return {
                    success: false,
                    error: "Token gating failed. Please check your token balance. If the problem persists, please contact technical support.",
                };
            }
        }

        const log = await prisma.questLog.findUnique({
            where: {
                playerId_questId: {
                    playerId: input.player.id,
                    questId: input.quest.id,
                },
            },
        });

        if (log?.completed && log.completedAt) {
            return {
                success: false,
                error: `You have already completed this quest at ${log.completedAt.toLocaleString()}.`,
            };
        }

        if (log?.isClaimed && log.claimedAt) {
            return {
                success: false,
                error: `You have already claimed the reward for this quest at ${log.claimedAt?.toLocaleString()}.`,
            };
        }

        if (
            input.quest.repeatable &&
            input.quest.repeatableCount &&
            input.quest.repeatableCount > 1
        ) {
            if (
                log?.repeatCount &&
                log.repeatCount >= input.quest.repeatableCount
            ) {
                return {
                    success: false,
                    error: `You have already completed this quest ${input.quest.repeatableCount} times.`,
                };
            }

            if (input.quest.repeatableInterval) {
                const lastCompletedAt =
                    log?.completedDates && log.completedDates.length > 0
                        ? Math.max(
                              ...log.completedDates.map((date) =>
                                  new Date(date).getTime()
                              )
                          )
                        : 0;
                const now = Date.now();
                if (now - lastCompletedAt < input.quest.repeatableInterval) {
                    const waitSeconds = Math.ceil(
                        (input.quest.repeatableInterval -
                            (now - lastCompletedAt)) /
                            1000
                    );
                    return {
                        success: false,
                        error: `You can complete this quest again ${formatWaitTime(
                            waitSeconds
                        )} seconds after the last completion.`,
                    };
                }
            }
        }

        const data: {
            questId: string;
            playerId: string;
            completed: boolean;
            completedAt: Date | null;
            rewardAssetId?: string;
            rewardAmount?: number;
            repeatCount: number;
            isClaimed: boolean;
            completedDates: Date[];
        } = {
            questId: input.quest.id,
            playerId: input.player.id,
            completed: false,
            completedAt: null,
            rewardAssetId: input.quest.rewardAssetId || undefined,
            rewardAmount: input.quest.rewardAmount || undefined,
            repeatCount: log?.repeatCount ? log.repeatCount + 1 : 1,
            isClaimed: false,
            completedDates: log?.completedDates ? [...log.completedDates] : [],
        };

        data.completedDates.push(new Date());

        if (
            !input.quest.repeatable ||
            !input.quest.repeatableCount ||
            (input.quest.repeatableCount && input.quest.repeatableCount <= 1)
        ) {
            data.completed = true;
            data.completedAt = new Date();
        } else if (
            input.quest.repeatableCount &&
            data.repeatCount >= input.quest.repeatableCount
        ) {
            data.completed = true;
            data.completedAt = new Date();
        }

        if (!input.quest.rewardAssetId) {
            data.isClaimed = true;
        }

        const questLog = await prisma.questLog.upsert({
            where: {
                playerId_questId: {
                    playerId: input.player.id,
                    questId: input.quest.id,
                },
            },
            update: data,
            create: data,
        });

        return {
            success: true,
            data: questLog,
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            error: "Failed to complete quest",
        };
    }
}

export interface ClaimQuestRewardInput {
    questLog: QuestLog;
    player: Player;
}

export interface ClaimQuestRewardResult {
    success: boolean;
    data?: QuestLog;
    error?: string;
}

export async function claimQuestReward(
    input: ClaimQuestRewardInput
): Promise<ClaimQuestRewardResult> {
    try {
        if (input.questLog.isClaimed) {
            return {
                success: false,
                error: "Quest reward already claimed",
            };
        }

        if (!input.questLog.rewardAssetId || !input.questLog.rewardAmount) {
            return {
                success: false,
                error: "Quest reward not found",
            };
        }

        const updateResult = await updatePlayerAsset({
            transaction: {
                playerId: input.player.id,
                assetId: input.questLog.rewardAssetId,
                amount: input.questLog.rewardAmount,
                operation: "ADD",
                reason: "Quest Reward",
                questId: input.questLog.questId,
                questLogId: input.questLog.id,
            },
        });
        if (!updateResult.success) {
            return {
                success: false,
                error: `Failed to give participation reward: ${updateResult.error}`,
            };
        }

        const updatedQuestLog = await prisma.questLog.update({
            where: { id: input.questLog.id },
            data: {
                isClaimed: true,
                claimedAt: new Date(),
            },
        });

        return {
            success: true,
            data: updatedQuestLog,
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            error: "Failed to claim quest reward",
        };
    }
}

export interface GetQuestLogsInput {
    questId?: string;
    artistId?: string;
    playerId?: string;
    isClaimed?: boolean;
    isPublic?: boolean;
}

export async function getQuestLogs({
    input,
    pagination,
}: {
    input?: GetQuestLogsInput;
    pagination?: PaginationInput;
}): Promise<{
    items: QuestLog[];
    totalItems: number;
    totalPages: number;
}> {
    try {
        if (!pagination) {
            pagination = {
                currentPage: 1,
                itemsPerPage: Number.MAX_SAFE_INTEGER,
            };
        }

        if (!input) {
            const questLogs = await prisma.questLog.findMany({
                orderBy: {
                    completedAt: "desc",
                },
                skip: (pagination.currentPage - 1) * pagination.itemsPerPage,
                take: pagination.itemsPerPage,
            });

            return {
                items: questLogs,
                totalItems: questLogs.length,
                totalPages: Math.ceil(
                    questLogs.length / pagination.itemsPerPage
                ),
            };
        }

        const where: Prisma.QuestLogWhereInput = {};

        if (input.questId) {
            where.questId = input.questId;
        }

        if (input.playerId) {
            where.playerId = input.playerId;
        }

        if (input.isClaimed !== undefined) {
            where.isClaimed = input.isClaimed;
        }

        if (input.artistId) {
            where.quest = {
                artistId: input.artistId,
            };
        }

        if (input.isPublic) {
            where.quest = {
                artistId: null,
                needToken: false,
                needTokenAddress: null,
            };
        }

        const questLogs = await prisma.questLog.findMany({
            where,
            orderBy: {
                completedAt: "desc",
            },
            skip: (pagination.currentPage - 1) * pagination.itemsPerPage,
            take: pagination.itemsPerPage,
        });

        return {
            items: questLogs,
            totalItems: questLogs.length,
            totalPages: Math.ceil(questLogs.length / pagination.itemsPerPage),
        };
    } catch (error) {
        console.error(error);
        return {
            items: [],
            totalItems: 0,
            totalPages: 0,
        };
    }
}

export interface GetClaimableQuestLogsInput {
    playerId: string;
    artistId?: string;
}

export async function getClaimableQuestLogs(
    input?: GetClaimableQuestLogsInput
): Promise<QuestLog[]> {
    try {
        if (!input) {
            return [];
        }

        const where: Prisma.QuestLogWhereInput = {
            playerId: input.playerId,
            isClaimed: false,
        };

        if (input.artistId) {
            where.quest = {
                artistId: input.artistId,
            };
        }

        const questLogs = await prisma.questLog.findMany({
            where: {
                playerId: input.playerId,
                isClaimed: false,
            },
        });

        return questLogs;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export interface GetClaimedQuestLogsInput {
    playerId: string;
    artistId?: string;
}

export async function getClaimedQuestLogs(
    input?: GetClaimedQuestLogsInput
): Promise<QuestLog[]> {
    try {
        if (!input) {
            return [];
        }

        const where: Prisma.QuestLogWhereInput = {
            playerId: input.playerId,
            isClaimed: true,
        };

        if (input.artistId) {
            where.quest = {
                artistId: input.artistId,
            };
        }

        const questLogs = await prisma.questLog.findMany({
            where: {
                playerId: input.playerId,
                isClaimed: true,
            },
        });

        return questLogs;
    } catch (error) {
        console.error(error);
        return [];
    }
}
