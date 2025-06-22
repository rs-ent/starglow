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
    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. 활성화된 referral 퀘스트 조회 (tx 사용)
            const referralQuests = await tx.quest.findMany({
                where: {
                    isReferral: true,
                    isActive: true,
                },
            });

            if (!referralQuests.length) {
                return {
                    success: true,
                    data: [],
                };
            }

            const referralQuestsIds = referralQuests.map((quest) => quest.id);

            // 2. 기존 퀘스트 로그 조회 (tx 사용)
            const questLogs = await tx.questLog.findMany({
                where: {
                    playerId: input.player.id,
                    questId: { in: referralQuestsIds },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            // 3. 플레이어의 referral 로그 조회 (tx 사용)
            // 성능 최적화: count와 데이터를 분리하여 조회
            const [referralCount, referralLogs] = await Promise.all([
                tx.referralLog.count({
                    where: {
                        referrerPlayerId: input.player.id,
                    },
                }),
                tx.referralLog.findMany({
                    where: {
                        referrerPlayerId: input.player.id,
                    },
                    orderBy: {
                        createdAt: "desc", // 최신순 정렬
                    },
                    take: 100, // 최대 100개만 조회 (대부분의 케이스 커버)
                }),
            ]);

            if (referralCount === 0) {
                return {
                    success: true,
                    data: [],
                };
            }

            if (!referralLogs.length) {
                return {
                    success: true,
                    data: [],
                };
            }

            // 3-1. 필요한 최대 referral 수 계산 (성능 최적화)
            const maxNeededReferrals = Math.max(
                ...referralQuests.map((q) => {
                    const existingLog = questLogs.find(
                        (log) => log.questId === q.id
                    );
                    if (!q.referralCount) return 0;

                    if (q.repeatable && q.repeatableCount && existingLog) {
                        return q.referralCount * q.repeatableCount;
                    }
                    return existingLog?.completed ? 0 : q.referralCount;
                })
            );

            // 필요 이상의 데이터를 처리하지 않도록 제한
            const effectiveReferralLogs = referralLogs.slice(
                0,
                maxNeededReferrals * 2
            ); // 여유분 포함

            // 4. 완료 가능한 퀘스트 필터링
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
                            if (
                                now - lastCompletedAt <
                                quest.repeatableInterval
                            ) {
                                return false;
                            }
                        } catch (error) {
                            console.error(
                                "Error parsing completedDates:",
                                error
                            );
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

            // 5. 퀘스트 로그 생성/업데이트
            const updatedLogs: QuestLog[] = [];

            for (const quest of completableQuests) {
                const existingLog = questLogs.find(
                    (log) => log.questId === quest.id
                );
                const now = new Date();

                // 사용할 referral 로그들 선택
                const usedReferralCount = existingLog
                    ? existingLog.repeatCount * (quest.referralCount || 0)
                    : 0;

                // 필요한 referral 로그가 충분한지 확인
                let relevantReferralLogs: typeof referralLogs;
                if (
                    usedReferralCount + (quest.referralCount || 0) >
                    referralLogs.length
                ) {
                    // 추가 데이터 필요 시 다시 조회
                    const additionalLogs = await tx.referralLog.findMany({
                        where: {
                            referrerPlayerId: input.player.id,
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                        skip: usedReferralCount,
                        take: quest.referralCount || 0,
                    });
                    relevantReferralLogs = additionalLogs;
                } else {
                    relevantReferralLogs = effectiveReferralLogs.slice(
                        usedReferralCount,
                        usedReferralCount + (quest.referralCount || 0)
                    );
                }

                // 가장 최근 referral의 시간을 완료 시간으로 사용
                const completedAt = relevantReferralLogs[0]?.createdAt || now;

                const data = {
                    playerId: input.player.id,
                    questId: quest.id,
                    completed: false,
                    completedAt: null as Date | null,
                    rewardAssetId: quest.rewardAssetId,
                    rewardAmount: quest.rewardAmount,
                    repeatCount: existingLog ? existingLog.repeatCount + 1 : 1,
                    isClaimed: !quest.rewardAssetId, // 보상이 없으면 자동 클레임
                    reclaimable: false,
                    completedDates: existingLog?.completedDates || [],
                };

                // completedDates에 새 날짜 추가
                data.completedDates.push(completedAt);

                // 반복 가능 퀘스트 처리
                if (quest.repeatable && quest.repeatableCount) {
                    if (data.repeatCount >= quest.repeatableCount) {
                        data.completed = true;
                        data.completedAt = completedAt;
                    }
                } else {
                    // 반복 불가능하거나 repeatableCount가 1인 경우
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

                const updatedLog = await tx.questLog.upsert({
                    where: {
                        playerId_questId: {
                            playerId: input.player.id,
                            questId: quest.id,
                        },
                    },
                    update: data,
                    create: data,
                });

                updatedLogs.push(updatedLog);
            }

            return {
                success: true,
                data: updatedLogs,
            };
        });

        return result;
    } catch (error) {
        console.error("Error in setReferralQuestLogs:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to set referral quest logs",
        };
    }
}
