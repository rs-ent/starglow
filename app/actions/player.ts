/// app\actions\player.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { Prisma, Player, PlayerAsset, AssetType } from "@prisma/client";
import type { RewardCurrency } from "@/app/types/player";
import type { User } from "next-auth";

export interface GetPlayerInput {
    playerId: string;
}

export async function getPlayer(
    input?: GetPlayerInput
): Promise<Player | null> {
    if (!input) {
        return null;
    }

    const player = await prisma.player.findUnique({
        where: { id: input.playerId },
    });

    if (!player) {
        return null;
    }

    return player;
}

export interface SetPlayerInput {
    user?: User;
    telegramId?: string;
}

export async function setPlayer(
    input?: SetPlayerInput
): Promise<Player | null> {
    if (!input || (!input.user && !input.telegramId)) {
        return null;
    }

    try {
        if (input.user?.id) {
            const playerByUserId = await prisma.player.findUnique({
                where: { userId: input.user.id },
            });

            if (playerByUserId) {
                return playerByUserId;
            }
        }

        if (input.telegramId) {
            const playerByTelegramId = await prisma.player.findUnique({
                where: { telegramId: input.telegramId },
            });

            if (playerByTelegramId) {
                return playerByTelegramId;
            }
        }

        return await prisma.player.create({
            data: {
                name: input.user?.name || input.telegramId || "New Player",
                userId: input.user?.id || null,
                telegramId: input.telegramId || null,
            },
        });
    } catch (error) {
        console.error("[setPlayer] Error:", error);
        return null;
    }
}

export interface InvitePlayerParams {
    currentUser: User;
    referralId: string;
    method: "Telegram" | "Web App";
}

export async function invitePlayer(
    input?: InvitePlayerParams
): Promise<Player | null> {
    if (!input) {
        return null;
    }

    const { currentUser, referralId, method } = input;

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
