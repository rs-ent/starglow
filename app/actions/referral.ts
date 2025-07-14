/// app/actions/referral.ts

"use server";

import { prisma } from "@/lib/prisma/client";

import type { Player, QuestLog, ReferralLog } from "@prisma/client";

export interface GetReferralLogsInput {
    playerId: string;
}

export async function getReferralLogs(
    input?: GetReferralLogsInput
): Promise<ReferralLog[]> {
    if (!input) {
        return [];
    }
    try {
        const referralLogs = await prisma.referralLog.findMany({
            cacheStrategy: {
                swr: 60 * 1,
                ttl: 60 * 1,
                tags: ["referralLogs", input.playerId],
            },
            where: {
                referrerPlayerId: input.playerId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return referralLogs;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export interface SetReferralQuestLogsInput {
    player: Player;
}

export async function setReferralQuestLogs(
    input: SetReferralQuestLogsInput
): Promise<{ success: boolean; error?: string; data?: QuestLog[] }> {
    const startTime = Date.now(); // 🚀 성능 모니터링 시작

    try {
        const [referralQuests, questLogs, referralCount, referralLogs] =
            await Promise.all([
                // 활성화된 referral 퀘스트 조회
                prisma.quest.findMany({
                    where: {
                        isReferral: true,
                        isActive: true,
                    },
                }),
                // 기존 퀘스트 로그 조회
                prisma.questLog.findMany({
                    where: {
                        playerId: input.player.id,
                        quest: {
                            isReferral: true,
                            isActive: true,
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                }),
                // referral 개수 조회
                prisma.referralLog.count({
                    where: {
                        referrerPlayerId: input.player.id,
                    },
                }),
                // referral 로그 조회
                prisma.referralLog.findMany({
                    where: {
                        referrerPlayerId: input.player.id,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 100, // 최대 100개만 조회
                }),
            ]);

        if (!referralQuests.length || referralCount === 0) {
            return {
                success: true,
                data: [],
            };
        }
        const completableQuests = referralQuests.filter((quest) => {
            const existingLog = questLogs.find(
                (log) => log.questId === quest.id
            );

            // 이미 완료되고 반복 불가능한 경우
            if (existingLog?.completed && !quest.repeatable) {
                return false;
            }

            // referralCount가 설정되지 않은 경우
            if (!quest.referralCount) {
                return false;
            }

            // 반복 가능한 퀘스트 처리
            if (quest.repeatable && existingLog) {
                // repeatableCount 체크
                if (
                    quest.repeatableCount &&
                    existingLog.repeatCount >= quest.repeatableCount
                ) {
                    return false;
                }

                // repeatableInterval 체크
                if (
                    quest.repeatableInterval &&
                    existingLog.completedDates.length > 0
                ) {
                    try {
                        const lastCompletedAt = Math.max(
                            ...existingLog.completedDates.map((date) =>
                                new Date(date).getTime()
                            )
                        );
                        const now = Date.now();
                        if (now - lastCompletedAt < quest.repeatableInterval) {
                            return false;
                        }
                    } catch (error) {
                        console.error("Error parsing completedDates:", error);
                        return false;
                    }
                }

                // 남은 referral 수 계산
                const usedReferrals =
                    existingLog.repeatCount * quest.referralCount;
                const remainingReferrals = referralCount - usedReferrals;
                return remainingReferrals >= quest.referralCount;
            }

            // 첫 완료 가능 여부
            return referralCount >= quest.referralCount;
        });

        if (!completableQuests.length) {
            return {
                success: true,
                data: [],
            };
        }
        const now = new Date();
        const upsertData = completableQuests.map((quest) => {
            const existingLog = questLogs.find(
                (log) => log.questId === quest.id
            );

            const usedReferralCount = existingLog
                ? existingLog.repeatCount * (quest.referralCount || 0)
                : 0;

            const relevantReferralLogs = referralLogs.slice(
                usedReferralCount,
                usedReferralCount + (quest.referralCount || 0)
            );

            const completedAt = relevantReferralLogs[0]?.createdAt || now;

            const data = {
                playerId: input.player.id,
                questId: quest.id,
                completed: false,
                completedAt: null as Date | null,
                rewardAssetId: quest.rewardAssetId,
                rewardAmount: quest.rewardAmount,
                repeatCount: existingLog ? existingLog.repeatCount + 1 : 1,
                isClaimed: !quest.rewardAssetId,
                reclaimable: false,
                completedDates: [
                    ...(existingLog?.completedDates || []),
                    completedAt,
                ],
            };

            // 반복 가능 퀘스트 처리
            if (quest.repeatable && quest.repeatableCount) {
                if (data.repeatCount >= quest.repeatableCount) {
                    data.completed = true;
                    data.completedAt = completedAt;
                }
            } else {
                data.completed = true;
                data.completedAt = completedAt;
            }

            // multiClaimable 처리
            if (quest.multiClaimable) {
                if (
                    !quest.multiClaimLimit ||
                    data.repeatCount < quest.multiClaimLimit
                ) {
                    data.reclaimable = true;
                }
            }

            return data;
        });
        const result = await prisma.$transaction(
            async (tx) => {
                const updatedLogs: QuestLog[] = [];

                // 배치로 upsert 처리 (Promise.all 사용)
                const upsertPromises = upsertData.map(async (data) => {
                    return tx.questLog.upsert({
                        where: {
                            playerId_questId: {
                                playerId: data.playerId,
                                questId: data.questId,
                            },
                        },
                        update: data,
                        create: data,
                    });
                });

                const results = await Promise.all(upsertPromises);
                updatedLogs.push(...results);

                return {
                    success: true,
                    data: updatedLogs,
                };
            },
            {
                maxWait: 90000, // 90초 대기 (증가)
                timeout: 90000, // 90초 타임아웃 (60초 증가)
            }
        );

        return result;
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(
            `[setReferralQuestLogs] Error after ${totalTime}ms:`,
            error
        );

        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to set referral quest logs",
        };
    }
}
