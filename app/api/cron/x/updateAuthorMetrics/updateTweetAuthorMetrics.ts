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

        // 2. 100명씩 배치 처리 (GET /2/users는 최대 100개 ID 지원)
        const batchSize = 100;
        const batches = [];

        for (let i = 0; i < authorsToUpdate.length; i += batchSize) {
            batches.push(authorsToUpdate.slice(i, i + batchSize));
        }

        // 3. Rate Limit 고려한 배치 처리 (24시간 기준 500회 제한)
        const maxRequestsPerRun = Math.min(8, Math.floor(500 / 48));

        for (const batch of batches) {
            if (requestCount >= maxRequestsPerRun) {
                console.warn(
                    `Daily rate limit protection: stopping at ${requestCount} requests`
                );
                break;
            }

            const authorIds = batch.map((author) => author.authorId);

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

                // 4. 메트릭 변화 감지 및 저장
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

                // 5. 데이터베이스 업데이트
                await prisma.$transaction(async (tx) => {
                    // 기본 정보 업데이트
                    for (const update of authorUpdates) {
                        await tx.tweetAuthor.update(update);
                    }

                    // 변화된 메트릭 저장
                    if (metricsToSave.length > 0) {
                        await tx.tweetAuthorMetrics.createMany({
                            data: metricsToSave,
                        });
                    }
                });

                totalMetricsUpdated += metricsToSave.length;

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
                    `Error processing author batch ${requestCount}:`,
                    error
                );
                continue;
            }
        }

        return {
            totalProcessed: authorsToUpdate.length,
            metricsUpdated: totalMetricsUpdated,
            apiRequestsUsed: requestCount,
            rateLimitRemaining: rateLimitRemaining
                ? parseInt(rateLimitRemaining)
                : null,
            timestamp: new Date().toISOString(),
            processingTimeMs: Date.now() - startTime,
        };
    } catch (error) {
        console.error("❌ Author metrics update failed:", error);
        throw error;
    }
}
