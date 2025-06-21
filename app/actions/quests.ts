/// app/actions/quests.ts

"use server";

import {
    QuestType,
    ReferralLog,
    User,
} from "@prisma/client";

import { tokenGating } from "@/app/story/nft/actions";
import { prisma } from "@/lib/prisma/client";
import { formatWaitTime } from "@/lib/utils/format";

import { updatePlayerAsset } from "./playerAssets";

import type { TokenGatingData } from "@/app/story/nft/actions";
import type {
    Artist,
    Asset,
    Player,
    Prisma,
    Quest,
    QuestLog} from "@prisma/client";

export type PaginationInput = {
    currentPage: number;
    itemsPerPage: number;
    totalItems?: number;
    totalPages?: number;
};

export interface CreateQuestInput {
    title: string;
    questType: QuestType;
    description?: string | null;
    url?: string | null;
    icon?: string | null;
    imgUrl?: string | null;
    youtubeUrl?: string | null;
    rewardAssetId?: string | null;
    rewardAmount?: number | null;
    startDate?: Date | null;
    endDate?: Date | null;
    permanent?: boolean;
    repeatable?: boolean;
    repeatableCount?: number | null;
    repeatableInterval?: number | null;
    isActive?: boolean;
    order?: number | null;
    effects?: string | null;
    type?: string | null;
    artistId?: string | null;
    needToken?: boolean;
    needTokenAddress?: string | null;
    isReferral?: boolean;
    referralCount?: number | null;
}

export async function createQuest(input: CreateQuestInput) {
    if (input.rewardAssetId) {
        const rewardAsset = await prisma.asset.findUnique({
            where: { id: input.rewardAssetId },
        });
        if (!rewardAsset || !rewardAsset.isActive) {
            throw new Error("Reward asset not found");
        }
    }

    // REFERRAL 타입 퀘스트 검증
    if (input.questType === QuestType.REFERRAL) {
        if (!input.referralCount || input.referralCount < 1) {
            throw new Error(
                "Referral quest must have referralCount of at least 1"
            );
        }
        // isReferral을 자동으로 true로 설정
        input.isReferral = true;
    }

    const { rewardAssetId, artistId, ...rest } = input;

    const quest = await prisma.quest.create({
        data: {
            ...rest,
            rewardAssetId: rewardAssetId || null,
            artistId: artistId || null,
            permanent: input.permanent ?? false,
            isActive: input.isActive ?? true,
            order: input.order ?? 0,
            isReferral: input.isReferral ?? false,
            referralCount: input.referralCount || null,
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
    artistId?: string | null;
    isPublic?: boolean;
    needToken?: boolean;
    needTokenAddress?: string | null;
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

        if (input.permanent !== undefined) {
            where.permanent = input.permanent;
        }

        if (input.isActive !== undefined) {
            where.isActive = input.isActive;
        }

        if (input.type) {
            where.type = input.type;
        }

        if (input.rewardAssetId) {
            where.rewardAssetId = input.rewardAssetId;
        }

        if (input.repeatable !== undefined) {
            where.repeatable = input.repeatable;
        }

        if (input.repeatableCount) {
            where.repeatableCount = input.repeatableCount;
        }

        if (input.repeatableInterval) {
            where.repeatableInterval = input.repeatableInterval;
        }

        // isPublic 조건을 먼저 처리하여 조건 충돌 방지
        if (input.isPublic) {
            where.artistId = null;
            where.needToken = false;
            where.needTokenAddress = null;
        } else if (input.artistId) {
            where.artistId = input.artistId;
        }

        // Promise.all로 병렬 처리하여 성능 향상
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

        let filteredItems = items;
        if (input.startDate !== undefined && input.endDate !== undefined) {
            filteredItems = filteredItems.filter((quest) => {
                if (quest.startDate && quest.endDate) {
                    return (
                        quest.startDate >= input.startDate! &&
                        quest.endDate <= input.endDate!
                    );
                }
                if (quest.permanent) return true;
                return true;
            });
        }

        const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);

        return {
            items: filteredItems,
            totalItems,
            totalPages,
        };
    } catch (error) {
        console.error("Error in getQuests:", error);
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
    questType?: QuestType;
    title?: string;
    description?: string | null;
    url?: string | null;
    icon?: string | null;
    imgUrl?: string | null;
    youtubeUrl?: string | null;
    rewardAssetId?: string | null;
    rewardAsset?: Asset | null;
    rewardAmount?: number | null;
    startDate?: Date | null;
    endDate?: Date | null;
    permanent?: boolean;
    repeatable?: boolean;
    repeatableCount?: number | null;
    repeatableInterval?: number | null;
    isActive?: boolean;
    order?: number | null;
    effects?: string | null;
    type?: string | null;
    artistId?: string | null;
    artist?: Artist | null;
    needToken?: boolean;
    needTokenAddress?: string | null;
    isReferral?: boolean;
    referralCount?: number | null;
}

export async function updateQuest(
    input: UpdateQuestInput
): Promise<Quest | null> {
    try {
        if (input.rewardAssetId) {
            const rewardAsset = await prisma.asset.findUnique({
                where: { id: input.rewardAssetId },
            });
            if (!rewardAsset || !rewardAsset.isActive) {
                throw new Error("Reward asset not found");
            }
        }

        // REFERRAL 타입 퀘스트 검증
        if (input.questType === QuestType.REFERRAL) {
            if (
                input.referralCount !== undefined &&
                input.referralCount !== null &&
                input.referralCount < 1
            ) {
                throw new Error(
                    "Referral quest must have referralCount of at least 1"
                );
            }
            // isReferral을 자동으로 true로 설정
            input.isReferral = true;
        }

        const { id, rewardAssetId, artistId, rewardAsset, artist, ...rest } =
            input;

        const quest = await prisma.quest.update({
            where: { id },
            data: {
                ...rest,
                rewardAssetId:
                    rewardAssetId === null || rewardAssetId === ""
                        ? null
                        : rewardAssetId || undefined,
                artistId:
                    artistId === null || artistId === ""
                        ? null
                        : artistId || undefined,
                permanent: input.permanent ?? false,
                isActive: input.isActive ?? true,
                order: input.order ?? 0,
                isReferral:
                    input.isReferral !== undefined
                        ? input.isReferral
                        : undefined,
                referralCount:
                    input.referralCount !== undefined
                        ? input.referralCount
                        : undefined,
            },
        });

        return quest;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export interface UpdateQuestOrderInput {
    quests: {
        id: string;
        order: number;
    }[];
}

export interface UpdateQuestOrderResult {
    data?: {
        id: string;
        order: number;
    }[];
    error?: string;
}

export async function updateQuestOrder(
    input: UpdateQuestOrderInput
): Promise<UpdateQuestOrderResult> {
    try {
        await prisma.$transaction(
            input.quests.map((quest) =>
                prisma.quest.update({
                    where: { id: quest.id },
                    data: { order: quest.order },
                })
            )
        );

        return {
            data: input.quests.map((quest) => ({
                id: quest.id,
                order: quest.order,
            })),
        };
    } catch (error) {
        console.error("Error updating quest order:", error);
        return {
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to update quest order",
        };
    }
}

export interface DeleteQuestInput {
    id: string;
}

export async function deleteQuest(input: DeleteQuestInput): Promise<boolean> {
    try {
        await prisma.$transaction(async (tx) => {
            await tx.questLog.deleteMany({
                where: { questId: input.id },
            });

            await tx.quest.delete({
                where: { id: input.id },
            });
        });

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export interface TokenGatingQuestInput {
    questId: string;
    userId: string;
}

export async function tokenGatingQuest(
    input?: TokenGatingQuestInput
): Promise<TokenGatingData> {
    try {
        if (!input || !input.questId || !input.userId) {
            return {
                hasToken: false,
                detail: [],
            };
        }

        const quest = await prisma.quest.findUnique({
            where: { id: input.questId },
            select: {
                needToken: true,
                needTokenAddress: true,
                artist: true,
            },
        });

        if (!quest) {
            return {
                hasToken: false,
                detail: [],
            };
        }

        if (!quest.artist || !quest.needToken || !quest.needTokenAddress) {
            return {
                hasToken: true,
                detail: [],
            };
        }

        const result = await tokenGating({
            userId: input.userId,
            artist: quest.artist,
        });

        return result.data[quest.needTokenAddress];
    } catch (error) {
        console.error("Error in token gating:", error);
        return {
            hasToken: false,
            detail: [],
        };
    }
}

export interface CompleteQuestInput {
    quest: Quest;
    player: Player;
    tokenGating?: TokenGatingData;
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
            if (!input.tokenGating) {
                return {
                    success: false,
                    error: "Token gating required",
                };
            }

            if (!input.tokenGating?.hasToken) {
                return {
                    success: false,
                    error: "Token gating failed",
                };
            }
        }

        const questLog = await prisma.$transaction(async (tx) => {
            const log = await tx.questLog.findUnique({
                where: {
                    playerId_questId: {
                        playerId: input.player.id,
                        questId: input.quest.id,
                    },
                },
            });

            if (log?.completed && log.completedAt) {
                throw new Error(
                    `You have already completed this quest at ${log.completedAt.toLocaleString()}.`
                );
            }

            if (log?.isClaimed && log.claimedAt) {
                throw new Error(
                    `You have already claimed the reward for this quest at ${log.claimedAt?.toLocaleString()}.`
                );
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
                    throw new Error(
                        `You have already completed this quest ${input.quest.repeatableCount} times.`
                    );
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
                    if (
                        now - lastCompletedAt <
                        input.quest.repeatableInterval
                    ) {
                        const waitSeconds = Math.ceil(
                            (input.quest.repeatableInterval -
                                (now - lastCompletedAt)) /
                                1000
                        );
                        throw new Error(
                            `You can complete this quest again ${formatWaitTime(
                                waitSeconds
                            )} seconds after the last completion.`
                        );
                    }
                }
            }

            if (input.quest.multiClaimable) {
                if (
                    log?.repeatCount &&
                    input.quest.multiClaimLimit &&
                    input.quest.multiClaimLimit > 0 &&
                    log.repeatCount >= input.quest.multiClaimLimit
                ) {
                    throw new Error(
                        `You reached the maximum number of claims.`
                    );
                }

                if (input.quest.multiClaimInterval) {
                    const lastCompletedAt =
                        log?.completedDates && log.completedDates.length > 0
                            ? Math.max(
                                  ...log.completedDates.map((date) =>
                                      new Date(date).getTime()
                                  )
                              )
                            : 0;
                    const now = Date.now();
                    if (
                        now - lastCompletedAt <
                        input.quest.multiClaimInterval
                    ) {
                        const waitSeconds = Math.ceil(
                            (input.quest.multiClaimInterval -
                                (now - lastCompletedAt)) /
                                1000
                        );
                        throw new Error(
                            `You can complete this quest again ${formatWaitTime(
                                waitSeconds
                            )} seconds after the last completion.`
                        );
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
                reclaimable: boolean;
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
                reclaimable: false,
                completedDates: log?.completedDates
                    ? [...log.completedDates]
                    : [],
            };

            data.completedDates.push(new Date());

            if (
                !input.quest.repeatable ||
                !input.quest.repeatableCount ||
                (input.quest.repeatableCount &&
                    input.quest.repeatableCount <= 1)
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

            if (
                input.quest.multiClaimable &&
                input.quest.multiClaimLimit &&
                data.repeatCount < Number(input.quest.multiClaimLimit)
            ) {
                data.reclaimable = true;
            }

            if (
                input.quest.multiClaimable &&
                input.quest.multiClaimLimit === 0
            ) {
                data.reclaimable = true;
            }

            return await tx.questLog.upsert({
                where: {
                    playerId_questId: {
                        playerId: input.player.id,
                        questId: input.quest.id,
                    },
                },
                update: data,
                create: data,
            });
        });

        return {
            success: true,
            data: questLog,
        };
    } catch (error: any) {
        console.error(error);
        return {
            success: false,
            error: error.message || "Failed to complete quest",
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

        if (input.questLog.reclaimable) {
            const claimedDates = input.questLog.claimedDates || [];
            claimedDates.push(new Date());
            const updatedReclaimableQuestLog = await prisma.questLog.update({
                where: { id: input.questLog.id },
                data: {
                    completed: false,
                    completedAt: null,
                    isClaimed: false,
                    claimedAt: null,
                    claimedDates,
                },
            });

            return {
                success: true,
                data: updatedReclaimableQuestLog,
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
    deprecated?: boolean;
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

        const where: Prisma.QuestLogWhereInput = {};

        if (input?.questId) {
            where.questId = input.questId;
        }

        if (input?.playerId) {
            where.playerId = input.playerId;
        }

        if (input?.isClaimed !== undefined) {
            where.isClaimed = input.isClaimed;
        }

        if (input?.artistId) {
            where.quest = {
                artistId: input.artistId,
            };
        }

        if (input?.isPublic) {
            where.quest = {
                artistId: null,
                needToken: false,
                needTokenAddress: null,
            };
        }

        if (input?.deprecated) {
            where.deprecated = input.deprecated;
        }

        // Promise.all로 병렬 처리하여 성능 향상
        const [items, totalItems] = await Promise.all([
            prisma.questLog.findMany({
                where,
                orderBy: {
                    completedAt: "desc",
                },
                skip: (pagination.currentPage - 1) * pagination.itemsPerPage,
                take: pagination.itemsPerPage,
            }),
            prisma.questLog.count({ where }),
        ]);

        const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);

        return {
            items,
            totalItems,
            totalPages,
        };
    } catch (error) {
        console.error("Error in getQuestLogs:", error);
        return {
            items: [],
            totalItems: 0,
            totalPages: 0,
        };
    }
}

export interface GetPlayerQuestLogsInput {
    playerId?: string;
}

export async function getPlayerQuestLogs(
    input?: GetPlayerQuestLogsInput
): Promise<QuestLog[]> {
    if (!input || !input.playerId) {
        return [];
    }

    try {
        return await prisma.questLog.findMany({
            where: {
                playerId: input.playerId,
            },
        });
    } catch (error) {
        console.error(error);
        return [];
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

        return await prisma.questLog.findMany({
            where: {
                playerId: input.playerId,
                isClaimed: false,
            },
        });
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

        return await prisma.questLog.findMany({
            where: {
                playerId: input.playerId,
                isClaimed: true,
            },
        });
    } catch (error) {
        console.error(error);
        return [];
    }
}

export interface UpdateQuestActiveInput {
    questId: string;
    isActive: boolean;
}

export async function updateQuestActive(
    input: UpdateQuestActiveInput
): Promise<boolean> {
    try {
        await prisma.quest.update({
            where: { id: input.questId },
            data: { isActive: input.isActive },
        });

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}
