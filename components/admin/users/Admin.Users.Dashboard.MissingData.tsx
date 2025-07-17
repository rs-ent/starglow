"use client";

import {
    checkMissingDailyData,
    batchCreateMissingDailyData,
    getDailyActivityWallets,
} from "@/app/actions/userDashboard/actions";
import type {
    MissingDatesResult,
    BatchCreateResult,
} from "@/app/actions/userDashboard/actions";
import { useState } from "react";
import type { DailyActivityWallet } from "@prisma/client";

interface AdminUsersDashboardMissingDataProps {
    onDataUpdate: (data: DailyActivityWallet[]) => void;
    className?: string;
}

export default function AdminUsersDashboardMissingData({
    onDataUpdate,
    className = "",
}: AdminUsersDashboardMissingDataProps) {
    const [startDateCheck, setStartDateCheck] = useState<string>("2025-07-09");
    const [endDateCheck, setEndDateCheck] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [missingData, setMissingData] = useState<MissingDatesResult | null>(
        null
    );
    const [batchResult, setBatchResult] = useState<BatchCreateResult | null>(
        null
    );

    const [isMissingCheckLoading, setIsMissingCheckLoading] = useState(false);
    const [isBatchCreateLoading, setIsBatchCreateLoading] = useState(false);
    const [missingError, setMissingError] = useState<string | null>(null);

    const handleCheckMissingData = async () => {
        try {
            setIsMissingCheckLoading(true);
            setMissingError(null);
            setBatchResult(null);

            const result = await checkMissingDailyData(
                new Date(startDateCheck),
                new Date(endDateCheck)
            );

            if (result.error) {
                setMissingError(result.error);
            } else {
                setMissingData(result);
            }
        } catch (err) {
            console.error("Failed to check missing data:", err);
            setMissingError("누락된 데이터 확인에 실패했습니다.");
        } finally {
            setIsMissingCheckLoading(false);
        }
    };

    const handleBatchCreate = async () => {
        if (!missingData || missingData.missingDates.length === 0) return;

        try {
            setIsBatchCreateLoading(true);
            setMissingError(null);

            const result = await batchCreateMissingDailyData(
                missingData.missingDates
            );
            setBatchResult(result);

            const updatedList = await getDailyActivityWallets();
            onDataUpdate(updatedList);

            const updatedMissingData = await checkMissingDailyData(
                new Date(startDateCheck),
                new Date(endDateCheck)
            );
            setMissingData(updatedMissingData);
        } catch (err) {
            console.error("Failed to batch create data:", err);
            setMissingError("일괄 생성에 실패했습니다.");
        } finally {
            setIsBatchCreateLoading(false);
        }
    };

    return (
        <div
            className={`relative bg-gradient-to-br from-orange-900/20 via-red-900/15 to-pink-900/20 rounded-3xl p-8 border border-orange-500/20 backdrop-blur-sm ${className}`}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-red-600/5 rounded-3xl"></div>

            <div className="relative">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                        <span className="text-3xl">📋</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
                            누락된 데이터 확인 & 일괄 생성
                        </h2>
                        <p className="text-orange-200/70">
                            데이터 무결성 관리 도구
                        </p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg
                            className="w-5 h-5 text-orange-400"
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
                        검색 기간 설정
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-orange-200/80">
                                시작 날짜
                            </label>
                            <input
                                type="date"
                                value={startDateCheck}
                                onChange={(e) =>
                                    setStartDateCheck(e.target.value)
                                }
                                className="w-full px-4 py-3 bg-white/10 text-white rounded-xl border border-white/20 backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-orange-200/80">
                                종료 날짜
                            </label>
                            <input
                                type="date"
                                value={endDateCheck}
                                onChange={(e) =>
                                    setEndDateCheck(e.target.value)
                                }
                                className="w-full px-4 py-3 bg-white/10 text-white rounded-xl border border-white/20 backdrop-blur-sm focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-8">
                    <button
                        onClick={handleCheckMissingData}
                        disabled={isMissingCheckLoading}
                        className="group relative px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-semibold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center gap-2">
                            {isMissingCheckLoading ? (
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
                                    확인 중...
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
                                    누락된 데이터 확인
                                </>
                            )}
                        </div>
                    </button>

                    {missingData && missingData.missingDates.length > 0 && (
                        <button
                            onClick={handleBatchCreate}
                            disabled={isBatchCreateLoading}
                            className="group relative px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl font-semibold text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative flex items-center gap-2">
                                {isBatchCreateLoading ? (
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
                                        생성 중... (
                                        {missingData.missingDates.length}개)
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
                                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                            />
                                        </svg>
                                        {missingData.missingDates.length}개 누락
                                        데이터 일괄 생성
                                    </>
                                )}
                            </div>
                        </button>
                    )}
                </div>

                {missingError && (
                    <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl p-4 mb-6">
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
                                {missingError}
                            </p>
                        </div>
                    </div>
                )}

                {missingData && (
                    <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm mb-6">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <svg
                                className="w-5 h-5 text-blue-400"
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
                            데이터 분석 결과
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">
                                            {missingData.totalDays}
                                        </div>
                                        <div className="text-blue-200/70 text-sm font-medium">
                                            전체 일수
                                        </div>
                                    </div>
                                </div>
                            </div>

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
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">
                                            {missingData.existingDates.length}
                                        </div>
                                        <div className="text-green-200/70 text-sm font-medium">
                                            기존 데이터
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl p-4 border border-red-400/30">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
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
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">
                                            {missingData.missingDates.length}
                                        </div>
                                        <div className="text-red-200/70 text-sm font-medium">
                                            누락 데이터
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {missingData.missingDates.length > 0 ? (
                            <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-xl p-4 border border-red-400/20">
                                <h4 className="text-red-300 font-semibold mb-3 flex items-center gap-2">
                                    <svg
                                        className="w-4 h-4"
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
                                    누락된 날짜들
                                </h4>
                                <div className="bg-black/20 rounded-xl p-4 max-h-40 overflow-y-auto">
                                    <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                        {missingData.missingDates.map(
                                            (date, index) => (
                                                <div
                                                    key={date}
                                                    className="bg-gradient-to-br from-red-500/30 to-pink-500/30 px-3 py-2 rounded-lg border border-red-400/30 text-center"
                                                    style={{
                                                        animationDelay: `${
                                                            index * 30
                                                        }ms`,
                                                    }}
                                                >
                                                    <div className="text-red-200 text-xs font-medium">
                                                        {new Date(
                                                            date
                                                        ).toLocaleDateString(
                                                            "ko-KR",
                                                            {
                                                                month: "short",
                                                                day: "numeric",
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-400/20 text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
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
                                <h4 className="text-green-300 text-lg font-semibold mb-2">
                                    완벽한 데이터 무결성!
                                </h4>
                                <p className="text-green-200/70">
                                    해당 기간의 모든 데이터가 존재합니다.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {batchResult && (
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
                            일괄 생성 결과
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-400/30">
                                <div className="text-2xl font-bold text-white mb-1">
                                    {batchResult.totalProcessed}
                                </div>
                                <div className="text-blue-200/70 text-sm font-medium">
                                    처리된 총 수
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-400/30">
                                <div className="text-2xl font-bold text-white mb-1">
                                    {batchResult.successDates.length}
                                </div>
                                <div className="text-green-200/70 text-sm font-medium">
                                    성공
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl p-4 border border-red-400/30">
                                <div className="text-2xl font-bold text-white mb-1">
                                    {batchResult.failedDates.length}
                                </div>
                                <div className="text-red-200/70 text-sm font-medium">
                                    실패
                                </div>
                            </div>
                        </div>

                        {batchResult.failedDates.length > 0 && (
                            <div className="mt-6 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-xl p-4 border border-red-400/20">
                                <h4 className="text-red-300 font-semibold mb-2">
                                    실패한 날짜들:
                                </h4>
                                <p className="text-red-200/80 text-sm">
                                    {batchResult.failedDates.join(", ")}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
