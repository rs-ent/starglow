/// app/api/cron/x/fetchTaggedTweets.ts

import { prisma } from "@/lib/prisma/client";
import { Tweet, TweetResponse, TweetSyncData } from "@prisma/client";

type TweetCreateData = Omit<Tweet, "id">;

interface TweetRawData {
    id: string;
    text: string;
    created_at: string;
    author_id: string;
}

interface XApiResponse {
    data?: TweetRawData[];
    includes?: {
        users: Array<{
            id: string;
            username: string;
            name: string;
        }>;
    };
    meta: {
        result_count: number;
        newest_id?: string;
        oldest_id?: string;
        next_token?: string;
    };
}

interface SyncResult {
    total: number;
    new: number;
    tweets: TweetCreateData[];
    timestamp: string;
    timeRange: {
        start: string;
        end: string;
    };
    apiRequestsUsed: number;
    rateLimitRemaining: number | null;
    lastTweetId: string | null | undefined;
    syncDataId: number;
}

interface ApiRequestLog {
    params: Record<string, any>;
    response: XApiResponse;
    status: number;
    processingTime: number;
}

export async function fetchTaggedTweets(): Promise<SyncResult> {
    const startTime = Date.now();
    const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

    if (!BEARER_TOKEN) {
        throw new Error("TWITTER_BEARER_TOKEN is not set");
    }

    let syncDataId: number;
    let requestCount = 0;
    let rateLimitRemaining: string | null = null;
    let apiLogs: ApiRequestLog[] = [];

    try {
        const lastSuccessSync = await prisma.tweetSyncData.findFirst({
            where: { syncStatus: "success" },
            orderBy: { lastSyncAt: "desc" },
        });

        console.log(
            `Starting sync. Last successful sync: ${
                lastSuccessSync?.lastSyncAt || "never"
            }`
        );

        let nextToken: string | undefined;
        let allTweets: TweetRawData[] = [];

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const startTimeForBackup = lastSuccessSync?.lastTweetId
            ? undefined
            : fiveMinutesAgo;

        do {
            requestCount++;

            if (requestCount > 5) {
                console.warn(
                    `Rate limit protection: stopping at ${requestCount} requests`
                );
                break;
            }

            const requestParams = {
                query: "@starglowP",
                "tweet.fields": "created_at,author_id,public_metrics",
                "user.fields": "username,name,profile_image_url",
                expansions: "author_id",
                max_results: "100",
                ...(lastSuccessSync?.lastTweetId && {
                    since_id: lastSuccessSync.lastTweetId,
                }),
                ...(startTimeForBackup && {
                    start_time: startTimeForBackup.toISOString(),
                }),
                ...(nextToken && { pagination_token: nextToken }),
            };

            const queryParams = new URLSearchParams(requestParams);
            const requestStartTime = Date.now();

            console.log(`API Request ${requestCount}:`, {
                since_id: requestParams.since_id || "none",
                start_time: requestParams.start_time || "none",
                pagination_token: requestParams.pagination_token || "none",
            });

            const response = await fetch(
                `https://api.twitter.com/2/tweets/search/recent?${queryParams}`,
                {
                    headers: {
                        Authorization: `Bearer ${BEARER_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const requestEndTime = Date.now();
            const processingTime = requestEndTime - requestStartTime;

            rateLimitRemaining = response.headers.get("x-rate-limit-remaining");
            const resetTime = response.headers.get("x-rate-limit-reset");

            if (rateLimitRemaining && parseInt(rateLimitRemaining) < 10) {
                const resetDate = new Date(parseInt(resetTime!) * 1000);
                console.warn(
                    `Rate limit warning: ${rateLimitRemaining} requests remaining. Reset at: ${resetDate}`
                );
            }

            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { detail: errorText };
                }

                apiLogs.push({
                    params: requestParams,
                    response: errorData,
                    status: response.status,
                    processingTime,
                });

                if (response.status === 429) {
                    console.error("Rate limited! Will retry in next cycle.");
                    break;
                }

                throw new Error(
                    `Twitter API Error: ${
                        errorData.detail || response.statusText
                    }`
                );
            }

            const data: XApiResponse = await response.json();

            apiLogs.push({
                params: requestParams,
                response: data,
                status: response.status,
                processingTime,
            });

            console.log(`API Response ${requestCount}:`, {
                result_count: data.meta.result_count,
                newest_id: data.meta.newest_id,
                next_token: data.meta.next_token ? "present" : "none",
            });

            if (!data.data || data.data.length === 0) {
                console.log("No more tweets found");
                break;
            }

            allTweets = [...allTweets, ...data.data];
            nextToken = data.meta.next_token;
        } while (nextToken);

        console.log(`Total tweets collected: ${allTweets.length}`);

        const result = await prisma.$transaction(async (tx) => {
            const syncData = await tx.tweetSyncData.create({
                data: {
                    lastSyncAt: new Date(),
                    syncStatus: "in_progress",
                    apiRequestsUsed: requestCount,
                    rateLimitRemaining: rateLimitRemaining
                        ? parseInt(rateLimitRemaining)
                        : null,
                    executionTimeMs: Date.now() - startTime,
                },
            });

            syncDataId = syncData.id;

            const responseData = apiLogs.map((log) => ({
                tweetSyncDataId: syncData.id,
                rawResponse: JSON.stringify(log.response),
                requestParams: JSON.stringify(log.params),
                responseCode: log.status,
                processingTimeMs: log.processingTime,
            }));

            if (responseData.length > 0) {
                await tx.tweetResponse.createMany({
                    data: responseData,
                });
            }

            const existingTweets = await tx.tweet.findMany({
                where: {
                    tweetId: {
                        in: allTweets.map((tweet) => tweet.id),
                    },
                },
                select: {
                    tweetId: true,
                },
            });

            const existingTweetIds = new Set(
                existingTweets.map((t) => t.tweetId)
            );

            const newTweetsData: TweetCreateData[] = allTweets
                .filter((tweet) => !existingTweetIds.has(tweet.id))
                .map((tweet) => ({
                    tweetId: tweet.id,
                    text: tweet.text,
                    authorId: tweet.author_id,
                    createdAt: new Date(tweet.created_at),
                }));

            if (newTweetsData.length > 0) {
                await tx.tweet.createMany({
                    data: newTweetsData,
                    skipDuplicates: true,
                });
                console.log(`Saved ${newTweetsData.length} new tweets`);
            }

            const newestTweetId =
                allTweets.length > 0
                    ? allTweets.reduce((newest, current) => {
                          try {
                              return BigInt(current.id) > BigInt(newest.id)
                                  ? current
                                  : newest;
                          } catch {
                              return current.id > newest.id ? current : newest;
                          }
                      }).id
                    : lastSuccessSync?.lastTweetId;

            await tx.tweetSyncData.update({
                where: { id: syncData.id },
                data: {
                    lastTweetId: newestTweetId,
                    syncStatus: "success",
                    totalTweetsFound: allTweets.length,
                    newTweetsAdded: newTweetsData.length,
                    executionTimeMs: Date.now() - startTime,
                },
            });

            return {
                total: allTweets.length,
                new: newTweetsData.length,
                tweets: newTweetsData,
                lastTweetId: newestTweetId,
                syncDataId: syncData.id,
            };
        });

        console.log(`Sync completed successfully. ID: ${result.syncDataId}`);

        return {
            ...result,
            timestamp: new Date().toISOString(),
            timeRange: {
                start:
                    startTimeForBackup?.toISOString() ||
                    lastSuccessSync?.lastSyncAt?.toISOString() ||
                    "since_last_sync",
                end: new Date().toISOString(),
            },
            apiRequestsUsed: requestCount,
            rateLimitRemaining: rateLimitRemaining
                ? parseInt(rateLimitRemaining)
                : null,
        };
    } catch (error) {
        console.error("❌ Sync failed:", error);

        try {
            const errorSyncData = await prisma.tweetSyncData.create({
                data: {
                    lastSyncAt: new Date(),
                    syncStatus: "failed",
                    errorMessage:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                    apiRequestsUsed: requestCount,
                    rateLimitRemaining: rateLimitRemaining
                        ? parseInt(rateLimitRemaining)
                        : null,
                    executionTimeMs: Date.now() - startTime,
                },
            });

            if (apiLogs.length > 0) {
                await prisma.tweetResponse.createMany({
                    data: apiLogs.map((log) => ({
                        tweetSyncDataId: errorSyncData.id,
                        rawResponse: JSON.stringify(log.response),
                        requestParams: JSON.stringify(log.params),
                        responseCode: log.status,
                        processingTimeMs: log.processingTime,
                    })),
                });
            }

            syncDataId = errorSyncData.id;
        } catch (logError) {
            console.error("Failed to log error:", logError);
        }

        throw error;
    }
}
