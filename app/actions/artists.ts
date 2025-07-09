/// app/actions/artists.ts

"use server";

import { prisma } from "@/lib/prisma/client";

import { getOwners } from "../story/nft/actions";

import type { AdvancedTokenGateResult } from "./blockchain";
import type {
    Artist,
    ArtistMessage,
    Poll,
    Prisma,
    Quest,
    Story_spg,
    Player,
    Board,
    BoardPost,
} from "@prisma/client";

export interface CreateArtistInput {
    name: string;
    order?: number;
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
    additionalInfo?: Prisma.InputJsonValue;
    backgroundColors?: string[];
    foregroundColors?: string[];
    collectionContractIds?: string[];
    playerIds?: string[];
    hidden?: boolean;
    code?: string;
}

export async function createArtist(input: CreateArtistInput): Promise<Artist> {
    try {
        const { collectionContractIds, playerIds, ...rest } = input;
        const artist = await prisma.artist.create({
            data: rest,
        });

        if (collectionContractIds && collectionContractIds.length > 0) {
            await prisma.collectionContract.updateMany({
                where: { id: { in: collectionContractIds } },
                data: { artistId: artist.id },
            });
        }

        // 선택된 플레이어들을 아티스트로 설정
        if (playerIds && playerIds.length > 0) {
            await prisma.player.updateMany({
                where: { id: { in: playerIds } },
                data: {
                    isArtist: true,
                    artistId: artist.id,
                },
            });
        }

        return artist;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to create artist");
    }
}

export type ArtistWithSPG = Artist & {
    story_spg: Story_spg[];
    messages: ArtistMessage[];
    polls: Poll[];
    quests: Quest[];
    players: Player[];
    boards: (Board & {
        posts: BoardPost[];
    })[];
};
export interface GetArtistInput {
    id?: string;
    code?: string;
    name?: string;
}

export async function getArtist(
    input?: GetArtistInput
): Promise<ArtistWithSPG | null> {
    try {
        if (!input) {
            return null;
        }

        if (input.id) {
            return (await prisma.artist.findUnique({
                where: { id: input.id },
                include: {
                    story_spg: true,
                    messages: true,
                    quests: true,
                    polls: true,
                    players: true,
                    boards: {
                        include: {
                            posts: true,
                        },
                    },
                },
            })) as ArtistWithSPG;
        }

        if (input.code) {
            return (await prisma.artist.findUnique({
                where: { code: input.code },
                include: {
                    story_spg: true,
                    messages: true,
                    quests: true,
                    polls: true,
                    players: true,
                    boards: {
                        include: {
                            posts: true,
                        },
                    },
                },
            })) as ArtistWithSPG;
        }

        if (input.name) {
            return (await prisma.artist.findFirst({
                where: { name: input.name },
                include: {
                    story_spg: true,
                    messages: true,
                    quests: true,
                    polls: true,
                    players: true,
                    boards: {
                        include: {
                            posts: true,
                        },
                    },
                },
            })) as ArtistWithSPG;
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

export async function getArtists(
    input?: GetArtistsInput
): Promise<ArtistWithSPG[]> {
    try {
        if (!input) {
            return (await prisma.artist.findMany({
                include: {
                    story_spg: true,
                    messages: true,
                    polls: true,
                    quests: true,
                    players: true,
                    boards: {
                        include: {
                            posts: true,
                        },
                    },
                },
                orderBy: {
                    name: "asc",
                },
            })) as ArtistWithSPG[];
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
                story_spg: true,
                messages: true,
                polls: true,
                quests: true,
                players: true,
                boards: {
                    include: {
                        posts: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });
        return artists as ArtistWithSPG[];
    } catch (error) {
        console.error(error);
        throw new Error("Failed to get artists");
    }
}

export interface UpdateArtistInput {
    id: string;
    name?: string;
    order?: number;
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
    additionalInfo?: Prisma.InputJsonValue;
    backgroundColors?: string[];
    foregroundColors?: string[];
    collectionContractIds?: string[];
    playerIds?: string[];
    hidden?: boolean;
    code?: string;
}

export async function updateArtist(input: UpdateArtistInput): Promise<Artist> {
    try {
        const { collectionContractIds, playerIds, ...rest } = input;
        const artist = await prisma.artist.update({
            where: { id: rest.id },
            data: rest,
        });

        // 1. 먼저 해당 아티스트의 모든 컬렉션 연결을 해제
        await prisma.collectionContract.updateMany({
            where: { artistId: artist.id },
            data: { artistId: null },
        });

        // 2. 새로 선택된 컬렉션들만 연결
        if (collectionContractIds && collectionContractIds.length > 0) {
            await prisma.collectionContract.updateMany({
                where: { id: { in: collectionContractIds } },
                data: { artistId: artist.id },
            });
        }

        // 3. 먼저 해당 아티스트와 연결된 모든 플레이어의 아티스트 연결을 해제
        await prisma.player.updateMany({
            where: { artistId: artist.id },
            data: {
                isArtist: false,
                artistId: null,
            },
        });

        // 4. 새로 선택된 플레이어들만 아티스트로 설정
        if (playerIds && playerIds.length > 0) {
            await prisma.player.updateMany({
                where: { id: { in: playerIds } },
                data: {
                    isArtist: true,
                    artistId: artist.id,
                },
            });
        }

        return artist;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to update artist");
    }
}

export interface UpdateArtistOrderInput {
    orders: {
        id: string;
        order: number;
    }[];
}

export async function updateArtistOrder(
    input: UpdateArtistOrderInput
): Promise<boolean> {
    try {
        await prisma.$transaction(async (tx) => {
            const updatePromises = input.orders.map(({ id, order }) =>
                tx.artist.update({
                    where: { id },
                    data: { order },
                })
            );
            await Promise.all(updatePromises);
        });

        return true;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to update artist order");
    }
}

export interface DeleteArtistInput {
    id: string;
}

export async function deleteArtist(input: DeleteArtistInput): Promise<boolean> {
    try {
        // 연결된 플레이어들의 아티스트 상태 해제
        await prisma.player.updateMany({
            where: { artistId: input.id },
            data: {
                isArtist: false,
                artistId: null,
            },
        });

        await prisma.artistMessage.deleteMany({
            where: { artistId: input.id },
        });
        await prisma.collectionContract.updateMany({
            where: { artistId: input.id },
            data: { artistId: null },
        });
        await prisma.artist.delete({ where: { id: input.id } });
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

export interface DeleteArtistMessageInput {
    id: string;
    artistId: string;
}

export async function deleteArtistMessage(
    input: DeleteArtistMessageInput
): Promise<boolean> {
    try {
        await prisma.artistMessage.delete({ where: { id: input.id } });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export interface TokenGatingInput {
    artist: Artist | null;
    userId: string | null;
}

interface TokenGatingResult {
    hasToken: Record<string, boolean>;
    tokenCount: Record<string, number>;
    ownerWallets: Record<string, string[]>;
}

export async function tokenGating(
    input?: TokenGatingInput
): Promise<AdvancedTokenGateResult> {
    try {
        const { artist, userId } = input || {};
        if (!artist?.id || !userId) {
            return {
                success: false,
                data: {
                    hasToken: {},
                    tokenCount: {},
                    ownerWallets: {},
                },
            };
        }

        const [spgs, user] = await Promise.all([
            prisma.story_spg.findMany({
                where: { artistId: artist.id },
                select: { address: true },
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    wallets: {
                        where: { status: "ACTIVE" },
                        select: { address: true },
                    },
                },
            }) as Promise<{ wallets: { address: string }[] } | null>,
        ]);

        if (!spgs.length) {
            return {
                success: true,
                data: {
                    hasToken: {},
                    tokenCount: {},
                    ownerWallets: {},
                },
            };
        }

        if (!user?.wallets || !user.wallets.length) {
            return {
                success: false,
                error: user ? "User has no active wallets" : "User not found",
                data: {
                    hasToken: {},
                    tokenCount: {},
                    ownerWallets: {},
                },
            };
        }

        const walletAddresses = new Set(user.wallets.map((w) => w.address));

        const results = await Promise.all(
            spgs.map(async (spg) => {
                const owners = await getOwners({ spgAddress: spg.address });
                const userOwnedTokens = owners.filter((owner) =>
                    walletAddresses.has(owner.owner)
                );

                return {
                    hasToken: { [spg.address]: userOwnedTokens.length > 0 },
                    tokenCount: { [spg.address]: userOwnedTokens.length },
                    ownerWallets: {
                        [spg.address]: userOwnedTokens.map(
                            (owner) => owner.owner
                        ),
                    },
                } as TokenGatingResult;
            })
        );

        const mergedResult = results.reduce<TokenGatingResult>(
            (acc, curr) => ({
                hasToken: { ...acc.hasToken, ...curr.hasToken },
                tokenCount: { ...acc.tokenCount, ...curr.tokenCount },
                ownerWallets: { ...acc.ownerWallets, ...curr.ownerWallets },
            }),
            {
                hasToken: {},
                tokenCount: {},
                ownerWallets: {},
            }
        );

        return {
            success: true,
            data: mergedResult,
        };
    } catch (error) {
        console.error("Error in token gating:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to check token ownership",
            data: {
                hasToken: {},
                tokenCount: {},
                ownerWallets: {},
            },
        };
    }
}

// 플레이어 목록을 가져오는 새로운 함수 추가
export interface GetPlayersInput {
    excludeArtists?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
}

export async function getPlayers(input?: GetPlayersInput): Promise<Player[]> {
    try {
        const where: Prisma.PlayerWhereInput = {};

        if (input?.excludeArtists) {
            where.isArtist = false;
        }

        if (input?.search) {
            where.OR = [
                { name: { contains: input.search, mode: "insensitive" } },
                { nickname: { contains: input.search, mode: "insensitive" } },
                { email: { contains: input.search, mode: "insensitive" } },
            ];
        }

        const players = await prisma.player.findMany({
            where,
            take: input?.limit || 50,
            skip: input?.offset || 0,
            orderBy: [
                { name: "asc" },
                { nickname: "asc" },
                { createdAt: "desc" },
            ],
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
        });

        return players;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to get players");
    }
}
