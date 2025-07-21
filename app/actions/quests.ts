/// app/actions/quests.ts

"use server";

import { QuestType } from "@prisma/client";

import { tokenGating } from "@/app/story/nft/actions";
import { prisma, createSafePagination } from "@/lib/prisma/client";
import { formatWaitTime } from "@/lib/utils/format";

import { updatePlayerAsset } from "@/app/actions/playerAssets/actions";

import type { TokenGatingData } from "@/app/story/nft/actions";
import type {
    Artist,
    Asset,
    Player,
    Prisma,
    Quest,
    QuestLog,
} from "@prisma/client";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

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
    test?: boolean;
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

export type QuestWithArtistAndRewardAsset = Quest & {
    artist: Artist;
    rewardAsset: Asset;
};

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
    test?: boolean;
}

export async function getQuests({
    input,
    pagination,
}: {
    input?: GetQuestsInput;
    pagination?: PaginationInput;
}): Promise<{
    items: QuestWithArtistAndRewardAsset[];
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
            const [items, totalItems] = await Promise.all([
                (await prisma.quest.findMany({
                    cacheStrategy: getCacheStrategy("tenMinutes"),
                    orderBy: {
                        order: "asc",
                    },
                    include: {
                        artist: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
                                code: true,
                            },
                        },
                        rewardAsset: {
                            select: {
                                id: true,
                                name: true,
                                symbol: true,
                                iconUrl: true,
                            },
                        },
                    },
                    skip:
                        (pagination.currentPage - 1) * pagination.itemsPerPage,
                    take: pagination.itemsPerPage,
                })) as QuestWithArtistAndRewardAsset[],

                prisma.quest.count({
                    cacheStrategy: getCacheStrategy("tenMinutes"),
                }),
            ]);

            return {
                items,
                totalItems,
                totalPages: Math.ceil(totalItems / pagination.itemsPerPage),
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

        if (input.test !== undefined) where.test = input.test;

        // isPublic 조건을 먼저 처리하여 조건 충돌 방지
        if (input.isPublic) {
            where.artistId = null;
            where.needToken = false;
            where.needTokenAddress = null;
        } else if (input.artistId) {
            where.artistId = input.artistId;
        }

        const [items, totalItems] = await Promise.all([
            (await prisma.quest.findMany({
                cacheStrategy: getCacheStrategy("tenMinutes"),
                where,
                orderBy: {
                    order: "asc",
                },
                skip: (pagination.currentPage - 1) * pagination.itemsPerPage,
                take: pagination.itemsPerPage,
                include: {
                    artist: {
                        select: {
                            id: true,
                            name: true,
                            imageUrl: true,
                            code: true,
                        },
                    },
                    rewardAsset: {
                        select: {
                            id: true,
                            name: true,
                            symbol: true,
                            iconUrl: true,
                        },
                    },
                },
            })) as QuestWithArtistAndRewardAsset[],

            prisma.quest.count({
                cacheStrategy: getCacheStrategy("tenMinutes"),
                where,
            }),
        ]);

        let filteredItems = items;
        if (input.startDate !== undefined && input.endDate !== undefined) {
            filteredItems = filteredItems.filter((quest) => {
                // permanent 퀘스트는 항상 포함
                if (quest.permanent) return true;

                // 현재 진행 중인 퀘스트 필터링
                if (quest.startDate && quest.endDate) {
                    const now = input.startDate!; // 현재 시간
                    return (
                        new Date(quest.startDate).getTime() <= now.getTime() && // 이미 시작됨
                        new Date(quest.endDate).getTime() >= now.getTime() // 아직 끝나지 않음
                    );
                }

                // startDate나 endDate가 없는 경우의 처리
                if (!quest.startDate && !quest.endDate) {
                    return true; // 날짜 제한이 없는 퀘스트
                }

                if (!quest.startDate && quest.endDate) {
                    return (
                        new Date(quest.endDate).getTime() >=
                        input.startDate!.getTime()
                    );
                }

                if (quest.startDate && !quest.endDate) {
                    return (
                        new Date(quest.startDate).getTime() <=
                        input.startDate!.getTime()
                    );
                }

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
                cacheStrategy: getCacheStrategy("tenMinutes"),
                where: { id: input.id },
            });
        }

        if (input.title) {
            return await prisma.quest.findFirst({
                cacheStrategy: getCacheStrategy("tenMinutes"),
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
    test?: boolean;
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

        console.info("Artist", artist);
        console.info("Reward Asset", rewardAsset);

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
                cacheStrategy: getCacheStrategy("realtime"),
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
    targetCount?: number;
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
        return await prisma.$transaction(async (tx) => {
            const log = await tx.questLog.findUnique({
                cacheStrategy: getCacheStrategy("realtime"),
                where: { id: input.questLog.id },
            });

            if (!log) {
                return {
                    success: false,
                    error: "Unexpected error occurred. Please try again later. If the problem persists, please contact support.",
                };
            }

            // 모든 검증을 먼저 수행
            if (log.isClaimed && !log.reclaimable) {
                return {
                    success: false,
                    error: "Quest reward already claimed",
                };
            }

            if (
                log.reclaimable &&
                input.targetCount &&
                log.claimedDates &&
                log.claimedDates.length >= input.targetCount
            ) {
                return {
                    success: false,
                    error: "You have already claimed this quest.",
                };
            }

            const lastClaimedDate =
                log.claimedDates && log.claimedDates.length > 0
                    ? log.claimedDates[log.claimedDates.length - 1]
                    : null;
            const minimumAwaitTime = new Date(Date.now() - 1000 * 5);
            if (lastClaimedDate && lastClaimedDate > minimumAwaitTime) {
                return {
                    success: false,
                    error: "You can claim this quest again in 5 seconds.",
                };
            }

            if (!log.rewardAssetId || !log.rewardAmount) {
                return {
                    success: false,
                    error: "Quest reward not found",
                };
            }

            // 🎯 핵심: 간단하고 확실한 Conditional Update
            let updateResult;

            if (log.reclaimable) {
                // reclaimable 퀘스트: 일반 퀘스트와 동일한 방식으로 안전하게 처리
                // 🔒 핵심: isClaimed: false 조건으로 race condition 완전 방지
                updateResult = await tx.questLog.updateMany({
                    where: {
                        id: log.id,
                        isClaimed: false, // 동시 요청 방지!
                    },
                    data: {
                        isClaimed: true,
                        claimedAt: new Date(),
                    },
                });

                // 업데이트가 성공했다면 reclaimable 상태로 리셋
                if (updateResult.count > 0) {
                    const claimedDates = [
                        ...(log.claimedDates || []),
                        new Date(),
                    ];
                    await tx.questLog.update({
                        where: { id: log.id },
                        data: {
                            claimedDates,
                            completed: false,
                            completedAt: null,
                            isClaimed: false, // 다시 claim 가능하도록
                            claimedAt: null,
                        },
                    });
                }
            } else {
                updateResult = await tx.questLog.updateMany({
                    where: {
                        id: log.id,
                        isClaimed: false, // 🔒 Race condition 방지
                    },
                    data: {
                        isClaimed: true,
                        claimedAt: new Date(),
                    },
                });
            }

            // 업데이트 실패 = 다른 요청이 먼저 처리함
            if (updateResult.count === 0) {
                return {
                    success: false,
                    error: "Quest reward already claimed",
                };
            }

            // 플레이어 에셋 업데이트
            const assetUpdateResult = await updatePlayerAsset(
                {
                    transaction: {
                        playerId: input.player.id,
                        assetId: log.rewardAssetId,
                        amount: log.rewardAmount,
                        operation: "ADD",
                        reason: "Quest Reward",
                        questId: log.questId,
                        questLogId: log.id,
                    },
                },
                tx
            );

            if (!assetUpdateResult.success) {
                return {
                    success: false,
                    error: `Failed to give participation reward: ${assetUpdateResult.error}`,
                };
            }

            // 최종 상태 조회
            const updatedQuestLog = await tx.questLog.findUnique({
                cacheStrategy: getCacheStrategy("realtime"),
                where: { id: log.id },
            });

            return {
                success: true,
                data: updatedQuestLog!,
            };
        });
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

export async function getQuestLogByQuest(
    questId: string,
    playerId: string
): Promise<QuestLog | null> {
    try {
        return await prisma.questLog.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
            where: {
                playerId_questId: {
                    playerId,
                    questId,
                },
            },
        });
    } catch (error) {
        console.error("Error getting quest log by quest:", error);
        return null;
    }
}

export async function getActiveQuestLogs(
    playerId: string
): Promise<QuestLog[]> {
    try {
        return await prisma.questLog.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where: {
                playerId,
                OR: [
                    { completed: false }, // 미완료
                    { isClaimed: false }, // 미클레임
                    { reclaimable: true }, // 재클레임 가능
                ],
            },
            include: {
                quest: {
                    select: {
                        id: true,
                        title: true,
                        questType: true,
                        isActive: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    } catch (error) {
        console.error("Error getting active quest logs:", error);
        return [];
    }
}

export async function getCompletedQuestLogs(
    playerId: string
): Promise<QuestLog[]> {
    try {
        return await prisma.questLog.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where: {
                playerId,
                completed: true,
                isClaimed: true,
                reclaimable: false,
            },
            include: {
                quest: {
                    select: {
                        id: true,
                        title: true,
                        questType: true,
                    },
                },
            },
            orderBy: { completedAt: "desc" },
        });
    } catch (error) {
        console.error("Error getting completed quest logs:", error);
        return [];
    }
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
        const safePagination = createSafePagination(
            pagination?.currentPage || 1,
            pagination?.itemsPerPage || 50,
            100
        );

        const where: Prisma.QuestLogWhereInput = {};

        if (input?.questId) where.questId = input.questId;
        if (input?.playerId) where.playerId = input.playerId;
        if (input?.isClaimed !== undefined) where.isClaimed = input.isClaimed;
        if (input?.deprecated !== undefined)
            where.deprecated = input.deprecated;

        const needsQuestJoin = input?.artistId || input?.isPublic;
        if (needsQuestJoin) {
            if (input?.artistId) {
                where.quest = { artistId: input.artistId };
            } else if (input?.isPublic) {
                where.quest = {
                    artistId: null,
                    needToken: false,
                    needTokenAddress: null,
                };
            }
        }

        const [items, totalItems] = await Promise.all([
            prisma.questLog.findMany({
                cacheStrategy: getCacheStrategy("realtime"),
                where,
                select: {
                    id: true,
                    questId: true,
                    playerId: true,
                    completed: true,
                    completedAt: true,
                    isClaimed: true,
                    claimedAt: true,
                    rewardAssetId: true,
                    rewardAmount: true,
                    repeatCount: true,
                    reclaimable: true,
                    deprecated: true,
                    createdAt: true,
                    status: true,
                    ...(needsQuestJoin && {
                        quest: {
                            select: {
                                id: true,
                                title: true,
                                artistId: true,
                            },
                        },
                    }),
                },
                orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
                ...safePagination,
            }),

            prisma.questLog.count({
                where,
                cacheStrategy: getCacheStrategy("realtime"),
            }),
        ]);

        const totalPages = Math.ceil(totalItems / safePagination.take);

        return {
            items: items as QuestLog[],
            totalItems,
            totalPages,
        };
    } catch (error) {
        console.error("🚨 getQuestLogs error:", error);
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

export interface GetActiveQuestLogsInput {
    playerId: string;
}

export interface GetCompletedQuestLogsInput {
    playerId: string;
}

export interface GetClaimableQuestLogsInput {
    playerId: string;
    artistId?: string;
}

export interface GetClaimedQuestLogsInput {
    playerId: string;
    artistId?: string;
}

export interface GetPlayerQuestLogInput {
    questId: string;
    playerId?: string;
}

export async function getPlayerQuestLog(
    input?: GetPlayerQuestLogInput
): Promise<QuestLog | null> {
    if (!input || !input.questId || !input.playerId) {
        return null;
    }

    try {
        return await prisma.questLog.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
            where: {
                playerId_questId: {
                    playerId: input.playerId,
                    questId: input.questId,
                },
            },
        });
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function getPlayerQuestLogs(
    input?: GetPlayerQuestLogsInput
): Promise<QuestLog[]> {
    if (!input || !input.playerId) {
        return [];
    }

    try {
        return await prisma.questLog.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where: {
                playerId: input.playerId,
            },
            orderBy: { createdAt: "desc" },
        });
    } catch (error) {
        console.error(error);
        return [];
    }
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
            OR: [{ isClaimed: false }, { reclaimable: true }],
        };

        if (input.artistId) {
            where.quest = {
                artistId: input.artistId,
            };
        }

        return await prisma.questLog.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where,
            include: {
                quest: {
                    select: {
                        id: true,
                        title: true,
                        rewardAssetId: true,
                        rewardAmount: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    } catch (error) {
        console.error(error);
        return [];
    }
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
            reclaimable: false, // 완전히 완료된 것만
        };

        if (input.artistId) {
            where.quest = {
                artistId: input.artistId,
            };
        }

        return await prisma.questLog.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where,
            include: {
                quest: {
                    select: {
                        id: true,
                        title: true,
                        rewardAssetId: true,
                        rewardAmount: true,
                    },
                },
            },
            orderBy: { claimedAt: "desc" },
        });
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getQuestProgressByQuests(
    questIds: string[],
    playerId: string
): Promise<Record<string, QuestLog | null>> {
    try {
        const questLogs = await prisma.questLog.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where: {
                playerId,
                questId: { in: questIds },
            },
        });

        const progressMap: Record<string, QuestLog | null> = {};
        questIds.forEach((questId) => {
            progressMap[questId] =
                questLogs.find((log) => log.questId === questId) || null;
        });

        return progressMap;
    } catch (error) {
        console.error("Error getting quest progress:", error);
        return {};
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

export interface GetArtistAllActiveQuestCountInput {
    artistId: string;
}

export async function getArtistAllActiveQuestCount(
    input?: GetArtistAllActiveQuestCountInput
): Promise<number> {
    if (!input) {
        return 0;
    }

    try {
        const count = await prisma.quest.count({
            cacheStrategy: getCacheStrategy("fiveMinutes"),
            where: {
                artistId: input.artistId,
                isActive: true,
            },
        });

        return count;
    } catch (error) {
        console.error("Error getting artist all active quest count:", error);
        return 0;
    }
}
