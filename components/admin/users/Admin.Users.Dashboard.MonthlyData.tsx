"use client";

import {
    fetchActivitySelectedMonth,
    getMonthlyActivityWallets,
    getMonthlyActivityWalletWithAssets,
} from "@/app/actions/userDashboard/actions";
import { useState, useEffect, useCallback } from "react";
import type { MonthlyActivityWallet } from "@prisma/client";

interface AdminUsersDashboardMonthlyDataProps {
    onDataUpdate: (data: MonthlyActivityWallet[]) => void;
    selectedYear?: number;
    selectedMonth?: number;
    className?: string;
}

export default function AdminUsersDashboardMonthlyData({
    onDataUpdate,
    selectedYear,
    selectedMonth,
    className = "",
}: AdminUsersDashboardMonthlyDataProps) {
    const [selectedYearState, setSelectedYearState] = useState<number>(
        selectedYear || new Date().getFullYear()
    );
    const [selectedMonthState, setSelectedMonthState] = useState<number>(
        selectedMonth || new Date().getMonth() + 1
    );
    const [monthlyData, setMonthlyData] =
        useState<MonthlyActivityWallet | null>(null);
    const [monthlyDataWithAssets, setMonthlyDataWithAssets] =
        useState<any>(null);
    const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);
    const [monthlyError, setMonthlyError] = useState<string | null>(null);

    const handleFetchMonthlyData = useCallback(async () => {
        try {
            setIsMonthlyLoading(true);
            setMonthlyError(null);

            const result = await fetchActivitySelectedMonth(
                selectedYearState,
                selectedMonthState
            );

            if (result.error) {
                setMonthlyError(result.error);
            } else {
                setMonthlyData(result.monthlyActivityWallet);

                const dataWithAssets = await getMonthlyActivityWalletWithAssets(
                    selectedYearState,
                    selectedMonthState
                );
                setMonthlyDataWithAssets(dataWithAssets);

                const updatedList = await getMonthlyActivityWallets();
                onDataUpdate(updatedList);
            }
        } catch (err) {
            console.error("Failed to fetch monthly data:", err);
            setMonthlyError("월별 데이터 조회에 실패했습니다.");
        } finally {
            setIsMonthlyLoading(false);
        }
    }, [selectedYearState, selectedMonthState, onDataUpdate]);

    useEffect(() => {
        if (selectedYear && selectedMonth) {
            setSelectedYearState(selectedYear);
            setSelectedMonthState(selectedMonth);
            // 자동으로 데이터도 fetch
            handleFetchMonthlyData().catch((error) => {
                console.error("Failed to fetch monthly data:", error);
            });
        }
    }, [selectedYear, selectedMonth, handleFetchMonthlyData]);

    return (
        <div
            className={`relative bg-gradient-to-br from-green-900/20 via-emerald-900/15 to-teal-900/20 rounded-3xl p-8 border border-green-500/20 backdrop-blur-sm ${className}`}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-teal-600/5 rounded-3xl"></div>

            <div className="relative">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
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
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                            월별 활동 데이터
                        </h2>
                        <p className="text-green-200/70">
                            월 단위 종합 활동 분석
                        </p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg
                            className="w-5 h-5 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        기간 선택
                    </h3>

                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-green-200/80">
                                년도
                            </label>
                            <input
                                type="number"
                                value={selectedYearState}
                                onChange={(e) =>
                                    setSelectedYearState(
                                        parseInt(e.target.value)
                                    )
                                }
                                min="2020"
                                max="2030"
                                className="px-4 py-3 bg-white/10 text-white rounded-xl border border-white/20 backdrop-blur-sm focus:border-green-400/60 focus:ring-2 focus:ring-green-400/20 transition-all duration-200 outline-none w-28"
                                placeholder="년도"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-green-200/80">
                                월
                            </label>
                            <select
                                value={selectedMonthState}
                                onChange={(e) =>
                                    setSelectedMonthState(
                                        parseInt(e.target.value)
                                    )
                                }
                                className="px-4 py-3 bg-white/10 text-white rounded-xl border border-white/20 backdrop-blur-sm focus:border-green-400/60 focus:ring-2 focus:ring-green-400/20 transition-all duration-200 outline-none"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option
                                        key={i + 1}
                                        value={i + 1}
                                        className="bg-gray-800"
                                    >
                                        {i + 1}월
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleFetchMonthlyData}
                            disabled={isMonthlyLoading}
                            className="group relative px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl font-semibold text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative flex items-center gap-2">
                                {isMonthlyLoading ? (
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
                                        집계 중...
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
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                        데이터 조회/생성
                                    </>
                                )}
                            </div>
                        </button>
                    </div>
                </div>

                {monthlyError && (
                    <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl p-4 mb-8">
                        <div className="flex items-center gap-3">
                            <svg
                                className="w-6 h-6 text-red-400 flex-shrink-0"
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
                            <p className="text-red-200 font-medium">
                                {monthlyError}
                            </p>
                        </div>
                    </div>
                )}

                {monthlyData && (
                    <div className="space-y-8">
                        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <svg
                                    className="w-5 h-5 text-emerald-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                월별 통계 - {selectedYearState}년{" "}
                                {selectedMonthState}월
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl p-4 border border-emerald-400/30">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                                            <svg
                                                className="w-5 h-5 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-white">
                                                {monthlyData.activeWallets.toLocaleString()}
                                            </div>
                                            <div className="text-emerald-200/70 text-sm font-medium">
                                                활성 지갑
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-400/30">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                            <svg
                                                className="w-5 h-5 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-white">
                                                {monthlyData.newWallets.toLocaleString()}
                                            </div>
                                            <div className="text-blue-200/70 text-sm font-medium">
                                                신규 지갑
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-400/30">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                                            <svg
                                                className="w-5 h-5 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-white">
                                                {monthlyData.returningWallets.toLocaleString()}
                                            </div>
                                            <div className="text-amber-200/70 text-sm font-medium">
                                                재방문 지갑
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-400/30">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                            <svg
                                                className="w-5 h-5 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-white">
                                                {monthlyData.totalWallets.toLocaleString()}
                                            </div>
                                            <div className="text-purple-200/70 text-sm font-medium">
                                                총 지갑
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <svg
                                    className="w-5 h-5 text-green-400"
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
                                월별 참여 활동 통계
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-400/30">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                            <svg
                                                className="w-5 h-5 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-white">
                                                {monthlyData.pollParticipationCount.toLocaleString()}
                                            </div>
                                            <div className="text-green-200/70 text-sm font-medium">
                                                투표 참여
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl p-4 border border-indigo-400/30">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                                            <svg
                                                className="w-5 h-5 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-white">
                                                {monthlyData.questParticipationCount.toLocaleString()}
                                            </div>
                                            <div className="text-indigo-200/70 text-sm font-medium">
                                                퀘스트 완료
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-xl p-4 border border-rose-400/30">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                                            <svg
                                                className="w-5 h-5 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 8v13m0-13V6a2 2 0 112 0v1m0 0V9a2 2 0 012 0v1m0 0v2a1 1 0 001 1h2m-6 0a1 1 0 001-1v-1a2 2 0 112 0v1a2 2 0 104 0V9a2 2 0 00-2-2V6a2 2 0 10-4 0v2a2 2 0 00-2 2v1a2 2 0 00-2 2z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-white">
                                                {monthlyData.raffleParticipationCount.toLocaleString()}
                                            </div>
                                            <div className="text-rose-200/70 text-sm font-medium">
                                                래플 참여
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {monthlyDataWithAssets &&
                            monthlyDataWithAssets.playerAssetsStatus &&
                            monthlyDataWithAssets.playerAssetsStatus.length >
                                0 && (
                                <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                        <span className="text-2xl">💎</span>
                                        월별 에셋 현황
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {monthlyDataWithAssets.playerAssetsStatus.map(
                                            (
                                                assetStatus: any,
                                                index: number
                                            ) => (
                                                <div
                                                    key={assetStatus.id}
                                                    className="group relative bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm hover:border-green-400/40 transition-all duration-300 hover:scale-105"
                                                    style={{
                                                        animationDelay: `${
                                                            index * 100
                                                        }ms`,
                                                    }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-teal-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                    <div className="relative">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                                                                <svg
                                                                    className="w-5 h-5 text-white"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                                                    />
                                                                </svg>
                                                            </div>
                                                            <div className="px-2 py-1 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-full border border-green-400/30">
                                                                <span className="text-green-200 text-xs font-medium">
                                                                    {assetStatus
                                                                        .asset
                                                                        ?.symbol ||
                                                                        "N/A"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="mb-4">
                                                            <h4 className="text-white font-bold text-lg mb-1 truncate">
                                                                {assetStatus
                                                                    .asset
                                                                    ?.name ||
                                                                    "Unknown Asset"}
                                                            </h4>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-gray-400 text-sm">
                                                                    총 잔고
                                                                </span>
                                                                <span className="text-green-400 font-bold text-lg">
                                                                    {assetStatus.totalBalance.toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-gray-400 text-sm">
                                                                    월별 보상
                                                                </span>
                                                                <span className="text-teal-400 font-bold text-lg">
                                                                    {assetStatus.rewardedCount.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
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
    );
}
