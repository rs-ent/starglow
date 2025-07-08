/// app/api/cron/x/updateTweetMetrics.ts

import { prisma } from "@/lib/prisma/client";

interface TweetMetricsRawData {
    id: string;
    public_metrics?: {
        retweet_count: number;
        reply_count: number;
        like_count: number;
        quote_count: number;
    };
}

interface XApiMetricsResponse {
    data?: TweetMetricsRawData[];
    meta: {
        result_count: number;
    };
}

interface MetricsUpdateResult {
    totalProcessed: number;
    metricsUpdated: number;
    apiRequestsUsed: number;
    rateLimitRemaining: number | null;
    timestamp: string;
    processingTimeMs: number;
}

interface TweetForMetricsUpdate {
    tweetId: string;
    metricsHistory: {
        replyCount: number;
        retweetCount: number;
        likeCount: number;
        quoteCount: number;
    }[];
}

export async function updateTweetMetrics(): Promise<MetricsUpdateResult> {
    const startTime = Date.now();
    const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

    if (!BEARER_TOKEN) {
        throw new Error("TWITTER_BEARER_TOKEN is not set");
    }

    let requestCount = 0;
    let rateLimitRemaining: string | null = null;
    let totalMetricsUpdated = 0;

    try {
        const tweetsToUpdate = (await prisma.tweet.findMany({
            where: {
                OR: [
                    {
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                        },
                    },
                    {
                        metricsHistory: {
                            some: {
                                OR: [
                                    { likeCount: { gte: 100 } },
                                    { retweetCount: { gte: 50 } },
                                    { replyCount: { gte: 20 } },
                                ],
                                recordedAt: {
                                    gte: new Date(
                                        Date.now() - 7 * 24 * 60 * 60 * 1000
                                    ),
                                },
                            },
                        },
                    },
                ],
                isDeleted: false,
            },
            select: {
                tweetId: true,
                metricsHistory: {
                    orderBy: { recordedAt: "desc" },
                    take: 1,
                },
            },
            orderBy: [{ createdAt: "desc" }],
            take: 1500,
        })) as unknown as TweetForMetricsUpdate[];

        console.info(
            `🔄 Starting tweet metrics update for ${tweetsToUpdate.length} tweets`
        );

        // 2. 100개씩 배치 처리
        const batchSize = 100;
        const batches = [];

        for (let i = 0; i < tweetsToUpdate.length; i += batchSize) {
            batches.push(tweetsToUpdate.slice(i, i + batchSize));
        }

        // 3. Rate Limit 고려한 배치 처리
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];

            if (requestCount >= 6) {
                console.warn(
                    `Rate limit protection: stopping at ${requestCount} requests`
                );
                break;
            }

            const tweetIds = batch.map((tweet) => tweet.tweetId);
            const batchStartTime = Date.now();

            try {
                const response = await fetch(
                    `https://api.twitter.com/2/tweets?ids=${tweetIds.join(
                        ","
                    )}&tweet.fields=public_metrics`,
                    {
                        headers: {
                            Authorization: `Bearer ${BEARER_TOKEN}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                requestCount++;
                rateLimitRemaining = response.headers.get(
                    "x-rate-limit-remaining"
                );

                if (!response.ok) {
                    console.error(
                        `API Error: ${response.status} ${response.statusText}`
                    );
                    continue;
                }

                const data: XApiMetricsResponse = await response.json();

                if (!data.data || data.data.length === 0) {
                    continue;
                }

                // 4. 메트릭 변화 감지 및 저장 데이터 준비
                const metricsToSave: Array<{
                    tweetId: string;
                    replyCount: number;
                    retweetCount: number;
                    likeCount: number;
                    quoteCount: number;
                    recordedAt: Date;
                }> = [];

                for (const tweetData of data.data) {
                    if (!tweetData.public_metrics) continue;

                    const originalTweet = batch.find(
                        (t) => t.tweetId === tweetData.id
                    );
                    if (!originalTweet) continue;

                    const latestMetrics = originalTweet.metricsHistory[0];
                    const newMetrics = tweetData.public_metrics;

                    // 메트릭 변화 확인
                    const hasChanged =
                        !latestMetrics ||
                        latestMetrics.replyCount !== newMetrics.reply_count ||
                        latestMetrics.retweetCount !==
                            newMetrics.retweet_count ||
                        latestMetrics.likeCount !== newMetrics.like_count ||
                        latestMetrics.quoteCount !== newMetrics.quote_count;

                    if (hasChanged) {
                        metricsToSave.push({
                            tweetId: tweetData.id,
                            replyCount: newMetrics.reply_count,
                            retweetCount: newMetrics.retweet_count,
                            likeCount: newMetrics.like_count,
                            quoteCount: newMetrics.quote_count,
                            recordedAt: new Date(),
                        });
                    }
                }

                // 5. 변화된 메트릭만 저장 (재시도 로직 포함)
                let batchMetricsUpdated = 0;

                if (metricsToSave.length > 0) {
                    const maxRetries = 3;

                    for (let attempt = 1; attempt <= maxRetries; attempt++) {
                        try {
                            await prisma.$transaction(
                                async (tx) => {
                                    await tx.tweetMetrics.createMany({
                                        data: metricsToSave,
                                        skipDuplicates: true,
                                    });
                                },
                                { timeout: 15000 }
                            );

                            batchMetricsUpdated = metricsToSave.length;
                            totalMetricsUpdated += batchMetricsUpdated;
                            break;
                        } catch (error) {
                            console.error(
                                `Tweet metrics batch ${
                                    batchIndex + 1
                                } attempt ${attempt} failed:`,
                                error
                            );

                            if (attempt === maxRetries) {
                                console.error(
                                    `⚠️ Failed to process tweet metrics batch ${
                                        batchIndex + 1
                                    } after all retries`
                                );
                                // Continue with next batch instead of failing completely
                                break;
                            }

                            // Wait before retry with exponential backoff
                            const delay = 1000 * Math.pow(2, attempt - 1);
                            console.info(
                                `Retrying tweet metrics batch ${
                                    batchIndex + 1
                                } in ${delay}ms...`
                            );
                            await new Promise((resolve) =>
                                setTimeout(resolve, delay)
                            );
                        }
                    }
                }

                const batchProcessingTime = Date.now() - batchStartTime;
                console.info(
                    `✅ Batch ${batchIndex + 1}/${
                        batches.length
                    } processed successfully: ${
                        batch.length
                    } tweets checked, ${batchMetricsUpdated} metrics updated in ${batchProcessingTime}ms`
                );

                // Rate Limit 체크
                if (rateLimitRemaining && parseInt(rateLimitRemaining) < 5) {
                    console.warn(
                        `Rate limit warning: ${rateLimitRemaining} requests remaining`
                    );
                    break;
                }

                // API 호출 간격 (Rate Limit 보호)
                await new Promise((resolve) => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(
                    `Error processing tweet metrics batch ${batchIndex + 1}:`,
                    error
                );
                continue;
            }
        }

        const totalProcessingTime = Date.now() - startTime;
        console.info(
            `✅ Tweet metrics update completed successfully: ${tweetsToUpdate.length} tweets processed, ${totalMetricsUpdated} metrics updated`
        );
        console.info(
            `📊 Performance Summary: Total time: ${totalProcessingTime}ms, API requests: ${requestCount}, Rate limit remaining: ${
                rateLimitRemaining || "unknown"
            }`
        );

        return {
            totalProcessed: tweetsToUpdate.length,
            metricsUpdated: totalMetricsUpdated,
            apiRequestsUsed: requestCount,
            rateLimitRemaining: rateLimitRemaining
                ? parseInt(rateLimitRemaining)
                : null,
            timestamp: new Date().toISOString(),
            processingTimeMs: totalProcessingTime,
        };
    } catch (error) {
        console.error("❌ Tweet metrics update failed:", error);
        throw error;
    }
}
