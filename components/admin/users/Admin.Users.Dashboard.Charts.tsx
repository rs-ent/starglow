"use client";

import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import type { DailyActivityWallet, MonthlyActivityWallet } from "@prisma/client";
import { useMemo, useState } from "react";

interface AdminUsersDashboardChartsProps {
    allDailyData: DailyActivityWallet[];
    allMonthlyData: MonthlyActivityWallet[];
    onDayClick?: (date: string) => void;
    onMonthClick?: (year: number, month: number) => void;
    selectedDate?: string;
    className?: string;
}

export default function AdminUsersDashboardCharts({
    allDailyData,
    allMonthlyData,
    onDayClick,
    onMonthClick,
    selectedDate,
    className = "",
}: AdminUsersDashboardChartsProps) {
    // Legend 토글 상태 관리
    const [dailyHiddenSeries, setDailyHiddenSeries] = useState<Set<string>>(
        new Set()
    );
    const [monthlyHiddenSeries, setMonthlyHiddenSeries] = useState<Set<string>>(
        new Set()
    );
    const dailyTrendData = useMemo(() => {
        return allDailyData
            .slice(-30)
            .sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            .map((item) => {
                const date = new Date(item.date);
                const dateStr = `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                const isSelected = selectedDate === dateStr;

                return {
                    date: new Date(item.date).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                    }),
                    fullDate: dateStr,
                    activeWallets: item.activeWallets,
                    newWallets: item.newWallets,
                    returningWallets: item.returningWallets,
                    totalWallets: item.totalWallets,
                    isSelected,
                };
            });
    }, [allDailyData, selectedDate]);

    const monthlyTrendData = useMemo(() => {
        return allMonthlyData
            .slice(-12)
            .sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            .map((item) => ({
                date: new Date(item.date).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "short",
                }),
                year: new Date(item.date).getFullYear(),
                month: new Date(item.date).getMonth() + 1,
                activeWallets: item.activeWallets,
                newWallets: item.newWallets,
                returningWallets: item.returningWallets,
                totalWallets: item.totalWallets,
            }));
    }, [allMonthlyData]);

    const handleDailyChartClick = (data: any) => {
        if (data && data.activePayload && data.activePayload[0]) {
            const clickedData = data.activePayload[0].payload;
            if (onDayClick && clickedData.fullDate) {
                onDayClick(clickedData.fullDate);
            }
        }
    };

    const handleMonthlyChartClick = (data: any) => {
        if (data && data.activePayload && data.activePayload[0]) {
            const clickedData = data.activePayload[0].payload;
            if (onMonthClick && clickedData.year && clickedData.month) {
                onMonthClick(clickedData.year, clickedData.month);
            }
        }
    };

    // Legend 클릭 핸들러들
    const handleDailyLegendClick = (e: any) => {
        const dataKey = e.dataKey;
        setDailyHiddenSeries((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(dataKey)) {
                newSet.delete(dataKey);
            } else {
                newSet.add(dataKey);
            }
            return newSet;
        });
    };

    const handleMonthlyLegendClick = (e: any) => {
        const dataKey = e.dataKey;
        setMonthlyHiddenSeries((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(dataKey)) {
                newSet.delete(dataKey);
            } else {
                newSet.add(dataKey);
            }
            return newSet;
        });
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0]?.payload;
            if (!data) return null;

            const getKoreanLabel = (dataKey: string) => {
                switch (dataKey) {
                    case "activeWallets":
                        return "활성 지갑";
                    case "newWallets":
                        return "신규 지갑";
                    case "returningWallets":
                        return "재방문 지갑";
                    case "totalWallets":
                        return "총 지갑";
                    default:
                        return dataKey;
                }
            };

            const totalActive = data.activeWallets || 0;
            const newWallets = data.newWallets || 0;
            const returningWallets = data.returningWallets || 0;
            const totalWallets = data.totalWallets || totalActive;

            const newPercentage =
                totalActive > 0
                    ? ((newWallets / totalActive) * 100).toFixed(1)
                    : "0";
            const returningPercentage =
                totalActive > 0
                    ? ((returningWallets / totalActive) * 100).toFixed(1)
                    : "0";

            return (
                <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-xl min-w-[320px] z-20">
                    <div className="border-b border-white/10 pb-3 mb-4">
                        <p className="text-white font-bold text-lg mb-1">
                            {label}
                        </p>
                        <p className="text-gray-300 text-sm">
                            지갑 활동 상세 정보
                        </p>
                    </div>

                    <div className="space-y-3">
                        {payload.map((entry: any, index: number) => (
                            <div
                                key={index}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full shadow-sm"
                                        style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-white font-medium">
                                        {getKoreanLabel(entry.dataKey)}
                                    </span>
                                </div>
                                <span
                                    className="font-bold text-base"
                                    style={{ color: entry.color }}
                                >
                                    {entry.value?.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>

                    {totalWallets > 0 && totalWallets !== totalActive && (
                        <div className="border-t border-white/10 pt-3 mt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300 text-sm">
                                    총 누적 지갑
                                </span>
                                <span className="text-white font-semibold">
                                    {totalWallets.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}

                    {(newWallets > 0 || returningWallets > 0) && (
                        <div className="border-t border-white/10 pt-3 mt-4">
                            <p className="text-gray-400 text-sm mb-3">
                                활성 지갑 구성 비율
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-cyan-500/10 rounded-lg p-2 text-center">
                                    <div className="text-cyan-300 font-bold text-lg">
                                        {newPercentage}%
                                    </div>
                                    <div className="text-cyan-200 text-xs">
                                        신규
                                    </div>
                                </div>
                                <div className="bg-green-500/10 rounded-lg p-2 text-center">
                                    <div className="text-green-300 font-bold text-lg">
                                        {returningPercentage}%
                                    </div>
                                    <div className="text-green-200 text-xs">
                                        재방문
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-white/10 pt-3 mt-4">
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            <span>💡</span>
                            클릭하여 해당 날짜의 상세 데이터 보기
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`space-y-8 ${className}`}>
            <div className="relative bg-gradient-to-br from-indigo-900/20 via-purple-900/15 to-pink-900/20 rounded-3xl p-8 border border-indigo-500/20 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 rounded-3xl"></div>
                <div className="relative">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
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
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                                데이터 시각화
                            </h3>
                            <p className="text-indigo-200/70">
                                차트를 클릭하여 상세 분석 보기 (1시간 캐싱)
                            </p>
                        </div>
                    </div>

                    {selectedDate && (
                        <div className="mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-400/30">
                            <div className="flex items-center gap-3">
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
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <span className="text-blue-200 font-medium">
                                    선택된 날짜:{" "}
                                    {new Date(selectedDate).toLocaleDateString(
                                        "ko-KR",
                                        {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        }
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm hover:border-blue-400/40 transition-all duration-300 cursor-pointer group">
                            <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
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
                                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                    />
                                </svg>
                                일별 지갑 활동 트렌드 (최근 30일)
                                <span className="text-xs text-blue-300/70 group-hover:text-blue-300">
                                    클릭 가능
                                </span>
                            </h4>
                            <ResponsiveContainer width="100%" height={400}>
                                <AreaChart
                                    data={dailyTrendData}
                                    onClick={handleDailyChartClick}
                                >
                                    <defs>
                                        <linearGradient
                                            id="activeWalletsGradient"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#8B5CF6"
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#8B5CF6"
                                                stopOpacity={0.1}
                                            />
                                        </linearGradient>
                                        <linearGradient
                                            id="newWalletsGradient"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#06B6D4"
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#06B6D4"
                                                stopOpacity={0.1}
                                            />
                                        </linearGradient>
                                        <linearGradient
                                            id="returningWalletsGradient"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#10B981"
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#10B981"
                                                stopOpacity={0.1}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#374151"
                                    />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#9CA3AF"
                                        fontSize={12}
                                    />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        wrapperStyle={{
                                            color: "#ffffff",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            cursor: "pointer",
                                        }}
                                        onClick={handleDailyLegendClick}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="activeWallets"
                                        name="활성 지갑"
                                        stroke="#8B5CF6"
                                        fillOpacity={1}
                                        fill="url(#activeWalletsGradient)"
                                        strokeWidth={2}
                                        hide={dailyHiddenSeries.has(
                                            "activeWallets"
                                        )}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="newWallets"
                                        name="신규 지갑"
                                        stroke="#06B6D4"
                                        fillOpacity={1}
                                        fill="url(#newWalletsGradient)"
                                        strokeWidth={2}
                                        hide={dailyHiddenSeries.has(
                                            "newWallets"
                                        )}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="returningWallets"
                                        name="재방문 지갑"
                                        stroke="#10B981"
                                        fillOpacity={1}
                                        fill="url(#returningWalletsGradient)"
                                        strokeWidth={2}
                                        hide={dailyHiddenSeries.has(
                                            "returningWallets"
                                        )}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm hover:border-green-400/40 transition-all duration-300 cursor-pointer group">
                            <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
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
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                                월별 지갑 성장 트렌드
                                <span className="text-xs text-green-300/70 group-hover:text-green-300">
                                    클릭 가능
                                </span>
                            </h4>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart
                                    data={monthlyTrendData}
                                    onClick={handleMonthlyChartClick}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#374151"
                                    />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#9CA3AF"
                                        fontSize={12}
                                    />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        wrapperStyle={{
                                            color: "#ffffff",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            cursor: "pointer",
                                        }}
                                        onClick={handleMonthlyLegendClick}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="totalWallets"
                                        name="총 누적 지갑"
                                        stroke="#8B5CF6"
                                        strokeWidth={3}
                                        dot={{
                                            fill: "#8B5CF6",
                                            strokeWidth: 2,
                                            r: 4,
                                        }}
                                        activeDot={{
                                            r: 6,
                                            fill: "#8B5CF6",
                                            stroke: "#ffffff",
                                            strokeWidth: 2,
                                        }}
                                        hide={monthlyHiddenSeries.has(
                                            "totalWallets"
                                        )}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="activeWallets"
                                        name="월별 활성 지갑"
                                        stroke="#06B6D4"
                                        strokeWidth={3}
                                        dot={{
                                            fill: "#06B6D4",
                                            strokeWidth: 2,
                                            r: 4,
                                        }}
                                        activeDot={{
                                            r: 6,
                                            fill: "#06B6D4",
                                            stroke: "#ffffff",
                                            strokeWidth: 2,
                                        }}
                                        hide={monthlyHiddenSeries.has(
                                            "activeWallets"
                                        )}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="newWallets"
                                        name="월별 신규 지갑"
                                        stroke="#10B981"
                                        strokeWidth={3}
                                        dot={{
                                            fill: "#10B981",
                                            strokeWidth: 2,
                                            r: 4,
                                        }}
                                        activeDot={{
                                            r: 6,
                                            fill: "#10B981",
                                            stroke: "#ffffff",
                                            strokeWidth: 2,
                                        }}
                                        hide={monthlyHiddenSeries.has(
                                            "newWallets"
                                        )}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
