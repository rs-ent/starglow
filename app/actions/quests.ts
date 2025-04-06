/// app\actions\quests.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { Quest } from "@prisma/client";
import { requireAuth } from "@/app/auth/authUtils";
import type { RewardCurrency } from "@/app/types/player";

export async function completeQuest(
    playerId: string,
    questId: string,
    rewards: number,
    rewardCurrency: RewardCurrency
) {
    const result = await prisma.$transaction(async (tx) => {
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
            rewardsLog = await tx.rewardsLog.create({
                data: {
                    playerId,
                    questId,
                    questLogId: questLog.id,
                    amount: rewards,
                    reason: "Quest Reward",
                    currency: rewardCurrency,
                },
            });

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

    return result;
}

export async function addRewards(
    playerId: string,
    amount: number,
    currency: RewardCurrency,
    reason: string = "Additional Reward",
    questId?: string,
    pollId?: string
) {
    await requireAuth();

    const result = await prisma.$transaction(async (tx) => {
        const rewardsLog = await tx.rewardsLog.create({
            data: {
                playerId,
                questId,
                pollId,
                amount,
                reason,
                currency,
            },
        });

        const player = await tx.player.update({
            where: { id: playerId },
            data: {
                [currency]: {
                    increment: amount,
                },
            },
        });

        return { rewardsLog, player };
    });

    return result;
}

export async function getDailyQuest(): Promise<Quest[]> {
    const result = await prisma.$transaction(async (tx) => {
        const latestQuest = await tx.quest.findFirst({
            where: { startDate: { not: null }, visible: true },
            orderBy: { startDate: "desc" },
            select: { startDate: true },
        });

        if (!latestQuest) {
            return [];
        }

        const dailyQuests = await tx.quest.findMany({
            where: { startDate: latestQuest.startDate, visible: true },
            orderBy: { primary: "asc" },
        });

        return dailyQuests;
    });

    return result;
}

export async function getMissions(): Promise<Quest[]> {
    const missions = await prisma.quest.findMany({
        where: { permanent: true, visible: true },
        orderBy: { primary: "asc" },
    });

    return missions;
}

export async function getQuestById(id: string): Promise<Quest | null> {
    return await prisma.quest.findUnique({
        where: { id },
    });
}

export async function getCompletedQuests(playerId: string): Promise<string[]> {
    const completedQuestIds = await prisma.questLog.findMany({
        where: { playerId, completed: true },
        select: { questId: true },
    });

    return completedQuestIds.map((log) => log.questId);
}
