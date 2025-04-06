/// app\actions\player.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { Player } from "@prisma/client";
import type { RewardCurrency } from "@/app/types/player";

export async function getPlayer(playerId: string) {
    const player = await prisma.player.findUnique({
        where: { id: playerId },
    });

    if (!player) {
        throw new Error("Player not found");
    }

    return player;
}

export async function setPlayer(
    userId?: string,
    telegramId?: string
): Promise<Player> {
    try {
        let player;

        if (userId) {
            player = await prisma.player.findUnique({
                where: { userId },
            });
        }

        if (telegramId) {
            player = await prisma.player.findUnique({
                where: { telegramId },
            });
        }

        if (!player) {
            player = await prisma.player.create({
                data: {
                    name: "John Doe",
                    userId: userId || null,
                    telegramId: telegramId || null,
                },
            });
        }

        return player;
    } catch (error) {
        console.error("[setPlayer] Error:", error);
        throw error;
    }
}

export async function getPlayerCurrency(
    playerId: string,
    currency: RewardCurrency
): Promise<number> {
    const player = await prisma.player.findUnique({
        where: { id: playerId },
        select: {
            [currency]: true,
        },
    });

    if (!player) {
        throw new Error("Player not found");
    }

    return Number(player[currency]) || 0;
}

export async function updatePlayerCurrency(
    playerId: string,
    currency: RewardCurrency,
    amount: number
): Promise<Player> {
    const player = await prisma.player.update({
        where: { id: playerId },
        data: {
            [currency]: {
                increment: amount,
            },
        },
    });

    return player;
}
