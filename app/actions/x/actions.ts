/// app/actions/x/actions.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import {
    TweetAuthor,
    User,
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
    user: User | null;
    tweets: TweetWithMetrics[];
    metrics: TweetAuthorMetrics[];
};

export async function getTweetAuthors(): Promise<Author[]> {
    return await prisma.tweetAuthor.findMany({
        include: {
            user: true,
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
    });
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
