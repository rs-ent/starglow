/// app/actions/artists.ts

"use server";

import { prisma } from "@/lib/prisma/client";
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
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

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
                cacheStrategy: getCacheStrategy("oneMinute"),
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
                cacheStrategy: getCacheStrategy("oneMinute"),
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
                cacheStrategy: getCacheStrategy("oneMinute"),
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

// 메타데이터 생성용 경량 함수
export async function getArtistForMetadata(
    input?: GetArtistInput
): Promise<Pick<
    Artist,
    "id" | "name" | "description" | "imageUrl" | "logoUrl" | "code"
> | null> {
    try {
        if (!input) {
            return null;
        }

        const select = {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            logoUrl: true,
            code: true,
        };

        if (input.id) {
            return await prisma.artist.findUnique({
                cacheStrategy: getCacheStrategy("fiveMinutes"),
                where: { id: input.id },
                select,
            });
        }

        if (input.code) {
            return await prisma.artist.findUnique({
                cacheStrategy: getCacheStrategy("fiveMinutes"),
                where: { code: input.code },
                select,
            });
        }

        if (input.name) {
            return await prisma.artist.findFirst({
                cacheStrategy: getCacheStrategy("fiveMinutes"),
                where: { name: input.name },
                select,
            });
        }

        return null;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to get artist for metadata");
    }
}

export type ArtistsForStarList = {
    id: string;
    name: string;
    imageUrl: string;
    logoUrl: string;
    code?: string;
    hidden: boolean;
    backgroundColors: string[];
    foregroundColors: string[];
};

export async function getArtistsForStarList(): Promise<
    ArtistsForStarList[] | null
> {
    try {
        const artists = await prisma.artist.findMany({
            cacheStrategy: getCacheStrategy("oneMinute"),
            select: {
                id: true,
                name: true,
                imageUrl: true,
                logoUrl: true,
                code: true,
                hidden: true,
                backgroundColors: true,
                foregroundColors: true,
            },
            orderBy: [{ order: "asc" }, { hidden: "asc" }],
            take: 12,
        });

        return artists as ArtistsForStarList[];
    } catch (error) {
        console.error(error);
        throw new Error("Failed to get artist for star page");
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
                cacheStrategy: getCacheStrategy("fiveMinutes"),
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
                take: 12,
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
            cacheStrategy: getCacheStrategy("oneMinute"),
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
            take: 12,
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
            cacheStrategy: getCacheStrategy("oneMinute"),
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
            cacheStrategy: getCacheStrategy("oneMinute"),
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

export type ArtistForStarPage = {
    id: string;
    name: string;
    imageUrl?: string;
    logoUrl?: string;
    code?: string;
    hidden: boolean;
    backgroundColors: string[];
    foregroundColors: string[];
};

export interface GetArtistForStarPageInput {
    code: string;
}

export async function getArtistForStarPage(
    input?: GetArtistForStarPageInput
): Promise<ArtistForStarPage | null> {
    if (!input) {
        return null;
    }
    try {
        return (await prisma.artist.findUnique({
            cacheStrategy: getCacheStrategy("fiveMinutes"),
            where: { code: input.code },
            select: {
                id: true,
                name: true,
                imageUrl: true,
                logoUrl: true,
                code: true,
                hidden: true,
                backgroundColors: true,
                foregroundColors: true,
            },
        })) as ArtistForStarPage;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to get artist for star page");
    }
}
