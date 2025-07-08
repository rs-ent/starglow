/// app/api/cron/x/fetchTaggedTweets.ts

import { prisma } from "@/lib/prisma/client";

import type { Tweet } from "@prisma/client";

type TweetCreateData = Omit<Tweet, "id">;

interface TweetRawData {
    id: string;
    text: string;
    created_at: string;
    author_id: string;
    public_metrics?: {
        retweet_count: number;
        reply_count: number;
        like_count: number;
        quote_count: number;
    };
    attachments?: {
        media_keys?: string[];
    };
}

interface XApiResponse {
    data?: TweetRawData[];
    includes?: {
        users?: Array<{
            id: string;
            username: string;
            name: string;
            profile_image_url: string | null;
            public_metrics?: {
                followers_count: number;
                following_count: number;
                tweet_count: number;
                listed_count: number;
            };
            verified?: boolean;
        }>;
        media?: Array<{
            media_key: string;
            type: string;
            url?: string;
            preview_image_url?: string;
            width?: number;
            height?: number;
            duration_ms?: number;
            alt_text?: string;
            public_metrics?: {
                view_count?: number;
            };
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

    let requestCount = 0;
    let rateLimitRemaining: string | null = null;
    const apiLogs: ApiRequestLog[] = [];

    try {
        const lastSuccessSync = await prisma.tweetSyncData.findFirst({
            where: { syncStatus: "success" },
            orderBy: { lastSyncAt: "desc" },
        });

        let nextToken: string | undefined;

        let allTweets: TweetRawData[] = [];
        const allUsers = new Map<
            string,
            {
                username: string;
                name: string;
                profile_image_url: string | null;
                public_metrics?: {
                    followers_count: number;
                    following_count: number;
                    tweet_count: number;
                    listed_count: number;
                };
                verified?: boolean;
            }
        >();
        const allMedia = new Map<
            string,
            {
                media_key: string;
                type: string;
                url?: string;
                preview_image_url?: string;
                width?: number;
                height?: number;
                duration_ms?: number;
                alt_text?: string;
                view_count?: number;
            }
        >();

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
                query: "@Starglow_world",
                "tweet.fields":
                    "created_at,author_id,public_metrics,attachments",
                "user.fields":
                    "username,name,profile_image_url,public_metrics,verified",
                "media.fields":
                    "type,url,preview_image_url,public_metrics,width,height,duration_ms,alt_text",
                expansions: "author_id,attachments.media_keys",
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

            if (rateLimitRemaining && parseInt(rateLimitRemaining) < 13) {
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

            if (data.includes?.users) {
                data.includes.users.forEach((user) => {
                    allUsers.set(user.id, {
                        username: user.username,
                        name: user.name,
                        profile_image_url: user.profile_image_url || null,
                        public_metrics: user.public_metrics,
                        verified: user.verified || false,
                    });
                });
            }

            if (data.includes?.media) {
                data.includes.media.forEach((media) => {
                    allMedia.set(media.media_key, {
                        media_key: media.media_key,
                        type: media.type,
                        url: media.url,
                        preview_image_url: media.preview_image_url,
                        width: media.width,
                        height: media.height,
                        duration_ms: media.duration_ms,
                        alt_text: media.alt_text,
                        view_count: media.public_metrics?.view_count,
                    });
                });
            }

            apiLogs.push({
                params: requestParams,
                response: data,
                status: response.status,
                processingTime,
            });

            if (!data.data || data.data.length === 0) {
                break;
            }

            allTweets = [...allTweets, ...data.data];
            nextToken = data.meta.next_token;
        } while (nextToken);

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

            const authorPromises = Array.from(allUsers.entries()).map(
                ([authorId, userData]) =>
                    tx.tweetAuthor.upsert({
                        where: {
                            authorId: authorId,
                        },
                        create: {
                            authorId: authorId,
                            name: userData.name,
                            username: userData.username,
                            profileImageUrl: userData.profile_image_url,
                        },
                        update: {
                            name: userData.name,
                            username: userData.username,
                            profileImageUrl: userData.profile_image_url,
                        },
                    })
            );

            await Promise.all(authorPromises);

            const authorMetricsPromises = Array.from(allUsers.entries()).map(
                ([authorId, userData]) => {
                    if (!userData.public_metrics) return Promise.resolve();

                    return tx.tweetAuthorMetrics.create({
                        data: {
                            tweetAuthorId: authorId,
                            followersCount:
                                userData.public_metrics.followers_count,
                            followingCount:
                                userData.public_metrics.following_count,
                            tweetCount: userData.public_metrics.tweet_count,
                            listedCount: userData.public_metrics.listed_count,
                            verified: userData.verified || false,
                            recordedAt: new Date(),
                        },
                    });
                }
            );

            await Promise.all(authorMetricsPromises.filter(Boolean));

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
                .map((tweet) => {
                    const author = allUsers.get(tweet.author_id);

                    return {
                        tweetId: tweet.id,
                        text: tweet.text,
                        authorId: tweet.author_id,
                        authorName: author?.name || null,
                        authorUsername: author?.username || null,
                        authorProfileImageUrl:
                            author?.profile_image_url || null,
                        createdAt: new Date(tweet.created_at),
                        updatedAt: new Date(),
                        isDeleted: false,
                        deletedAt: null,
                    };
                });

            if (newTweetsData.length > 0) {
                await tx.tweet.createMany({
                    data: newTweetsData,
                    skipDuplicates: true,
                });
            }

            const tweetMetricsPromises = allTweets.map((tweet) => {
                if (!tweet.public_metrics) return Promise.resolve();

                return tx.tweetMetrics.create({
                    data: {
                        tweetId: tweet.id,
                        replyCount: tweet.public_metrics.reply_count,
                        retweetCount: tweet.public_metrics.retweet_count,
                        likeCount: tweet.public_metrics.like_count,
                        quoteCount: tweet.public_metrics.quote_count,
                        recordedAt: new Date(),
                    },
                });
            });

            await Promise.all(tweetMetricsPromises.filter(Boolean));

            const mediaPromises = allTweets
                .filter((tweet) => tweet.attachments?.media_keys)
                .flatMap((tweet) =>
                    tweet.attachments!.media_keys!.map((mediaKey) => {
                        const mediaData = allMedia.get(mediaKey);
                        if (!mediaData) return Promise.resolve();

                        return tx.tweetMedia.create({
                            data: {
                                mediaKey: mediaData.media_key,
                                tweetId: tweet.id,
                                type: mediaData.type,
                                url: mediaData.url || null,
                                previewImageUrl:
                                    mediaData.preview_image_url || null,
                                width: mediaData.width || null,
                                height: mediaData.height || null,
                                durationMs: mediaData.duration_ms || null,
                                altText: mediaData.alt_text || null,
                            },
                        });
                    })
                );

            await Promise.all(mediaPromises.filter(Boolean));

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
        } catch (logError) {
            console.error("Failed to log error:", logError);
        }

        throw error;
    } finally {
        // 오래된 tweetSyncData, tweetResponse 정리 (3일 이전)
        const cutoffDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        try {
            // 1. 3일 이전 tweetSyncData id 목록 조회
            const oldSyncData = await prisma.tweetSyncData.findMany({
                where: { lastSyncAt: { lt: cutoffDate } },
                select: { id: true },
            });
            const oldIds = oldSyncData.map((d) => d.id);
            if (oldIds.length > 0) {
                // 2. tweetResponse 먼저 삭제
                await prisma.tweetResponse.deleteMany({
                    where: { tweetSyncDataId: { in: oldIds } },
                });
                // 3. tweetSyncData 삭제
                await prisma.tweetSyncData.deleteMany({
                    where: { id: { in: oldIds } },
                });
            }
        } catch (cleanupError) {
            console.error("Cleanup failed:", cleanupError);
        }
    }
}
