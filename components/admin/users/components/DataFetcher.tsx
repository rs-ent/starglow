"use client";

import {
    getWalletsCount,
    getDailyActiveUsers,
    getQuestPerformance,
    getQuestLogsCount,
    getQuestPerformancePage,
} from "@/app/actions/userDashboard/actions-read";
import { useCallback, useState, useRef } from "react";

const serviceStartDate = "2025-07-09T00:00:00.000Z";

export type RefreshTarget =
    | "wallets"
    | "dailyActiveUsers"
    | "questPerformance"
    | "questPerformanceHybrid";

// 🚀 하이브리드 방식을 위한 진행률 타입
export interface HybridProgress {
    totalRecords: number;
    processedRecords: number;
    currentPage: number;
    totalPages: number;
    percentage: number;
    speed: number; // records per second
    estimatedTimeRemaining: number; // seconds
    isComplete: boolean;
    canCancel: boolean;
}

export const useDataFetcher = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // 🎯 실시간 업데이트를 위한 questPerformance 데이터 상태 (기존 방식)
    const [questPerformanceData, setQuestPerformanceData] = useState<
        | {
              date: string;
              completions: number;
              claims: number;
          }[]
        | null
    >(null);

    // 🎯 진행률 상태 (기존 방식)
    const [questPerformanceProgress, setQuestPerformanceProgress] = useState<{
        batchCount: number;
        totalProcessed: number;
    } | null>(null);

    // 🚀 하이브리드 방식을 위한 새로운 상태들
    const [questPerformanceHybridData, setQuestPerformanceHybridData] =
        useState<
            | {
                  date: string;
                  completions: number;
                  claims: number;
              }[]
            | null
        >(null);

    const [hybridProgress, setHybridProgress] = useState<HybridProgress | null>(
        null
    );

    // 🚀 중단 제어를 위한 ref
    const hybridCancellationRef = useRef<{ cancelled: boolean }>({
        cancelled: false,
    });

    const fetchWalletsData = useCallback(async () => {
        return await getWalletsCount();
    }, []);

    const fetchDailyActiveUsersData = useCallback(async () => {
        return await getDailyActiveUsers(serviceStartDate);
    }, []);

    const fetchQuestPerformanceData = useCallback(async () => {
        // 🎯 실시간 업데이트를 위한 콜백 함수
        const onProgress = (progress: {
            batchCount: number;
            totalProcessed: number;
            currentData: {
                date: string;
                completions: number;
                claims: number;
            }[];
        }) => {
            console.log(
                `Progress update: Batch ${progress.batchCount}, Processed ${progress.totalProcessed} records`
            );

            setQuestPerformanceData(progress.currentData);
            setQuestPerformanceProgress({
                batchCount: progress.batchCount,
                totalProcessed: progress.totalProcessed,
            });
        };

        return await getQuestPerformance(serviceStartDate, onProgress);
    }, []);

    // 🚀 하이브리드 방식: 페이지네이션으로 처리
    const fetchQuestPerformanceHybrid = useCallback(async () => {
        // 중단 플래그 초기화
        hybridCancellationRef.current.cancelled = false;

        try {
            // Step 1: 총 개수 조회
            console.log("🔍 Getting total quest logs count...");
            const totalRecords = await getQuestLogsCount(serviceStartDate);

            if (totalRecords === 0) {
                setQuestPerformanceHybridData([]);
                setHybridProgress({
                    totalRecords: 0,
                    processedRecords: 0,
                    currentPage: 0,
                    totalPages: 0,
                    percentage: 100,
                    speed: 0,
                    estimatedTimeRemaining: 0,
                    isComplete: true,
                    canCancel: false,
                });
                return [];
            }

            const pageSize = 1000; // 1000개씩 처리
            const totalPages = Math.ceil(totalRecords / pageSize);

            console.log(
                `📊 Total: ${totalRecords.toLocaleString()} records, ${totalPages} pages`
            );

            // 전체 결과를 누적할 Map
            const allDailyStats = new Map<
                string,
                { completions: Set<string>; claims: Set<string> }
            >();

            let processedRecords = 0;
            const startTime = Date.now();

            // Step 2: 페이지별로 처리
            for (let page = 1; page <= totalPages; page++) {
                // 중단 확인
                if (hybridCancellationRef.current.cancelled) {
                    console.log("🛑 Processing cancelled by user");
                    break;
                }

                const pageStartTime = Date.now();

                // 진행률 업데이트 (처리 시작 전)
                const elapsed = (Date.now() - startTime) / 1000;
                const speed = processedRecords / Math.max(elapsed, 1);
                const remainingRecords = totalRecords - processedRecords;
                const estimatedTimeRemaining =
                    speed > 0 ? remainingRecords / speed : 0;

                setHybridProgress({
                    totalRecords,
                    processedRecords,
                    currentPage: page,
                    totalPages,
                    percentage: (processedRecords / totalRecords) * 100,
                    speed,
                    estimatedTimeRemaining,
                    isComplete: false,
                    canCancel: true,
                });

                // 페이지 데이터 가져오기
                const pageResult = await getQuestPerformancePage(
                    serviceStartDate,
                    page,
                    pageSize
                );

                if (pageResult.metadata.error) {
                    console.error(
                        `❌ Page ${page} failed:`,
                        pageResult.metadata.error
                    );
                    // 에러가 있어도 계속 진행
                    continue;
                }

                // 🚀 페이지 결과를 전체 결과에 병합 (실제 ID 기반)
                pageResult.data.forEach(
                    ({
                        date,
                        completions,
                        claims,
                        completionIds,
                        claimIds,
                    }) => {
                        if (!allDailyStats.has(date)) {
                            allDailyStats.set(date, {
                                completions: new Set(),
                                claims: new Set(),
                            });
                        }

                        const stats = allDailyStats.get(date)!;

                        // 🚀 실제 ID를 사용하여 중복 제거
                        if (completionIds) {
                            completionIds.forEach((id) =>
                                stats.completions.add(id)
                            );
                        }
                        if (claimIds) {
                            claimIds.forEach((id) => stats.claims.add(id));
                        }
                    }
                );

                processedRecords += pageResult.metadata.recordsProcessed;

                // 현재까지의 결과를 UI에 업데이트
                const currentResult = Array.from(allDailyStats.entries())
                    .map(([date, stats]) => ({
                        date,
                        completions: stats.completions.size,
                        claims: stats.claims.size,
                    }))
                    .filter((day) => day.completions > 0 || day.claims > 0)
                    .sort((a, b) => a.date.localeCompare(b.date));

                setQuestPerformanceHybridData(currentResult);

                const pageElapsed = Date.now() - pageStartTime;
                console.log(
                    `✅ Page ${page}/${totalPages} completed in ${pageElapsed}ms - ${pageResult.metadata.recordsProcessed} records`
                );

                // 마지막 페이지가 아니면 잠시 대기 (서버 부하 분산)
                if (
                    page < totalPages &&
                    !hybridCancellationRef.current.cancelled
                ) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
            }

            // 최종 결과
            const finalResult = Array.from(allDailyStats.entries())
                .map(([date, stats]) => ({
                    date,
                    completions: stats.completions.size,
                    claims: stats.claims.size,
                }))
                .filter((day) => day.completions > 0 || day.claims > 0)
                .sort((a, b) => a.date.localeCompare(b.date));

            // 완료 상태 업데이트
            const totalElapsed = (Date.now() - startTime) / 1000;
            const finalSpeed = processedRecords / Math.max(totalElapsed, 1);

            setHybridProgress({
                totalRecords,
                processedRecords,
                currentPage: totalPages,
                totalPages,
                percentage: 100,
                speed: finalSpeed,
                estimatedTimeRemaining: 0,
                isComplete: true,
                canCancel: false,
            });

            setQuestPerformanceHybridData(finalResult);

            console.log(`🎉 Hybrid processing completed! 
                - Total time: ${totalElapsed.toFixed(1)}s
                - Records processed: ${processedRecords.toLocaleString()}
                - Average speed: ${finalSpeed.toFixed(0)} records/sec
                - Days with activity: ${finalResult.length}`);

            return finalResult;
        } catch (error) {
            console.error("❌ Hybrid processing failed:", error);
            throw error;
        }
    }, []);

    // 🚀 하이브리드 처리 중단 함수
    const cancelHybridProcessing = useCallback(() => {
        hybridCancellationRef.current.cancelled = true;
        console.log("🛑 Hybrid processing cancellation requested");
    }, []);

    const handleRefresh = useCallback(
        async (target: RefreshTarget) => {
            setIsLoading(true);
            setError(null);

            try {
                switch (target) {
                    case "wallets":
                        const count = await fetchWalletsData();
                        return count;
                    case "dailyActiveUsers":
                        const dailyActiveUsers =
                            await fetchDailyActiveUsersData();
                        return dailyActiveUsers;
                    case "questPerformance":
                        // 🎯 기존 방식: 시작할 때 데이터 초기화
                        setQuestPerformanceData(null);
                        setQuestPerformanceProgress(null);

                        const questPerformance =
                            await fetchQuestPerformanceData();
                        return questPerformance;
                    case "questPerformanceHybrid":
                        // 🚀 하이브리드 방식: 시작할 때 데이터 초기화
                        setQuestPerformanceHybridData(null);
                        setHybridProgress(null);

                        const questPerformanceHybrid =
                            await fetchQuestPerformanceHybrid();
                        return questPerformanceHybrid;
                    default:
                        console.warn(`Unknown refresh target: ${target}`);
                        return null;
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
                setError("Failed to load data");
                return null;
            } finally {
                setIsLoading(false);
                setLastUpdated(new Date());
            }
        },
        [
            fetchWalletsData,
            fetchDailyActiveUsersData,
            fetchQuestPerformanceData,
            fetchQuestPerformanceHybrid,
        ]
    );

    return {
        isLoading,
        error,
        handleRefresh,
        fetchWalletsData,
        lastUpdated,
        // 🎯 기존 방식 반환값들
        questPerformanceData,
        questPerformanceProgress,
        // 🚀 하이브리드 방식 새로운 반환값들
        questPerformanceHybridData,
        hybridProgress,
        cancelHybridProcessing,
    };
};
