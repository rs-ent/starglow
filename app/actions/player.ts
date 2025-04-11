/// app\actions\player.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { Player } from "@prisma/client";
import type { RewardCurrency } from "@/app/types/player";
import type { User } from "next-auth";
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
    user?: User,
    telegramId?: string
): Promise<Player> {
    try {
        let player;

        if (user) {
            player = await prisma.player.findUnique({
                where: { userId: user.id },
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
                    name: user?.name || "New Player",
                    userId: user?.id || null,
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

interface InvitePlayerParams {
    currentUser: User;
    referralId: string;
    method: "Telegram" | "Web App";
}

export async function invitePlayer({
    currentUser,
    referralId,
    method,
}: InvitePlayerParams): Promise<Player> {
    try {
        // 1. Get or create current player
        const currentPlayer = await prisma.player.upsert({
            where: { userId: currentUser.id },
            create: {
                userId: currentUser.id,
                name: currentUser.name || "New Player",
            },
            update: {},
            select: {
                id: true,
                userId: true,
                telegramId: true,
                recommenderId: true,
            },
        });

        // 2. Validate if player is already invited
        if (currentPlayer.recommenderId) {
            throw new Error("ALREADY_INVITED");
        }

        // 3. Find referrer
        const referrer = await prisma.player.findUnique({
            where:
                method === "Telegram"
                    ? { telegramId: referralId }
                    : { id: referralId },
            select: {
                id: true,
                userId: true,
                telegramId: true,
                name: true,
            },
        });

        if (!referrer) {
            throw new Error("REFERRER_NOT_FOUND");
        }

        // 4. Validate self-invitation
        if (
            referrer.userId === currentPlayer.userId ||
            referrer.telegramId === currentPlayer.telegramId
        ) {
            throw new Error("SELF_INVITE_NOT_ALLOWED");
        }

        // 5. Process invitation
        const [updatedPlayer] = await prisma.$transaction([
            prisma.player.update({
                where: { userId: currentPlayer.userId! },
                data: {
                    recommenderId: referrer.id,
                    recommenderMethod: method,
                    recommenderName: referrer.name || "",
                },
            }),
            prisma.player.update({
                where: { id: referrer.id },
                data: {
                    recommendedCount: { increment: 1 },
                },
            }),
        ]);

        return updatedPlayer;
    } catch (error) {
        console.error("[invitePlayer] Error:", error);
        throw error;
    }
}
