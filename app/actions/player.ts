/// app\actions\player.ts

"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma/client";
import type { UserDetailData } from "@/lib/utils/user-detail-data";
import { getUserDetailDataForServerAction } from "@/lib/utils/user-detail-data";

import { setDefaultPlayerAsset } from "@/app/actions/playerAssets/actions";
import { setReferralQuestLogs } from "./referral";

import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

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
        cacheStrategy: getCacheStrategy("realtime"),
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
            cacheStrategy: getCacheStrategy("fiveMinutes"),
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

export async function getPlayerByUserIdForSession(
    userId: string
): Promise<Player | null> {
    try {
        const player = await prisma.player.findUnique({
            cacheStrategy: getCacheStrategy("oneDay"),
            where: { userId: userId },
            select: {
                id: true,
                userId: true,
                name: true,
                nickname: true,
                image: true,
                referralCode: true,
                isArtist: true,
                artistId: true,
                createdAt: true,
                lastConnectedAt: true,
            },
        });

        if (!player) {
            return null;
        }

        return player as Player;
    } catch (error) {
        console.error("[getPlayerByUserIdForSession] Error:", error);
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
                user: { connect: { id: input.user.id } },
                referralCode: referralCode,
                ...(input.tweetAuthorId && {
                    tweetAuthor: { connect: { authorId: input.tweetAuthorId } },
                }),
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
        let userDetails: Partial<UserDetailData> = {};
        try {
            userDetails = await getUserDetailDataForServerAction();
            const collectedFields = Object.entries(userDetails).filter(
                ([_, value]) => value !== null
            );
            if (collectedFields.length === 0) {
                console.warn("[updatePlayer] No valid data collected");
            }
        } catch (detailError) {
            console.error(
                "[updatePlayer] Failed to collect user details:",
                detailError instanceof Error ? detailError.message : detailError
            );
        }

        const player = await prisma.player.update({
            where: { id: input.playerId },
            data: {
                tweetAuthorId: input.tweetAuthorId,
                lastConnectedAt: new Date(),
                // 🎯 사용자 상세 정보 자동 업데이트
                ...(userDetails.ipAddress && {
                    ipAddress: userDetails.ipAddress,
                }),
                ...(userDetails.locale && { locale: userDetails.locale }),
                ...(userDetails.os && { os: userDetails.os }),
                ...(userDetails.device && { device: userDetails.device }),
                ...(userDetails.browser && { browser: userDetails.browser }),
                ...(userDetails.country && { country: userDetails.country }),
                ...(userDetails.state && { state: userDetails.state }),
                ...(userDetails.city && { city: userDetails.city }),
                ...(userDetails.timezone && { timezone: userDetails.timezone }),
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

export interface PlayerUpsertResult {
    player: Player | null;
    isNew: boolean;
    needsAssetSetup: boolean;
    error?: string;
}

export interface PlayerAssetSetupResult {
    success: boolean;
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
        let userDetails: Partial<UserDetailData> = {};
        try {
            userDetails = await getUserDetailDataForServerAction();
        } catch (detailError) {
            console.error(
                "[setPlayer] Failed to collect user details:",
                detailError instanceof Error ? detailError.message : detailError
            );
        }

        // Step 1: Handle core player upsert (fast transaction)
        const playerResult = await upsertPlayerCore(input, userDetails);
        if (!playerResult.player) {
            return {
                player: null,
                isNew: false,
                error: playerResult.error || "Failed to create/update player",
            };
        }

        // Step 2: Handle asset setup synchronously (maintaining original logic)
        if (playerResult.needsAssetSetup) {
            try {
                await setDefaultPlayerAsset({
                    player: playerResult.player,
                });
            } catch (error) {
                console.error("[setPlayer] Asset setup failed:", error);
                // Original logic would have failed here, so we maintain that behavior
            }
        }

        // Step 3: Handle referral quest logs asynchronously
        if (playerResult.player) {
            setReferralQuestLogs({
                player: playerResult.player,
            }).catch((error) => {
                console.error(
                    "[setPlayer] Failed to set referral quest logs:",
                    error
                );
            });
        }

        return {
            player: playerResult.player,
            isNew: playerResult.isNew,
            error: playerResult.error,
        };
    } catch (error) {
        console.error("[setPlayer] Error:", error);
        return {
            player: null,
            isNew: false,
            error: "Failed to set player",
        };
    }
}

// New helper function for core player operations (fast transaction)
async function upsertPlayerCore(
    input: SetPlayerInput,
    userDetails: Partial<UserDetailData>
): Promise<PlayerUpsertResult> {
    let error: string | undefined = undefined;
    const referralCode = await generateReferralCode();

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Quick check for existing player
            const existingPlayer = await tx.player.findUnique({
                cacheStrategy: getCacheStrategy("realtime"),
                where: { userId: input.user.id },
                select: {
                    id: true,
                    tweetAuthorId: true,
                },
            });

            const updateData: Prisma.PlayerUpdateInput = {
                name: input.user.name || "New Player",
                lastConnectedAt: new Date(),
                // Include user details
                ...(userDetails.ipAddress && {
                    ipAddress: userDetails.ipAddress,
                }),
                ...(userDetails.locale && { locale: userDetails.locale }),
                ...(userDetails.os && { os: userDetails.os }),
                ...(userDetails.device && { device: userDetails.device }),
                ...(userDetails.browser && { browser: userDetails.browser }),
                ...(userDetails.country && { country: userDetails.country }),
                ...(userDetails.state && { state: userDetails.state }),
                ...(userDetails.city && { city: userDetails.city }),
                ...(userDetails.timezone && { timezone: userDetails.timezone }),
            };

            // Handle tweet author connection only if needed
            if (input.tweetAuthorId && !existingPlayer?.tweetAuthorId) {
                const existingPlayerWithTweetAuthorId =
                    await tx.player.findUnique({
                        where: { tweetAuthorId: input.tweetAuthorId },
                        select: { id: true },
                    });

                if (!existingPlayerWithTweetAuthorId) {
                    updateData.tweetAuthor = {
                        connect: { authorId: input.tweetAuthorId },
                    };
                } else {
                    error = "TWEET_AUTHOR_ID_ALREADY_USED";
                }
            }

            const player = await tx.player.upsert({
                where: { userId: input.user.id },
                update: updateData,
                create: {
                    name: input.user.name || "New Player",
                    user: { connect: { id: input.user.id } },
                    referralCode: referralCode,
                    ...(input.tweetAuthorId && {
                        tweetAuthor: {
                            connect: { authorId: input.tweetAuthorId },
                        },
                    }),
                    // 🎯 사용자 상세 정보 포함
                    ...(userDetails.ipAddress && {
                        ipAddress: userDetails.ipAddress,
                    }),
                    ...(userDetails.locale && { locale: userDetails.locale }),
                    ...(userDetails.os && { os: userDetails.os }),
                    ...(userDetails.device && { device: userDetails.device }),
                    ...(userDetails.browser && {
                        browser: userDetails.browser,
                    }),
                    ...(userDetails.country && {
                        country: userDetails.country,
                    }),
                    ...(userDetails.state && { state: userDetails.state }),
                    ...(userDetails.city && { city: userDetails.city }),
                    ...(userDetails.timezone && {
                        timezone: userDetails.timezone,
                    }),
                },
            });

            return {
                player,
                isNew: !existingPlayer,
                needsAssetSetup: !existingPlayer, // 새 플레이어만 asset setup 필요
                error,
            };
        });

        return result;
    } catch (error) {
        console.error("[upsertPlayerCore] Error:", error);
        return {
            player: null,
            isNew: false,
            needsAssetSetup: false,
            error: "Failed to upsert player",
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
        // Step 1: Pre-validation (fast, outside transaction)
        const validationResult = await validateInvitePlayer(input);
        if (!validationResult.isValid) {
            throw new Error(validationResult.error);
        }

        // Step 2: Core referral creation (atomic operation)
        const result = await createReferralRelationship(
            validationResult.referredPlayer!,
            validationResult.referrerPlayer!,
            input.method || "Unknown",
            input.telegramId
        );

        // Step 3: Background processing (quest logs, notifications, etc.)
        if (result && result.referrerPlayer) {
            setReferralQuestLogs({
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

// Helper function for validation (fast, read-only operations)
interface InviteValidationResult {
    isValid: boolean;
    error?: string;
    referredPlayer?: Player;
    referrerPlayer?: Player;
}

async function validateInvitePlayer(
    input: InvitePlayerParams
): Promise<InviteValidationResult> {
    try {
        // Check telegram ID if provided
        if (input.telegramId) {
            const existingPlayer = await prisma.player.findUnique({
                cacheStrategy: getCacheStrategy("realtime"),
                where: { telegramId: input.telegramId },
                select: { id: true },
            });

            if (existingPlayer) {
                return { isValid: false, error: "TELEGRAM_ID_ALREADY_USED" };
            }
        }

        // Get referred player
        const referredPlayer = await prisma.player.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { userId: input.referredUser.id },
            select: {
                id: true,
                userId: true,
                referredBy: true,
                name: true,
                referralCode: true,
                referralCount: true,
                tweetAuthorId: true,
                tweetVerified: true,
                telegramId: true,
                // Include other needed fields
            },
        });

        if (!referredPlayer) {
            return { isValid: false, error: "REFERRED_PLAYER_NOT_FOUND" };
        }

        if (referredPlayer.referredBy) {
            return { isValid: false, error: "ALREADY_INVITED" };
        }

        // Get referrer player
        const referrerPlayer = await prisma.player.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { referralCode: input.referrerCode },
            select: {
                id: true,
                userId: true,
                referredBy: true,
                name: true,
                referralCode: true,
                referralCount: true,
                tweetAuthorId: true,
                tweetVerified: true,
                telegramId: true,
                // Include other needed fields
            },
        });

        if (!referrerPlayer) {
            return { isValid: false, error: "REFERRER_NOT_FOUND" };
        }

        if (referrerPlayer.id === referredPlayer.id) {
            return { isValid: false, error: "SELF_INVITE_NOT_ALLOWED" };
        }

        // Check for existing referral log
        const existingLog = await prisma.referralLog.findUnique({
            cacheStrategy: getCacheStrategy("forever"),
            where: {
                referredPlayerId_referrerPlayerId: {
                    referredPlayerId: referredPlayer.id,
                    referrerPlayerId: referrerPlayer.id,
                },
            },
            select: { id: true },
        });

        if (existingLog) {
            return { isValid: false, error: "ALREADY_INVITED" };
        }

        return {
            isValid: true,
            referredPlayer: referredPlayer as Player,
            referrerPlayer: referrerPlayer as Player,
        };
    } catch (error) {
        console.error("[validateInvitePlayer] Error:", error);
        return { isValid: false, error: "VALIDATION_FAILED" };
    }
}

// Helper function for atomic referral creation (fast transaction)
async function createReferralRelationship(
    referredPlayer: Player,
    referrerPlayer: Player,
    method: string,
    telegramId?: string
): Promise<InvitePlayerResult> {
    return await prisma.$transaction(async (tx) => {
        // Create referral log first
        const referralLog = await tx.referralLog.create({
            data: {
                referredPlayerId: referredPlayer.id,
                referrerPlayerId: referrerPlayer.id,
                method: method,
            },
        });

        // Update players in parallel
        const updatePromises = [
            tx.player.update({
                where: { id: referredPlayer.id },
                data: {
                    referredBy: referrerPlayer.id,
                    referredMethod: method,
                    ...(telegramId && { telegramId }),
                },
            }),
            tx.player.update({
                where: { id: referrerPlayer.id },
                data: { referralCount: { increment: 1 } },
            }),
        ];

        const [updatedReferred, updatedReferrer] = await Promise.all(
            updatePromises
        );

        return {
            referredPlayer: updatedReferred,
            referrerPlayer: updatedReferrer,
            referralLog: referralLog,
        };
    });
}

// 🆕 마이그레이션 전용 referral log 생성 함수
export interface CreateReferralLogForMigrationParams {
    referredTelegramId: string;
    referrerTelegramId: string;
    method?: string;
}

export async function createReferralLogForMigration(
    input: CreateReferralLogForMigrationParams
): Promise<{
    success: boolean;
    error?: string;
    result?: any;
    skipped?: boolean;
}> {
    try {
        // Step 1: Pre-validation (fast, outside transaction)
        const validationResult = await validateMigrationPlayers(input);
        if (!validationResult.isValid) {
            return { success: false, error: validationResult.error };
        }

        if (validationResult.skipped) {
            return { success: true, skipped: true };
        }

        // Step 2: Core referral creation (atomic operation)
        const result = await createMigrationReferralLog(
            validationResult.referredPlayer!,
            validationResult.referrerPlayer!,
            input.method || "telegram"
        );

        // Step 3: Background processing (quest logs)
        if (validationResult.referrerPlayer) {
            setReferralQuestLogs({
                player: validationResult.referrerPlayer,
            }).catch((error) => {
                console.error(
                    "[createReferralLogForMigration] Failed to set referral quest logs:",
                    error
                );
            });
        }

        return { success: true, result };
    } catch (error) {
        console.error("createReferralLogForMigration Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// Helper function for migration validation (fast, read-only operations)
interface MigrationValidationResult {
    isValid: boolean;
    error?: string;
    referredPlayer?: Player;
    referrerPlayer?: Player;
    skipped?: boolean;
}

async function validateMigrationPlayers(
    input: CreateReferralLogForMigrationParams
): Promise<MigrationValidationResult> {
    try {
        // Find users in parallel
        const [referredUser, referrerUser] = await Promise.all([
            prisma.user.findUnique({
                where: { telegramId: input.referredTelegramId },
                select: {
                    id: true,
                    player: {
                        select: {
                            id: true,
                            userId: true,
                            referredBy: true,
                            name: true,
                            referralCode: true,
                            referralCount: true,
                            tweetAuthorId: true,
                            tweetVerified: true,
                            telegramId: true,
                        },
                    },
                },
            }),
            prisma.user.findUnique({
                where: { telegramId: input.referrerTelegramId },
                select: {
                    id: true,
                    player: {
                        select: {
                            id: true,
                            userId: true,
                            referredBy: true,
                            name: true,
                            referralCode: true,
                            referralCount: true,
                            tweetAuthorId: true,
                            tweetVerified: true,
                            telegramId: true,
                        },
                    },
                },
            }),
        ]);

        if (!referredUser?.player) {
            return { isValid: false, error: "Referred user not found" };
        }

        if (!referrerUser?.player) {
            return { isValid: false, error: "Referrer user not found" };
        }

        // Check for existing referral log
        const existingLog = await prisma.referralLog.findUnique({
            cacheStrategy: getCacheStrategy("forever"),
            where: {
                referredPlayerId_referrerPlayerId: {
                    referredPlayerId: referredUser.player.id,
                    referrerPlayerId: referrerUser.player.id,
                },
            },
            select: { id: true },
        });

        if (existingLog) {
            return { isValid: true, skipped: true };
        }

        return {
            isValid: true,
            referredPlayer: referredUser.player as Player,
            referrerPlayer: referrerUser.player as Player,
        };
    } catch (error) {
        console.error("[validateMigrationPlayers] Error:", error);
        return { isValid: false, error: "Validation failed" };
    }
}

// Helper function for atomic migration referral creation (fast transaction)
async function createMigrationReferralLog(
    referredPlayer: Player,
    referrerPlayer: Player,
    method: string
): Promise<any> {
    return await prisma.$transaction(async (tx) => {
        // Create referral log first
        const referralLog = await tx.referralLog.create({
            data: {
                referredPlayerId: referredPlayer.id,
                referrerPlayerId: referrerPlayer.id,
                method: method,
            },
        });

        // Update players in parallel (only if needed)
        const updatePromises = [];

        // Update referredBy relationship only if not already set
        if (!referredPlayer.referredBy) {
            updatePromises.push(
                tx.player.update({
                    where: { id: referredPlayer.id },
                    data: {
                        referredBy: referrerPlayer.id,
                        referredMethod: method,
                    },
                })
            );
        }

        // Always increment referral count
        updatePromises.push(
            tx.player.update({
                where: { id: referrerPlayer.id },
                data: { referralCount: { increment: 1 } },
            })
        );

        await Promise.all(updatePromises);

        return { referralLog };
    });
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
            cacheStrategy: getCacheStrategy("forever"),
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
            cacheStrategy: getCacheStrategy("realtime"),
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

// 사용자 상세 정보 업데이트 관련 인터페이스와 함수들

export interface UpdatePlayerDetailsInput {
    playerId: string;
    details: Partial<UserDetailData>;
}

export interface UpdatePlayerDetailsResult {
    success: boolean;
    player?: Player;
    error?: string;
}

/**
 * Player의 상세 정보(IP, 기기 정보, 지역 등)를 업데이트하는 함수
 * 속도 최적화: 실패해도 에러를 던지지 않고 결과만 반환
 */
export async function updatePlayerDetails(
    input?: UpdatePlayerDetailsInput
): Promise<UpdatePlayerDetailsResult> {
    if (!input) {
        return { success: false, error: "입력값이 없습니다." };
    }

    const { playerId, details } = input;

    try {
        // 업데이트할 데이터만 필터링 (null/undefined 제외)
        const updateData: Record<string, any> = {};

        if (details.ipAddress !== undefined && details.ipAddress !== null) {
            updateData.ipAddress = details.ipAddress;
        }
        if (details.locale !== undefined && details.locale !== null) {
            updateData.locale = details.locale;
        }
        if (details.os !== undefined && details.os !== null) {
            updateData.os = details.os;
        }
        if (details.device !== undefined && details.device !== null) {
            updateData.device = details.device;
        }
        if (details.browser !== undefined && details.browser !== null) {
            updateData.browser = details.browser;
        }
        if (details.country !== undefined && details.country !== null) {
            updateData.country = details.country;
        }
        if (details.state !== undefined && details.state !== null) {
            updateData.state = details.state;
        }
        if (details.city !== undefined && details.city !== null) {
            updateData.city = details.city;
        }
        if (details.timezone !== undefined && details.timezone !== null) {
            updateData.timezone = details.timezone;
        }

        // 업데이트할 데이터가 없으면 성공으로 처리
        if (Object.keys(updateData).length === 0) {
            return { success: true, error: "업데이트할 데이터가 없습니다." };
        }

        // Player 업데이트 (upsert 방식으로 안전하게)
        const updatedPlayer = await prisma.player.update({
            where: { id: playerId },
            data: {
                ...updateData,
                lastConnectedAt: new Date(), // 접속 시간도 업데이트
            },
        });

        // 관련 캐시 무효화 (필요시)
        revalidatePath("/user");
        revalidatePath("/admin");

        return {
            success: true,
            player: updatedPlayer,
        };
    } catch (error) {
        console.error("[updatePlayerDetails] Error:", error);

        // 상세한 에러 정보 제공
        let errorMessage = "사용자 정보 업데이트에 실패했습니다.";

        if (error instanceof Error) {
            if (error.message.includes("Record to update not found")) {
                errorMessage = "해당 사용자를 찾을 수 없습니다.";
            } else if (error.message.includes("Unique constraint")) {
                errorMessage = "중복된 정보가 있습니다.";
            }
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}
