"use server";

import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";
import { prisma } from "@/lib/prisma/client";

export async function getWalletsCount() {
    return await prisma.wallet.count({
        cacheStrategy: getCacheStrategy("tenMinutes"),
        where: {
            status: "ACTIVE",
        },
    });
}

export async function getDailyActiveUsers(startDateISO: string) {
    const utcStartDate = new Date(startDateISO);
    const utcEndDate = new Date();
    utcEndDate.setUTCHours(23, 59, 59, 999);

    if (isNaN(utcStartDate.getTime())) {
        throw new Error("Invalid startDate ISO string");
    }

    const wallets = await prisma.wallet.findMany({
        cacheStrategy: getCacheStrategy("tenMinutes"),
        where: {
            lastAccessedAt: {
                gte: utcStartDate,
                lte: utcEndDate,
            },
        },
        select: {
            address: true,
            lastAccessedAt: true,
            createdAt: true,
        },
    });

    const dailyStats = new Map<
        string,
        {
            activeWallets: Set<string>;
            newUsers: Set<string>;
            revisitUsers: Set<string>;
        }
    >();

    wallets.forEach((wallet) => {
        if (wallet.lastAccessedAt) {
            const date = wallet.lastAccessedAt.toISOString().split("T")[0];

            if (!dailyStats.has(date)) {
                dailyStats.set(date, {
                    activeWallets: new Set(),
                    newUsers: new Set(),
                    revisitUsers: new Set(),
                });
            }

            const dayStats = dailyStats.get(date)!;
            dayStats.activeWallets.add(wallet.address);

            const timeDiff =
                wallet.lastAccessedAt.getTime() - wallet.createdAt.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff >= 24) {
                dayStats.revisitUsers.add(wallet.address);
            } else {
                dayStats.newUsers.add(wallet.address);
            }
        }
    });

    const result = Array.from(dailyStats.entries())
        .map(([date, stats]) => ({
            date,
            activeWallets: stats.activeWallets.size,
            newUsers: stats.newUsers.size,
            revisitUsers: stats.revisitUsers.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return result;
}

// 단일 날짜의 퀘스트 성능 데이터를 가져오는 함수
export async function getQuestPerformanceForDate(dateStr: string) {
    try {
        const date = new Date(dateStr + "T00:00:00.000Z");
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const questLogs = await prisma.questLog.findMany({
            where: {
                createdAt: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
            select: {
                id: true,
                completedDates: true,
                claimedDates: true,
                claimedAt: true,
            },
        });

        const completions = new Set<string>();
        const claims = new Set<string>();

        questLogs.forEach((log) => {
            // completedDates 배열 처리
            log.completedDates.forEach((completedDate) => {
                const completedDateStr = completedDate
                    .toISOString()
                    .split("T")[0];
                if (completedDateStr === dateStr) {
                    completions.add(log.id);
                }
            });

            // claimedDates 배열 처리
            log.claimedDates.forEach((claimedDate) => {
                const claimedDateStr = claimedDate.toISOString().split("T")[0];
                if (claimedDateStr === dateStr) {
                    claims.add(log.id);
                }
            });

            // claimedAt 단일 필드 처리
            if (log.claimedAt) {
                const claimedAtStr = log.claimedAt.toISOString().split("T")[0];
                if (claimedAtStr === dateStr) {
                    claims.add(log.id);
                }
            }
        });

        return {
            date: dateStr,
            completions: completions.size,
            claims: claims.size,
        };
    } catch (error) {
        console.error(`Error processing date ${dateStr}:`, error);
        return {
            date: dateStr,
            completions: 0,
            claims: 0,
        };
    }
}

// 콜백 타입 정의
type ProgressCallback = (progress: {
    batchCount: number;
    totalProcessed: number;
    currentData: {
        date: string;
        completions: number;
        claims: number;
    }[];
}) => void;

export async function getQuestPerformance(
    startDateISO: string,
    onProgress?: ProgressCallback
) {
    const utcStartDate = new Date(startDateISO);
    const utcEndDate = new Date();
    utcEndDate.setUTCHours(23, 59, 59, 999);

    if (isNaN(utcStartDate.getTime())) {
        throw new Error("Invalid startDate ISO string");
    }

    try {
        // 🚀 100개씩 questLog를 처리하면서 실시간 업데이트
        const batchSize = 100;
        const delayMs = 50;
        let skip = 0;
        let hasMore = true;

        const dailyStats = new Map<
            string,
            { completions: Set<string>; claims: Set<string> }
        >();
        let totalProcessed = 0;
        let batchCount = 0;

        console.log(
            `Starting quest performance analysis with ${batchSize} records per batch...`
        );

        while (hasMore) {
            batchCount++;

            try {
                console.log(
                    `Processing batch ${batchCount}: records ${skip + 1}-${
                        skip + batchSize
                    }`
                );

                const questLogs = await prisma.questLog.findMany({
                    where: {
                        createdAt: {
                            gte: utcStartDate,
                            lte: utcEndDate,
                        },
                    },
                    select: {
                        id: true,
                        completedDates: true,
                        claimedDates: true,
                        claimedAt: true,
                    },
                    orderBy: {
                        id: "asc", // 안정적인 정렬
                    },
                    skip: skip,
                    take: batchSize,
                });

                // 더 이상 데이터가 없으면 종료
                if (questLogs.length === 0) {
                    hasMore = false;
                    break;
                }

                // 이 배치의 데이터 처리
                let batchCompletions = 0;
                let batchClaims = 0;

                questLogs.forEach((log) => {
                    // completedDates 배열 처리
                    log.completedDates.forEach((completedDate) => {
                        if (
                            completedDate >= utcStartDate &&
                            completedDate <= utcEndDate
                        ) {
                            const date = completedDate
                                .toISOString()
                                .split("T")[0];

                            if (!dailyStats.has(date)) {
                                dailyStats.set(date, {
                                    completions: new Set(),
                                    claims: new Set(),
                                });
                            }

                            dailyStats.get(date)!.completions.add(log.id);
                            batchCompletions++;
                        }
                    });

                    // claimedDates 배열 처리
                    log.claimedDates.forEach((claimedDate) => {
                        if (
                            claimedDate >= utcStartDate &&
                            claimedDate <= utcEndDate
                        ) {
                            const date = claimedDate
                                .toISOString()
                                .split("T")[0];

                            if (!dailyStats.has(date)) {
                                dailyStats.set(date, {
                                    completions: new Set(),
                                    claims: new Set(),
                                });
                            }

                            dailyStats.get(date)!.claims.add(log.id);
                            batchClaims++;
                        }
                    });

                    // claimedAt 단일 필드 처리
                    if (
                        log.claimedAt &&
                        log.claimedAt >= utcStartDate &&
                        log.claimedAt <= utcEndDate
                    ) {
                        const date = log.claimedAt.toISOString().split("T")[0];

                        if (!dailyStats.has(date)) {
                            dailyStats.set(date, {
                                completions: new Set(),
                                claims: new Set(),
                            });
                        }

                        dailyStats.get(date)!.claims.add(log.id);
                        batchClaims++;
                    }
                });

                totalProcessed += questLogs.length;
                skip += batchSize;

                // 현재까지의 결과 계산
                const currentResult = Array.from(dailyStats.entries())
                    .map(([date, stats]) => ({
                        date,
                        completions: stats.completions.size,
                        claims: stats.claims.size,
                    }))
                    .filter((day) => day.completions > 0 || day.claims > 0)
                    .sort((a, b) => a.date.localeCompare(b.date));

                console.log(
                    `Batch ${batchCount} completed: ${questLogs.length} logs processed, ${batchCompletions} completion events, ${batchClaims} claim events`
                );

                // 🎯 콜백으로 중간 결과 전달
                if (onProgress) {
                    onProgress({
                        batchCount,
                        totalProcessed,
                        currentData: currentResult,
                    });
                }

                // 배치 크기보다 적으면 마지막 배치
                if (questLogs.length < batchSize) {
                    hasMore = false;
                }
            } catch (batchError) {
                console.error(
                    `Error processing batch ${batchCount}:`,
                    batchError
                );
                // 에러가 나도 다음 배치 시도
                skip += batchSize;

                // 너무 많은 에러가 연속으로 나면 중단
                if (batchCount > 1000) {
                    console.error("Too many batches processed, stopping...");
                    hasMore = false;
                }
            }

            // 딜레이 추가 (마지막 배치가 아닐 때)
            if (hasMore) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }

        // 최종 결과
        const result = Array.from(dailyStats.entries())
            .map(([date, stats]) => ({
                date,
                completions: stats.completions.size,
                claims: stats.claims.size,
            }))
            .filter((day) => day.completions > 0 || day.claims > 0)
            .sort((a, b) => a.date.localeCompare(b.date));

        const finalCompletions = result.reduce(
            (sum, day) => sum + day.completions,
            0
        );
        const finalClaims = result.reduce((sum, day) => sum + day.claims, 0);

        console.log(`Quest performance analysis completed!
            - Processed ${batchCount} batches (${batchSize} records each)
            - Total quest logs processed: ${totalProcessed}
            - Final completion events: ${finalCompletions}
            - Final claim events: ${finalClaims}
            - Activity found on ${result.length} days`);

        return result;
    } catch (error) {
        console.error("Quest performance query error:", error);
        return [];
    }
}

// 🚀 하이브리드 방식: 총 개수 조회
export async function getQuestLogsCount(startDateISO: string) {
    const utcStartDate = new Date(startDateISO);
    const utcEndDate = new Date();
    utcEndDate.setUTCHours(23, 59, 59, 999);

    if (isNaN(utcStartDate.getTime())) {
        throw new Error("Invalid startDate ISO string");
    }

    try {
        const totalCount = await prisma.questLog.count({
            cacheStrategy: getCacheStrategy("tenMinutes"),
            where: {
                createdAt: {
                    gte: utcStartDate,
                    lte: utcEndDate,
                },
            },
        });

        console.log(
            `Total quest logs in range: ${totalCount.toLocaleString()}`
        );
        return totalCount;
    } catch (error) {
        console.error("Quest logs count query error:", error);
        return 0;
    }
}

// 🚀 하이브리드 방식: 페이지별 처리
export async function getQuestPerformancePage(
    startDateISO: string,
    page: number,
    pageSize: number = 1000
) {
    const utcStartDate = new Date(startDateISO);
    const utcEndDate = new Date();
    utcEndDate.setUTCHours(23, 59, 59, 999);

    if (isNaN(utcStartDate.getTime())) {
        throw new Error("Invalid startDate ISO string");
    }

    const skip = (page - 1) * pageSize;

    try {
        console.log(
            `Processing page ${page}: records ${skip + 1}-${skip + pageSize}`
        );

        const questLogs = await prisma.questLog.findMany({
            where: {
                createdAt: {
                    gte: utcStartDate,
                    lte: utcEndDate,
                },
            },
            select: {
                id: true,
                completedDates: true,
                claimedDates: true,
                claimedAt: true,
            },
            orderBy: {
                id: "asc", // 안정적인 정렬
            },
            skip: skip,
            take: pageSize,
        });

        // 이 페이지의 데이터를 날짜별로 집계
        const dailyStats = new Map<
            string,
            { completions: Set<string>; claims: Set<string> }
        >();

        let pageCompletions = 0;
        let pageClaims = 0;

        questLogs.forEach((log) => {
            // completedDates 배열 처리
            log.completedDates.forEach((completedDate) => {
                if (
                    completedDate >= utcStartDate &&
                    completedDate <= utcEndDate
                ) {
                    const date = completedDate.toISOString().split("T")[0];

                    if (!dailyStats.has(date)) {
                        dailyStats.set(date, {
                            completions: new Set(),
                            claims: new Set(),
                        });
                    }

                    // 🚀 실제 questLog ID를 사용하여 중복 제거
                    dailyStats.get(date)!.completions.add(log.id);
                    pageCompletions++;
                }
            });

            // claimedDates 배열 처리
            log.claimedDates.forEach((claimedDate) => {
                if (claimedDate >= utcStartDate && claimedDate <= utcEndDate) {
                    const date = claimedDate.toISOString().split("T")[0];

                    if (!dailyStats.has(date)) {
                        dailyStats.set(date, {
                            completions: new Set(),
                            claims: new Set(),
                        });
                    }

                    // 🚀 실제 questLog ID를 사용하여 중복 제거
                    dailyStats.get(date)!.claims.add(log.id);
                    pageClaims++;
                }
            });

            // claimedAt 단일 필드 처리
            if (
                log.claimedAt &&
                log.claimedAt >= utcStartDate &&
                log.claimedAt <= utcEndDate
            ) {
                const date = log.claimedAt.toISOString().split("T")[0];

                if (!dailyStats.has(date)) {
                    dailyStats.set(date, {
                        completions: new Set(),
                        claims: new Set(),
                    });
                }

                // 🚀 실제 questLog ID를 사용하여 중복 제거
                dailyStats.get(date)!.claims.add(log.id);
                pageClaims++;
            }
        });

        const pageResult = Array.from(dailyStats.entries()).map(
            ([date, stats]) => ({
                date,
                completions: stats.completions.size,
                claims: stats.claims.size,
                // 🚀 실제 ID 목록도 반환 (클라이언트에서 병합용)
                completionIds: Array.from(stats.completions),
                claimIds: Array.from(stats.claims),
            })
        );

        console.log(
            `Page ${page} completed: ${questLogs.length} logs processed, ${pageCompletions} completion events, ${pageClaims} claim events`
        );

        return {
            data: pageResult,
            metadata: {
                page,
                pageSize,
                recordsProcessed: questLogs.length,
                completionEvents: pageCompletions,
                claimEvents: pageClaims,
                hasMore: questLogs.length === pageSize,
            },
        };
    } catch (error) {
        console.error(`Page ${page} processing error:`, error);
        return {
            data: [],
            metadata: {
                page,
                pageSize,
                recordsProcessed: 0,
                completionEvents: 0,
                claimEvents: 0,
                hasMore: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
        };
    }
}
