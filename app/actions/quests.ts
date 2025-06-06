/// app/actions/quests.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import {
    Artist,
    Asset,
    Player,
    Prisma,
    Quest,
    QuestLog,
    QuestType,
    ReferralLog,
    User,
} from "@prisma/client";
import { updatePlayerAsset } from "./playerAssets";
import { tokenGate } from "./blockchain";
import { formatWaitTime } from "@/lib/utils/format";
// Redis 캐싱 유틸리티 import
import { getCachedData, invalidateCache } from "@/lib/cache/upstash-redis";

// 캐시 태그 상수 정의
const CACHE_TAGS = {
    QUESTS: "quests",
    QUEST_LOGS: "questLogs",
    TOKEN_GATE: "tokenGate",
};

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

    const { rewardAssetId, artistId, ...rest } = input;

    const quest = await prisma.quest.create({
        data: {
            ...rest,
            rewardAssetId: rewardAssetId || null,
            artistId: artistId || null,
            permanent: input.permanent ?? false,
            isActive: input.isActive ?? true,
            order: input.order ?? 0,
        },
    });

    // 퀘스트 생성 후 캐시 무효화
    await invalidateQuestsCache();

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
    enableCache = true,
}: {
    input?: GetQuestsInput;
    pagination?: PaginationInput;
    enableCache?: boolean;
}): Promise<{
    items: Quest[];
    totalItems: number;
    totalPages: number;
}> {
    try {
        // 캐시 키 생성
        const cacheKey = `quests:${JSON.stringify(input)}:${JSON.stringify(
            pagination
        )}`;

        // Redis 환경 변수가 설정되어 있고 캐싱이 활성화된 경우에만 캐싱 사용
        const redisConfigured = Boolean(
            process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
        );

        // 캐싱 적용 (enableCache가 true이고 input이 있고 Redis가 구성된 경우에만)
        if (enableCache && input && redisConfigured) {
            try {
                return await getCachedData(
                    cacheKey,
                    async () => {
                        return await fetchQuestsFromDB(input, pagination);
                    },
                    {
                        ttl: 300, // 5분 캐싱
                        tags: [CACHE_TAGS.QUESTS],
                    }
                );
            } catch (cacheError) {
                console.error("Cache error in getQuests:", cacheError);
                // 캐싱 오류 시 직접 DB 조회
                return await fetchQuestsFromDB(input, pagination);
            }
        }

        // 캐싱을 사용하지 않는 경우 직접 DB 조회
        return await fetchQuestsFromDB(input, pagination);
    } catch (error) {
        console.error("Error in getQuests:", error);
        return {
            items: [],
            totalItems: 0,
            totalPages: 0,
        };
    }
}

// 데이터베이스에서 퀘스트를 조회하는 함수 분리 (코드 재사용성 향상)
async function fetchQuestsFromDB(
    input?: GetQuestsInput,
    pagination?: PaginationInput
): Promise<{
    items: Quest[];
    totalItems: number;
    totalPages: number;
}> {
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

    if (input.artistId) {
        where.artistId = input.artistId;
    }

    if (input.isPublic) {
        where.artistId = null;
        where.needToken = false;
        where.needTokenAddress = null;
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

    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);

    return {
        items,
        totalItems,
        totalPages,
    };
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
            },
        });

        // 퀘스트 업데이트 후 캐시 무효화
        await invalidateQuestsCache();

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

        // 퀘스트 삭제 후 캐시 무효화
        await invalidateQuestsCache();

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
    input?: TokenGatingInput,
    enableCache = true
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

        // 캐시 키 생성
        const cacheKey = `tokenGate:${user.id}:${quest.needTokenAddress}`;

        // 캐싱 적용
        if (enableCache && quest.needTokenAddress) {
            return await getCachedData(
                cacheKey,
                async () => {
                    return await checkTokenGating(
                        user.id,
                        quest.needTokenAddress || ""
                    );
                },
                {
                    ttl: 1800, // 30분 캐싱
                    tags: [CACHE_TAGS.TOKEN_GATE, `tokenGate:${user.id}`],
                }
            );
        }

        // 캐싱을 사용하지 않는 경우 직접 체크
        return await checkTokenGating(user.id, quest.needTokenAddress);
    } catch (error) {
        console.error("Error in token gating:", error);
        return {
            success: false,
            error: "Failed to check token ownership",
        };
    }
}

// 토큰 게이팅 체크 함수 분리
async function checkTokenGating(
    userId: string,
    tokenAddress: string
): Promise<TokenGatingResult> {
    try {
        const result = await tokenGate({
            userId,
            tokenType: "Collection",
            tokenAddress,
        });

        return {
            success: result.success,
            data: result.data || {
                hasToken: false,
                tokenCount: 0,
                ownerWallets: [],
            },
            error: result.error,
        };
    } catch (error) {
        console.error("Error in checkTokenGating:", error);
        return {
            success: false,
            error: "Failed to check token ownership",
        };
    }
}

// 토큰 게이팅 캐시 무효화 함수 추가
export async function invalidateTokenGatingCache(userId?: string) {
    if (userId) {
        await invalidateCache({ tags: [`tokenGate:${userId}`] });
    } else {
        await invalidateCache({ tags: [CACHE_TAGS.TOKEN_GATE] });
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

        // 토큰 게이팅 체크 최적화 - 캐시된 결과 사용
        if (input.quest.needToken && input.quest.needTokenAddress) {
            if (!input.tokenGating) {
                return {
                    success: false,
                    error: "Token gating required",
                };
            }

            if (
                !input.tokenGating.success ||
                !input.tokenGating.data?.hasToken
            ) {
                return {
                    success: false,
                    error: "Token gating failed",
                };
            }
        }

        // 트랜잭션으로 묶어 원자성 보장
        const questLog = await prisma.$transaction(async (tx) => {
            // 기존 로그 조회
            const log = await tx.questLog.findUnique({
                where: {
                    playerId_questId: {
                        playerId: input.player.id,
                        questId: input.quest.id,
                    },
                },
            });

            // 이미 완료된 퀘스트 체크
            if (log?.completed && log.completedAt) {
                throw new Error(
                    `You have already completed this quest at ${log.completedAt.toLocaleString()}.`
                );
            }

            // 이미 보상을 받은 퀘스트 체크
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
    enableCache = true,
}: {
    input?: GetQuestLogsInput;
    pagination?: PaginationInput;
    enableCache?: boolean;
}): Promise<{
    items: QuestLog[];
    totalItems: number;
    totalPages: number;
}> {
    try {
        // 캐시 키 생성
        const cacheKey = `questLogs:${JSON.stringify(input)}:${JSON.stringify(
            pagination
        )}`;

        // Redis 환경 변수 확인
        const redisConfigured = Boolean(
            process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
        );

        // 캐싱 적용
        if (enableCache && input && redisConfigured) {
            try {
                return await getCachedData(
                    cacheKey,
                    async () => {
                        return await fetchQuestLogsFromDB(input, pagination);
                    },
                    {
                        ttl: 300, // 5분 캐싱
                        tags: [CACHE_TAGS.QUEST_LOGS],
                    }
                );
            } catch (cacheError) {
                console.error("Cache error in getQuestLogs:", cacheError);
                return await fetchQuestLogsFromDB(input, pagination);
            }
        }

        // 캐싱을 사용하지 않는 경우 직접 DB 조회
        return await fetchQuestLogsFromDB(input, pagination);
    } catch (error) {
        console.error("Error in getQuestLogs:", error);
        return {
            items: [],
            totalItems: 0,
            totalPages: 0,
        };
    }
}

// 데이터베이스에서 퀘스트 로그를 조회하는 함수 분리
async function fetchQuestLogsFromDB(
    input?: GetQuestLogsInput,
    pagination?: PaginationInput
): Promise<{
    items: QuestLog[];
    totalItems: number;
    totalPages: number;
}> {
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

export interface SetReferralQuestLogsInput {
    referralQuests: Quest[];
    questLogs: QuestLog[];
    referralLogs: ReferralLog[];
    player: Player;
}

export async function setReferralQuestLogs(
    input: SetReferralQuestLogsInput
): Promise<boolean> {
    try {
        if (!input.referralQuests?.length || !input.player?.id) {
            console.error("Invalid input: missing required data");
            return false;
        }

        const completableQuests = input.referralQuests.filter((quest) => {
            const existingLogs = input.questLogs.filter(
                (log) => log.questId === quest.id && log.isClaimed
            );

            if (
                quest.repeatable &&
                quest.referralCount &&
                existingLogs.length > 0
            ) {
                const claimedCount = existingLogs.length;
                const remainingReferrals =
                    input.referralLogs.length -
                    quest.referralCount * claimedCount;

                return remainingReferrals >= quest.referralCount;
            }

            if (
                existingLogs.length > 0 ||
                existingLogs.some((log) => log.completed)
            ) {
                return false;
            }

            return (
                quest.referralCount &&
                quest.referralCount <= input.referralLogs.length
            );
        });

        if (!completableQuests.length) {
            return true;
        }

        const newDataToCreate = completableQuests.map((quest) => {
            const existingLogs = input.questLogs.filter(
                (log) => log.questId === quest.id && log.isClaimed
            );

            return {
                playerId: input.player.id,
                questId: quest.id,
                completed: true,
                completedAt: input.referralLogs[0].createdAt,
                rewardAssetId: quest.rewardAssetId,
                rewardAmount: quest.rewardAmount,
                repeatCount: existingLogs.length + 1,
                completedDates: [input.referralLogs[0].createdAt],
            };
        });

        await prisma.$transaction(async (tx) => {
            await tx.questLog.createMany({
                data: newDataToCreate,
                skipDuplicates: true,
            });
        });

        return true;
    } catch (error) {
        console.error(error);
        return false;
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

// 퀘스트 캐시 무효화 함수 추가
export async function invalidateQuestsCache() {
    await invalidateCache({ tags: [CACHE_TAGS.QUESTS] });
}
