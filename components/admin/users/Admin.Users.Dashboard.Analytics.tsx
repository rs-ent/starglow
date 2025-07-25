"use client";

import { useCallback, useState } from "react";
import { RefreshTarget, useDataFetcher } from "./components/DataFetcher";
import ActiveWallets from "./components/ActiveWallets";
import DailyActiveWallets from "./components/DailyActiveWallets";
import QuestPerformance from "./components/QuestPerformance";

interface AdminUsersDashboardAnalyticsProps {
    className?: string;
}

export default function AdminUsersDashboardAnalytics({
    className = "",
}: AdminUsersDashboardAnalyticsProps) {
    const [walletsCount, setWalletsCount] = useState<number | null>(null);
    const [dailyActiveUsers, setDailyActiveUsers] = useState<
        | {
              date: string;
              activeWallets: number;
              newUsers: number;
              revisitUsers: number;
          }[]
        | null
    >(null);

    // 🚀 퀘스트 성능 분석 모드 상태
    const [questMode, setQuestMode] = useState<"legacy" | "hybrid">("hybrid");

    const {
        isLoading,
        error,
        lastUpdated,
        handleRefresh,
        // 🎯 기존 방식 데이터
        questPerformanceData,
        questPerformanceProgress,
        // 🚀 하이브리드 방식 데이터
        questPerformanceHybridData,
        hybridProgress,
        cancelHybridProcessing,
    } = useDataFetcher();

    const onRefresh = useCallback(
        async (target: RefreshTarget) => {
            switch (target) {
                case "wallets":
                    const count = await handleRefresh("wallets");
                    if (typeof count === "number" && count !== null) {
                        setWalletsCount(count);
                    }
                    break;
                case "dailyActiveUsers":
                    const dailyActiveUsers = await handleRefresh(
                        "dailyActiveUsers"
                    );
                    if (
                        Array.isArray(dailyActiveUsers) &&
                        dailyActiveUsers !== null &&
                        dailyActiveUsers.every(
                            (item) =>
                                typeof item === "object" &&
                                "date" in item &&
                                "activeWallets" in item &&
                                "newUsers" in item &&
                                "revisitUsers" in item
                        )
                    ) {
                        const typedDailyActiveUsers = dailyActiveUsers as {
                            date: string;
                            activeWallets: number;
                            newUsers: number;
                            revisitUsers: number;
                        }[];
                        setDailyActiveUsers(typedDailyActiveUsers);
                    }
                    break;
                case "questPerformance":
                    // 🎯 레거시 방식: DataFetcher에서 직접 관리하므로 여기서는 트리거만
                    await handleRefresh("questPerformance");
                    break;
                case "questPerformanceHybrid":
                    // 🚀 하이브리드 방식: DataFetcher에서 직접 관리하므로 여기서는 트리거만
                    await handleRefresh("questPerformanceHybrid");
                    break;
                default:
                    console.warn(`Unknown refresh target: ${target}`);
                    break;
            }
        },
        [handleRefresh]
    );

    // 🚀 퀘스트 모드 전환 함수
    const handleQuestModeToggle = useCallback(() => {
        setQuestMode((prev) => (prev === "legacy" ? "hybrid" : "legacy"));
    }, []);

    return (
        <div
            className={`relative min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black ${className}`}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>

            <div className="relative">
                <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-b border-slate-700/30 backdrop-blur-sm">
                    <div className="px-8 py-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-200 to-indigo-200 bg-clip-text text-transparent mb-2">
                                User Analytics
                            </h2>

                            {/* 🚀 퀘스트 분석 모드 토글 */}
                            <div className="mt-4 flex items-center justify-center gap-4">
                                <span className="text-slate-400 text-sm">
                                    Quest Analysis Mode:
                                </span>
                                <button
                                    onClick={handleQuestModeToggle}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        questMode === "hybrid"
                                            ? "bg-green-600/20 text-green-300 border border-green-600/50 hover:bg-green-600/30"
                                            : "bg-blue-600/20 text-blue-300 border border-blue-600/50 hover:bg-blue-600/30"
                                    }`}
                                >
                                    {questMode === "hybrid"
                                        ? "🚀 HYBRID (5M+ records)"
                                        : "🎯 LEGACY (streaming)"}
                                </button>

                                {/* 모드 설명 */}
                                <div className="text-xs text-slate-500 max-w-md">
                                    {questMode === "hybrid"
                                        ? "Efficient pagination with precise progress tracking and cancellation support"
                                        : "Real-time streaming analysis with approximate progress tracking"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
                        <ActiveWallets
                            walletsCount={walletsCount}
                            isLoading={isLoading}
                            error={error}
                            onRefresh={() => onRefresh("wallets")}
                            lastUpdated={lastUpdated}
                        />
                        <DailyActiveWallets
                            dailyActiveUsers={dailyActiveUsers}
                            isLoading={isLoading}
                            error={error}
                            onRefresh={() => onRefresh("dailyActiveUsers")}
                            lastUpdated={lastUpdated}
                        />
                        <QuestPerformance
                            mode={questMode}
                            // 기존 방식 props
                            questPerformanceData={questPerformanceData}
                            questPerformanceProgress={questPerformanceProgress}
                            onRefresh={() => onRefresh("questPerformance")}
                            // 하이브리드 방식 props
                            questPerformanceHybridData={
                                questPerformanceHybridData
                            }
                            hybridProgress={hybridProgress}
                            cancelHybridProcessing={cancelHybridProcessing}
                            onRefreshHybrid={() =>
                                onRefresh("questPerformanceHybrid")
                            }
                            // 공통 props
                            isLoading={isLoading}
                            error={error}
                            lastUpdated={lastUpdated}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
