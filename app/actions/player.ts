/// app\actions\player.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import {
    Prisma,
    User as DBUser,
    Player,
    PlayerAsset,
    AssetType,
    ReferralLog,
} from "@prisma/client";
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
    user: User;
}

export async function setPlayer(
    input?: SetPlayerInput
): Promise<Player | null> {
    if (!input || !input.user) {
        return null;
    }

    try {
        return await prisma.player.upsert({
            where: { userId: input.user.id },
            update: {
                name: input.user.name || "New Player",
            },
            create: {
                name: input.user.name || "New Player",
                userId: input.user.id,
            },
        });
    } catch (error) {
        console.error("[setPlayer] Error:", error);
        return null;
    }
}

export interface InvitePlayerParams {
    referredUser: User;
    referrerPlayerId: string;
    method?: string;
}

export interface InvitePlayerResult {
    referredPlayer: Player;
    referrerPlayer: Player;
    referralLog: ReferralLog;
}

export async function invitePlayer(
    input?: InvitePlayerParams
): Promise<InvitePlayerResult | null> {
    if (!input || !input.referredUser || !input.referrerPlayerId) {
        return null;
    }

    if (input.referredUser.id === input.referrerPlayerId) {
        throw new Error("SELF_INVITE_NOT_ALLOWED");
    }

    try {
        return await prisma.$transaction(async (tx) => {
            const referredPlayer = await tx.player.findUnique({
                where: { userId: input.referredUser.id },
            });

            if (!referredPlayer) {
                throw new Error("REFERRER_NOT_FOUND");
            }

            if (referredPlayer.referredBy) {
                throw new Error("ALREADY_INVITED");
            }

            const existingLog = await tx.referralLog.findUnique({
                where: {
                    referredPlayerId_referrerPlayerId: {
                        referredPlayerId: referredPlayer.id,
                        referrerPlayerId: input.referrerPlayerId,
                    },
                },
            });

            if (existingLog) {
                throw new Error("ALREADY_INVITED");
            }

            const method = input.method || "Unknown";
            const [updatedReferred, updatedReferrer, createdReferralLog] =
                await Promise.all([
                    tx.player.update({
                        where: { userId: input.referredUser.id },
                        data: {
                            referredBy: input.referrerPlayerId,
                            referredMethod: method,
                        },
                    }),
                    tx.player.update({
                        where: { id: input.referrerPlayerId },
                        data: { referralCount: { increment: 1 } },
                    }),
                    tx.referralLog.create({
                        data: {
                            referredPlayerId: referredPlayer.id,
                            referrerPlayerId: input.referrerPlayerId,
                            method: method,
                        },
                    }),
                ]);

            return {
                referredPlayer: updatedReferred,
                referrerPlayer: updatedReferrer,
                referralLog: createdReferralLog,
            };
        });
    } catch (error) {
        console.error("[invitePlayer] Error:", error);
        throw error;
    }
}

export interface GetDBUserFromPlayerInput {
    playerId: string;
}

export async function getDBUserFromPlayer(
    input?: GetDBUserFromPlayerInput
): Promise<DBUser | null> {
    if (!input) {
        return null;
    }

    try {
        const user = await prisma.user.findFirst({
            where: { player: { id: input.playerId } },
        });

        if (!user) {
            return null;
        }

        return user;
    } catch (error) {
        console.error("[getDBUserFromPlayer] Error:", error);
        return null;
    }
}
