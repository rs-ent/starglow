/// app/actions/artists.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import {
    Prisma,
    Artist,
    ArtistMessage,
    User,
    CollectionContract,
} from "@prisma/client";
import { advancedTokenGate, AdvancedTokenGateResult } from "./blockchain";

export interface CreateArtistInput {
    name: string;
    description?: string;
    logoUrl?: string;
    imageUrl?: string;
    externalUrl?: string;
    reportUrl?: string;
    company?: string;
    sns?: string[];
    gallery?: string[];
    videos?: string[];
    music?: string[];
    events?: string[];
    additionalInfo?: any;
    collectionContractIds?: string[];
}

export async function createArtist(input: CreateArtistInput): Promise<Artist> {
    try {
        const { collectionContractIds, ...rest } = input;
        const artist = await prisma.artist.create({
            data: rest,
        });

        if (collectionContractIds && collectionContractIds.length > 0) {
            await prisma.collectionContract.updateMany({
                where: { id: { in: collectionContractIds } },
                data: { artistId: artist.id },
            });
        }
        return artist;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to create artist");
    }
}

export interface GetArtistInput {
    id?: string;
    name?: string;
}

export async function getArtist(
    input?: GetArtistInput
): Promise<Artist | null> {
    try {
        if (!input) {
            return null;
        }

        const where: Prisma.ArtistWhereInput = {};
        if (input.id) {
            return await prisma.artist.findUnique({
                where: { id: input.id },
                include: {
                    collectionContracts: true,
                    messages: true,
                    quests: true,
                    polls: true,
                },
            });
        }
        if (input.name) {
            return await prisma.artist.findFirst({
                where: { name: input.name },
                include: {
                    collectionContracts: true,
                    messages: true,
                    quests: true,
                    polls: true,
                },
            });
        }

        return null;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to get artist");
    }
}

export interface GetArtistsInput {
    id?: string;
    name?: string;
    collectionContractId?: string;
}

export async function getArtists(input?: GetArtistsInput): Promise<Artist[]> {
    try {
        if (!input) {
            return await prisma.artist.findMany({
                include: {
                    collectionContracts: true,
                    messages: true,
                    quests: true,
                    polls: true,
                },
                orderBy: {
                    name: "asc",
                },
            });
        }

        const where: Prisma.ArtistWhereInput = {};
        if (input.id) {
            where.id = input.id;
        }
        if (input.name) {
            where.name = input.name;
        }
        if (input.collectionContractId) {
            where.collectionContracts = {
                some: {
                    id: input.collectionContractId,
                },
            };
        }
        const artists = await prisma.artist.findMany({
            where,
            include: {
                collectionContracts: true,
                messages: true,
            },
            orderBy: {
                name: "asc",
            },
        });
        return artists;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to get artists");
    }
}

export interface UpdateArtistInput {
    id: string;
    name?: string;
    description?: string;
    logoUrl?: string;
    imageUrl?: string;
    externalUrl?: string;
    reportUrl?: string;
    company?: string;
    sns?: string[];
    gallery?: string[];
    videos?: string[];
    music?: string[];
    events?: string[];
    additionalInfo?: any;
    collectionContractIds?: string[];
}

export async function updateArtist(input: UpdateArtistInput): Promise<Artist> {
    try {
        const { collectionContractIds, ...rest } = input;
        const artist = await prisma.artist.update({
            where: { id: rest.id },
            data: rest,
        });

        if (collectionContractIds && collectionContractIds.length > 0) {
            await prisma.collectionContract.updateMany({
                where: { id: { in: collectionContractIds } },
                data: { artistId: artist.id },
            });
        }
        return artist;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to update artist");
    }
}

export interface DeleteArtistInput {
    id: string;
}

export async function deleteArtist(input: DeleteArtistInput): Promise<boolean> {
    try {
        await prisma.artist.delete({ where: { id: input.id } });
        await prisma.collectionContract.updateMany({
            where: { artistId: input.id },
            data: { artistId: null },
        });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export interface CreateArtistMessageInput {
    artistId: string;
    message: string;
    bannerUrl?: string;
    externalUrl?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
}

export async function createArtistMessage(
    input: CreateArtistMessageInput
): Promise<ArtistMessage> {
    try {
        const artistMessage = await prisma.artistMessage.create({
            data: input,
        });
        return artistMessage;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to create artist message");
    }
}

export interface GetArtistMessagesInput {
    artistId: string;
    isActive?: boolean;
    startDate?: Date;
    startDateIndicator?: "before" | "after" | "on";
    endDate?: Date;
    endDateIndicator?: "before" | "after" | "on";
}

export async function getArtistMessages(
    input?: GetArtistMessagesInput
): Promise<ArtistMessage[]> {
    try {
        if (!input) {
            return [];
        }
        const where: Prisma.ArtistMessageWhereInput = {};
        where.artistId = input.artistId;
        if (input.isActive) {
            where.isActive = input.isActive;
        }
        if (input.startDate) {
            if (input.startDateIndicator === "before") {
                where.startDate = { lte: input.startDate };
            } else if (input.startDateIndicator === "after") {
                where.startDate = { gte: input.startDate };
            } else if (input.startDateIndicator === "on") {
                where.startDate = input.startDate;
            }
        }
        if (input.endDate) {
            if (input.endDateIndicator === "before") {
                where.endDate = { lte: input.endDate };
            } else if (input.endDateIndicator === "after") {
                where.endDate = { gte: input.endDate };
            } else if (input.endDateIndicator === "on") {
                where.endDate = input.endDate;
            }
        }
        const artistMessages = await prisma.artistMessage.findMany({
            where,
            orderBy: { startDate: "desc" },
        });
        return artistMessages;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export interface UpdateArtistMessageInput {
    id: string;
    artistId?: string;
    message?: string;
    bannerUrl?: string;
    externalUrl?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
}

export async function updateArtistMessage(
    input: UpdateArtistMessageInput
): Promise<ArtistMessage> {
    try {
        const artistMessage = await prisma.artistMessage.update({
            where: { id: input.id },
            data: input,
        });
        return artistMessage;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to update artist message");
    }
}

export interface TokenGatingInput {
    artist: Artist | null;
    user: User | null;
}

export async function tokenGating(
    input?: TokenGatingInput
): Promise<AdvancedTokenGateResult> {
    try {
        const { artist, user } = input || {};

        if (!artist || !user) {
            return {
                success: false,
                data: {
                    hasToken: {},
                    tokenCount: {},
                    ownerWallets: {},
                },
            };
        }

        const artistDB = await prisma.artist.findUnique({
            where: { id: artist.id },
            include: {
                collectionContracts: true,
            },
        });

        if (!artistDB) {
            return {
                success: false,
                data: {
                    hasToken: {},
                    tokenCount: {},
                    ownerWallets: {},
                },
            };
        }

        if (artistDB?.collectionContracts.length === 0) {
            return {
                success: true,
                data: {
                    hasToken: {},
                    tokenCount: {},
                    ownerWallets: {},
                },
            };
        }

        const tokens = artistDB.collectionContracts.map(
            (collectionContract) => ({
                tokenType: "Collection" as const,
                tokenAddress: collectionContract.address,
            })
        );

        return advancedTokenGate({ userId: user.id, tokens });
    } catch (error) {
        console.error("Error in token gating:", error);
        return {
            success: false,
            error: "Failed to check token ownership",
        };
    }
}
