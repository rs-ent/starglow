"use client";

import type {
    DailyActivityWallet,
    MonthlyActivityWallet,
} from "@prisma/client";
import { useState } from "react";
import AdminUsersDashboardDailyData from "./Admin.Users.Dashboard.DailyData";

interface AdminUsersDashboardStatsProps {
    walletsCount: number | null;
    allDailyData: DailyActivityWallet[];
    allMonthlyData: MonthlyActivityWallet[];
    allAssets: any[];
    className?: string;
}

export default function AdminUsersDashboardStats({
    walletsCount,
    allDailyData,
    allMonthlyData,
    allAssets,
    className = "",
}: AdminUsersDashboardStatsProps) {
    const [isDailyDataModalOpen, setIsDailyDataModalOpen] = useState(false);

    return (
        <>
            <div className={`space-y-8 ${className}`}>
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-blue-900/30 to-indigo-900/20 rounded-3xl p-8 border border-purple-500/20 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5"></div>
                    <div className="relative">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
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
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                                    {walletsCount?.toLocaleString() || 0}
                                </h1>
                                <p className="text-purple-200/80 text-lg font-medium">
                                    활성 지갑 수
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <button
                        onClick={() => setIsDailyDataModalOpen(true)}
                        className="group relative bg-gradient-to-br from-emerald-900/30 to-teal-900/20 rounded-2xl p-6 border border-emerald-500/20 backdrop-blur-sm hover:border-emerald-400/40 transition-all duration-300 hover:scale-105 text-left w-full"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-teal-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                    <svg
                                        className="w-6 h-6 text-white"
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
                                <svg
                                    className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-200"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                </svg>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                                {allDailyData.length.toLocaleString()}
                            </div>
                            <div className="text-emerald-200/70 font-medium">
                                일별 데이터 보기
                            </div>
                        </div>
                    </button>

                    <div className="group relative bg-gradient-to-br from-blue-900/30 to-cyan-900/20 rounded-2xl p-6 border border-blue-500/20 backdrop-blur-sm hover:border-blue-400/40 transition-all duration-300 hover:scale-105">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-cyan-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                                    <svg
                                        className="w-6 h-6 text-white"
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
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                                {allMonthlyData.length.toLocaleString()}
                            </div>
                            <div className="text-blue-200/70 font-medium">
                                월별 데이터
                            </div>
                        </div>
                    </div>

                    <div className="group relative bg-gradient-to-br from-amber-900/30 to-orange-900/20 rounded-2xl p-6 border border-amber-500/20 backdrop-blur-sm hover:border-amber-400/40 transition-all duration-300 hover:scale-105">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/5 to-orange-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                                    <svg
                                        className="w-6 h-6 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                                {allAssets.length.toLocaleString()}
                            </div>
                            <div className="text-amber-200/70 font-medium">
                                활성 에셋
                            </div>
                        </div>
                    </div>

                    <div className="group relative bg-gradient-to-br from-green-900/30 to-emerald-900/20 rounded-2xl p-6 border border-green-500/20 backdrop-blur-sm hover:border-green-400/40 transition-all duration-300 hover:scale-105">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-emerald-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                                    <svg
                                        className="w-6 h-6 text-white"
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
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">
                                정상
                            </div>
                            <div className="text-green-200/70 font-medium">
                                시스템 상태
                            </div>
                        </div>
                    </div>
                </div>

                {allAssets.length > 0 && (
                    <div className="relative bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-rose-900/20 rounded-3xl p-8 border border-purple-500/20 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 rounded-3xl"></div>
                        <div className="relative">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                                    <span className="text-2xl">🎯</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                                        활성 에셋 목록
                                    </h3>
                                    <p className="text-purple-200/70">
                                        현재 운영 중인 모든 에셋
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                {allAssets.map((asset, index) => (
                                    <div
                                        key={asset.id}
                                        className="group relative bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm hover:border-purple-400/40 transition-all duration-300 hover:scale-105"
                                        style={{
                                            animationDelay: `${index * 50}ms`,
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="relative">
                                            <div className="text-white font-bold text-lg mb-2 truncate">
                                                {asset.name}
                                            </div>
                                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30">
                                                <span className="text-purple-200 text-sm font-medium">
                                                    {asset.symbol}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AdminUsersDashboardDailyData
                isOpen={isDailyDataModalOpen}
                onClose={() => setIsDailyDataModalOpen(false)}
                onDataUpdate={() => {}}
                selectedDate={new Date().toISOString().split("T")[0]}
            />
        </>
    );
}
