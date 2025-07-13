"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/app/auth/authUtils";
import { initialTransfer } from "@/app/story/transfer/actions";
import {
    validatePlayerAsset,
    updatePlayerAsset,
} from "@/app/actions/playerAssets/actions";
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

export interface RafflePrizeInput {
    title: string;
    description?: string;
    imageUrl?: string;
    order?: number;

    quantity: number;

    type: RafflePrizeType;

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
    rarityOrder?: number;

    assetId?: string;
    assetAmount?: number;

    spgAddress?: string;
    nftQuantity?: number;
}

export interface CreateRaffleInput {
    title: string;
    description?: string;
    imgUrl?: string;
    artistId?: string;

    startDate?: Date;
    endDate: Date;
    drawDate?: Date;

    instantReveal?: boolean;

    isLimited?: boolean;

    displayType?: string;

    prizes: RafflePrizeInput[];

    maxParticipants?: number;
    entryFeeAssetId?: string;
    entryFeeAmount?: number;
    allowMultipleEntry?: boolean;
    maxEntriesPerPlayer?: number;

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
    entryFeeAsset?: { symbol: string; iconUrl: string | null } | null;
    _count?: {
        participants: number;
        winners: number;
        prizes: number;
    };
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

function drawPrizeFromPool(
    prizes: RafflePrize[],
    isLimited: boolean = true
): {
    prize: RafflePrize;
    slotNumber: number;
} {
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

    const randomSlot = crypto.randomInt(0, totalSlots);

    let currentSlot = 0;
    for (const prize of activePrizes.sort((a, b) => a.order - b.order)) {
        if (randomSlot < currentSlot + prize.quantity) {
            return { prize, slotNumber: randomSlot };
        }
        currentSlot += prize.quantity;
    }

    throw new Error("Invalid prize pool configuration");
}

export interface UpdateRaffleInput extends Partial<CreateRaffleInput> {
    id: string;
}

export async function createRaffle(
    input: CreateRaffleInput
): Promise<RaffleResult<RaffleWithDetails>> {
    try {
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

        if (user.role !== "admin" && !user.player?.isArtist) {
            return {
                success: false,
                error: "Insufficient permissions. Admin or Artist role required.",
            };
        }

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

        const raffleResult = await prisma.$transaction(async (tx) => {
            const newRaffle = await tx.raffle.create({
                data: {
                    title: input.title,
                    description: input.description,
                    imgUrl: input.imgUrl,
                    artistId: validatedArtistId,

                    startDate: input.startDate || new Date(),
                    endDate: input.endDate,
                    drawDate: input.drawDate,

                    instantReveal: input.instantReveal ?? true,

                    isLimited: input.isLimited ?? true,

                    displayType: input.displayType || "GACHA",

                    maxParticipants: input.maxParticipants,
                    entryFeeAssetId: input.entryFeeAssetId,
                    entryFeeAmount: input.entryFeeAmount || 0,
                    allowMultipleEntry: input.allowMultipleEntry || false,
                    maxEntriesPerPlayer: input.maxEntriesPerPlayer,

                    isPublic: input.isPublic !== false,
                    isActive: true,

                    totalSlots,
                    totalParticipants: 0,
                },
            });

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

export async function updateRaffle(
    input: UpdateRaffleInput
): Promise<RaffleResult<RaffleWithDetails>> {
    try {
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

        let totalSlots = existingRaffle.totalSlots;
        const prizesToUpdate: any[] = [];

        if (input.prizes && input.prizes.length > 0) {
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

        await prisma.$transaction(async (tx) => {
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

            if (prizesToUpdate.length > 0) {
                await tx.rafflePrize.updateMany({
                    where: { raffleId: input.id },
                    data: { isActive: false },
                });

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
            where,
            include: {
                artist: { select: { id: true, name: true } },
                prizes: {
                    where: { isActive: true },
                    include: {
                        asset: true,
                        spg: true,
                    },
                    orderBy: { order: "asc" },
                },
                entryFeeAsset: { select: { symbol: true, iconUrl: true } },
                _count: {
                    select: {
                        participants: true,
                        winners: true,
                        prizes: { where: { isActive: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: input?.limit,
            skip: input?.offset,
        });

        const rafflesWithStatus = raffles.map((raffle) => ({
            ...raffle,
            status: calculateRaffleStatus(
                raffle.startDate,
                raffle.endDate,
                raffle.drawDate
            ),
        })) as RaffleWithDetails[];

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

export async function getRaffleDetails(
    raffleId: string
): Promise<RaffleResult<RaffleWithDetails>> {
    try {
        const raffle = await prisma.raffle.findUnique({
            where: { id: raffleId },
            include: {
                artist: { select: { id: true, name: true } },
                prizes: {
                    where: { isActive: true },
                    include: {
                        asset: true,
                        spg: true,
                    },
                    orderBy: { order: "asc" },
                },
                entryFeeAsset: { select: { symbol: true, iconUrl: true } },
                _count: {
                    select: {
                        participants: true,
                        winners: true,
                        prizes: { where: { isActive: true } },
                    },
                },
            },
        });

        if (!raffle) {
            return { success: false, error: "Raffle not found" };
        }

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

/**
 * Fetch participants for a raffle with pagination
 * This prevents the 10MB query size limit by limiting results
 */
export async function getRaffleParticipants(
    input: GetRaffleParticipantsInput
): Promise<
    RaffleResult<{
        participants: RaffleParticipantWithRelations[];
        totalCount: number;
        page: number;
        limit: number;
        totalPages: number;
    }>
> {
    try {
        const page = input.page || 1;
        const limit = Math.min(input.limit || 50, 100); // Max 100 per page
        const skip = (page - 1) * limit;

        const where: any = {
            raffleId: input.raffleId,
        };

        if (input.playerId) {
            where.playerId = input.playerId;
        }

        const [participants, totalCount] = await Promise.all([
            prisma.raffleParticipant.findMany({
                where,
                include: {
                    player: {
                        select: { id: true, name: true, nickname: true },
                    },
                    prize: {
                        select: { id: true, title: true, prizeType: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.raffleParticipant.count({ where }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return {
            success: true,
            data: {
                participants: participants as RaffleParticipantWithRelations[],
                totalCount,
                page,
                limit,
                totalPages,
            },
        };
    } catch (error) {
        console.error("Error fetching raffle participants:", error);
        return {
            success: false,
            error: "Failed to fetch raffle participants",
        };
    }
}

/**
 * Check if a user has participated in a raffle
 * This is optimized to avoid fetching all participants
 */
export async function checkUserParticipation(
    raffleId: string,
    playerId: string
): Promise<
    RaffleResult<{
        hasParticipated: boolean;
        participationCount: number;
        participants: RaffleParticipantWithRelations[];
    }>
> {
    try {
        const participants = await prisma.raffleParticipant.findMany({
            where: {
                raffleId,
                playerId,
            },
            include: {
                player: {
                    select: { id: true, name: true, nickname: true },
                },
                prize: {
                    select: { id: true, title: true, prizeType: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            data: {
                hasParticipated: participants.length > 0,
                participationCount: participants.length,
                participants: participants as RaffleParticipantWithRelations[],
            },
        };
    } catch (error) {
        console.error("Error checking user participation:", error);
        return {
            success: false,
            error: "Failed to check user participation",
        };
    }
}

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

        const result = await prisma.$transaction(async (tx) => {
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

            const updatedRaffle = await tx.raffle.update({
                where: { id: input.raffleId },
                data: {
                    totalParticipants: { increment: 1 },
                },
                select: { totalParticipants: true, maxParticipants: true },
            });

            if (
                updatedRaffle.maxParticipants &&
                updatedRaffle.totalParticipants > updatedRaffle.maxParticipants
            ) {
                throw new Error(
                    "Raffle is full - maximum participants exceeded"
                );
            }

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

            let drawnPrize: RafflePrize | undefined;
            let slotNumber: number | undefined;
            let randomSeed: string | undefined;

            if (raffle.instantReveal) {
                try {
                    const currentPrizes = await tx.rafflePrize.findMany({
                        where: {
                            raffleId: input.raffleId,
                            isActive: true,
                            quantity: { gt: 0 },
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

            const participant = await tx.raffleParticipant.create({
                data: {
                    raffleId: input.raffleId,
                    playerId: input.playerId,
                    prizeId: drawnPrize?.id,
                    drawnAt: drawnPrize ? new Date() : null,
                    revealedAt: null,
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

            if (drawnPrize && drawnPrize.prizeType !== "EMPTY") {
                await tx.raffleWinner.create({
                    data: {
                        raffleId: input.raffleId,
                        prizeId: drawnPrize.id,
                        playerId: input.playerId,
                        status: "PENDING",
                    },
                });

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

export interface RevealResultInput {
    raffleId: string;
    playerId: string;
    participantId?: string;
}

export interface RevealAllResultsInput {
    raffleId: string;
    playerId: string;
}

export async function revealRaffleResult(
    input: RevealResultInput
): Promise<RaffleResult<RaffleParticipantWithRelations>> {
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

        let participant: any;

        if (input.participantId) {
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
            participant = await prisma.raffleParticipant.findFirst({
                where: {
                    raffleId: input.raffleId,
                    playerId: input.playerId,
                    isRevealed: false,
                    drawnAt: { not: null },
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
                orderBy: { createdAt: "desc" },
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

export async function revealAllRaffleResults(
    input: RevealAllResultsInput
): Promise<RaffleResult<RaffleParticipantWithRelations[]>> {
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

        const participants = await prisma.raffleParticipant.findMany({
            where: {
                raffleId: input.raffleId,
                playerId: input.playerId,
                isRevealed: false,
                drawnAt: { not: null },
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

export interface DrawAllWinnersInput {
    raffleId: string;
    drawnBy: string;
}

export async function drawAllWinners(
    input: DrawAllWinnersInput
): Promise<RaffleResult<RaffleWinner[]>> {
    try {
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

        const raffleData = (await prisma.raffle.findUnique({
            where: { id: input.raffleId },
            include: {
                prizes: {
                    where: { isActive: true },
                    orderBy: { order: "asc" },
                },
                participants: { where: { drawnAt: null } },
            },
        })) as RaffleWithParticipantsAndPrizes | null;

        if (!raffleData) {
            return { success: false, error: "Raffle not found" };
        }

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

        if (raffleData.instantReveal) {
            return {
                success: false,
                error: "Cannot draw winners for instant reveal raffle",
            };
        }

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

        const winners = await prisma.$transaction(async (tx) => {
            const allWinners: RaffleWinner[] = [];

            for (const participant of raffleData.participants) {
                try {
                    const currentPrizes = await tx.rafflePrize.findMany({
                        where: {
                            raffleId: input.raffleId,
                            isActive: true,
                            quantity: { gt: 0 },
                        },
                        orderBy: { order: "asc" },
                    });

                    if (currentPrizes.length === 0) {
                        console.error(
                            `All prizes exhausted in batch draw for raffle ${input.raffleId}`
                        );
                        break;
                    }

                    const drawResult = drawPrizeFromPool(
                        currentPrizes,
                        raffleData.isLimited
                    );
                    const randomSeed = crypto.randomBytes(16).toString("hex");

                    await tx.raffleParticipant.update({
                        where: { id: participant.id },
                        data: {
                            prizeId: drawResult.prize.id,
                            drawnAt: new Date(),
                            slotNumber: drawResult.slotNumber,
                            randomSeed,
                        },
                    });

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

export interface DistributePrizesInput {
    raffleId: string;
    executedBy?: string;
    playerId?: string;
}

export async function distributePrizes(
    input: DistributePrizesInput
): Promise<RaffleResult<{ distributed: number; failed: number }>> {
    try {
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

        const raffle = await prisma.raffle.findUnique({
            where: { id: input.raffleId },
            select: { id: true, artistId: true, instantReveal: true },
        });

        if (!raffle) {
            return { success: false, error: "Raffle not found" };
        }

        let hasPermission = false;

        if (user.role === "admin") {
            hasPermission = true;
        } else if (
            user.player?.isArtist &&
            raffle.artistId === user.player.artistId
        ) {
            hasPermission = true;
        } else if (raffle.instantReveal && input.executedBy) {
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

        const distributionResults = await Promise.allSettled(
            winners.map(async (winner) => {
                return await prisma.$transaction(async (tx) => {
                    try {
                        let txHash: string | undefined;

                        if (winner.prize.prizeType === "ASSET") {
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

export interface GetRaffleParticipantsInput {
    raffleId: string;
    page?: number;
    limit?: number;
    playerId?: string; // Filter by specific player
}

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

export async function getPlayerParticipations(
    input: GetPlayerParticipationsInput
): Promise<RaffleResult<PlayerParticipationSummary>> {
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
                drawnAt: { not: null },
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
    participantIds?: string[];
}

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
            drawnAt: { not: null },
        };

        if (input.participantIds && input.participantIds.length > 0) {
            where.id = { in: input.participantIds };
        }

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

// 🎯 Analytics용 실제 데이터 조회 함수들

export interface ProbabilityAnalyticsData {
    raffleId: string;
    raffleName: string;
    totalSlots: number;
    totalParticipants: number;
    totalDraws: number;
    prizeAnalytics: Array<{
        prizeId: string;
        prizeName: string;
        rarityTier: string;
        rarityOrder: number;
        theoreticalProbability: number;
        quantity: number;
        actualWins: number;
        distributedWins: number;
        actualProbability: number;
        distributedProbability: number;
        participantCount: number;
    }>;
}

export async function getProbabilityAnalyticsData(
    raffleIds?: string[]
): Promise<RaffleResult<ProbabilityAnalyticsData[]>> {
    try {
        // 래플 목록 조회 (raffleIds가 없으면 전체 조회)
        const raffles = await prisma.raffle.findMany({
            where: raffleIds ? { id: { in: raffleIds } } : undefined,
            include: {
                prizes: {
                    include: {
                        _count: {
                            select: {
                                participants: true,
                                winners: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
        });

        const analyticsData: ProbabilityAnalyticsData[] = [];

        for (const raffle of raffles) {
            // 총 슬롯 수 계산
            const totalSlots = raffle.prizes.reduce(
                (sum, prize) => sum + prize.quantity,
                0
            );

            // 총 참가자 수
            const totalParticipants = raffle._count.participants;

            // 실제 추첨 완료된 수 (drawnAt이 null이 아닌 경우)
            const totalDraws = await prisma.raffleParticipant.count({
                where: {
                    raffleId: raffle.id,
                    drawnAt: { not: null },
                },
            });

            // 각 상품별 상세 분석
            const prizeAnalytics = await Promise.all(
                raffle.prizes.map(async (prize) => {
                    // 이론적 확률 계산
                    const theoreticalProbability =
                        totalSlots > 0
                            ? (prize.quantity / totalSlots) * 100
                            : 0;

                    // 실제 당첨 수 (해당 상품을 뽑은 참가자 수)
                    const actualWins = await prisma.raffleParticipant.count({
                        where: {
                            raffleId: raffle.id,
                            prizeId: prize.id,
                            drawnAt: { not: null },
                        },
                    });

                    // 실제 배포 완료된 당첨 수
                    const distributedWins = await prisma.raffleWinner.count({
                        where: {
                            raffleId: raffle.id,
                            prizeId: prize.id,
                            status: "DISTRIBUTED",
                        },
                    });

                    // 실제 확률 계산
                    const actualProbability =
                        totalDraws > 0 ? (actualWins / totalDraws) * 100 : 0;

                    // 배포 확률 계산
                    const distributedProbability =
                        totalDraws > 0
                            ? (distributedWins / totalDraws) * 100
                            : 0;

                    // 해당 상품에 참여한 참가자 수
                    const participantCount = prize._count.participants;

                    return {
                        prizeId: prize.id,
                        prizeName: prize.title,
                        rarityTier: prize.rarityTier || "COMMON",
                        rarityOrder: prize.rarityOrder || 9,
                        theoreticalProbability,
                        quantity: prize.quantity,
                        actualWins,
                        distributedWins,
                        actualProbability,
                        distributedProbability,
                        participantCount,
                    };
                })
            );

            analyticsData.push({
                raffleId: raffle.id,
                raffleName: raffle.title,
                totalSlots,
                totalParticipants,
                totalDraws,
                prizeAnalytics,
            });
        }

        return { success: true, data: analyticsData };
    } catch (error) {
        console.error("Error fetching probability analytics data:", error);
        return {
            success: false,
            error: "Failed to fetch probability analytics data",
        };
    }
}

export interface RevenueAnalyticsData {
    raffleId: string;
    raffleName: string;
    artistName: string;
    artistId: string;
    totalParticipants: number;
    entryFeeAmount: number;
    totalRevenue: number;
    totalPrizeCost: number;
    operatingCost: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    roi: number;
    participationRate: number;
    maxParticipants: number | null;
    startDate: Date;
    endDate: Date;
    status: string;
    prizeDistribution: Array<{
        prizeId: string;
        prizeName: string;
        assetAmount: number;
        quantity: number;
        totalCost: number;
    }>;
}

export async function getRevenueAnalyticsData(
    raffleIds?: string[]
): Promise<RaffleResult<RevenueAnalyticsData[]>> {
    try {
        const raffles = await prisma.raffle.findMany({
            where: raffleIds ? { id: { in: raffleIds } } : undefined,
            include: {
                artist: true,
                prizes: {
                    include: {
                        asset: true,
                    },
                },
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
        });

        const analyticsData: RevenueAnalyticsData[] = raffles.map((raffle) => {
            const totalParticipants = raffle._count.participants;
            const entryFeeAmount = raffle.entryFeeAmount || 0;
            const totalRevenue = totalParticipants * entryFeeAmount;

            // 상품 비용 계산
            const totalPrizeCost = raffle.prizes.reduce((sum, prize) => {
                const assetAmount = prize.assetAmount || 0;
                return sum + assetAmount * prize.quantity;
            }, 0);

            // 운영비 추정 (수익의 10%)
            const operatingCost = totalRevenue * 0.1;
            const totalCosts = totalPrizeCost + operatingCost;

            const netProfit = totalRevenue - totalCosts;
            const profitMargin =
                totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
            const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

            const participationRate = raffle.maxParticipants
                ? (totalParticipants / raffle.maxParticipants) * 100
                : 100;

            const status = calculateRaffleStatus(
                raffle.startDate,
                raffle.endDate,
                raffle.drawDate
            );

            const prizeDistribution = raffle.prizes.map((prize) => ({
                prizeId: prize.id,
                prizeName: prize.title,
                assetAmount: prize.assetAmount || 0,
                quantity: prize.quantity,
                totalCost: (prize.assetAmount || 0) * prize.quantity,
            }));

            return {
                raffleId: raffle.id,
                raffleName: raffle.title,
                artistName: raffle.artist?.name || "Unknown",
                artistId: raffle.artistId || "",
                totalParticipants,
                entryFeeAmount,
                totalRevenue,
                totalPrizeCost,
                operatingCost,
                totalCosts,
                netProfit,
                profitMargin,
                roi,
                participationRate,
                maxParticipants: raffle.maxParticipants,
                startDate: raffle.startDate,
                endDate: raffle.endDate,
                status,
                prizeDistribution,
            };
        });

        return { success: true, data: analyticsData };
    } catch (error) {
        console.error("Error fetching revenue analytics data:", error);
        return {
            success: false,
            error: "Failed to fetch revenue analytics data",
        };
    }
}

export interface ParticipantAnalyticsData {
    playerId: string;
    playerName: string;
    telegramId: string | null;
    totalParticipations: number;
    totalSpent: number;
    totalWins: number;
    totalWinValue: number;
    firstParticipation: Date | null;
    lastParticipation: Date | null;
    participationHistory: Array<{
        raffleId: string;
        raffleName: string;
        participatedAt: Date;
        entryFee: number;
        won: boolean;
        prizeValue: number;
        revealed: boolean;
    }>;
    favoriteArtists: Array<{
        artistId: string;
        artistName: string;
        participationCount: number;
    }>;
    participationPatterns: {
        hourDistribution: number[];
        dayOfWeekDistribution: number[];
        monthlyTrend: Array<{
            month: string;
            participations: number;
            spending: number;
        }>;
    };
}

export async function getParticipantAnalyticsData(
    playerIds?: string[]
): Promise<RaffleResult<ParticipantAnalyticsData[]>> {
    try {
        // 참가자별 기본 통계 조회
        const participants = await prisma.raffleParticipant.findMany({
            where: playerIds ? { playerId: { in: playerIds } } : undefined,
            include: {
                player: true,
                raffle: {
                    include: {
                        artist: true,
                    },
                },
                prize: {
                    include: {
                        asset: true,
                    },
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        // 당첨자 정보 조회
        const winners = await prisma.raffleWinner.findMany({
            where: playerIds ? { playerId: { in: playerIds } } : undefined,
            include: {
                prize: {
                    include: {
                        asset: true,
                    },
                },
            },
        });

        // 플레이어별로 그룹화
        const playerMap = new Map<string, any[]>();
        participants.forEach((p) => {
            if (!playerMap.has(p.playerId)) {
                playerMap.set(p.playerId, []);
            }
            playerMap.get(p.playerId)!.push(p);
        });

        // 당첨자 정보도 플레이어별로 그룹화
        const winnerMap = new Map<string, any[]>();
        winners.forEach((w) => {
            if (!winnerMap.has(w.playerId)) {
                winnerMap.set(w.playerId, []);
            }
            winnerMap.get(w.playerId)!.push(w);
        });

        const analyticsData: ParticipantAnalyticsData[] = Array.from(
            playerMap.entries()
        ).map(([playerId, participations]) => {
            const player = participations[0].player;
            const playerWins = winnerMap.get(playerId) || [];

            // 기본 통계 계산
            const totalParticipations = participations.length;
            const totalSpent = participations.reduce(
                (sum, p) => sum + (p.raffle.entryFeeAmount || 0),
                0
            );
            const totalWins = playerWins.length;
            const totalWinValue = playerWins.reduce(
                (sum, w) => sum + (w.prize.assetAmount || 0),
                0
            );

            // 참여 이력
            const participationHistory = participations.map((p) => ({
                raffleId: p.raffleId,
                raffleName: p.raffle.title,
                participatedAt: p.createdAt,
                entryFee: p.raffle.entryFeeAmount || 0,
                won: playerWins.some((w) => w.raffleId === p.raffleId),
                prizeValue: playerWins
                    .filter((w) => w.raffleId === p.raffleId)
                    .reduce((sum, w) => sum + (w.prize.assetAmount || 0), 0),
                revealed: p.isRevealed,
            }));

            // 선호 아티스트 분석
            const artistMap = new Map<string, number>();
            participations.forEach((p) => {
                if (p.raffle.artistId) {
                    const count = artistMap.get(p.raffle.artistId) || 0;
                    artistMap.set(p.raffle.artistId, count + 1);
                }
            });

            const favoriteArtists = Array.from(artistMap.entries())
                .map(([artistId, count]) => {
                    const artist = participations.find(
                        (p) => p.raffle.artistId === artistId
                    )?.raffle.artist;
                    return {
                        artistId,
                        artistName: artist?.name || "Unknown",
                        participationCount: count,
                    };
                })
                .sort((a, b) => b.participationCount - a.participationCount)
                .slice(0, 5);

            // 참여 패턴 분석
            const hourDistribution = new Array(24).fill(0);
            const dayOfWeekDistribution = new Array(7).fill(0);
            const monthlyMap = new Map<
                string,
                { participations: number; spending: number }
            >();

            participations.forEach((p) => {
                const date = new Date(p.createdAt);
                const hour = date.getHours();
                const dayOfWeek = date.getDay();
                const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}`;

                hourDistribution[hour]++;
                dayOfWeekDistribution[dayOfWeek]++;

                const monthData = monthlyMap.get(monthKey) || {
                    participations: 0,
                    spending: 0,
                };
                monthData.participations++;
                monthData.spending += p.raffle.entryFeeAmount || 0;
                monthlyMap.set(monthKey, monthData);
            });

            const monthlyTrend = Array.from(monthlyMap.entries())
                .map(([month, data]) => ({ month, ...data }))
                .sort((a, b) => a.month.localeCompare(b.month));

            return {
                playerId,
                playerName:
                    player.name ||
                    player.nickname ||
                    `Player ${playerId.slice(-6)}`,
                telegramId: player.telegramId,
                totalParticipations,
                totalSpent,
                totalWins,
                totalWinValue,
                firstParticipation:
                    participations.length > 0
                        ? participations[0].createdAt
                        : null,
                lastParticipation:
                    participations.length > 0
                        ? participations[participations.length - 1].createdAt
                        : null,
                participationHistory,
                favoriteArtists,
                participationPatterns: {
                    hourDistribution,
                    dayOfWeekDistribution,
                    monthlyTrend,
                },
            };
        });

        return { success: true, data: analyticsData };
    } catch (error) {
        console.error("Error fetching participant analytics data:", error);
        return {
            success: false,
            error: "Failed to fetch participant analytics data",
        };
    }
}
