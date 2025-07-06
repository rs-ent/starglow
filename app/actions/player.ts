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

// 🆕 마이그레이션 전용 referral log 생성 함수
export interface CreateReferralLogForMigrationParams {
    referredTelegramId: string;
    referrerTelegramId: string;
    method?: string;
}

export async function createReferralLogForMigration(
    input: CreateReferralLogForMigrationParams
): Promise<{ success: boolean; error?: string; result?: any; skipped?: boolean }> {
    try {
        // 1. 사용자들 찾기
        const [referredUser, referrerUser] = await Promise.all([
            prisma.user.findUnique({
                where: { telegramId: input.referredTelegramId },
                include: { player: true },
            }),
            prisma.user.findUnique({
                where: { telegramId: input.referrerTelegramId },
                include: { player: true },
            }),
        ]);

        if (!referredUser?.player) {
            return { success: false, error: "Referred user not found" };
        }

        if (!referrerUser?.player) {
            return { success: false, error: "Referrer user not found" };
        }

        // 2. 기존 referral log 확인
        const existingLog = await prisma.referralLog.findUnique({
            where: {
                referredPlayerId_referrerPlayerId: {
                    referredPlayerId: referredUser.player.id,
                    referrerPlayerId: referrerUser.player.id,
                },
            },
        });

        if (existingLog) {
            return { success: true, skipped: true };
        }

        // 3. referral log 생성
        const result = await prisma.$transaction(async (tx) => {
            // ReferralLog 생성
            const referralLog = await tx.referralLog.create({
                data: {
                    referredPlayerId: referredUser.player.id,
                    referrerPlayerId: referrerUser.player.id,
                    method: input.method || "telegram",
                },
            });

            // referredBy 관계 설정 (없는 경우에만)
            if (!referredUser.player.referredBy) {
                await tx.player.update({
                    where: { id: referredUser.player.id },
                    data: {
                        referredBy: referrerUser.player.id,
                        referredMethod: input.method || "telegram",
                    },
                });
            }

            // referrer의 referralCount 증가
            await tx.player.update({
                where: { id: referrerUser.player.id },
                data: { referralCount: { increment: 1 } },
            });

            return { referralLog };
        });

        // 4. Referral Quest 자동 완료 처리
        await setReferralQuestLogs({
            player: referrerUser.player,
        }).catch((error) => {
            console.error(
                "[createReferralLogForMigration] Failed to set referral quest logs:",
                error
            );
        });

        return { success: true, result };
    } catch (error) {
        console.error("createReferralLogForMigration Error:", error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Unknown error" 
        };
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

export interface GetPlayerProfileInput {
    playerId: string;
}

export interface GetPlayerProfileResult {
    name: string | null;
    image: string | null;
    email: string | null;
}

export async function getPlayerProfile(
    input?: GetPlayerProfileInput
): Promise<GetPlayerProfileResult | null> {
    if (!input) {
        return null;
    }

    try {
        const player = await prisma.player.findUnique({
            where: { id: input.playerId },
            select: {
                nickname: true,
                name: true,
                image: true,
                email: true,
                user: {
                    select: {
                        image: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!player) {
            return null;
        }

        return {
            name: player.nickname || player.name || player.user?.name || null,
            image: player.image || player.user?.image || null,
            email: player.email || player.user?.email || null,
        };
    } catch (error) {
        console.error("[getPlayerProfile] Error:", error);
        return null;
    }
}
