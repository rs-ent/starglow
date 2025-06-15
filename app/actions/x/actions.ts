/// app/actions/x/actions.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import {
    TweetAuthor,
    Tweet,
    TweetMetrics,
    TweetAuthorMetrics,
    TweetMedia,
} from "@prisma/client";

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
