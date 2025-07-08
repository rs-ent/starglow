/// app/api/cron/x/updateAuthorMetrics.ts

import { prisma } from "@/lib/prisma/client";

interface UserMetricsRawData {
    id: string;
    username: string;
    name: string;
    profile_image_url?: string;
    public_metrics?: {
        followers_count: number;
        following_count: number;
        tweet_count: number;
        listed_count: number;
    };
    verified?: boolean;
}

interface XApiUsersResponse {
    data?: UserMetricsRawData[];
    meta: {
        result_count: number;
    };
}

interface AuthorMetricsUpdateResult {
    totalProcessed: number;
    metricsUpdated: number;
    apiRequestsUsed: number;
    rateLimitRemaining: number | null;
    timestamp: string;
    processingTimeMs: number;
}

interface AuthorForMetricsUpdate {
    authorId: string;
    metrics: {
        followersCount: number;
        followingCount: number;
        tweetCount: number;
        listedCount: number;
        verified: boolean;
    }[];
}

export async function updateAuthorMetrics(): Promise<AuthorMetricsUpdateResult> {
    const startTime = Date.now();
    const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

    if (!BEARER_TOKEN) {
        throw new Error("TWITTER_BEARER_TOKEN is not set");
    }

    let requestCount = 0;
    let rateLimitRemaining: string | null = null;
    let totalMetricsUpdated = 0;

    try {
        // 1. 업데이트할 작성자 선택 (우선순위 기반)
        const authorsToUpdate = (await prisma.tweetAuthor.findMany({
            where: {
                OR: [
                    // 최근 24시간 내 트윗이 있는 작성자
                    {
                        tweets: {
                            some: {
                                createdAt: {
                                    gte: new Date(
                                        Date.now() - 24 * 60 * 60 * 1000
                                    ),
                                },
                                isDeleted: false,
                            },
                        },
                    },
                    // 또는 최근 메트릭이 높은 작성자
                    {
                        metrics: {
                            some: {
                                OR: [
                                    { followersCount: { gte: 1000 } },
                                    { verified: true },
                                ],
                                createdAt: {
                                    gte: new Date(
                                        Date.now() - 7 * 24 * 60 * 60 * 1000
                                    ),
                                },
                            },
                        },
                    },
                ],
            },
            select: {
                authorId: true,
                metrics: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
            orderBy: [
                // 최근 트윗이 있는 작성자 우선
                {
                    tweets: {
                        _count: "desc",
                    },
                },
            ],
            take: 200,
        })) as unknown as AuthorForMetricsUpdate[];

        console.info(
            `🔄 Starting author metrics update for ${authorsToUpdate.length} authors`
        );

        // 2. 100명씩 배치 처리 (GET /2/users는 최대 100개 ID 지원)
        const batchSize = 100;
        const batches = [];

        for (let i = 0; i < authorsToUpdate.length; i += batchSize) {
            batches.push(authorsToUpdate.slice(i, i + batchSize));
        }

        // 3. Rate Limit 고려한 배치 처리 (24시간 기준 500회 제한)
        const maxRequestsPerRun = Math.min(8, Math.floor(500 / 48));

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];

            if (requestCount >= maxRequestsPerRun) {
                console.warn(
                    `Daily rate limit protection: stopping at ${requestCount} requests`
                );
                break;
            }

            const authorIds = batch.map((author) => author.authorId);
            const batchStartTime = Date.now();

            try {
                const response = await fetch(
                    `https://api.twitter.com/2/users?ids=${authorIds.join(
                        ","
                    )}&user.fields=username,name,profile_image_url,public_metrics,verified`,
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

                const data: XApiUsersResponse = await response.json();

                if (!data.data || data.data.length === 0) {
                    continue;
                }

                // 4. 메트릭 변화 감지 및 저장 데이터 준비
                const metricsToSave: Array<{
                    tweetAuthorId: string;
                    followersCount: number;
                    followingCount: number;
                    tweetCount: number;
                    listedCount: number;
                    verified: boolean;
                    recordedAt: Date;
                }> = [];

                const authorUpdates: Array<{
                    where: { authorId: string };
                    data: {
                        name: string;
                        username: string;
                        profileImageUrl: string | null;
                    };
                }> = [];

                for (const userData of data.data) {
                    const originalAuthor = batch.find(
                        (a) => a.authorId === userData.id
                    );
                    if (!originalAuthor) continue;

                    // 기본 정보 업데이트 준비
                    authorUpdates.push({
                        where: { authorId: userData.id },
                        data: {
                            name: userData.name,
                            username: userData.username,
                            profileImageUrl: userData.profile_image_url || null,
                        },
                    });

                    // 메트릭 변화 확인
                    if (userData.public_metrics) {
                        const latestMetrics = originalAuthor.metrics[0];
                        const newMetrics = userData.public_metrics;

                        const hasChanged =
                            !latestMetrics ||
                            latestMetrics.followersCount !==
                                newMetrics.followers_count ||
                            latestMetrics.followingCount !==
                                newMetrics.following_count ||
                            latestMetrics.tweetCount !==
                                newMetrics.tweet_count ||
                            latestMetrics.listedCount !==
                                newMetrics.listed_count ||
                            latestMetrics.verified !==
                                (userData.verified || false);

                        if (hasChanged) {
                            metricsToSave.push({
                                tweetAuthorId: userData.id,
                                followersCount: newMetrics.followers_count,
                                followingCount: newMetrics.following_count,
                                tweetCount: newMetrics.tweet_count,
                                listedCount: newMetrics.listed_count,
                                verified: userData.verified || false,
                                recordedAt: new Date(),
                            });
                        }
                    }
                }

                // 5. 데이터베이스 업데이트 (분리된 트랜잭션과 재시도 로직)
                const maxRetries = 3;
                let batchMetricsUpdated = 0;

                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        // Step 1: Author 기본 정보 업데이트
                        await prisma.$transaction(
                            async (tx) => {
                                for (const update of authorUpdates) {
                                    await tx.tweetAuthor.update(update);
                                }
                            },
                            { timeout: 20000 }
                        );

                        // Step 2: 메트릭 데이터 저장 (분리된 트랜잭션)
                        if (metricsToSave.length > 0) {
                            await prisma.$transaction(
                                async (tx) => {
                                    await tx.tweetAuthorMetrics.createMany({
                                        data: metricsToSave,
                                        skipDuplicates: true,
                                    });
                                },
                                { timeout: 15000 }
                            );
                        }

                        batchMetricsUpdated = metricsToSave.length;
                        totalMetricsUpdated += batchMetricsUpdated;

                        const batchProcessingTime = Date.now() - batchStartTime;
                        console.info(
                            `✅ Batch ${batchIndex + 1}/${
                                batches.length
                            } processed successfully: ${
                                authorUpdates.length
                            } authors updated, ${batchMetricsUpdated} metrics changed in ${batchProcessingTime}ms`
                        );
                        break;
                    } catch (error) {
                        console.error(
                            `Author batch ${
                                batchIndex + 1
                            } attempt ${attempt} failed:`,
                            error
                        );

                        if (attempt === maxRetries) {
                            console.error(
                                `⚠️ Failed to process author batch ${
                                    batchIndex + 1
                                } after all retries`
                            );
                            // Continue with next batch instead of failing completely
                            break;
                        }

                        // Wait before retry with exponential backoff
                        const delay = 1000 * Math.pow(2, attempt - 1);
                        console.info(
                            `Retrying author batch ${
                                batchIndex + 1
                            } in ${delay}ms...`
                        );
                        await new Promise((resolve) =>
                            setTimeout(resolve, delay)
                        );
                    }
                }

                // Rate Limit 체크
                if (rateLimitRemaining && parseInt(rateLimitRemaining) < 50) {
                    console.warn(
                        `Rate limit warning: ${rateLimitRemaining} requests remaining`
                    );
                    break;
                }

                // API 호출 간격 (Rate Limit 보호)
                await new Promise((resolve) => setTimeout(resolve, 3000));
            } catch (error) {
                console.error(
                    `Error processing author batch ${batchIndex + 1}:`,
                    error
                );
                continue;
            }
        }

        const totalProcessingTime = Date.now() - startTime;
        console.info(
            `✅ Author metrics update completed successfully: ${authorsToUpdate.length} authors processed, ${totalMetricsUpdated} metrics updated`
        );
        console.info(
            `📊 Performance Summary: Total time: ${totalProcessingTime}ms, API requests: ${requestCount}, Rate limit remaining: ${
                rateLimitRemaining || "unknown"
            }`
        );

        return {
            totalProcessed: authorsToUpdate.length,
            metricsUpdated: totalMetricsUpdated,
            apiRequestsUsed: requestCount,
            rateLimitRemaining: rateLimitRemaining
                ? parseInt(rateLimitRemaining)
                : null,
            timestamp: new Date().toISOString(),
            processingTimeMs: totalProcessingTime,
        };
    } catch (error) {
        console.error("❌ Author metrics update failed:", error);
        throw error;
    }
}
