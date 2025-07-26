"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import type { DailyActivityPolls } from "@prisma/client";

interface PollPerformanceProps {
    dailyPollsData: DailyActivityPolls[];
    isLoading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
    lastUpdated?: Date | null;
}

interface PollPopularityItem {
    pollId: string;
    pollTitle: string;
    bettingMode: boolean;
    participation: number;
}

export default function PollPerformance({
    dailyPollsData,
    isLoading = false,
    error = null,
    onRefresh,
    lastUpdated,
}: PollPerformanceProps) {
    const lastDayData =
        dailyPollsData && dailyPollsData.length > 0
            ? dailyPollsData[dailyPollsData.length - 1]
            : null;

    const lastDayParticipation = lastDayData?.participation || 0;

    const totalParticipation =
        dailyPollsData?.reduce(
            (sum, item) => sum + (item.participation || 0),
            0
        ) || 0;

    // Get popular polls from the latest day
    const latestPollPopularity = lastDayData?.pollPopularity
        ? (lastDayData.pollPopularity as unknown as PollPopularityItem[])
        : [];

    const bettingPolls = latestPollPopularity.filter((p) => p.bettingMode);
    const regularPolls = latestPollPopularity.filter((p) => !p.bettingMode);

    const totalBettingParticipation = bettingPolls.reduce(
        (sum, poll) => sum + poll.participation,
        0
    );
    const totalRegularParticipation = regularPolls.reduce(
        (sum, poll) => sum + poll.participation,
        0
    );

    const topPolls = latestPollPopularity
        .sort((a, b) => b.participation - a.participation)
        .slice(0, 5);

    const chartData =
        dailyPollsData?.map((item: DailyActivityPolls) => {
            const popularity =
                (item.pollPopularity as unknown as PollPopularityItem[]) || [];
            const bettingCount = popularity
                .filter((p) => p.bettingMode)
                .reduce((sum, p) => sum + p.participation, 0);
            const regularCount = popularity
                .filter((p) => !p.bettingMode)
                .reduce((sum, p) => sum + p.participation, 0);

            return {
                date: item.date,
                total: item.participation || 0,
                betting: bettingCount,
                regular: regularCount,
            };
        }) || [];

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
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
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
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm w-full mx-auto shadow-2xl">
            <div className="text-center">
                <div className="flex items-center justify-between mb-6 gap-4">
                    <div className="flex-1" />
                    <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                        POLL PERFORMANCE
                    </h2>
                    <div className="flex-1 flex justify-end">
                        <button
                            onClick={onRefresh}
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

                <div className="mb-6">
                    <div className="text-4xl font-bold text-white mb-2">
                        {totalParticipation?.toLocaleString() || "0"}
                    </div>
                    <div className="text-sm text-slate-400">
                        Total Poll Participation
                    </div>
                </div>

                <div className="mb-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                            <div className="text-lg font-semibold text-blue-400">
                                <span>
                                    {totalBettingParticipation.toLocaleString()}
                                </span>
                            </div>
                            <div className="text-xs text-blue-300">
                                Betting Polls
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-green-400">
                                <span>
                                    {totalRegularParticipation.toLocaleString()}
                                </span>
                            </div>
                            <div className="text-xs text-green-300">
                                Regular Polls
                            </div>
                        </div>
                    </div>

                    {lastDayData && (
                        <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-700/30">
                            <div className="text-center">
                                <div className="text-sm font-semibold text-cyan-300">
                                    <span>
                                        {lastDayParticipation.toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-xs text-cyan-200">
                                    {`Today's Participation`}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chart section */}
                {chartData && chartData.length > 0 && (
                    <div className="mb-6">
                        <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={chartData}
                                    margin={{
                                        top: 5,
                                        right: 5,
                                        left: 5,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#374151"
                                        opacity={0.3}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10, fill: "#9CA3AF" }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => {
                                            const date = new Date(value);
                                            return `${
                                                date.getMonth() + 1
                                            }/${date.getDate()}`;
                                        }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: "#9CA3AF" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#1F2937",
                                            border: "1px solid #374151",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                        }}
                                        labelStyle={{ color: "#F3F4F6" }}
                                        labelFormatter={(label) => {
                                            const date = new Date(label);
                                            return date.toLocaleDateString();
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="betting"
                                        stroke="#3B82F6"
                                        strokeWidth={2}
                                        dot={{
                                            fill: "#3B82F6",
                                            strokeWidth: 0,
                                            r: 2,
                                        }}
                                        activeDot={{
                                            r: 4,
                                            stroke: "#3B82F6",
                                            strokeWidth: 2,
                                        }}
                                        name="Betting Polls"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="regular"
                                        stroke="#10B981"
                                        strokeWidth={2}
                                        dot={{
                                            fill: "#10B981",
                                            strokeWidth: 0,
                                            r: 2,
                                        }}
                                        activeDot={{
                                            r: 4,
                                            stroke: "#10B981",
                                            strokeWidth: 2,
                                        }}
                                        name="Regular Polls"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Chart legend */}
                        <div className="flex justify-center mt-2 space-x-4 text-xs">
                            <div className="flex items-center">
                                <div className="w-3 h-0.5 bg-blue-400 mr-1"></div>
                                <span className="text-slate-300">
                                    Betting Polls
                                </span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-0.5 bg-green-400 mr-1"></div>
                                <span className="text-slate-300">
                                    Regular Polls
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Polls section */}
                {topPolls.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-slate-400 mb-3 text-left">
                            {`Today's Most Popular Polls`}
                        </h3>
                        <div className="space-y-2">
                            {topPolls.map((poll, index) => (
                                <div
                                    key={poll.pollId}
                                    className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="text-xs font-bold text-slate-400 w-4">
                                            #{index + 1}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-medium text-white truncate max-w-48">
                                                {poll.pollTitle}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {poll.bettingMode ? (
                                                    <span className="text-blue-400">
                                                        Betting
                                                    </span>
                                                ) : (
                                                    <span className="text-green-400">
                                                        Regular
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold text-white">
                                            {poll.participation.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            participants
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer section */}
                <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                        <p className="text-slate-400 text-xs">
                            Daily poll participation metrics
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
