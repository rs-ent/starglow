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

        let queryParams = null;
        let requestStartTime = null;
        let response = null;
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

            queryParams = new URLSearchParams(requestParams);
            requestStartTime = Date.now();

            response = await fetch(
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

        // Step 1: Create sync data record
        const syncData = await prisma.tweetSyncData.create({
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

        // Step 2: Process API logs (non-critical, can be done separately)
        if (apiLogs.length > 0) {
            const responseData = apiLogs.map((log) => ({
                tweetSyncDataId: syncData.id,
                rawResponse: JSON.stringify(log.response),
                requestParams: JSON.stringify(log.params),
                responseCode: log.status,
                processingTimeMs: log.processingTime,
            }));

            await prisma.tweetResponse.createMany({
                data: responseData,
            });
        }

        // Step 3: Process authors efficiently
        const authorEntries = Array.from(allUsers.entries());
        const authorProcessingStart = Date.now();

        if (authorEntries.length > 0) {
            // Check which authors already exist to optimize operations
            const existingAuthors = await prisma.tweetAuthor.findMany({
                where: {
                    authorId: {
                        in: authorEntries.map(([authorId]) => authorId),
                    },
                },
                select: { authorId: true },
            });

            const existingAuthorIds = new Set(
                existingAuthors.map((author) => author.authorId)
            );

            const authorsToCreate = authorEntries
                .filter(([authorId]) => !existingAuthorIds.has(authorId))
                .map(([authorId, userData]) => ({
                    authorId,
                    name: userData.name,
                    username: userData.username,
                    profileImageUrl: userData.profile_image_url,
                }));

            const authorsToUpdate = authorEntries.filter(([authorId]) =>
                existingAuthorIds.has(authorId)
            );

            // Process in single optimized transaction with retry logic
            const maxRetries = 3;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    await prisma.$transaction(
                        async (tx) => {
                            // Create new authors in batch
                            if (authorsToCreate.length > 0) {
                                await tx.tweetAuthor.createMany({
                                    data: authorsToCreate,
                                    skipDuplicates: true,
                                });
                            }

                            // Update existing authors (batch updates for efficiency)
                            for (const [
                                authorId,
                                userData,
                            ] of authorsToUpdate) {
                                await tx.tweetAuthor.update({
                                    where: { authorId },
                                    data: {
                                        name: userData.name,
                                        username: userData.username,
                                        profileImageUrl:
                                            userData.profile_image_url,
                                    },
                                });
                            }

                            // Create all author metrics in one batch
                            const metricsData = authorEntries
                                .filter(
                                    ([, userData]) => userData.public_metrics
                                )
                                .map(([authorId, userData]) => ({
                                    tweetAuthorId: authorId,
                                    followersCount:
                                        userData.public_metrics!
                                            .followers_count,
                                    followingCount:
                                        userData.public_metrics!
                                            .following_count,
                                    tweetCount:
                                        userData.public_metrics!.tweet_count,
                                    listedCount:
                                        userData.public_metrics!.listed_count,
                                    verified: userData.verified || false,
                                    recordedAt: new Date(),
                                }));

                            if (metricsData.length > 0) {
                                await tx.tweetAuthorMetrics.createMany({
                                    data: metricsData,
                                    skipDuplicates: true,
                                });
                            }
                        },
                        { timeout: 20000 }
                    );

                    const authorProcessingTime =
                        Date.now() - authorProcessingStart;
                    console.info(
                        `✅ Successfully processed ${authorEntries.length} authors in ${authorProcessingTime}ms (${authorsToCreate.length} new, ${authorsToUpdate.length} updated)`
                    );
                    break;
                } catch (error) {
                    console.error(
                        `Author processing attempt ${attempt} failed:`,
                        error
                    );

                    if (attempt === maxRetries) {
                        console.error(
                            "⚠️ Author processing failed after all retries, but continuing with tweets..."
                        );
                        // Don't throw - we can still process tweets even if authors fail
                        break;
                    }

                    // Wait before retry with exponential backoff
                    const delay = 1000 * Math.pow(2, attempt - 1);
                    console.info(`Retrying author processing in ${delay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }

        // Step 4: Process tweets efficiently
        const existingTweets = await prisma.tweet.findMany({
            where: {
                tweetId: {
                    in: allTweets.map((tweet) => tweet.id),
                },
            },
            select: {
                tweetId: true,
            },
        });

        const existingTweetIds = new Set(existingTweets.map((t) => t.tweetId));

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
                    authorProfileImageUrl: author?.profile_image_url || null,
                    createdAt: new Date(tweet.created_at),
                    updatedAt: new Date(),
                    isDeleted: false,
                    deletedAt: null,
                };
            });

        // Step 5: Create tweets, metrics, and media efficiently
        const tweetProcessingStart = Date.now();
        if (allTweets.length > 0) {
            // Prepare all data upfront for batch operations
            const allTweetMetrics = allTweets
                .filter((tweet) => tweet.public_metrics)
                .map((tweet) => ({
                    tweetId: tweet.id,
                    replyCount: tweet.public_metrics!.reply_count,
                    retweetCount: tweet.public_metrics!.retweet_count,
                    likeCount: tweet.public_metrics!.like_count,
                    quoteCount: tweet.public_metrics!.quote_count,
                    recordedAt: new Date(),
                }));

            const allMediaData = allTweets
                .filter((tweet) => tweet.attachments?.media_keys)
                .flatMap((tweet) =>
                    tweet
                        .attachments!.media_keys!.map((mediaKey) => {
                            const mediaInfo = allMedia.get(mediaKey);
                            if (!mediaInfo) return null;

                            return {
                                mediaKey: mediaInfo.media_key,
                                tweetId: tweet.id,
                                type: mediaInfo.type,
                                url: mediaInfo.url || null,
                                previewImageUrl:
                                    mediaInfo.preview_image_url || null,
                                width: mediaInfo.width || null,
                                height: mediaInfo.height || null,
                                durationMs: mediaInfo.duration_ms || null,
                                altText: mediaInfo.alt_text || null,
                            };
                        })
                        .filter(
                            (item): item is NonNullable<typeof item> =>
                                item !== null
                        )
                );

            // Process in optimized batches
            const batchSize = 200;
            for (
                let i = 0;
                i <
                Math.max(
                    newTweetsData.length,
                    allTweetMetrics.length,
                    allMediaData.length
                );
                i += batchSize
            ) {
                const tweetsBatch = newTweetsData.slice(i, i + batchSize);
                const metricsBatch = allTweetMetrics.slice(i, i + batchSize);
                const mediaBatch = allMediaData.slice(i, i + batchSize);

                const maxRetries = 2;

                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        await prisma.$transaction(
                            async (tx) => {
                                // Create new tweets
                                if (tweetsBatch.length > 0) {
                                    await tx.tweet.createMany({
                                        data: tweetsBatch,
                                        skipDuplicates: true,
                                    });
                                }

                                // Create tweet metrics
                                if (metricsBatch.length > 0) {
                                    await tx.tweetMetrics.createMany({
                                        data: metricsBatch,
                                        skipDuplicates: true,
                                    });
                                }

                                // Create tweet media
                                if (mediaBatch.length > 0) {
                                    await tx.tweetMedia.createMany({
                                        data: mediaBatch,
                                        skipDuplicates: true,
                                    });
                                }
                            },
                            { timeout: 60000 } // 15초 → 60초로 증가
                        );

                        break;
                    } catch (error) {
                        console.error(
                            `Tweet batch ${
                                Math.floor(i / batchSize) + 1
                            } attempt ${attempt} failed:`,
                            error
                        );

                        if (attempt === maxRetries) {
                            console.error(
                                `⚠️ Failed to process tweet batch ${
                                    Math.floor(i / batchSize) + 1
                                } after all retries`
                            );
                            // Continue with next batch instead of failing completely
                            break;
                        }

                        // Wait before retry
                        await new Promise((resolve) =>
                            setTimeout(resolve, 500 * attempt)
                        );
                    }
                }
            }

            const tweetProcessingTime = Date.now() - tweetProcessingStart;
            console.info(
                `✅ Successfully processed ${allTweets.length} tweets in ${tweetProcessingTime}ms (${newTweetsData.length} new tweets, ${allTweetMetrics.length} metrics, ${allMediaData.length} media items)`
            );
        }

        // Step 6: Update sync status with error handling
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

        try {
            await prisma.tweetSyncData.update({
                where: { id: syncData.id },
                data: {
                    lastTweetId: newestTweetId,
                    syncStatus: "success",
                    totalTweetsFound: allTweets.length,
                    newTweetsAdded: newTweetsData.length,
                    executionTimeMs: Date.now() - startTime,
                },
            });

            const totalProcessingTime = Date.now() - startTime;
            console.info(
                `✅ Sync completed successfully: ${allTweets.length} tweets found, ${newTweetsData.length} new tweets added`
            );
            console.info(
                `📊 Performance Summary: Total time: ${totalProcessingTime}ms, API requests: ${requestCount}, Authors: ${
                    authorEntries?.length || 0
                }, Rate limit remaining: ${rateLimitRemaining || "unknown"}`
            );
        } catch (error) {
            console.error(
                "⚠️ Failed to update sync status, but data was processed:",
                error
            );
            // Don't throw - the actual data processing was successful
        }

        const result = {
            total: allTweets.length,
            new: newTweetsData.length,
            tweets: newTweetsData,
            lastTweetId: newestTweetId,
            syncDataId: syncData.id,
        };

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
