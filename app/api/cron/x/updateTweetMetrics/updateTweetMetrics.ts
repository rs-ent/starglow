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
        const tweetsToUpdate = await prisma.tweet.findMany({
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
        });

        console.log(`Found ${tweetsToUpdate.length} tweets to update metrics`);

        // 2. 100개씩 배치 처리
        const batchSize = 100;
        const batches = [];

        for (let i = 0; i < tweetsToUpdate.length; i += batchSize) {
            batches.push(tweetsToUpdate.slice(i, i + batchSize));
        }

        console.log(
            `Processing ${batches.length} batches of ${batchSize} tweets each`
        );

        // 3. Rate Limit 고려한 배치 처리
        for (const batch of batches) {
            if (requestCount >= 6) {
                console.warn(
                    `Rate limit protection: stopping at ${requestCount} requests`
                );
                break;
            }

            const tweetIds = batch.map((tweet) => tweet.tweetId);

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
                    console.log(
                        `No metrics data returned for batch ${requestCount}`
                    );
                    continue;
                }

                // 4. 메트릭 변화 감지 및 저장
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

                // 5. 변화된 메트릭만 저장
                if (metricsToSave.length > 0) {
                    await prisma.tweetMetrics.createMany({
                        data: metricsToSave,
                    });

                    totalMetricsUpdated += metricsToSave.length;
                    console.log(
                        `Saved ${metricsToSave.length} updated metrics in batch ${requestCount}`
                    );
                }

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
                console.error(`Error processing batch ${requestCount}:`, error);
                continue;
            }
        }

        console.log(
            `Metrics update completed: ${totalMetricsUpdated} metrics updated using ${requestCount} API requests`
        );

        return {
            totalProcessed: tweetsToUpdate.length,
            metricsUpdated: totalMetricsUpdated,
            apiRequestsUsed: requestCount,
            rateLimitRemaining: rateLimitRemaining
                ? parseInt(rateLimitRemaining)
                : null,
            timestamp: new Date().toISOString(),
            processingTimeMs: Date.now() - startTime,
        };
    } catch (error) {
        console.error("❌ Metrics update failed:", error);
        throw error;
    }
}
