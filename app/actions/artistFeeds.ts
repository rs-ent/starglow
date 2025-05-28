/// app/actions/artistFeeds.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { ArtistFeed, ArtistFeedReaction } from "@prisma/client";

export type ArtistFeedWithReactions = ArtistFeed & {
    reactions: ArtistFeedReaction[];
};

export interface CreateArtistFeedInput {
    artistId: string;
    imageUrls: string[];
    videoUrls: string[];
    text: string;
}

export async function createArtistFeed({
    input,
}: {
    input: CreateArtistFeedInput;
}): Promise<ArtistFeed | null> {
    try {
        const artistFeed = await prisma.artistFeed.create({
            data: input,
        });
        return artistFeed;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export interface GetArtistFeedsInput {
    artistId: string;
    pagination?: {
        cursor?: string;
        limit?: number;
    };
}

export async function getArtistFeeds({
    input,
}: {
    input?: GetArtistFeedsInput;
}): Promise<{ feeds: ArtistFeedWithReactions[]; nextCursor: string | null }> {
    if (!input) {
        return { feeds: [], nextCursor: null };
    }
    try {
        const artistFeeds = await prisma.artistFeed.findMany({
            where: {
                artistId: input.artistId,
            },
            include: {
                reactions: true,
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: input.pagination?.limit,
            ...(input.pagination?.cursor
                ? {
                      cursor: { id: input.pagination.cursor },
                      skip: 1,
                  }
                : {}),
        });

        const nextCursor =
            artistFeeds.length > 0
                ? artistFeeds[artistFeeds.length - 1].id
                : null;

        return { feeds: artistFeeds, nextCursor };
    } catch (error) {
        console.error(error);
        return { feeds: [], nextCursor: null };
    }
}

export interface UpdateArtistFeedInput {
    id: string;
    artistId: string;
    imageUrls?: string[];
    videoUrls?: string[];
    text?: string;
}

export async function updateArtistFeed({
    input,
}: {
    input: UpdateArtistFeedInput;
}): Promise<ArtistFeed | null> {
    try {
        const { id, ...data } = input;
        const artistFeed = await prisma.artistFeed.update({
            where: { id },
            data,
        });
        return artistFeed;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export interface DeleteArtistFeedInput {
    id: string;
    artistId: string;
}

export async function deleteArtistFeed({
    input,
}: {
    input: DeleteArtistFeedInput;
}): Promise<boolean> {
    try {
        await prisma.artistFeed.delete({
            where: { id: input.id },
        });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export interface CreateArtistFeedReactionInput {
    artistFeedId: string;
    playerId: string;
    reaction: string;
    comment?: string;
}

export async function createArtistFeedReaction({
    input,
}: {
    input: CreateArtistFeedReactionInput;
}): Promise<ArtistFeedReaction | null> {
    try {
        const artistFeedReaction = await prisma.artistFeedReaction.create({
            data: input,
        });
        return artistFeedReaction;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export interface GetArtistFeedReactionsInput {
    artistFeedId?: string;
    playerId?: string;
    pagination?: {
        cursor?: string;
        limit?: number;
    };
}

export async function getArtistFeedReactions({
    input,
}: {
    input?: GetArtistFeedReactionsInput;
}): Promise<{
    reactions: ArtistFeedReaction[];
    nextCursor: string | null;
}> {
    if (!input || (!input.artistFeedId && !input.playerId)) {
        return {
            reactions: [],
            nextCursor: null,
        };
    }
    try {
        const artistFeedReactions = await prisma.artistFeedReaction.findMany({
            where: {
                artistFeedId: input.artistFeedId,
                playerId: input.playerId,
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: input.pagination?.limit,
            ...(input.pagination?.cursor
                ? {
                      cursor: { id: input.pagination.cursor },
                      skip: 1,
                  }
                : {}),
        });
        return {
            reactions: artistFeedReactions,
            nextCursor:
                artistFeedReactions.length > 0
                    ? artistFeedReactions[artistFeedReactions.length - 1].id
                    : null,
        };
    } catch (error) {
        console.error(error);
        return {
            reactions: [],
            nextCursor: null,
        };
    }
}

export interface UpdateArtistFeedReactionInput {
    id: string;
    artistFeedId: string;
    playerId: string;
    reaction?: string;
    comment?: string;
}

export async function updateArtistFeedReaction({
    input,
}: {
    input: UpdateArtistFeedReactionInput;
}): Promise<ArtistFeedReaction | null> {
    try {
        const { id, artistFeedId, playerId, ...data } = input;
        const artistFeedReaction = await prisma.artistFeedReaction.update({
            where: { id },
            data,
        });
        return artistFeedReaction;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export interface DeleteArtistFeedReactionInput {
    id: string;
    artistFeedId: string;
    playerId: string;
}

export async function deleteArtistFeedReaction({
    input,
}: {
    input: DeleteArtistFeedReactionInput;
}): Promise<boolean> {
    try {
        await prisma.artistFeedReaction.delete({
            where: { id: input.id },
        });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}
