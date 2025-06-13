/// app/actions/x/actions.ts

"use server";

import { prisma } from "@/lib/prisma/client";

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

export async function getTweets() {
    return await prisma.tweet.findMany();
}
