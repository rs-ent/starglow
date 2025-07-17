"use client";

import {
    getWalletsCount,
    getDailyActivityWallets,
    getMonthlyActivityWallets,
    getAllActiveAssets,
    verifyAllAssetBalances,
    fetchActivitySelectedDate,
    fetchActivitySelectedMonth,
} from "@/app/actions/userDashboard/actions";
import { useState, useEffect, useCallback } from "react";
import type {
    DailyActivityWallet,
    MonthlyActivityWallet,
} from "@prisma/client";

import AdminUsersDashboardStats from "./Admin.Users.Dashboard.Stats";
import AdminUsersDashboardCharts from "./Admin.Users.Dashboard.Charts";
import AdminUsersDashboardMissingData from "./Admin.Users.Dashboard.MissingData";
import AdminUsersDashboardDailyData from "./Admin.Users.Dashboard.DailyData";
import AdminUsersDashboardMonthlyData from "./Admin.Users.Dashboard.MonthlyData";

interface AdminUsersDashboardAnalyticsProps {
    className?: string;
}

interface CacheEntry {
    data: any;
    timestamp: number;
}

const CACHE_DURATION = 60 * 60 * 1000;

export default function AdminUsersDashboardAnalytics({
    className = "",
}: AdminUsersDashboardAnalyticsProps) {
    const [walletsCount, setWalletsCount] = useState<number | null>(null);
    const [allDailyData, setAllDailyData] = useState<DailyActivityWallet[]>([]);
    const [allMonthlyData, setAllMonthlyData] = useState<
        MonthlyActivityWallet[]
    >([]);
    const [allAssets, setAllAssets] = useState<any[]>([]);
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    // 차트 인터랙션 상태
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedYear, setSelectedYear] = useState<number>(0);
    const [selectedMonth, setSelectedMonth] = useState<number>(0);
    const [isChartLoading, setIsChartLoading] = useState(false);

    // 패널 상태
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [panelType, setPanelType] = useState<"daily" | "monthly" | null>(
        null
    );

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 캐시 관련 함수
    const getCacheKey = (type: "daily" | "monthly", dateKey: string) =>
        `dashboard_${type}_${dateKey}`;

    const getCachedData = (cacheKey: string): any | null => {
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { data, timestamp }: CacheEntry = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    return data;
                }
                localStorage.removeItem(cacheKey);
            }
        } catch (error) {
            console.error("Cache read error:", error);
        }
        return null;
    };

    const setCachedData = (cacheKey: string, data: any) => {
        try {
            const cacheEntry: CacheEntry = {
                data,
                timestamp: Date.now(),
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
        } catch (error) {
            console.error("Cache write error:", error);
        }
    };

    // 차트 클릭 핸들러
    const handleDayClick = useCallback(async (date: string) => {
        const cacheKey = getCacheKey("daily", date);
        const cachedData = getCachedData(cacheKey);

        setSelectedDate(date);
        setIsChartLoading(true);
        setPanelType("daily");
        setIsPanelOpen(true);

        try {
            if (cachedData) {
                setIsChartLoading(false);
                return;
            }

            const result = await fetchActivitySelectedDate(new Date(date));

            if (!result.error) {
                setCachedData(cacheKey, result.dailyActivityWallet);
            }
        } catch (err) {
            console.error("Failed to fetch daily data:", err);
        } finally {
            setIsChartLoading(false);
        }
    }, []);

    const handleMonthClick = useCallback(
        async (year: number, month: number) => {
            const cacheKey = getCacheKey("monthly", `${year}-${month}`);
            const cachedData = getCachedData(cacheKey);

            setSelectedYear(year);
            setSelectedMonth(month);
            setIsChartLoading(true);
            setPanelType("monthly");
            setIsPanelOpen(true);

            try {
                if (cachedData) {
                    setIsChartLoading(false);
                    return;
                }

                const result = await fetchActivitySelectedMonth(year, month);

                if (!result.error) {
                    setCachedData(cacheKey, result.monthlyActivityWallet);
                }
            } catch (err) {
                console.error("Failed to fetch monthly data:", err);
            } finally {
                setIsChartLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                const [count, dailyList, monthlyList, assetsList] =
                    await Promise.all([
                        getWalletsCount(),
                        getDailyActivityWallets(),
                        getMonthlyActivityWallets(),
                        getAllActiveAssets(),
                    ]);

                setWalletsCount(count);
                setAllDailyData(dailyList);
                setAllMonthlyData(monthlyList);
                setAllAssets(assetsList);
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
                setError("초기 데이터를 불러오는데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData().catch((error) => {
            console.error("Failed to fetch initial data:", error);
        });
    }, []);

    const handleVerifyAssets = async () => {
        try {
            setIsVerifying(true);
            const result = await verifyAllAssetBalances();
            setVerificationResult(result);
        } catch (err) {
            console.error("Failed to verify assets:", err);
            setError("에셋 검증에 실패했습니다.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleDailyDataUpdate = (data: DailyActivityWallet[]) => {
        setAllDailyData(data);
    };

    const handleMonthlyDataUpdate = (data: MonthlyActivityWallet[]) => {
        setAllMonthlyData(data);
    };

    if (isLoading) {
        return (
            <div
                className={`relative min-h-screen bg-gradient-to-br from-gray-900 to-black ${className}`}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
                <div className="relative p-8 flex items-center justify-center min-h-screen">
                    <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-12 border border-white/10 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center animate-pulse">
                                <svg
                                    className="w-8 h-8 text-white animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    데이터를 불러오는 중...
                                </h2>
                                <p className="text-gray-400">
                                    사용자 대시보드 정보를 로딩하고 있습니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className={`relative min-h-screen bg-gradient-to-br from-gray-900 to-black ${className}`}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-pink-600/10"></div>
                <div className="relative p-8 flex items-center justify-center min-h-screen">
                    <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-3xl p-12 border border-red-400/30 backdrop-blur-sm max-w-md">
                        <div className="flex flex-col items-center gap-6 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
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
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    오류 발생
                                </h2>
                                <p className="text-red-200">{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`relative min-h-screen bg-gradient-to-br from-gray-900 to-black ${className}`}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5"></div>

            <div className="relative">
                <div className="bg-gradient-to-br from-white/5 to-white/10 border-b border-white/10 backdrop-blur-sm">
                    <div className="px-8 py-12">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/25">
                                <svg
                                    className="w-10 h-10 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-2">
                                    사용자 대시보드 분석
                                </h1>
                                <p className="text-gray-300 text-lg">
                                    포괄적인 사용자 활동 및 에셋 분석 도구
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-400/30">
                                <div className="text-blue-200/80 mb-1">
                                    일별 레코드
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {allDailyData.length.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-400/30">
                                <div className="text-green-200/80 mb-1">
                                    월별 레코드
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {allMonthlyData.length.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-400/30">
                                <div className="text-amber-200/80 mb-1">
                                    활성 에셋
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {allAssets.length.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-400/30">
                                <div className="text-purple-200/80 mb-1">
                                    총 지갑
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {walletsCount?.toLocaleString() || 0}
                                </div>
                            </div>
                        </div>

                        {isChartLoading && (
                            <div className="mt-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-400/30">
                                <div className="flex items-center gap-3">
                                    <svg
                                        className="w-5 h-5 text-blue-400 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    <span className="text-blue-200 font-medium">
                                        데이터를 로딩 중... (1시간 캐싱 적용)
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 space-y-12">
                    <AdminUsersDashboardStats
                        walletsCount={walletsCount}
                        allDailyData={allDailyData}
                        allMonthlyData={allMonthlyData}
                        allAssets={allAssets}
                    />

                    <AdminUsersDashboardCharts
                        allDailyData={allDailyData}
                        allMonthlyData={allMonthlyData}
                        onDayClick={handleDayClick}
                        onMonthClick={handleMonthClick}
                        selectedDate={selectedDate}
                    />

                    <div className="relative bg-gradient-to-br from-yellow-900/20 via-amber-900/15 to-orange-900/20 rounded-3xl p-8 border border-yellow-500/20 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/5 to-orange-600/5 rounded-3xl"></div>
                        <div className="relative">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/25">
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
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                                        에셋 totalBalance 검증
                                    </h3>
                                    <p className="text-yellow-200/70">
                                        데이터 무결성 확인 도구
                                    </p>
                                </div>
                                <button
                                    onClick={handleVerifyAssets}
                                    disabled={isVerifying}
                                    className="group relative px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-semibold text-white shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative flex items-center gap-2">
                                        {isVerifying ? (
                                            <>
                                                <svg
                                                    className="w-5 h-5 animate-spin"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                검증 중...
                                            </>
                                        ) : (
                                            <>
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                검증 실행
                                            </>
                                        )}
                                    </div>
                                </button>
                            </div>

                            {verificationResult && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-400/30">
                                            <div className="text-blue-200/80 text-sm mb-1">
                                                총 에셋
                                            </div>
                                            <div className="text-2xl font-bold text-white">
                                                {verificationResult.summary
                                                    ?.totalAssets || 0}
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-400/30">
                                            <div className="text-green-200/80 text-sm mb-1">
                                                일치
                                            </div>
                                            <div className="text-2xl font-bold text-white">
                                                {verificationResult.summary
                                                    ?.matchingAssets || 0}
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl p-4 border border-red-400/30">
                                            <div className="text-red-200/80 text-sm mb-1">
                                                불일치
                                            </div>
                                            <div className="text-2xl font-bold text-white">
                                                {verificationResult.summary
                                                    ?.mismatchedAssets || 0}
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl p-4 border border-orange-400/30">
                                            <div className="text-orange-200/80 text-sm mb-1">
                                                에러
                                            </div>
                                            <div className="text-2xl font-bold text-white">
                                                {verificationResult.summary
                                                    ?.errorAssets || 0}
                                            </div>
                                        </div>
                                    </div>

                                    {verificationResult.verifications && (
                                        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                                <svg
                                                    className="w-5 h-5 text-yellow-400"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                                    />
                                                </svg>
                                                상세 검증 결과
                                            </h4>
                                            <div className="max-h-80 overflow-y-auto space-y-3">
                                                {verificationResult.verifications.map(
                                                    (
                                                        verification: any,
                                                        index: number
                                                    ) => (
                                                        <div
                                                            key={index}
                                                            className={`p-4 rounded-xl border ${
                                                                verification.error
                                                                    ? "bg-red-500/10 border-red-400/30"
                                                                    : verification.isMatching
                                                                    ? "bg-green-500/10 border-green-400/30"
                                                                    : "bg-red-500/10 border-red-400/30"
                                                            }`}
                                                        >
                                                            <div className="font-medium text-white mb-2">
                                                                에셋 ID:{" "}
                                                                {verification.assetId.slice(
                                                                    0,
                                                                    8
                                                                )}
                                                                ...
                                                            </div>
                                                            {verification.error ? (
                                                                <div className="text-red-300 text-sm">
                                                                    {
                                                                        verification.error
                                                                    }
                                                                </div>
                                                            ) : (
                                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <span className="text-gray-400">
                                                                            Aggregate:
                                                                        </span>
                                                                        <span className="text-white ml-2">
                                                                            {verification.aggregateTotal?.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-400">
                                                                            Direct:
                                                                        </span>
                                                                        <span className="text-white ml-2">
                                                                            {verification.directTotal?.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-400">
                                                                            레코드
                                                                            수:
                                                                        </span>
                                                                        <span className="text-white ml-2">
                                                                            {
                                                                                verification.recordCount
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-400">
                                                                            차이:
                                                                        </span>
                                                                        <span className="text-white ml-2">
                                                                            {verification.difference?.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <AdminUsersDashboardMissingData
                        onDataUpdate={handleDailyDataUpdate}
                    />
                </div>
            </div>

            {/* Full Screen Detail Panel */}
            {isPanelOpen && panelType === "daily" && selectedDate && (
                <AdminUsersDashboardDailyData
                    onDataUpdate={handleDailyDataUpdate}
                    selectedDate={selectedDate}
                    isOpen={isPanelOpen}
                    onClose={() => setIsPanelOpen(false)}
                />
            )}

            {isPanelOpen &&
                panelType === "monthly" &&
                selectedYear > 0 &&
                selectedMonth > 0 && (
                    <AdminUsersDashboardMonthlyData
                        onDataUpdate={handleMonthlyDataUpdate}
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                    />
                )}
        </div>
    );
}
