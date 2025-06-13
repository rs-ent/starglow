/// app/actions/x/actions.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { TweetAuthor, User, Tweet } from "@prisma/client";

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

export type Author = TweetAuthor & {
    user: User | null;
    tweets: Tweet[];
};

export async function getTweetAuthors(): Promise<Author[]> {
    return await prisma.tweetAuthor.findMany({
        include: {
            user: true,
            tweets: true,
        },
    });
}

export async function getTweets() {
    return await prisma.tweet.findMany();
}
