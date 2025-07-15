/// app/actions/referral.ts

"use server";

import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";
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
            cacheStrategy: getCacheStrategy("fiveMinutes"),
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
        // Step 1: Fetch all required data in parallel (outside transaction)
        const [referralQuests, questLogs, referralCount] = await Promise.all([
            prisma.quest.findMany({
                cacheStrategy: getCacheStrategy("tenMinutes"),
                where: {
                    isReferral: true,
                    isActive: true,
                },
            }),
            prisma.questLog.findMany({
                cacheStrategy: getCacheStrategy("realtime"),
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
            prisma.referralLog.count({
                where: {
                    referrerPlayerId: input.player.id,
                },
            }),
        ]);

        if (!referralQuests.length || referralCount === 0) {
            return {
                success: true,
                data: [],
            };
        }

        // Step 2: Calculate completable quests (outside transaction)
        const completableQuests = await calculateCompletableQuests(
            referralQuests,
            questLogs,
            referralCount
        );

        if (!completableQuests.length) {
            return {
                success: true,
                data: [],
            };
        }

        // Step 3: Generate upsert data (outside transaction)
        const upsertData = await generateQuestUpsertData(
            completableQuests,
            questLogs,
            input.player.id
        );

        // Step 4: Execute fast transaction (minimal database operations)
        const result = await executeQuestLogUpserts(upsertData);

        return result;
    } catch (error) {
        console.error("[setReferralQuestLogs] Error:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to set referral quest logs",
        };
    }
}

// Helper function to calculate completable quests
async function calculateCompletableQuests(
    referralQuests: any[],
    questLogs: any[],
    referralCount: number
): Promise<any[]> {
    return referralQuests.filter((quest) => {
        const existingLog = questLogs.find((log) => log.questId === quest.id);

        if (existingLog?.completed && !quest.repeatable) {
            return false;
        }

        if (!quest.referralCount) {
            return false;
        }

        if (quest.repeatable && existingLog) {
            if (
                quest.repeatableCount &&
                existingLog.repeatCount >= quest.repeatableCount
            ) {
                return false;
            }

            if (
                quest.repeatableInterval &&
                existingLog.completedDates.length > 0
            ) {
                try {
                    const lastCompletedAt = Math.max(
                        ...existingLog.completedDates.map((date: any) =>
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

            const usedReferrals = existingLog.repeatCount * quest.referralCount;
            const remainingReferrals = referralCount - usedReferrals;
            return remainingReferrals >= quest.referralCount;
        }

        return referralCount >= quest.referralCount;
    });
}

// Helper function to generate upsert data
async function generateQuestUpsertData(
    completableQuests: any[],
    questLogs: any[],
    playerId: string
): Promise<any[]> {
    const now = new Date();

    return completableQuests.map((quest) => {
        const existingLog = questLogs.find((log) => log.questId === quest.id);

        const completedAt = now;

        const data = {
            playerId: playerId,
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

        if (quest.repeatable && quest.repeatableCount) {
            if (data.repeatCount >= quest.repeatableCount) {
                data.completed = true;
                data.completedAt = completedAt;
            }
        } else {
            data.completed = true;
            data.completedAt = completedAt;
        }

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
}

// Helper function for fast transaction execution
async function executeQuestLogUpserts(upsertData: any[]): Promise<{
    success: boolean;
    data: QuestLog[];
}> {
    return await prisma.$transaction(async (tx) => {
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

        return {
            success: true,
            data: results,
        };
    });
}
