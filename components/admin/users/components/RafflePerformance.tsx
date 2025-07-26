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
import type { CombinedRafflePerformance } from "./DataFetcher";

interface RafflePerformanceProps {
    dailyRafflesData: CombinedRafflePerformance[];
    isLoading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
    lastUpdated?: Date | null;
}

interface RafflePopularityItem {
    raffleId: string;
    raffleTitle: string;
    participation: number;
    isOnchain?: boolean;
    contractAddress?: string;
}

interface ExtendedRaffleItem extends RafflePopularityItem {
    isOnchain: boolean;
}

export default function RafflePerformance({
    dailyRafflesData,
    isLoading = false,
    error = null,
    onRefresh,
    lastUpdated,
}: RafflePerformanceProps) {
    const lastDayData =
        dailyRafflesData && dailyRafflesData.length > 0
            ? dailyRafflesData[dailyRafflesData.length - 1]
            : null;

    const lastDayParticipation = lastDayData?.participation || 0;

    // Calculate totals across all dates
    const totalParticipation =
        dailyRafflesData?.reduce(
            (sum, item) => sum + (item.participation || 0),
            0
        ) || 0;

    // Get onchain summary for the latest day
    const onchainSummary = lastDayData?.onchainSummary;
    const totalOnchainDrawnParticipants =
        onchainSummary?.totalDrawnParticipants || 0;

    // Calculate offchain participation from the base data (excluding onchain)
    const offchainParticipation = lastDayParticipation;

    // Get popular raffles from the latest day (offchain)
    const latestOffchainRaffles = lastDayData?.rafflePopularity
        ? (lastDayData.rafflePopularity as unknown as RafflePopularityItem[])
        : [];

    // Get onchain raffle stats
    const latestOnchainRaffles =
        onchainSummary?.contractResults.flatMap((contract) =>
            contract.raffleStats.map((raffle) => ({
                ...raffle,
                isOnchain: true,
                contractAddress: contract.contractAddress,
            }))
        ) || [];

    // Combine all raffles for top list
    const allRaffles: ExtendedRaffleItem[] = [
        ...latestOffchainRaffles.map(
            (r): ExtendedRaffleItem => ({ ...r, isOnchain: false })
        ),
        ...latestOnchainRaffles,
    ];

    const topRaffles = allRaffles
        .sort((a, b) => b.participation - a.participation)
        .slice(0, 5);

    const chartData =
        dailyRafflesData?.map((item: CombinedRafflePerformance) => {
            const onchainCount = item.onchainSummary?.totalParticipation || 0;
            const onchainDrawnCount =
                item.onchainSummary?.totalDrawnParticipants || 0;
            const offchainCount = (item.participation || 0) - onchainCount;

            return {
                date: item.date,
                total: item.participation || 0,
                onchain: onchainCount,
                onchainDrawn: onchainDrawnCount,
                offchain: Math.max(0, offchainCount), // Ensure non-negative
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
                        RAFFLE PERFORMANCE
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
                        Total Raffle Participation
                    </div>
                </div>

                <div className="mb-4">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center">
                            <div className="text-lg font-semibold text-purple-400">
                                <span>
                                    {offchainParticipation.toLocaleString()}
                                </span>
                            </div>
                            <div className="text-xs text-purple-300">
                                Offchain Raffles
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-green-400">
                                <span>
                                    {totalOnchainDrawnParticipants.toLocaleString()}
                                </span>
                            </div>
                            <div className="text-xs text-green-300">
                                Onchain Raffles
                            </div>
                        </div>
                    </div>
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
                                        dataKey="total"
                                        stroke="#FB923C"
                                        strokeWidth={2}
                                        dot={{
                                            fill: "#FB923C",
                                            strokeWidth: 0,
                                            r: 2,
                                        }}
                                        activeDot={{
                                            r: 4,
                                            stroke: "#FB923C",
                                            strokeWidth: 2,
                                        }}
                                        name="Total Raffle Participation"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="offchain"
                                        stroke="#8B5CF6"
                                        strokeWidth={2}
                                        dot={{
                                            fill: "#8B5CF6",
                                            strokeWidth: 0,
                                            r: 2,
                                        }}
                                        activeDot={{
                                            r: 4,
                                            stroke: "#8B5CF6",
                                            strokeWidth: 2,
                                        }}
                                        name="Offchain Raffle"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="onchain"
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
                                        name="Onchain Raffles"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Chart legend */}
                        <div className="flex flex-wrap justify-center mt-2 gap-3 text-xs">
                            <div className="flex items-center">
                                <div className="w-3 h-0.5 bg-orange-400 mr-1"></div>
                                <span className="text-slate-300">Total</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-0.5 bg-green-400 mr-1"></div>
                                <span className="text-slate-300">Onchain</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-0.5 bg-purple-400 mr-1"></div>
                                <span className="text-slate-300">Offchain</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Onchain Summary section */}
                {onchainSummary && onchainSummary.totalContracts > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-slate-400 mb-3 text-left">
                            Onchain Contracts Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="text-center bg-slate-700/20 rounded-lg p-3">
                                <div className="text-lg font-semibold text-blue-400">
                                    {onchainSummary.totalContracts}
                                </div>
                                <div className="text-xs text-blue-300">
                                    Active Contracts
                                </div>
                            </div>
                            <div className="text-center bg-slate-700/20 rounded-lg p-3">
                                <div className="text-lg font-semibold text-orange-400">
                                    {onchainSummary.contractResults.reduce(
                                        (sum, c) => sum + c.totalEvents,
                                        0
                                    )}
                                </div>
                                <div className="text-xs text-orange-300">
                                    Total Events
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {onchainSummary.contractResults.map((contract) => (
                                <div
                                    key={`${contract.contractAddress}_${contract.networkId}`}
                                    className="bg-slate-700/20 rounded-lg p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-left">
                                            <div className="text-xs font-medium text-slate-300 truncate max-w-32">
                                                {contract.contractAddress}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {contract.participation} events
                                                •{" "}
                                                {
                                                    contract.totalDrawnParticipants
                                                }{" "}
                                                drawn • {contract.totalEvents}{" "}
                                                total
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-semibold text-green-400">
                                                {
                                                    contract.totalDrawnParticipants
                                                }
                                            </div>
                                            <div className="text-xs text-green-300">
                                                drawn
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Top Raffles section */}
                {topRaffles.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-slate-400 mb-3 text-left">
                            {`Today's Most Popular Raffles`}
                        </h3>
                        <div className="space-y-2">
                            {topRaffles.map(
                                (raffle: ExtendedRaffleItem, index: number) => (
                                    <div
                                        key={raffle.raffleId}
                                        className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="text-xs font-bold text-slate-400 w-4">
                                                #{index + 1}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-medium text-white truncate max-w-48">
                                                    {raffle.raffleTitle}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    <span className="text-orange-400">
                                                        {raffle.participation.toLocaleString()}{" "}
                                                        participations
                                                    </span>
                                                    <span className="mx-1">
                                                        •
                                                    </span>
                                                    {raffle.isOnchain ? (
                                                        <span className="text-blue-400">
                                                            Onchain
                                                        </span>
                                                    ) : (
                                                        <span className="text-purple-400">
                                                            Offchain
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-semibold text-white">
                                                {raffle.participation.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                participants
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}

                {/* Footer section */}
                <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                        <p className="text-slate-400 text-xs">
                            Daily raffle participation metrics
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
