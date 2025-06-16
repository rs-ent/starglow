/// app/actions/x/actions.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import {
    TweetAuthor,
    Tweet,
    TweetMetrics,
    TweetAuthorMetrics,
    TweetMedia,
    Player,
} from "@prisma/client";

interface TweetMention {
    start: number;
    end: number;
    username: string;
    id?: string;
}

interface TweetEntities {
    mentions?: TweetMention[];
    hashtags?: Array<{
        start: number;
        end: number;
        tag: string;
    }>;
    urls?: Array<{
        start: number;
        end: number;
        url: string;
        expanded_url?: string;
        display_url?: string;
    }>;
}

interface UserTweetData {
    id: string;
    text: string;
    entities?: TweetEntities;
}

interface XApiUserTweetsResponse {
    data?: UserTweetData[];
    meta: {
        result_count: number;
        next_token?: string;
        previous_token?: string;
    };
}

export async function getLatestSyncData() {
    return await prisma.tweetSyncData.findFirst({
        where: {
            syncStatus: "success",
        },
        orderBy: {
            lastSyncAt: "desc",
        },
    });
}

export type TweetWithMetrics = Tweet & {
    metricsHistory: TweetMetrics[];
    media: TweetMedia[];
};

export type Author = TweetAuthor & {
    tweets: TweetWithMetrics[];
    metrics: TweetAuthorMetrics[];
};

export async function getTweetAuthors(): Promise<Author[]> {
    return (await prisma.tweetAuthor.findMany({
        include: {
            tweets: {
                include: {
                    metricsHistory: {
                        orderBy: { recordedAt: "desc" },
                        take: 1,
                    },
                    media: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
            metrics: {
                orderBy: { recordedAt: "desc" },
                take: 1,
            },
        },
    })) as Author[];
}

export interface GetAuthorMetricsHistoryInput {
    authorId: string | null;
}

export async function getAuthorMetricsHistory(
    input?: GetAuthorMetricsHistoryInput
) {
    if (!input || !input.authorId) {
        return [];
    }

    return await prisma.tweetAuthorMetrics.findMany({
        where: {
            tweetAuthorId: input.authorId,
        },
        orderBy: {
            recordedAt: "asc",
        },
    });
}

export interface GetTweetMetricsHistoryInput {
    tweetId: string | null;
}

export async function getTweetMetricsHistory(
    input?: GetTweetMetricsHistoryInput
) {
    if (!input || !input.tweetId) {
        return [];
    }

    return await prisma.tweetMetrics.findMany({
        where: {
            tweetId: input.tweetId,
        },
        orderBy: {
            recordedAt: "asc",
        },
    });
}

export async function getTweets() {
    return await prisma.tweet.findMany();
}

export interface FetchAuthorMetricsFromXInput {
    authorId: string | null;
}

export async function fetchAuthorMetricsFromX(
    input?: FetchAuthorMetricsFromXInput
) {
    if (!input?.authorId) {
        throw new Error("Author ID is required");
    }

    const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
    if (!BEARER_TOKEN) {
        throw new Error("TWITTER_BEARER_TOKEN is not set");
    }

    try {
        const response = await fetch(
            `https://api.twitter.com/2/users/${input.authorId}?user.fields=username,name,profile_image_url,public_metrics,verified`,
            {
                headers: {
                    Authorization: `Bearer ${BEARER_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(
                `Twitter API Error: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();
        const userData = data.data;

        if (!userData) {
            throw new Error("No user data returned from Twitter API");
        }

        const currentAuthor = (await prisma.tweetAuthor.findUnique({
            where: { authorId: input.authorId },
            include: {
                metrics: {
                    orderBy: { recordedAt: "desc" },
                    take: 1,
                },
            },
        })) as Author | null;

        const hasChanged =
            !currentAuthor?.metrics[0] ||
            currentAuthor.metrics[0].followersCount !==
                userData.public_metrics.followers_count ||
            currentAuthor.metrics[0].followingCount !==
                userData.public_metrics.following_count ||
            currentAuthor.metrics[0].tweetCount !==
                userData.public_metrics.tweet_count ||
            currentAuthor.metrics[0].listedCount !==
                userData.public_metrics.listed_count ||
            currentAuthor.metrics[0].verified !== (userData.verified || false);

        await prisma.$transaction(async (tx) => {
            await tx.tweetAuthor.upsert({
                where: { authorId: input.authorId! },
                create: {
                    authorId: input.authorId!,
                    name: userData.name,
                    username: userData.username,
                    profileImageUrl: userData.profile_image_url || null,
                },
                update: {
                    name: userData.name,
                    username: userData.username,
                    profileImageUrl: userData.profile_image_url || null,
                },
            });

            if (hasChanged) {
                await tx.tweetAuthorMetrics.create({
                    data: {
                        tweetAuthorId: input.authorId!,
                        followersCount: userData.public_metrics.followers_count,
                        followingCount: userData.public_metrics.following_count,
                        tweetCount: userData.public_metrics.tweet_count,
                        listedCount: userData.public_metrics.listed_count,
                        verified: userData.verified || false,
                        recordedAt: new Date(),
                    },
                });
            }
        });

        return {
            success: true,
            authorId: input.authorId,
            metricsUpdated: hasChanged,
            data: {
                name: userData.name,
                username: userData.username,
                metrics: userData.public_metrics,
                verified: userData.verified,
            },
        };
    } catch (error) {
        console.error("Error fetching author metrics:", error);
        throw error;
    }
}

export interface GetAuthorByPlayerIdInput {
    playerId: string;
}

export async function getAuthorByPlayerId(
    input?: GetAuthorByPlayerIdInput
): Promise<TweetAuthor | null> {
    try {
        if (!input || !input.playerId) {
            return null;
        }

        const player = await prisma.player.findUnique({
            where: {
                id: input.playerId,
            },
            include: {
                tweetAuthor: true,
            },
        });

        if (!player || !player.tweetAuthor) {
            return null;
        }

        return player.tweetAuthor;
    } catch (error) {
        console.error("Error getting author by player ID:", error);
        return null;
    }
}

export interface ValidateRegisterXAuthorInput {
    playerId: string;
    tweetAuthorId: string;
}

export interface ValidateRegisterXAuthorOutput {
    isValid: boolean;
    message?: string;
}

export async function validateRegisterXAuthor(
    input: ValidateRegisterXAuthorInput
): Promise<ValidateRegisterXAuthorOutput> {
    try {
        if (!input.playerId || !input.tweetAuthorId) {
            return {
                isValid: false,
                message:
                    "Invalid input. Please try again. If the problem persists, please contact support.",
            };
        }

        const player = await prisma.player.findUnique({
            where: {
                id: input.playerId,
            },
            select: {
                tweetAuthorId: true,
            },
        });

        if (!player) {
            return {
                isValid: false,
                message:
                    "Player not found. Please try again. If the problem persists, please contact support.",
            };
        }

        if (player.tweetAuthorId) {
            return {
                isValid: false,
                message: "You already registered with X Account.",
            };
        }

        const existingAuthor = await prisma.tweetAuthor.findUnique({
            where: {
                authorId: input.tweetAuthorId,
            },
            select: {
                player: true,
            },
        });

        if (
            existingAuthor?.player &&
            existingAuthor.player.id !== input.playerId
        ) {
            return {
                isValid: false,
                message:
                    "X Account already registered by other player. Please try with other X Account.",
            };
        }

        return {
            isValid: true,
        };
    } catch (error) {
        console.error("Error occurred while validating X author:", error);
        return {
            isValid: false,
            message:
                "Error occurred while validating X author. Please try again. If the problem persists, please contact support.",
        };
    }
}

export interface CheckIsActiveXAuthorInput {
    tweetAuthorId: string;
}

export interface CheckIsActiveXAuthorOutput {
    isActive: boolean;
    message?: string;
}

export async function checkIsActiveXAuthor(
    input: CheckIsActiveXAuthorInput
): Promise<CheckIsActiveXAuthorOutput> {
    try {
        if (!input.tweetAuthorId) {
            return {
                isActive: false,
                message:
                    "Invalid input. Please try again. If the problem persists, please contact support.",
            };
        }

        const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

        if (!BEARER_TOKEN) {
            return {
                isActive: false,
                message: "TWITTER_BEARER_TOKEN is not set",
            };
        }

        const response = await fetch(
            `https://api.twitter.com/2/users/${input.tweetAuthorId}/tweets?max_results=5&tweet.fields=entities&expansions=author_id&user.fields=username,name,profile_image_url,public_metrics,verified`,
            {
                headers: {
                    Authorization: `Bearer ${BEARER_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            return {
                isActive: false,
                message: `Twitter API Error: ${response.status} ${response.statusText}`,
            };
        }

        const data: XApiUserTweetsResponse = await response.json();
        const tweets = data.data || [];

        const hasMentioned = tweets.some((tweet: UserTweetData) =>
            tweet.entities?.mentions?.some(
                (mention: TweetMention) =>
                    mention.username.toLowerCase() === "starglowp"
            )
        );

        return {
            isActive: hasMentioned,
            message: hasMentioned
                ? "Found mention of @StarglowP in recent tweets"
                : "No mentions of @StarglowP in recent tweets",
        };
    } catch (error) {
        console.error(
            "Error occurred while checking X Account Activity:",
            error
        );
        return {
            isActive: false,
            message:
                "Error occurred while checking X Account Activity. Please try again. If the problem persists, please contact support.",
        };
    }
}

export interface ConfirmRegisterXAuthorInput {
    playerId: string;
    tweetAuthorId: string;
}

export interface ConfirmRegisterXAuthorOutput {
    success: boolean;
    data?: TweetAuthor;
    message?: string;
}

export async function confirmRegisterXAuthor(
    input: ConfirmRegisterXAuthorInput
): Promise<ConfirmRegisterXAuthorOutput> {
    try {
        if (!input.playerId || !input.tweetAuthorId) {
            return {
                success: false,
                message:
                    "Invalid input. Please try again. If the problem persists, please contact support.",
            };
        }

        const player = await prisma.player.findUnique({
            where: {
                id: input.playerId,
            },
            include: {
                tweetAuthor: true,
            },
        });

        if (!player) {
            return {
                success: false,
                message:
                    "Player not found. Please try again. If the problem persists, please contact support.",
            };
        }

        const tweetAuthor = await prisma.tweetAuthor.findUnique({
            where: {
                authorId: input.tweetAuthorId,
            },
            include: {
                player: true,
            },
        });

        if (!tweetAuthor) {
            return {
                success: false,
                message:
                    "X Account not found. Please try again. If the problem persists, please contact support.",
            };
        }

        const updatedPlayer = await prisma.player.update({
            where: {
                id: input.playerId,
            },
            data: {
                tweetAuthorId: input.tweetAuthorId,
            },
        });

        return {
            success: true,
            data: tweetAuthor,
        };
    } catch (error) {
        console.error("Error occurred while registering X author:", error);
        return {
            success: false,
            message:
                "Error occurred while registering X author. Please try again. If the problem persists, please contact support.",
        };
    }
}
