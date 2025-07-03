"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/app/auth/authUtils";
import { initialTransfer } from "@/app/story/transfer/actions";
import {
    validatePlayerAsset,
    updatePlayerAsset,
} from "@/app/actions/playerAssets";
import crypto from "crypto";
import { calculateRaffleStatus, type RaffleStatus } from "./utils";

import type {
    Raffle,
    RafflePrize,
    RaffleParticipant,
    RaffleWinner,
    Asset,
    Story_spg,
    RafflePrizeType,
} from "@prisma/client";

// ==================== Types & Status Management ====================

// 🎁 단순화된 상품 입력 타입
export interface RafflePrizeInput {
    title: string;
    description?: string;
    imageUrl?: string;
    order?: number;

    // 📦 수량 = 확률 (핵심!)
    quantity: number; // 이 상품의 총 개수

    // 🏆 상품 타입
    type: RafflePrizeType; // "ASSET", "NFT", "EMPTY"

    // 💎 레어도 시스템
    rarityTier?:
        | "COSMIC"
        | "STELLAR"
        | "CELESTIAL"
        | "DIVINE"
        | "LEGENDARY"
        | "EPIC"
        | "RARE"
        | "UNCOMMON"
        | "COMMON";
    rarityOrder?: number; // 1(최고) ~ 9(최저)

    // Asset 상품
    assetId?: string;
    assetAmount?: number;

    // NFT 상품
    spgAddress?: string;
    nftQuantity?: number;
}

// 🎰 단순화된 래플 생성 입력
export interface CreateRaffleInput {
    title: string;
    description?: string;
    imgUrl?: string;
    artistId?: string;

    // 📅 날짜 설정
    startDate?: Date;
    endDate: Date;
    drawDate?: Date; // null이면 즉시 공개

    // ⚡ 공개 방식 (단순화!)
    instantReveal?: boolean; // 즉시 결과 확인 여부

    // 🎯 상품 소진 방식
    isLimited?: boolean; // true: 수량 소진형 (기본값), false: 고정 확률형

    // 🎨 UI 표현 (프론트엔드 전용)
    displayType?: string; // "GACHA", "SCRATCH_CARD", "SLOT_MACHINE", etc.

    // 🎁 상품 풀 (수량 기반)
    prizes: RafflePrizeInput[];

    // 👥 참가 조건
    maxParticipants?: number;
    entryFeeAssetId?: string;
    entryFeeAmount?: number;
    allowMultipleEntry?: boolean;
    maxEntriesPerPlayer?: number;

    // 🔧 설정
    isPublic?: boolean;
}

export interface RaffleResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export type RaffleWithDetails = Raffle & {
    artist?: { id: string; name: string } | null;
    prizes?: (RafflePrize & {
        asset?: Asset | null;
        spg?: Story_spg | null;
    })[];
    _count?: {
        participants: number;
        winners: number;
        prizes: number;
    };
    // 계산된 상태
    status?: RaffleStatus;
};

export type RaffleWithPrizes = Raffle & {
    entryFeeAsset: Asset | null;
    prizes: RafflePrize[];
    _count: { participants: number };
};

export type RaffleWithParticipantsAndPrizes = Raffle & {
    prizes: RafflePrize[];
    participants: RaffleParticipant[];
};

export type RaffleParticipantWithRelations = RaffleParticipant & {
    player: { id: string; name: string | null; nickname: string | null };
    prize:
        | (RafflePrize & {
              asset?: Asset | null;
              spg?: (Story_spg & { network: any }) | null;
          })
        | null;
};

export type RaffleWinnerWithRelations = RaffleWinner & {
    player: {
        id: string;
        name: string | null;
        nickname: string | null;
        user?: {
            wallets: Array<{
                address: string;
                status: string;
                default: boolean;
            }>;
        } | null;
    };
    prize: RafflePrize & {
        asset?: Asset | null;
        spg?: (Story_spg & { network: any }) | null;
    };
};

// ==================== 핵심 추첨 로직 (단순화!) ====================

/**
 * 🎲 상품 풀 기반 추첨 로직
 *
 * 예시: 총 1000개 슬롯
 * - 전설 NFT: 1개 (0.1%)
 * - 레어 굿즈: 49개 (4.9%)
 * - 일반 스티커: 200개 (20%)
 * - 꽝: 750개 (75%)
 */
function drawPrizeFromPool(
    prizes: RafflePrize[],
    isLimited: boolean = true
): {
    prize: RafflePrize;
    slotNumber: number;
} {
    // 🎯 제한형: 수량 > 0인 상품만, 무제한형: 모든 활성 상품
    const activePrizes = isLimited
        ? prizes.filter((prize) => prize.isActive && prize.quantity > 0)
        : prizes.filter((prize) => prize.isActive);
    const totalSlots = activePrizes.reduce(
        (sum, prize) => sum + prize.quantity,
        0
    );

    if (totalSlots === 0) {
        throw new Error("No available prizes in pool");
    }

    // 🎯 암호학적 안전한 난수 생성
    const randomSlot = Math.floor(Math.random() * totalSlots);

    let currentSlot = 0;
    for (const prize of activePrizes.sort((a, b) => a.order - b.order)) {
        if (randomSlot < currentSlot + prize.quantity) {
            return { prize, slotNumber: randomSlot };
        }
        currentSlot += prize.quantity;
    }

    throw new Error("Invalid prize pool configuration");
}

// ==================== Update Raffle Input ====================

export interface UpdateRaffleInput extends Partial<CreateRaffleInput> {
    id: string; // 업데이트할 래플 ID
}

// ==================== Create Raffle (단순화!) ====================

export async function createRaffle(
    input: CreateRaffleInput
): Promise<RaffleResult<RaffleWithDetails>> {
    try {
        // 🔒 인증 및 권한 검증
        const session = await requireAuth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { player: true },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Admin 또는 Artist 권한 확인
        if (user.role !== "admin" && !user.player?.isArtist) {
            return {
                success: false,
                error: "Insufficient permissions. Admin or Artist role required.",
            };
        }

        // Artist인 경우 자신의 래플만 생성 가능
        if (
            user.role !== "admin" &&
            input.artistId &&
            input.artistId !== user.player?.artistId
        ) {
            return {
                success: false,
                error: "Artists can only create raffles for themselves",
            };
        }

        // artistId 유효성 검증 및 변환
        let validatedArtistId: string | undefined;
        if (input.artistId && input.artistId.trim() !== "") {
            const artist = await prisma.artist.findUnique({
                where: { id: input.artistId },
                select: { id: true },
            });

            if (!artist) {
                return {
                    success: false,
                    error: "Invalid artist ID - artist not found",
                };
            }
            validatedArtistId = input.artistId;
        }

        // ✅ 기본 입력 검증
        if (!input.title?.trim()) {
            return { success: false, error: "Title is required" };
        }

        if (!input.endDate || input.endDate <= new Date()) {
            return { success: false, error: "End date must be in the future" };
        }

        if (input.startDate && input.startDate >= input.endDate) {
            return {
                success: false,
                error: "Start date must be before end date",
            };
        }

        if (input.drawDate && input.drawDate < input.endDate) {
            return {
                success: false,
                error: "Draw date must be after end date",
            };
        }

        if (!input.prizes || input.prizes.length === 0) {
            return { success: false, error: "At least one prize is required" };
        }

        // ✅ 상품 풀 검증
        let totalSlots = 0;
        for (const [index, prize] of input.prizes.entries()) {
            if (!prize.title?.trim()) {
                return {
                    success: false,
                    error: `Prize ${index + 1}: Title is required`,
                };
            }

            if (!prize.quantity || prize.quantity <= 0) {
                return {
                    success: false,
                    error: `Prize ${
                        index + 1
                    }: Quantity must be greater than 0`,
                };
            }

            totalSlots += prize.quantity;

            // 상품 타입별 검증
            if (prize.type === "ASSET") {
                if (!prize.assetId || !prize.assetAmount) {
                    return {
                        success: false,
                        error: `Prize ${
                            index + 1
                        }: Asset prize requires assetId and amount`,
                    };
                }

                if (prize.assetAmount <= 0) {
                    return {
                        success: false,
                        error: `Prize ${
                            index + 1
                        }: Asset amount must be greater than 0`,
                    };
                }

                // Asset 존재 확인
                const asset = await prisma.asset.findUnique({
                    where: { id: prize.assetId },
                });
                if (!asset || !asset.isActive) {
                    return {
                        success: false,
                        error: `Prize ${index + 1}: Invalid or inactive asset`,
                    };
                }
            }

            if (prize.type === "NFT") {
                if (!prize.spgAddress || !prize.nftQuantity) {
                    return {
                        success: false,
                        error: `Prize ${
                            index + 1
                        }: NFT prize requires SPG address and quantity`,
                    };
                }

                if (prize.nftQuantity <= 0) {
                    return {
                        success: false,
                        error: `Prize ${
                            index + 1
                        }: NFT quantity must be greater than 0`,
                    };
                }

                // SPG 주소 형식 검증
                if (!/^0x[a-fA-F0-9]{40}$/.test(prize.spgAddress)) {
                    return {
                        success: false,
                        error: `Prize ${index + 1}: Invalid SPG address format`,
                    };
                }

                const spg = await prisma.story_spg.findUnique({
                    where: { address: prize.spgAddress },
                });
                if (!spg) {
                    return {
                        success: false,
                        error: `Prize ${index + 1}: Invalid SPG address`,
                    };
                }
            }
        }

        // 🏗️ 트랜잭션으로 래플과 상품들 생성
        const raffleResult = await prisma.$transaction(async (tx) => {
            // 1. Raffle 생성
            const newRaffle = await tx.raffle.create({
                data: {
                    title: input.title,
                    description: input.description,
                    imgUrl: input.imgUrl,
                    artistId: validatedArtistId,

                    // 📅 날짜 설정
                    startDate: input.startDate || new Date(),
                    endDate: input.endDate,
                    drawDate: input.drawDate,

                    // ⚡ 공개 방식
                    instantReveal: input.instantReveal ?? true,

                    // 🎯 상품 소진 방식
                    isLimited: input.isLimited ?? true,

                    // 🎨 UI 표현
                    displayType: input.displayType || "GACHA",

                    // 👥 참가 조건
                    maxParticipants: input.maxParticipants,
                    entryFeeAssetId: input.entryFeeAssetId,
                    entryFeeAmount: input.entryFeeAmount || 0,
                    allowMultipleEntry: input.allowMultipleEntry || false,
                    maxEntriesPerPlayer: input.maxEntriesPerPlayer,

                    // 🔧 설정
                    isPublic: input.isPublic !== false,
                    isActive: true,

                    // 📊 통계
                    totalSlots,
                    totalParticipants: 0,
                },
            });

            // 2. RafflePrize들 생성
            const prizes = await Promise.all(
                input.prizes.map(async (prize, index) => {
                    return await tx.rafflePrize.create({
                        data: {
                            raffleId: newRaffle.id,
                            title: prize.title,
                            description: prize.description,
                            imageUrl: prize.imageUrl,
                            order: prize.order ?? index,
                            quantity: prize.quantity,
                            prizeType: prize.type,
                            assetId: prize.assetId,
                            assetAmount: prize.assetAmount,
                            spgAddress: prize.spgAddress,
                            nftQuantity: prize.nftQuantity,
                            isActive: true,
                        },
                        include: {
                            asset: true,
                            spg: true,
                        },
                    });
                })
            );

            return { raffle: newRaffle, prizes };
        });

        // 완전한 데이터 조회
        const completeRaffle = await prisma.raffle.findUnique({
            where: { id: raffleResult.raffle.id },
            include: {
                artist: { select: { id: true, name: true } },
                prizes: {
                    include: {
                        asset: true,
                        spg: true,
                    },
                    orderBy: { order: "asc" },
                },
                _count: {
                    select: {
                        participants: true,
                        winners: true,
                        prizes: true,
                    },
                },
            },
        });

        // 상태 계산 추가
        const raffleWithStatus = {
            ...completeRaffle,
            status: calculateRaffleStatus(
                completeRaffle!.startDate,
                completeRaffle!.endDate,
                completeRaffle!.drawDate
            ),
        } as RaffleWithDetails;

        revalidatePath("/admin/raffles");

        return {
            success: true,
            data: raffleWithStatus,
        };
    } catch (error) {
        console.error("❌ Error creating raffle:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to create raffle",
        };
    }
}

// ==================== Update Raffle ====================

export async function updateRaffle(
    input: UpdateRaffleInput
): Promise<RaffleResult<RaffleWithDetails>> {
    try {
        // 🔒 인증 및 권한 검증
        const session = await requireAuth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { player: true },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // 기존 래플 조회 및 권한 확인
        const existingRaffle = await prisma.raffle.findUnique({
            where: { id: input.id },
            include: {
                prizes: true,
                participants: true,
            },
        });

        if (!existingRaffle) {
            return { success: false, error: "Raffle not found" };
        }

        // Admin 또는 래플 소유자만 수정 가능
        if (
            user.role !== "admin" &&
            (!user.player?.isArtist ||
                existingRaffle.artistId !== user.player.artistId)
        ) {
            return {
                success: false,
                error: "Insufficient permissions. Admin or raffle owner required.",
            };
        }

        // 래플이 이미 시작된 경우 제한적 수정만 허용 (단, dev 환경에서는 제외)
        const raffleStatus = calculateRaffleStatus(
            existingRaffle.startDate,
            existingRaffle.endDate,
            existingRaffle.drawDate
        );

        const isDevelopment = process.env.NODE_ENV === "development";

        if (
            !isDevelopment &&
            (raffleStatus === "ACTIVE" || raffleStatus === "COMPLETED")
        ) {
            // 활성화/완료된 래플은 제한적 수정만 허용 (프로덕션 환경에서만)
            const allowedFields = [
                "description",
                "imgUrl",
                "isPublic",
                "isActive",
                "allowMultipleEntry",
                "maxEntriesPerPlayer",
            ];
            const attemptedFields = Object.keys(input).filter(
                (key) => key !== "id"
            );
            const restrictedFields = attemptedFields.filter(
                (field) => !allowedFields.includes(field)
            );

            if (restrictedFields.length > 0) {
                return {
                    success: false,
                    error: `Cannot modify ${restrictedFields.join(
                        ", "
                    )} after raffle has started. Only description, image, visibility, and active status can be changed.`,
                };
            }
        }

        // artistId 유효성 검증 및 변환
        let validatedArtistId: string | undefined =
            existingRaffle.artistId || undefined;
        if (input.artistId !== undefined) {
            if (input.artistId && input.artistId.trim() !== "") {
                const artist = await prisma.artist.findUnique({
                    where: { id: input.artistId },
                    select: { id: true },
                });

                if (!artist) {
                    return {
                        success: false,
                        error: "Invalid artist ID - artist not found",
                    };
                }
                validatedArtistId = input.artistId;
            } else {
                validatedArtistId = undefined;
            }
        }

        // ✅ 기본 입력 검증 (변경된 필드만)
        if (input.title !== undefined && !input.title?.trim()) {
            return { success: false, error: "Title is required" };
        }

        if (input.endDate !== undefined && input.endDate <= new Date()) {
            return { success: false, error: "End date must be in the future" };
        }

        if (
            input.startDate !== undefined &&
            input.endDate !== undefined &&
            input.startDate >= input.endDate
        ) {
            return {
                success: false,
                error: "Start date must be before end date",
            };
        }

        if (
            input.drawDate !== undefined &&
            input.endDate !== undefined &&
            input.drawDate < input.endDate
        ) {
            return {
                success: false,
                error: "Draw date must be after end date",
            };
        }

        // ✅ 상품 풀 검증 (상품이 변경된 경우만)
        let totalSlots = existingRaffle.totalSlots;
        const prizesToUpdate: any[] = [];

        if (input.prizes && input.prizes.length > 0) {
            // 개발 환경에서는 경고 로그만 출력
            if (isDevelopment && existingRaffle.participants.length > 0) {
                console.warn(
                    `⚠️ DEV MODE: Modifying prizes with ${existingRaffle.participants.length} existing participants`
                );
            }

            // 프로덕션에서는 참가자가 있으면 상품 변경 제한
            if (!isDevelopment && existingRaffle.participants.length > 0) {
                return {
                    success: false,
                    error: "Cannot modify prizes after participants have joined (production mode)",
                };
            }

            totalSlots = 0;
            for (const [index, prize] of input.prizes.entries()) {
                if (!prize.title?.trim()) {
                    return {
                        success: false,
                        error: `Prize ${index + 1}: Title is required`,
                    };
                }

                if (!prize.quantity || prize.quantity <= 0) {
                    return {
                        success: false,
                        error: `Prize ${
                            index + 1
                        }: Quantity must be greater than 0`,
                    };
                }

                totalSlots += prize.quantity;

                // 상품 타입별 검증
                if (prize.type === "ASSET") {
                    if (!prize.assetId || !prize.assetAmount) {
                        return {
                            success: false,
                            error: `Prize ${
                                index + 1
                            }: Asset prize requires assetId and amount`,
                        };
                    }

                    if (prize.assetAmount <= 0) {
                        return {
                            success: false,
                            error: `Prize ${
                                index + 1
                            }: Asset amount must be greater than 0`,
                        };
                    }

                    // Asset 존재 확인
                    const asset = await prisma.asset.findUnique({
                        where: { id: prize.assetId },
                    });
                    if (!asset || !asset.isActive) {
                        return {
                            success: false,
                            error: `Prize ${
                                index + 1
                            }: Invalid or inactive asset`,
                        };
                    }
                }

                if (prize.type === "NFT") {
                    if (!prize.spgAddress || !prize.nftQuantity) {
                        return {
                            success: false,
                            error: `Prize ${
                                index + 1
                            }: NFT prize requires SPG address and quantity`,
                        };
                    }

                    if (prize.nftQuantity <= 0) {
                        return {
                            success: false,
                            error: `Prize ${
                                index + 1
                            }: NFT quantity must be greater than 0`,
                        };
                    }

                    // SPG 주소 형식 검증
                    if (!/^0x[a-fA-F0-9]{40}$/.test(prize.spgAddress)) {
                        return {
                            success: false,
                            error: `Prize ${
                                index + 1
                            }: Invalid SPG address format`,
                        };
                    }

                    const spg = await prisma.story_spg.findUnique({
                        where: { address: prize.spgAddress },
                    });
                    if (!spg) {
                        return {
                            success: false,
                            error: `Prize ${index + 1}: Invalid SPG address`,
                        };
                    }
                }

                // 업데이트할 상품 데이터 준비
                prizesToUpdate.push({
                    title: prize.title,
                    description: prize.description,
                    imageUrl: prize.imageUrl,
                    order: prize.order ?? index,
                    quantity: prize.quantity,
                    prizeType: prize.type,
                    assetId: prize.assetId,
                    assetAmount: prize.assetAmount,
                    spgAddress: prize.spgAddress,
                    nftQuantity: prize.nftQuantity,
                    isActive: true,
                });
            }
        }

        // 🏗️ 트랜잭션으로 래플과 상품들 업데이트
        await prisma.$transaction(async (tx) => {
            // 1. Raffle 업데이트 (변경된 필드만)
            const updateData: any = {
                updatedAt: new Date(),
            };

            if (input.title !== undefined) updateData.title = input.title;
            if (input.description !== undefined)
                updateData.description = input.description;
            if (input.imgUrl !== undefined) updateData.imgUrl = input.imgUrl;
            if (validatedArtistId !== existingRaffle.artistId)
                updateData.artistId = validatedArtistId;
            if (input.startDate !== undefined)
                updateData.startDate = input.startDate;
            if (input.endDate !== undefined) updateData.endDate = input.endDate;
            if (input.drawDate !== undefined)
                updateData.drawDate = input.drawDate;
            if (input.instantReveal !== undefined)
                updateData.instantReveal = input.instantReveal;
            if (input.isLimited !== undefined)
                updateData.isLimited = input.isLimited;
            if (input.displayType !== undefined)
                updateData.displayType = input.displayType;
            if (input.maxParticipants !== undefined)
                updateData.maxParticipants = input.maxParticipants;
            if (input.entryFeeAssetId !== undefined)
                updateData.entryFeeAssetId = input.entryFeeAssetId;
            if (input.entryFeeAmount !== undefined)
                updateData.entryFeeAmount = input.entryFeeAmount;
            if (input.allowMultipleEntry !== undefined)
                updateData.allowMultipleEntry = input.allowMultipleEntry;
            if (input.maxEntriesPerPlayer !== undefined)
                updateData.maxEntriesPerPlayer = input.maxEntriesPerPlayer;
            if (input.isPublic !== undefined)
                updateData.isPublic = input.isPublic;
            if (totalSlots !== existingRaffle.totalSlots)
                updateData.totalSlots = totalSlots;

            const updatedRaffle = await tx.raffle.update({
                where: { id: input.id },
                data: updateData,
            });

            // 2. 상품이 변경된 경우 안전하게 업데이트/추가
            if (prizesToUpdate.length > 0) {
                // 기존 상품들 조회
                const existingPrizes = await tx.rafflePrize.findMany({
                    where: { raffleId: input.id },
                    include: {
                        participants: true,
                        winners: true,
                    },
                });

                // 참가자나 당첨자가 있는 상품은 수정 제한 (개발 환경에서도 안전성 우선)
                const prizesWithData = existingPrizes.filter(
                    (prize) =>
                        prize.participants.length > 0 ||
                        prize.winners.length > 0
                );

                if (prizesWithData.length > 0 && !isDevelopment) {
                    throw new Error(
                        `Cannot modify prizes that have participants or winners: ${prizesWithData
                            .map((p) => p.title)
                            .join(", ")}`
                    );
                }

                // 개발 환경에서는 경고만 로그
                if (prizesWithData.length > 0 && isDevelopment) {
                    console.warn(
                        `⚠️ DEV MODE: Modifying prizes with existing data: ${prizesWithData
                            .map((p) => p.title)
                            .join(", ")}`
                    );
                }

                // 기존 상품들을 비활성화
                await tx.rafflePrize.updateMany({
                    where: { raffleId: input.id },
                    data: { isActive: false },
                });

                // 새 상품들 생성
                await Promise.all(
                    prizesToUpdate.map(async (prize, index) => {
                        return await tx.rafflePrize.create({
                            data: {
                                raffleId: input.id,
                                ...prize,
                                order: prize.order ?? index,
                            },
                        });
                    })
                );
            }

            return updatedRaffle;
        });

        // 완전한 데이터 조회
        const completeRaffle = await prisma.raffle.findUnique({
            where: { id: input.id },
            include: {
                artist: { select: { id: true, name: true } },
                prizes: {
                    include: {
                        asset: true,
                        spg: true,
                    },
                    orderBy: { order: "asc" },
                },
                _count: {
                    select: {
                        participants: true,
                        winners: true,
                        prizes: true,
                    },
                },
            },
        });

        // 상태 계산 추가
        const raffleWithStatus = {
            ...completeRaffle,
            status: calculateRaffleStatus(
                completeRaffle!.startDate,
                completeRaffle!.endDate,
                completeRaffle!.drawDate
            ),
        } as RaffleWithDetails;

        revalidatePath("/admin/raffles");

        return {
            success: true,
            data: raffleWithStatus,
        };
    } catch (error) {
        console.error("❌ Error updating raffle:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to update raffle",
        };
    }
}

// ==================== Get Raffles ====================

export interface GetRafflesInput {
    status?: RaffleStatus[];
    artistId?: string;
    isPublic?: boolean;
    playerId?: string;
    limit?: number;
    offset?: number;
}

export async function getRaffles(
    input?: GetRafflesInput
): Promise<RaffleResult<RaffleWithDetails[]>> {
    try {
        const where: {
            artistId?: string;
            isPublic?: boolean;
            participants?: {
                some: { playerId: string };
            };
        } = {};

        if (input?.artistId) {
            where.artistId = input.artistId;
        }

        if (input?.isPublic !== undefined) {
            where.isPublic = input.isPublic;
        }

        if (input?.playerId) {
            where.participants = {
                some: { playerId: input.playerId },
            };
        }

        const raffles = await prisma.raffle.findMany({
            cacheStrategy: {
                swr: 30,
                ttl: 60,
                tags: ["raffles", JSON.stringify(input)],
            },
            where,
            include: {
                artist: { select: { id: true, name: true } },
                prizes: {
                    where: { isActive: true }, // 🔧 활성화된 상품만 조회
                    include: {
                        asset: true,
                        spg: true,
                    },
                    orderBy: { order: "asc" },
                },
                _count: {
                    select: {
                        participants: true,
                        winners: true,
                        prizes: { where: { isActive: true } }, // 🔧 활성화된 상품만 카운트
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: input?.limit,
            skip: input?.offset,
        });

        // 상태 계산 추가
        const rafflesWithStatus = raffles.map((raffle) => ({
            ...raffle,
            status: calculateRaffleStatus(
                raffle.startDate,
                raffle.endDate,
                raffle.drawDate
            ),
        })) as RaffleWithDetails[];

        // 🔍 상태 필터링 (계산된 상태 기준)
        const filteredRaffles = input?.status
            ? rafflesWithStatus.filter((raffle) =>
                  input.status!.includes(raffle.status!)
              )
            : rafflesWithStatus;

        return { success: true, data: filteredRaffles };
    } catch (error) {
        console.error("Error fetching raffles:", error);
        return {
            success: false,
            error: "Failed to fetch raffles",
        };
    }
}

// ==================== Get Raffle Details ====================

export async function getRaffleDetails(
    raffleId: string
): Promise<RaffleResult<RaffleWithDetails>> {
    try {
        const raffle = await prisma.raffle.findUnique({
            cacheStrategy: {
                swr: 5,
                ttl: 10,
                tags: ["raffleDetails", raffleId],
            },
            where: { id: raffleId },
            include: {
                artist: { select: { id: true, name: true } },
                prizes: {
                    where: { isActive: true }, // 🔧 활성화된 상품만 조회
                    include: {
                        asset: true,
                        spg: true,
                        participants: {
                            include: {
                                player: {
                                    select: {
                                        id: true,
                                        name: true,
                                        nickname: true,
                                    },
                                },
                            },
                        },
                        winners: {
                            include: {
                                player: {
                                    select: {
                                        id: true,
                                        name: true,
                                        nickname: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { order: "asc" },
                },
                participants: {
                    include: {
                        player: {
                            select: { id: true, name: true, nickname: true },
                        },
                        prize: {
                            select: { id: true, title: true, prizeType: true },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
                winners: {
                    include: {
                        player: {
                            select: { id: true, name: true, nickname: true },
                        },
                        prize: true,
                    },
                    orderBy: { createdAt: "desc" },
                },
                _count: {
                    select: {
                        participants: true,
                        winners: true,
                        prizes: { where: { isActive: true } }, // 🔧 활성화된 상품만 카운트
                    },
                },
            },
        });

        if (!raffle) {
            return { success: false, error: "Raffle not found" };
        }

        // 상태 계산 추가
        const raffleWithStatus = {
            ...raffle,
            status: calculateRaffleStatus(
                raffle.startDate,
                raffle.endDate,
                raffle.drawDate
            ),
        } as RaffleWithDetails;

        return { success: true, data: raffleWithStatus };
    } catch (error) {
        console.error("Error fetching raffle details:", error);
        return {
            success: false,
            error: "Failed to fetch raffle details",
        };
    }
}

// ==================== Participate in Raffle ====================

export interface ParticipateRaffleInput {
    raffleId: string;
    playerId: string;
    ipAddress?: string;
    userAgent?: string;
}

export async function participateInRaffle(
    input: ParticipateRaffleInput
): Promise<RaffleResult<RaffleParticipantWithRelations>> {
    try {
        // 🔒 인증 및 권한 검증
        const session = await requireAuth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        // playerId 소유권 검증
        const player = await prisma.player.findUnique({
            where: { id: input.playerId },
            include: { user: true },
        });

        if (!player || player.userId !== session.user.id) {
            return {
                success: false,
                error: "Invalid player or insufficient permissions",
            };
        }

        // 1. 래플 기본 검증
        const raffle = (await prisma.raffle.findUnique({
            where: { id: input.raffleId },
            include: {
                entryFeeAsset: true,
                prizes: {
                    where: { isActive: true },
                    orderBy: { order: "asc" },
                },
                _count: { select: { participants: true } },
            },
        })) as RaffleWithPrizes | null;

        if (!raffle) {
            return { success: false, error: "Raffle not found" };
        }

        // 래플 상태 확인
        const status = calculateRaffleStatus(
            raffle.startDate,
            raffle.endDate,
            raffle.drawDate
        );
        if (status !== "ACTIVE") {
            return {
                success: false,
                error: `Raffle is ${status.toLowerCase()}`,
            };
        }

        // 트랜잭션으로 참가 처리
        const result = await prisma.$transaction(async (tx) => {
            // 🔒 중복 참가 확인
            if (!raffle.allowMultipleEntry) {
                const existingParticipant =
                    await tx.raffleParticipant.findFirst({
                        where: {
                            raffleId: input.raffleId,
                            playerId: input.playerId,
                        },
                    });

                if (existingParticipant) {
                    throw new Error("Already participated");
                }
            } else if (raffle.maxEntriesPerPlayer) {
                // 🔒 플레이어당 최대 참여 횟수 확인
                const existingParticipantCount =
                    await tx.raffleParticipant.count({
                        where: {
                            raffleId: input.raffleId,
                            playerId: input.playerId,
                        },
                    });

                if (existingParticipantCount >= raffle.maxEntriesPerPlayer) {
                    throw new Error(
                        `Maximum ${raffle.maxEntriesPerPlayer} entries per player exceeded`
                    );
                }
            }

            // 🔒 참가자 수 원자적 증가 및 검증 (동시성 문제 해결)
            const updatedRaffle = await tx.raffle.update({
                where: { id: input.raffleId },
                data: {
                    totalParticipants: { increment: 1 },
                },
                select: { totalParticipants: true, maxParticipants: true },
            });

            // 최대 참가자 수 초과 시 롤백
            if (
                updatedRaffle.maxParticipants &&
                updatedRaffle.totalParticipants > updatedRaffle.maxParticipants
            ) {
                throw new Error(
                    "Raffle is full - maximum participants exceeded"
                );
            }

            // 4. 참가비 처리
            if (raffle.entryFeeAssetId && raffle.entryFeeAmount > 0) {
                const feeValidation = await validatePlayerAsset(
                    {
                        playerId: input.playerId,
                        assetId: raffle.entryFeeAssetId,
                        requiredAmount: raffle.entryFeeAmount,
                    },
                    tx
                );

                if (!feeValidation.success) {
                    throw new Error(
                        `Entry fee check failed: ${feeValidation.error}`
                    );
                }

                const feeDeduction = await updatePlayerAsset(
                    {
                        transaction: {
                            playerId: input.playerId,
                            assetId: raffle.entryFeeAssetId,
                            amount: raffle.entryFeeAmount,
                            operation: "SUBTRACT",
                            reason: `Raffle participation fee: ${raffle.title}`,
                        },
                    },
                    tx
                );

                if (!feeDeduction.success) {
                    throw new Error(
                        `Failed to deduct entry fee: ${feeDeduction.error}`
                    );
                }
            }

            // 🎲 즉시 공개인 경우 → 즉시 추첨 실행!
            let drawnPrize: RafflePrize | undefined;
            let slotNumber: number | undefined;
            let randomSeed: string | undefined;

            if (raffle.instantReveal) {
                try {
                    // 🔄 최신 상품 정보 조회 (수량 변경 반영)
                    const currentPrizes = await tx.rafflePrize.findMany({
                        where: {
                            raffleId: input.raffleId,
                            isActive: true,
                            quantity: { gt: 0 }, // 수량이 0보다 큰 것만
                        },
                        orderBy: { order: "asc" },
                    });

                    if (currentPrizes.length === 0) {
                        console.error(
                            `⚠️ All prizes exhausted for raffle ${input.raffleId}`
                        );
                        throw new Error(
                            "All prizes have been distributed - raffle pool exhausted"
                        );
                    }

                    const drawResult = drawPrizeFromPool(
                        currentPrizes,
                        raffle.isLimited
                    );
                    drawnPrize = drawResult.prize;
                    slotNumber = drawResult.slotNumber;
                    randomSeed = crypto.randomBytes(16).toString("hex");
                } catch (error) {
                    console.error("❌ Instant draw failed:", error);
                    throw new Error("Prize drawing failed");
                }
            }

            // 5. 참가자 등록
            const participant = await tx.raffleParticipant.create({
                data: {
                    raffleId: input.raffleId,
                    playerId: input.playerId,
                    prizeId: drawnPrize?.id,
                    drawnAt: drawnPrize ? new Date() : null,
                    revealedAt: null, // 사용자가 결과 확인 시 업데이트
                    isRevealed: false,
                    slotNumber,
                    randomSeed,
                },
                include: {
                    player: {
                        select: { id: true, name: true, nickname: true },
                    },
                    prize: {
                        include: {
                            asset: true,
                            spg: { include: { network: true } },
                        },
                    },
                },
            });

            // 6. 래플 통계는 이미 위에서 업데이트됨 (동시성 안전성 위해)

            // 7. 즉시 당첨인 경우 → RaffleWinner 생성 및 상품 수량 감소
            if (drawnPrize && drawnPrize.prizeType !== "EMPTY") {
                await tx.raffleWinner.create({
                    data: {
                        raffleId: input.raffleId,
                        prizeId: drawnPrize.id,
                        playerId: input.playerId,
                        status: "PENDING",
                    },
                });

                // 🎯 제한형일 때만 상품 수량 감소 (중요!)
                if (raffle.isLimited) {
                    await tx.rafflePrize.update({
                        where: { id: drawnPrize.id },
                        data: {
                            quantity: { decrement: 1 },
                        },
                    });
                }
            }

            return participant as RaffleParticipantWithRelations;
        });

        // 🎁 즉시 공개 래플의 경우 트랜잭션 완료 후 자동 배포
        if (raffle.instantReveal && result.prizeId) {
            try {
                const distributeResult = await distributePrizes({
                    raffleId: input.raffleId,
                    executedBy: input.playerId,
                    playerId: input.playerId,
                });

                if (distributeResult.success) {
                    console.info(
                        `Prize instantly distributed to Player ${input.playerId}`
                    );
                } else {
                    console.error(
                        "❌ Instant prize distribution failed:",
                        distributeResult.error
                    );
                }
            } catch (error) {
                console.error("❌ Instant prize distribution failed:", error);
                // 배포 실패해도 참가는 성공으로 처리
            }
        }

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error("❌ Error participating in raffle:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to participate in raffle",
        };
    }
}

// ==================== Reveal Result (즉시 공개용) ====================

export interface RevealResultInput {
    raffleId: string;
    playerId: string;
    participantId?: string; // 특정 참여 기록을 지정할 경우
}

export interface RevealAllResultsInput {
    raffleId: string;
    playerId: string;
}

// 특정 참여 기록의 결과 공개
export async function revealRaffleResult(
    input: RevealResultInput
): Promise<RaffleResult<RaffleParticipantWithRelations>> {
    try {
        // 🔒 인증 및 권한 검증
        const session = await requireAuth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        const player = await prisma.player.findUnique({
            where: { id: input.playerId },
            include: { user: true },
        });

        if (!player || player.userId !== session.user.id) {
            return {
                success: false,
                error: "Invalid player or insufficient permissions",
            };
        }

        let participant: any;

        if (input.participantId) {
            // 특정 참여 기록 조회
            participant = await prisma.raffleParticipant.findUnique({
                where: { id: input.participantId },
                include: {
                    prize: {
                        include: {
                            asset: true,
                            spg: { include: { network: true } },
                        },
                    },
                    player: {
                        select: { id: true, name: true, nickname: true },
                    },
                },
            });

            if (
                !participant ||
                participant.raffleId !== input.raffleId ||
                participant.playerId !== input.playerId
            ) {
                return {
                    success: false,
                    error: "Invalid participation record",
                };
            }
        } else {
            // 가장 최근 미공개 참여 기록 조회
            participant = await prisma.raffleParticipant.findFirst({
                where: {
                    raffleId: input.raffleId,
                    playerId: input.playerId,
                    isRevealed: false,
                    drawnAt: { not: null }, // 추첨된 것만
                },
                include: {
                    prize: {
                        include: {
                            asset: true,
                            spg: { include: { network: true } },
                        },
                    },
                    player: {
                        select: { id: true, name: true, nickname: true },
                    },
                },
                orderBy: { createdAt: "desc" }, // 가장 최근 것부터
            });

            if (!participant) {
                return {
                    success: false,
                    error: "No unrevealed participation found",
                };
            }
        }

        if (participant.isRevealed) {
            return {
                success: true,
                data: participant as RaffleParticipantWithRelations,
            };
        }

        // 결과 공개 처리
        const updatedParticipant = await prisma.raffleParticipant.update({
            where: { id: participant.id },
            data: {
                isRevealed: true,
                revealedAt: new Date(),
            },
            include: {
                prize: {
                    include: {
                        asset: true,
                        spg: { include: { network: true } },
                    },
                },
                player: { select: { id: true, name: true, nickname: true } },
            },
        });

        return {
            success: true,
            data: updatedParticipant as RaffleParticipantWithRelations,
        };
    } catch (error) {
        console.error("❌ Error revealing result:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to reveal result",
        };
    }
}

// 모든 참여 기록의 결과 공개
export async function revealAllRaffleResults(
    input: RevealAllResultsInput
): Promise<RaffleResult<RaffleParticipantWithRelations[]>> {
    try {
        // 🔒 인증 및 권한 검증
        const session = await requireAuth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        const player = await prisma.player.findUnique({
            where: { id: input.playerId },
            include: { user: true },
        });

        if (!player || player.userId !== session.user.id) {
            return {
                success: false,
                error: "Invalid player or insufficient permissions",
            };
        }

        // 모든 미공개 참여 기록 조회
        const participants = await prisma.raffleParticipant.findMany({
            where: {
                raffleId: input.raffleId,
                playerId: input.playerId,
                isRevealed: false,
                drawnAt: { not: null }, // 추첨된 것만
            },
            include: {
                prize: {
                    include: {
                        asset: true,
                        spg: { include: { network: true } },
                    },
                },
                player: { select: { id: true, name: true, nickname: true } },
            },
            orderBy: { createdAt: "asc" },
        });

        if (participants.length === 0) {
            return {
                success: false,
                error: "No unrevealed participations found",
            };
        }

        // 모든 참여 기록 일괄 공개
        const updatedParticipants = await prisma.$transaction(async (tx) => {
            const results = [];
            for (const participant of participants) {
                const updated = await tx.raffleParticipant.update({
                    where: { id: participant.id },
                    data: {
                        isRevealed: true,
                        revealedAt: new Date(),
                    },
                    include: {
                        prize: {
                            include: {
                                asset: true,
                                spg: { include: { network: true } },
                            },
                        },
                        player: {
                            select: { id: true, name: true, nickname: true },
                        },
                    },
                });
                results.push(updated);
            }
            return results;
        });

        return {
            success: true,
            data: updatedParticipants as RaffleParticipantWithRelations[],
        };
    } catch (error) {
        console.error("❌ Error revealing all results:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to reveal all results",
        };
    }
}

// ==================== Draw All Winners (일괄 추첨) ====================

export interface DrawAllWinnersInput {
    raffleId: string;
    drawnBy: string;
}

export async function drawAllWinners(
    input: DrawAllWinnersInput
): Promise<RaffleResult<RaffleWinner[]>> {
    try {
        // 🔒 인증 및 관리자 권한 검증
        const session = await requireAuth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { player: true },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // 래플 소유권 확인
        const raffleData = (await prisma.raffle.findUnique({
            where: { id: input.raffleId },
            include: {
                prizes: {
                    where: { isActive: true },
                    orderBy: { order: "asc" },
                },
                participants: { where: { drawnAt: null } }, // 아직 추첨되지 않은 참가자들
            },
        })) as RaffleWithParticipantsAndPrizes | null;

        if (!raffleData) {
            return { success: false, error: "Raffle not found" };
        }

        // Admin이 아니고, 래플 소유자도 아닌 경우 거부
        if (
            user.role !== "admin" &&
            (!user.player?.isArtist ||
                raffleData.artistId !== user.player.artistId)
        ) {
            return {
                success: false,
                error: "Insufficient permissions. Admin or raffle owner required.",
            };
        }

        // 즉시 공개 래플은 일괄 추첨 불가
        if (raffleData.instantReveal) {
            return {
                success: false,
                error: "Cannot draw winners for instant reveal raffle",
            };
        }

        // 추첨 시간 확인
        const status = calculateRaffleStatus(
            raffleData.startDate,
            raffleData.endDate,
            raffleData.drawDate
        );
        if (status !== "WAITING_DRAW" && status !== "COMPLETED") {
            return {
                success: false,
                error: `Cannot draw winners. Raffle status: ${status}`,
            };
        }

        if (raffleData.participants.length === 0) {
            return { success: false, error: "No participants to draw" };
        }

        // 🎲 일괄 추첨 실행
        const winners = await prisma.$transaction(async (tx) => {
            const allWinners: RaffleWinner[] = [];

            // 각 참가자에게 상품 추첨
            for (const participant of raffleData.participants) {
                try {
                    // 🔄 최신 상품 정보 조회 (매번 업데이트된 수량 반영)
                    const currentPrizes = await tx.rafflePrize.findMany({
                        where: {
                            raffleId: input.raffleId,
                            isActive: true,
                            quantity: { gt: 0 }, // 수량이 0보다 큰 것만
                        },
                        orderBy: { order: "asc" },
                    });

                    if (currentPrizes.length === 0) {
                        console.error(
                            `All prizes exhausted in batch draw for raffle ${input.raffleId}`
                        );
                        break; // 남은 참가자들은 상품 없음으로 처리
                    }

                    const drawResult = drawPrizeFromPool(
                        currentPrizes,
                        raffleData.isLimited
                    );
                    const randomSeed = crypto.randomBytes(16).toString("hex");

                    // 참가자 업데이트
                    await tx.raffleParticipant.update({
                        where: { id: participant.id },
                        data: {
                            prizeId: drawResult.prize.id,
                            drawnAt: new Date(),
                            slotNumber: drawResult.slotNumber,
                            randomSeed,
                        },
                    });

                    // 당첨자 생성 (꽝이 아닌 경우만)
                    if (drawResult.prize.prizeType !== "EMPTY") {
                        const winner = await tx.raffleWinner.create({
                            data: {
                                raffleId: input.raffleId,
                                prizeId: drawResult.prize.id,
                                playerId: participant.playerId,
                                status: "PENDING",
                            },
                            include: {
                                player: {
                                    select: {
                                        id: true,
                                        name: true,
                                        nickname: true,
                                    },
                                },
                                prize: true,
                            },
                        });

                        // 🎯 제한형일 때만 상품 수량 감소 (일괄 추첨에서도 중요!)
                        if (raffleData.isLimited) {
                            await tx.rafflePrize.update({
                                where: { id: drawResult.prize.id },
                                data: {
                                    quantity: { decrement: 1 },
                                },
                            });
                        }

                        allWinners.push(winner);
                    }
                } catch (error) {
                    console.error(
                        `❌ Failed to draw for participant ${participant.id}:`,
                        error
                    );
                    // 개별 참가자 추첨 실패는 로그만 남기고 계속 진행
                }
            }

            return allWinners;
        });

        return { success: true, data: winners };
    } catch (error) {
        console.error("❌ Error drawing all winners:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to draw winners",
        };
    }
}

// ==================== Distribute Prizes ====================

export interface DistributePrizesInput {
    raffleId: string;
    executedBy?: string;
    playerId?: string; // 특정 플레이어만 배포할 경우
}

export async function distributePrizes(
    input: DistributePrizesInput
): Promise<RaffleResult<{ distributed: number; failed: number }>> {
    try {
        // 🔒 인증 및 관리자 권한 검증
        const session = await requireAuth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { player: true },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // 래플 및 권한 확인
        const raffle = await prisma.raffle.findUnique({
            where: { id: input.raffleId },
            select: { id: true, artistId: true, instantReveal: true },
        });

        if (!raffle) {
            return { success: false, error: "Raffle not found" };
        }

        // 권한 체크: Admin, 래플 소유자, 또는 즉시 공개 래플의 참가자
        let hasPermission = false;

        if (user.role === "admin") {
            hasPermission = true;
        } else if (
            user.player?.isArtist &&
            raffle.artistId === user.player.artistId
        ) {
            hasPermission = true;
        } else if (raffle.instantReveal && input.executedBy) {
            // 즉시 공개 래플의 경우 참가자 본인이 호출하는지 확인
            const participant = await prisma.raffleParticipant.findFirst({
                where: {
                    raffleId: input.raffleId,
                    playerId: input.executedBy,
                },
                include: { player: { include: { user: true } } },
            });

            if (participant && participant.player.userId === session.user.id) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            return {
                success: false,
                error: "Insufficient permissions. Admin, raffle owner, or participant required.",
            };
        }

        // 당첨자 조회 (특정 플레이어 지정 시 해당 플레이어만)
        const where: any = {
            raffleId: input.raffleId,
            status: "PENDING",
        };

        if (input.playerId) {
            where.playerId = input.playerId;
        }

        const winners = (await prisma.raffleWinner.findMany({
            where,
            include: {
                player: {
                    include: {
                        user: {
                            include: {
                                wallets: {
                                    where: { status: "ACTIVE" },
                                    orderBy: { default: "desc" },
                                },
                            },
                        },
                    },
                },
                prize: {
                    include: {
                        asset: true,
                        spg: { include: { network: true } },
                    },
                },
            },
        })) as RaffleWinnerWithRelations[];

        if (winners.length === 0) {
            return { success: false, error: "No pending prizes to distribute" };
        }

        let distributedCount = 0;
        let failedCount = 0;

        // 각 당첨자별로 상품 배포
        const distributionResults = await Promise.allSettled(
            winners.map(async (winner) => {
                return await prisma.$transaction(async (tx) => {
                    try {
                        let txHash: string | undefined;

                        if (winner.prize.prizeType === "ASSET") {
                            // Asset 상품 배포
                            const result = await updatePlayerAsset(
                                {
                                    transaction: {
                                        playerId: winner.playerId,
                                        assetId: winner.prize.assetId!,
                                        amount: winner.prize.assetAmount!,
                                        operation: "ADD",
                                        reason: `Raffle prize: ${winner.prize.title}`,
                                    },
                                },
                                tx
                            );

                            if (!result.success) {
                                throw new Error(
                                    `Asset distribution failed: ${result.error}`
                                );
                            }
                        } else if (winner.prize.prizeType === "NFT") {
                            // NFT 상품 배포
                            const userWallet =
                                winner.player.user?.wallets?.find(
                                    (wallet) => wallet.default
                                )?.address;

                            if (!userWallet) {
                                throw new Error(
                                    "User wallet address not found"
                                );
                            }

                            const result = await initialTransfer({
                                spgAddress: winner.prize.spgAddress!,
                                quantity: winner.prize.nftQuantity!,
                                toAddress: userWallet,
                            });

                            if (!result) {
                                throw new Error("NFT transfer failed");
                            }

                            txHash =
                                "txHash" in result
                                    ? result.txHash
                                    : result.txHashes[0];
                            if (!txHash) {
                                throw new Error("Transaction hash not found");
                            }
                        }

                        // 성공 시 상태 업데이트
                        await tx.raffleWinner.update({
                            where: { id: winner.id },
                            data: {
                                status: "DISTRIBUTED",
                                distributedAt: new Date(),
                                transactionHash: txHash,
                            },
                        });

                        return {
                            winnerId: winner.id,
                            playerName:
                                winner.player.nickname || winner.player.name,
                            success: true,
                            txHash,
                        };
                    } catch (error) {
                        // 실패 시 상태 업데이트
                        await tx.raffleWinner.update({
                            where: { id: winner.id },
                            data: {
                                status: "FAILED",
                                failureReason:
                                    error instanceof Error
                                        ? error.message
                                        : "Unknown error",
                            },
                        });

                        throw error;
                    }
                });
            })
        );

        // 결과 집계
        distributionResults.forEach((result, index) => {
            if (result.status === "fulfilled") {
                distributedCount++;
            } else {
                failedCount++;
                const winner = winners[index];
                console.error(
                    `❌ Failed to distribute prize to ${
                        winner.player.nickname || winner.player.name
                    }:`,
                    result.reason
                );
            }
        });

        return {
            success: true,
            data: {
                distributed: distributedCount,
                failed: failedCount,
            },
        };
    } catch (error) {
        console.error("❌ Error distributing prizes:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to distribute prizes",
        };
    }
}

// ==================== Player Participation Queries (다중 참여 지원) ====================

export interface GetPlayerParticipationsInput {
    raffleId: string;
    playerId: string;
    includeUnrevealed?: boolean;
}

export interface PlayerParticipationSummary {
    totalParticipations: number;
    revealedCount: number;
    unrevealedCount: number;
    totalWins: number;
    participations: RaffleParticipantWithRelations[];
    winners: RaffleWinnerWithRelations[];
}

// 플레이어의 특정 래플 참여 현황 조회 (다중 참여 지원)
export async function getPlayerParticipations(
    input: GetPlayerParticipationsInput
): Promise<RaffleResult<PlayerParticipationSummary>> {
    try {
        // 🔒 인증 및 권한 검증
        const session = await requireAuth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        const player = await prisma.player.findUnique({
            where: { id: input.playerId },
            include: { user: true },
        });

        if (!player || player.userId !== session.user.id) {
            return {
                success: false,
                error: "Invalid player or insufficient permissions",
            };
        }

        // 모든 참여 기록 조회
        const where: any = {
            raffleId: input.raffleId,
            playerId: input.playerId,
        };

        if (input.includeUnrevealed === false) {
            where.isRevealed = true;
        }

        const participations = await prisma.raffleParticipant.findMany({
            where,
            include: {
                prize: {
                    include: {
                        asset: true,
                        spg: { include: { network: true } },
                    },
                },
                player: { select: { id: true, name: true, nickname: true } },
            },
            orderBy: { createdAt: "asc" },
        });

        // 당첨 기록 조회
        const winners = (await prisma.raffleWinner.findMany({
            where: {
                raffleId: input.raffleId,
                playerId: input.playerId,
            },
            include: {
                player: {
                    include: {
                        user: {
                            include: {
                                wallets: {
                                    where: { status: "ACTIVE" },
                                    orderBy: { default: "desc" },
                                },
                            },
                        },
                    },
                },
                prize: {
                    include: {
                        asset: true,
                        spg: { include: { network: true } },
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        })) as RaffleWinnerWithRelations[];

        const summary: PlayerParticipationSummary = {
            totalParticipations: participations.length,
            revealedCount: participations.filter((p) => p.isRevealed).length,
            unrevealedCount: participations.filter((p) => !p.isRevealed).length,
            totalWins: winners.length,
            participations: participations as RaffleParticipantWithRelations[],
            winners,
        };

        return { success: true, data: summary };
    } catch (error) {
        console.error("❌ Error getting player participations:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get player participations",
        };
    }
}

export interface GetUnrevealedCountInput {
    raffleId: string;
    playerId: string;
}

// 플레이어의 미공개 결과 개수 조회
export async function getUnrevealedCount(
    input: GetUnrevealedCountInput
): Promise<RaffleResult<{ count: number }>> {
    try {
        const session = await requireAuth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        const player = await prisma.player.findUnique({
            where: { id: input.playerId },
            include: { user: true },
        });

        if (!player || player.userId !== session.user.id) {
            return {
                success: false,
                error: "Invalid player or insufficient permissions",
            };
        }

        const count = await prisma.raffleParticipant.count({
            where: {
                raffleId: input.raffleId,
                playerId: input.playerId,
                isRevealed: false,
                drawnAt: { not: null }, // 추첨된 것만
            },
        });

        return { success: true, data: { count } };
    } catch (error) {
        console.error("❌ Error getting unrevealed count:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get unrevealed count",
        };
    }
}

export interface BulkRevealInput {
    raffleId: string;
    playerId: string;
    participantIds?: string[]; // 특정 참여 기록들만 공개할 경우
}

// 여러 참여 기록을 한 번에 공개
export async function bulkRevealResults(input: BulkRevealInput): Promise<
    RaffleResult<{
        revealed: RaffleParticipantWithRelations[];
        alreadyRevealed: number;
    }>
> {
    try {
        const session = await requireAuth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        const player = await prisma.player.findUnique({
            where: { id: input.playerId },
            include: { user: true },
        });

        if (!player || player.userId !== session.user.id) {
            return {
                success: false,
                error: "Invalid player or insufficient permissions",
            };
        }

        const where: any = {
            raffleId: input.raffleId,
            playerId: input.playerId,
            drawnAt: { not: null }, // 추첨된 것만
        };

        if (input.participantIds && input.participantIds.length > 0) {
            where.id = { in: input.participantIds };
        }

        // 공개 대상 참여 기록들 조회
        const participants = await prisma.raffleParticipant.findMany({
            where,
            include: {
                prize: {
                    include: {
                        asset: true,
                        spg: { include: { network: true } },
                    },
                },
                player: { select: { id: true, name: true, nickname: true } },
            },
            orderBy: { createdAt: "asc" },
        });

        if (participants.length === 0) {
            return { success: false, error: "No participation records found" };
        }

        // 미공개 기록만 필터링
        const unrevealedParticipants = participants.filter(
            (p) => !p.isRevealed
        );
        const alreadyRevealedCount =
            participants.length - unrevealedParticipants.length;

        if (unrevealedParticipants.length === 0) {
            return {
                success: true,
                data: {
                    revealed: [],
                    alreadyRevealed: alreadyRevealedCount,
                },
            };
        }

        // 일괄 공개 처리
        const revealedParticipants = await prisma.$transaction(async (tx) => {
            const results = [];
            for (const participant of unrevealedParticipants) {
                const updated = await tx.raffleParticipant.update({
                    where: { id: participant.id },
                    data: {
                        isRevealed: true,
                        revealedAt: new Date(),
                    },
                    include: {
                        prize: {
                            include: {
                                asset: true,
                                spg: { include: { network: true } },
                            },
                        },
                        player: {
                            select: { id: true, name: true, nickname: true },
                        },
                    },
                });
                results.push(updated);
            }
            return results;
        });

        return {
            success: true,
            data: {
                revealed:
                    revealedParticipants as RaffleParticipantWithRelations[],
                alreadyRevealed: alreadyRevealedCount,
            },
        };
    } catch (error) {
        console.error("❌ Error bulk revealing results:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to bulk reveal results",
        };
    }
}

// ==================== Helper Functions ====================

// Helper functions moved to ./utils.ts to avoid "must be async" server action constraint
