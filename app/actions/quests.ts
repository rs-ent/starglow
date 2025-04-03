/// app\actions\quests.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { Quest, StoredImage } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/app/auth/authUtils";

export async function completeQuest(
    playerId: string,
    questId: string,
    rewards: number,
    rewardCurrency: "points" | "SGP" | "SGT"
) {
    try {
        await requireAuth();

        const result = await prisma.$transaction(async (tx) => {
            // create quest log
            const questLog = await tx.questLog.create({
                data: {
                    playerId,
                    questId,
                    completed: true,
                    completedAt: new Date(),
                    rewards,
                    rewardCurrency,
                },
            });

            let rewardsLog = null;
            if (rewards && rewardCurrency) {
                // create rewards log
                rewardsLog = await tx.rewardsLog.create({
                    data: {
                        playerId,
                        questId,
                        questLogId: questLog.id,
                        amount: rewards,
                        reason: "Quest completion",
                        currency: rewardCurrency,
                    },
                });

                // increment rewards in player
                await tx.player.update({
                    where: { id: playerId },
                    data: {
                        [rewardCurrency]: {
                            increment: rewards,
                        },
                    },
                });
            }

            return { questLog, rewardsLog };
        });

        // revalidate quests page
        revalidatePath("/quests");
        return result;
    } catch (error) {
        console.error("Error completing quest:", error);
        throw error;
    }
}

// Add rewards to player
export async function addRewards(
    playerId: string,
    questId: string,
    questLogId: string,
    amount: number,
    currency: "points" | "SGP" | "SGT",
    reason: string = "Additional reward",
    pollId?: string,
    pollLogId?: string
) {
    try {
        await requireAuth();

        const result = await prisma.$transaction(async (tx) => {
            // create rewards log
            const rewardsLog = await tx.rewardsLog.create({
                data: {
                    playerId,
                    questId,
                    questLogId,
                    pollId,
                    pollLogId,
                    amount,
                    reason,
                    currency,
                },
            });

            // increment rewards in player
            const player = await tx.player.update({
                where: { id: playerId },
                data: {
                    [currency]: {
                        increment: amount,
                    },
                },
            });

            return { player, rewardsLog };
        });

        // revalidate player page
        revalidatePath("/player");
        return result;
    } catch (error) {
        console.error("Error adding rewards:", error);
        throw error;
    }
}

// Get daily quests
export async function getDailyQuests(): Promise<Quest[]> {
    try {
        // get latest quest to get start date
        const latestQuest = await prisma.quest.findFirst({
            where: { startDate: { not: null } },
            orderBy: { startDate: "desc" },
            select: { startDate: true },
        });

        if (!latestQuest) {
            return [];
        }

        // get daily quests
        const dailyQuests = await prisma.quest.findMany({
            where: { startDate: latestQuest.startDate },
            orderBy: { primary: "asc" },
        });

        return dailyQuests;
    } catch (error) {
        console.error("[getDailyQuests] Error:", error);
        return [];
    }
}

// Get missions
export async function getMissions(): Promise<Quest[]> {
    try {
        const missions = await prisma.quest.findMany({
            where: { permanent: true, visible: true },
            orderBy: { primary: "asc" },
        });

        return missions;
    } catch (error) {
        console.error("[getMissions] Error:", error);
        return [];
    }
}

// Get banners for Missions page
export async function getBanners(): Promise<Pick<StoredImage, "id" | "url">[]> {
    try {
        const banners = await prisma.storedImage.findMany({
            where: { onBanner: true },
            orderBy: { order: "asc" },
            select: { id: true, url: true },
        });

        return banners;
    } catch (error) {
        console.error("[getBanners] Error:", error);
        return [];
    }
}
