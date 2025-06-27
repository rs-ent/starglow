/// app\actions\player.ts

"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma/client";

import { setDefaultPlayerAsset } from "./playerAssets";
import { setReferralQuestLogs } from "./referral";

import type {
    Prisma,
    User as DBUser,
    Player,
    ReferralLog,
} from "@prisma/client";
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

export async function getPlayerByUserId(
    userId: string
): Promise<Player | null> {
    try {
        const player = await prisma.player.findUnique({
            where: { userId: userId },
        });

        if (!player) {
            return null;
        }

        return player;
    } catch (error) {
        console.error("[getPlayerByUserId] Error:", error);
        return null;
    }
}

export interface CreatePlayerInput {
    user: User;
    tweetAuthorId?: string;
}

export async function createPlayer(
    input?: CreatePlayerInput
): Promise<Player | null> {
    if (!input || !input.user) {
        return null;
    }

    try {
        const referralCode = await generateReferralCode();
        const player = await prisma.player.create({
            data: {
                name: input.user.name || "New Player",
                userId: input.user.id,
                referralCode: referralCode,
                tweetAuthorId: input.tweetAuthorId,
            },
        });

        if (player) {
            await setDefaultPlayerAsset({
                player: player,
            });
        }

        return player;
    } catch (error) {
        console.error("[createPlayer] Error:", error);
        return null;
    }
}

export interface UpdatePlayerInput {
    playerId: string;
    tweetAuthorId?: string;
}

export async function updatePlayer(
    input?: UpdatePlayerInput
): Promise<Player | null> {
    if (!input || !input.playerId) {
        return null;
    }

    try {
        const player = await prisma.player.update({
            where: { id: input.playerId },
            data: {
                tweetAuthorId: input.tweetAuthorId,
                lastConnectedAt: new Date(),
            },
        });

        return player;
    } catch (error) {
        console.error("[updatePlayer] Error:", error);
        return null;
    }
}

export interface SetPlayerInput {
    user: User;
    tweetAuthorId?: string;
}

export interface SetPlayerResult {
    player: Player | null;
    isNew: boolean;
    error?: string;
}

export async function setPlayer(
    input?: SetPlayerInput
): Promise<SetPlayerResult> {
    if (!input || !input.user) {
        return {
            player: null,
            isNew: false,
            error: "Invalid input",
        };
    }

    try {
        let error: string | undefined = undefined;
        const referralCode = await generateReferralCode();
        const result = await prisma.$transaction(async (tx) => {
            const existingPlayer = await tx.player.findUnique({
                where: { userId: input.user.id },
                select: {
                    tweetAuthorId: true,
                },
            });

            const updateData: Prisma.PlayerUpdateInput = {
                name: input.user.name || "New Player",
                lastConnectedAt: new Date(),
            };

            if (input.tweetAuthorId && !existingPlayer?.tweetAuthorId) {
                const existingPlayerWithTweetAuthorId =
                    await tx.player.findUnique({
                        where: { tweetAuthorId: input.tweetAuthorId },
                    });

                if (!existingPlayerWithTweetAuthorId) {
                    updateData.tweetAuthor = {
                        connect: { authorId: input.tweetAuthorId },
                    };
                } else {
                    error = "TWEET_AUTHOR_ID_ALREADY_USED";
                    console.error(
                        "TWEET_AUTHOR_ID_ALREADY_USED",
                        input.tweetAuthorId
                    );
                }
            }

            const player = await tx.player.upsert({
                where: { userId: input.user.id },
                update: updateData,
                create: {
                    name: input.user.name || "New Player",
                    userId: input.user.id,
                    referralCode: referralCode,
                    tweetAuthorId: input.tweetAuthorId,
                },
            });

            if (player) {
                setReferralQuestLogs({
                    player: player,
                }).catch((error) => {
                    console.error(
                        "[SetReferral] Failed to set referral quest logs:",
                        error
                    );
                });

                await setDefaultPlayerAsset({
                    player: player,
                    trx: tx,
                });
            }

            return {
                player: player,
                isNew: !existingPlayer,
                error: error,
            };
        });

        return result;
    } catch (error) {
        console.error("[setPlayer] Error:", error);
        return {
            player: null,
            isNew: false,
            error: "Failed to set player",
        };
    }
}

export interface InvitePlayerParams {
    referredUser: User;
    referrerCode: string;
    method?: string;
    telegramId?: string;
}

export interface InvitePlayerResult {
    referredPlayer: Player;
    referrerPlayer: Player;
    referralLog: ReferralLog;
}

export async function invitePlayer(
    input?: InvitePlayerParams
): Promise<InvitePlayerResult | null> {
    if (!input || !input.referredUser || !input.referrerCode) {
        return null;
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            if (input.telegramId) {
                const existingPlayer = await tx.player.findUnique({
                    where: { telegramId: input.telegramId },
                });

                if (existingPlayer) {
                    throw new Error("TELEGRAM_ID_ALREADY_USED");
                }
            }

            const referredPlayer = await tx.player.findUnique({
                where: { userId: input.referredUser.id },
            });

            if (!referredPlayer) {
                throw new Error("REFERRER_NOT_FOUND");
            }

            if (referredPlayer.referredBy) {
                throw new Error("ALREADY_INVITED");
            }

            const referrerPlayer = await tx.player.findUnique({
                where: { referralCode: input.referrerCode },
            });

            if (!referrerPlayer) {
                throw new Error("REFERRER_NOT_FOUND");
            }

            if (referrerPlayer.id === referredPlayer.id) {
                throw new Error("SELF_INVITE_NOT_ALLOWED");
            }

            const existingLog = await tx.referralLog.findUnique({
                where: {
                    referredPlayerId_referrerPlayerId: {
                        referredPlayerId: referredPlayer.id,
                        referrerPlayerId: referrerPlayer.id,
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
                            referredBy: referrerPlayer.id,
                            referredMethod: method,
                        },
                    }),
                    tx.player.update({
                        where: { id: referrerPlayer.id },
                        data: { referralCount: { increment: 1 } },
                    }),
                    tx.referralLog.create({
                        data: {
                            referredPlayerId: referredPlayer.id,
                            referrerPlayerId: referrerPlayer.id,
                            method: method,
                        },
                    }),
                    input.telegramId &&
                        tx.player.update({
                            where: { id: referredPlayer.id },
                            data: { telegramId: input.telegramId },
                        }),
                ]);

            return {
                referredPlayer: updatedReferred,
                referrerPlayer: updatedReferrer,
                referralLog: createdReferralLog,
            };
        });

        // Referral Quest 자동 완료 처리
        if (result && result.referrerPlayer) {
            await setReferralQuestLogs({
                player: result.referrerPlayer,
            }).catch((error) => {
                console.error(
                    "[invitePlayer] Failed to set referral quest logs:",
                    error
                );
            });
        }

        return result;
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

export async function generateReferralCode(): Promise<string> {
    let code: string;
    let exists = true;
    do {
        code = nanoid(6);
        const existingPlayer = await prisma.player.findUnique({
            where: { referralCode: code },
            select: { referralCode: true },
        });

        if (!existingPlayer || !existingPlayer.referralCode) {
            exists = false;
        }
    } while (exists);

    return code;
}

export interface UpdatePlayerSettingsInput {
    playerId: string;
    nickname?: string;
    image?: string;
    email?: string;
}

export async function updatePlayerSettings(
    input?: UpdatePlayerSettingsInput
): Promise<Player | null> {
    if (!input) {
        return null;
    }

    try {
        const updatedPlayer = await prisma.player.update({
            where: { id: input.playerId },
            data: {
                nickname: input.nickname,
                image: input.image,
                email: input.email,
            },
        });

        revalidatePath("/user/*");

        return updatedPlayer;
    } catch (error) {
        console.error("[updatePlayerSettings] Error:", error);
        return null;
    }
}

export interface GetPlayerImageInput {
    playerId: string;
}

export async function getPlayerImage(
    input?: GetPlayerImageInput
): Promise<string | null> {
    if (!input) {
        return null;
    }

    try {
        const player = await prisma.player.findUnique({
            where: { id: input.playerId },
            select: {
                image: true,
                user: {
                    select: {
                        image: true,
                    },
                },
            },
        });

        if (!player) {
            return null;
        }

        return player.image || player.user?.image || null;
    } catch (error) {
        console.error("[getPlayerImage] Error:", error);
        return null;
    }
}
