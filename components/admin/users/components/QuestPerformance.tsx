"use client";

import { useEffect, useState } from "react";
import { HybridProgress } from "./DataFetcher";

interface QuestPerformanceProps {
    questPerformanceData:
        | {
              date: string;
              completions: number;
              claims: number;
          }[]
        | null;
    questPerformanceProgress?: {
        batchCount: number;
        totalProcessed: number;
    } | null;
    // 🚀 하이브리드 방식 props 추가
    questPerformanceHybridData?:
        | {
              date: string;
              completions: number;
              claims: number;
          }[]
        | null;
    hybridProgress?: HybridProgress | null;
    cancelHybridProcessing?: () => void;
    mode?: "legacy" | "hybrid";
    isLoading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
    onRefreshHybrid?: () => void;
    lastUpdated?: Date | null;
}

export default function QuestPerformance({
    questPerformanceData,
    questPerformanceProgress,
    questPerformanceHybridData,
    hybridProgress,
    cancelHybridProcessing,
    mode = "legacy",
    isLoading = false,
    error = null,
    onRefresh,
    onRefreshHybrid,
    lastUpdated,
}: QuestPerformanceProps) {
    // 실시간 업데이트를 위한 애니메이션 상태
    const [animatedCompletions, setAnimatedCompletions] = useState(0);
    const [animatedClaims, setAnimatedClaims] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // 현재 모드에 따라 데이터 선택
    const currentData =
        mode === "hybrid" ? questPerformanceHybridData : questPerformanceData;

    // Calculate summary statistics
    const totalCompletions =
        currentData?.reduce((sum, day) => sum + day.completions, 0) || 0;
    const totalClaims =
        currentData?.reduce((sum, day) => sum + day.claims, 0) || 0;
    const totalDays = currentData?.length || 0;

    // 데이터가 변경될 때 애니메이션 효과
    useEffect(() => {
        if (totalCompletions > 0 || totalClaims > 0) {
            setIsAnimating(true);

            // 애니메이션 시작
            const duration = 1000; // 1초
            const steps = 50;
            const interval = duration / steps;

            let currentStep = 0;
            const timer = setInterval(() => {
                currentStep++;
                const progress = currentStep / steps;

                setAnimatedCompletions(Math.floor(totalCompletions * progress));
                setAnimatedClaims(Math.floor(totalClaims * progress));

                if (currentStep >= steps) {
                    setAnimatedCompletions(totalCompletions);
                    setAnimatedClaims(totalClaims);
                    setIsAnimating(false);
                    clearInterval(timer);
                }
            }, interval);

            return () => clearInterval(timer);
        }
    }, [totalCompletions, totalClaims]);

    // 🚀 시간 포맷팅 함수
    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${Math.round(seconds / 3600)}h`;
    };

    if (error) {
        return (
            <div className="bg-gradient-to-br from-red-900/90 to-red-800/90 rounded-2xl p-8 border border-red-700/50 backdrop-blur-sm max-w-md mx-auto shadow-2xl">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-red-200 mb-2">
                        Data Error
                    </h2>
                    <p className="text-red-300 text-sm mb-4">{error}</p>
                    {(onRefresh || onRefreshHybrid) && (
                        <button
                            onClick={
                                mode === "hybrid" ? onRefreshHybrid : onRefresh
                            }
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors duration-200"
                        >
                            Retry
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm max-w-lg mx-auto shadow-2xl">
            <div className="text-center">
                {/* Header with mode toggle and refresh button */}
                <div className="flex items-center justify-between mb-6 gap-4">
                    <div className="flex-1">
                        {/* 🚀 모드 표시 */}
                        <div className="flex items-center gap-2">
                            <div
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                    mode === "hybrid"
                                        ? "bg-green-600/20 text-green-300 border border-green-600/30"
                                        : "bg-blue-600/20 text-blue-300 border border-blue-600/30"
                                }`}
                            >
                                {mode === "hybrid" ? "HYBRID" : "LEGACY"}
                            </div>
                        </div>
                    </div>
                    <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                        QUEST PERFORMANCE
                    </h2>
                    <div className="flex-1 flex justify-end">
                        <button
                            onClick={
                                mode === "hybrid" ? onRefreshHybrid : onRefresh
                            }
                            disabled={isLoading}
                            className="group relative p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh Data"
                        >
                            <svg
                                className={`w-5 h-5 text-slate-300 group-hover:text-white transition-transform duration-200 ${
                                    isLoading
                                        ? "animate-spin"
                                        : "group-hover:rotate-180"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 🚀 하이브리드 방식 진행률 표시 */}
                {isLoading && mode === "hybrid" && hybridProgress && (
                    <div className="mb-6">
                        <div className="flex items-center justify-center mb-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                        </div>

                        {/* 정확한 진행률 */}
                        <div className="text-slate-300 text-sm mb-2">
                            Processing page {hybridProgress.currentPage} of{" "}
                            {hybridProgress.totalPages}
                        </div>

                        {/* 세부 통계 */}
                        <div className="text-slate-400 text-xs mb-3 space-y-1">
                            <div>
                                {hybridProgress.processedRecords.toLocaleString()}{" "}
                                / {hybridProgress.totalRecords.toLocaleString()}{" "}
                                records
                            </div>
                            <div>
                                {hybridProgress.speed.toFixed(0)} records/sec
                            </div>
                            {hybridProgress.estimatedTimeRemaining > 0 && (
                                <div>
                                    ETA:{" "}
                                    {formatTime(
                                        hybridProgress.estimatedTimeRemaining
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 정확한 진행 바 */}
                        <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                            <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                    width: `${hybridProgress.percentage}%`,
                                }}
                            ></div>
                        </div>

                        {/* 중단 버튼 */}
                        {hybridProgress.canCancel && cancelHybridProcessing && (
                            <button
                                onClick={cancelHybridProcessing}
                                className="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-white text-sm font-medium transition-colors duration-200"
                            >
                                Cancel Processing
                            </button>
                        )}
                    </div>
                )}

                {/* 🎯 레거시 방식 진행률 표시 */}
                {isLoading && mode === "legacy" && questPerformanceProgress && (
                    <div className="mb-6">
                        <div className="flex items-center justify-center mb-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                        </div>
                        <div className="text-slate-300 text-sm mb-2">
                            Processing batch{" "}
                            {questPerformanceProgress.batchCount}...
                        </div>
                        <div className="text-slate-400 text-xs mb-3">
                            {questPerformanceProgress.totalProcessed.toLocaleString()}{" "}
                            records processed
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300 animate-pulse"
                                style={{ width: "60%" }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* 기본 로딩 (진행률 정보가 없을 때) */}
                {isLoading && !questPerformanceProgress && !hybridProgress && (
                    <div className="mb-6">
                        <div className="flex items-center justify-center mb-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                        </div>
                        <div className="text-slate-300 text-sm mb-2">
                            Starting quest analysis...
                        </div>
                    </div>
                )}

                {/* Metrics grid with animation */}
                {!isLoading && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 rounded-xl p-4 border border-blue-700/30">
                            <div
                                className={`text-2xl font-bold text-blue-200 mb-1 transition-all duration-300 ${
                                    isAnimating ? "scale-110" : "scale-100"
                                }`}
                            >
                                {animatedCompletions.toLocaleString()}
                            </div>
                            <div className="text-blue-300 text-xs uppercase tracking-wide">
                                Total Completions
                            </div>
                            {isAnimating && (
                                <div className="w-full bg-blue-800/30 rounded-full h-1 mt-2">
                                    <div
                                        className="bg-blue-400 h-1 rounded-full animate-pulse"
                                        style={{
                                            width: `${
                                                (animatedCompletions /
                                                    totalCompletions) *
                                                100
                                            }%`,
                                        }}
                                    ></div>
                                </div>
                            )}
                        </div>
                        <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 rounded-xl p-4 border border-green-700/30">
                            <div
                                className={`text-2xl font-bold text-green-200 mb-1 transition-all duration-300 ${
                                    isAnimating ? "scale-110" : "scale-100"
                                }`}
                            >
                                {animatedClaims.toLocaleString()}
                            </div>
                            <div className="text-green-300 text-xs uppercase tracking-wide">
                                Total Claims
                            </div>
                            {isAnimating && (
                                <div className="w-full bg-green-800/30 rounded-full h-1 mt-2">
                                    <div
                                        className="bg-green-400 h-1 rounded-full animate-pulse"
                                        style={{
                                            width: `${
                                                (animatedClaims / totalClaims) *
                                                100
                                            }%`,
                                        }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 🎯 실시간 데이터 표시 (로딩 중에도) */}
                {isLoading && currentData && currentData.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mb-6 opacity-75">
                        <div
                            className={`rounded-xl p-4 border ${
                                mode === "hybrid"
                                    ? "bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700/20"
                                    : "bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/20"
                            }`}
                        >
                            <div
                                className={`text-xl font-bold mb-1 ${
                                    mode === "hybrid"
                                        ? "text-green-300"
                                        : "text-blue-300"
                                }`}
                            >
                                {totalCompletions.toLocaleString()}
                            </div>
                            <div
                                className={`text-xs uppercase tracking-wide ${
                                    mode === "hybrid"
                                        ? "text-green-400"
                                        : "text-blue-400"
                                }`}
                            >
                                Completions (Live)
                            </div>
                        </div>
                        <div
                            className={`rounded-xl p-4 border ${
                                mode === "hybrid"
                                    ? "bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700/20"
                                    : "bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700/20"
                            }`}
                        >
                            <div className="text-xl font-bold text-green-300 mb-1">
                                {totalClaims.toLocaleString()}
                            </div>
                            <div className="text-green-400 text-xs uppercase tracking-wide">
                                Claims (Live)
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary stats */}
                {!isLoading && totalDays > 0 && (
                    <div className="mb-4">
                        <div className="text-slate-300 text-sm">
                            Over {totalDays} days
                        </div>
                        <div className="text-slate-400 text-xs mt-1">
                            Avg:{" "}
                            {Math.round((totalCompletions / totalDays) * 10) /
                                10}{" "}
                            completions,{" "}
                            {Math.round((totalClaims / totalDays) * 10) / 10}{" "}
                            claims per day
                        </div>
                    </div>
                )}

                {/* Real-time update indicator */}
                {isAnimating && (
                    <div className="mb-4">
                        <div className="flex items-center justify-center gap-2">
                            <div
                                className={`w-2 h-2 rounded-full animate-ping ${
                                    mode === "hybrid"
                                        ? "bg-green-400"
                                        : "bg-green-400"
                                }`}
                            ></div>
                            <span className="text-green-300 text-xs">
                                Updating in real-time
                            </span>
                        </div>
                    </div>
                )}

                {/* Footer section */}
                <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                        <p className="text-slate-400 text-xs">
                            Quest daily statistics ({mode} mode)
                        </p>
                        {lastUpdated && (
                            <div className="text-slate-500 text-xs">
                                {lastUpdated.toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
