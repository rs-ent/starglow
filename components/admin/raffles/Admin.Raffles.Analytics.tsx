"use client";

import { useState, useMemo } from "react";
import { useRaffles } from "@/app/actions/raffles/hooks";
import { calculateRaffleStatus } from "@/app/actions/raffles/utils";

import {
    FaArrowLeft,
    FaChartBar,
    FaUsers,
    FaDice,
    FaTrophy,
    FaCalendarAlt,
    FaFilter,
    FaDownload,
    FaSpinner,
    FaCrown,
    FaGift,
} from "react-icons/fa";
import { TbTopologyStar3 } from "react-icons/tb";

import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

import type { RaffleWithDetails } from "@/app/actions/raffles/actions";

interface AdminRafflesAnalyticsProps {
    onBack: () => void;
}

interface AnalyticsData {
    overview: {
        totalRaffles: number;
        activeRaffles: number;
        totalParticipants: number;
        totalPrizes: number;
        completionRate: number;
        averageParticipants: number;
    };
    trends: Array<{
        date: string;
        raffles: number;
        participants: number;
        revenue: number;
    }>;
    statusDistribution: Array<{
        name: string;
        value: number;
        color: string;
    }>;
    artistPerformance: Array<{
        artist: string;
        raffles: number;
        participants: number;
        successRate: number;
    }>;
    prizeDistribution: Array<{
        type: string;
        count: number;
        percentage: number;
    }>;
}

export default function AdminRafflesAnalytics({
    onBack,
}: AdminRafflesAnalyticsProps) {
    // 래플 데이터 조회
    const { rafflesData, isRafflesLoading, isRafflesError, rafflesError } =
        useRaffles({
            getRafflesInput: {},
        });

    // 📊 기간 필터
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">(
        "30d"
    );

    // 📈 분석 데이터 계산
    const analyticsData: AnalyticsData = useMemo(() => {
        if (!rafflesData?.success || !rafflesData.data) {
            return {
                overview: {
                    totalRaffles: 0,
                    activeRaffles: 0,
                    totalParticipants: 0,
                    totalPrizes: 0,
                    completionRate: 0,
                    averageParticipants: 0,
                },
                trends: [],
                statusDistribution: [],
                artistPerformance: [],
                prizeDistribution: [],
            };
        }

        const raffles = rafflesData.data as RaffleWithDetails[];

        // 기간 필터링
        const now = new Date();
        const cutoffDate = new Date();
        if (timeRange === "7d") cutoffDate.setDate(now.getDate() - 7);
        else if (timeRange === "30d") cutoffDate.setDate(now.getDate() - 30);
        else if (timeRange === "90d") cutoffDate.setDate(now.getDate() - 90);
        else cutoffDate.setFullYear(2020); // all

        const filteredRaffles = raffles.filter(
            (raffle) => new Date(raffle.createdAt) >= cutoffDate
        );

        // 📊 기본 통계
        const totalRaffles = filteredRaffles.length;
        const activeRaffles = filteredRaffles.filter(
            (raffle) =>
                calculateRaffleStatus(
                    raffle.startDate,
                    raffle.endDate,
                    raffle.drawDate
                ) === "ACTIVE"
        ).length;
        const totalParticipants = filteredRaffles.reduce(
            (sum, raffle) => sum + (raffle._count?.participants || 0),
            0
        );
        const totalPrizes = filteredRaffles.reduce(
            (sum, raffle) => sum + (raffle._count?.prizes || 0),
            0
        );
        const completedRaffles = filteredRaffles.filter(
            (raffle) =>
                calculateRaffleStatus(
                    raffle.startDate,
                    raffle.endDate,
                    raffle.drawDate
                ) === "COMPLETED"
        ).length;

        // 📈 트렌드 데이터 (최근 14일)
        const trendDays = 14;
        const trends = [];
        for (let i = trendDays - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayRaffles = filteredRaffles.filter((raffle) => {
                const raffleDate = new Date(raffle.createdAt);
                return raffleDate >= dayStart && raffleDate <= dayEnd;
            });

            trends.push({
                date: date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                }),
                raffles: dayRaffles.length,
                participants: dayRaffles.reduce(
                    (sum, raffle) => sum + (raffle._count?.participants || 0),
                    0
                ),
                revenue: dayRaffles.reduce((sum, raffle) => {
                    const participants = raffle._count?.participants || 0;
                    const entryFee = raffle.entryFeeAmount || 0;
                    return sum + participants * entryFee;
                }, 0),
            });
        }

        // 🎯 상태별 분포
        const statusCounts = {
            UPCOMING: 0,
            ACTIVE: 0,
            WAITING_DRAW: 0,
            COMPLETED: 0,
        };

        filteredRaffles.forEach((raffle) => {
            const status = calculateRaffleStatus(
                raffle.startDate,
                raffle.endDate,
                raffle.drawDate
            );
            statusCounts[status]++;
        });

        const statusDistribution = [
            {
                name: "Upcoming",
                value: statusCounts.UPCOMING,
                color: "#3B82F6",
            },
            { name: "Active", value: statusCounts.ACTIVE, color: "#10B981" },
            {
                name: "Waiting Draw",
                value: statusCounts.WAITING_DRAW,
                color: "#F59E0B",
            },
            {
                name: "Completed",
                value: statusCounts.COMPLETED,
                color: "#6B7280",
            },
        ];

        // 🎨 아티스트별 성과
        const artistStats = new Map();
        filteredRaffles.forEach((raffle) => {
            if (!raffle.artist) return;

            const artistName = raffle.artist.name;
            if (!artistStats.has(artistName)) {
                artistStats.set(artistName, {
                    raffles: 0,
                    participants: 0,
                    completed: 0,
                });
            }

            const stats = artistStats.get(artistName);
            stats.raffles++;
            stats.participants += raffle._count?.participants || 0;

            const status = calculateRaffleStatus(
                raffle.startDate,
                raffle.endDate,
                raffle.drawDate
            );
            if (status === "COMPLETED") stats.completed++;
        });

        const artistPerformance = Array.from(artistStats.entries())
            .map(([artist, stats]) => ({
                artist,
                raffles: stats.raffles,
                participants: stats.participants,
                successRate:
                    stats.raffles > 0 ? stats.completed / stats.raffles : 0,
            }))
            .sort((a, b) => b.participants - a.participants)
            .slice(0, 8);

        // 🎁 상금 타입별 분포
        const prizeTypeCounts = new Map();
        let totalPrizeCount = 0;

        filteredRaffles.forEach((raffle) => {
            raffle.prizes?.forEach((prize) => {
                const type = prize.prizeType || "EMPTY";
                prizeTypeCounts.set(type, (prizeTypeCounts.get(type) || 0) + 1);
                totalPrizeCount++;
            });
        });

        const prizeDistribution = Array.from(prizeTypeCounts.entries()).map(
            ([type, count]) => ({
                type: type === "EMPTY" ? "No Prize" : type,
                count,
                percentage:
                    totalPrizeCount > 0 ? (count / totalPrizeCount) * 100 : 0,
            })
        );

        return {
            overview: {
                totalRaffles,
                activeRaffles,
                totalParticipants,
                totalPrizes,
                completionRate:
                    totalRaffles > 0
                        ? (completedRaffles / totalRaffles) * 100
                        : 0,
                averageParticipants:
                    totalRaffles > 0 ? totalParticipants / totalRaffles : 0,
            },
            trends,
            statusDistribution,
            artistPerformance,
            prizeDistribution,
        };
    }, [rafflesData, timeRange]);

    if (isRafflesLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex items-center gap-3 text-white">
                    <FaSpinner className="animate-spin text-2xl" />
                    <span className="text-lg">Loading analytics...</span>
                </div>
            </div>
        );
    }

    if (isRafflesError) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="text-red-400 text-lg mb-4">
                    Error loading analytics: {rafflesError?.message}
                </div>
                <button
                    onClick={onBack}
                    className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-purple-900/30 relative overflow-hidden">
            {/* Background decoration */}
            <TbTopologyStar3 className="absolute text-[18rem] text-purple-900/10 right-[-4rem] top-[-6rem] pointer-events-none select-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl transition-colors"
                    >
                        <FaArrowLeft className="text-white" />
                    </button>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <FaChartBar className="text-purple-400" />
                        Raffle{" "}
                        <span className="text-purple-400">Analytics</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Time Range Filter */}
                    <div className="flex items-center gap-2">
                        <FaFilter className="text-gray-400" />
                        <select
                            value={timeRange}
                            onChange={(e) =>
                                setTimeRange(
                                    e.target.value as
                                        | "7d"
                                        | "30d"
                                        | "90d"
                                        | "all"
                                )
                            }
                            className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        >
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                            <option value="all">All time</option>
                        </select>
                    </div>

                    {/* Export Button */}
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all">
                        <FaDownload />
                        Export
                    </button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <FaDice className="text-2xl text-purple-400" />
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {analyticsData.overview.totalRaffles}
                            </div>
                            <div className="text-sm text-gray-400">
                                Total Raffles
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <FaSpinner className="text-2xl text-green-400" />
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {analyticsData.overview.activeRaffles}
                            </div>
                            <div className="text-sm text-gray-400">
                                Active Now
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <FaUsers className="text-2xl text-blue-400" />
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {analyticsData.overview.totalParticipants.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-400">
                                Participants
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <FaGift className="text-2xl text-pink-400" />
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {analyticsData.overview.totalPrizes}
                            </div>
                            <div className="text-sm text-gray-400">
                                Total Prizes
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <FaTrophy className="text-2xl text-yellow-400" />
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {analyticsData.overview.completionRate.toFixed(
                                    1
                                )}
                                %
                            </div>
                            <div className="text-sm text-gray-400">
                                Completion Rate
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <FaCalendarAlt className="text-2xl text-indigo-400" />
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {analyticsData.overview.averageParticipants.toFixed(
                                    0
                                )}
                            </div>
                            <div className="text-sm text-gray-400">
                                Avg. Participants
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Trends Chart */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <FaChartBar className="text-blue-400" />
                        Activity Trends (Last 14 Days)
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analyticsData.trends}>
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
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1F2937",
                                    border: "1px solid #374151",
                                    borderRadius: "8px",
                                    color: "#F3F4F6",
                                }}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="raffles"
                                stackId="1"
                                stroke="#8B5CF6"
                                fill="#8B5CF6"
                                fillOpacity={0.3}
                                name="Raffles Created"
                            />
                            <Area
                                type="monotone"
                                dataKey="participants"
                                stackId="2"
                                stroke="#10B981"
                                fill="#10B981"
                                fillOpacity={0.3}
                                name="New Participants"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Status Distribution */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <FaDice className="text-purple-400" />
                        Raffle Status Distribution
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={analyticsData.statusDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {analyticsData.statusDistribution.map(
                                    (entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                        />
                                    )
                                )}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1F2937",
                                    border: "1px solid #374151",
                                    borderRadius: "8px",
                                    color: "#F3F4F6",
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Artist Performance */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <FaCrown className="text-yellow-400" />
                        Top Artists by Participation
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={analyticsData.artistPerformance}
                            layout="horizontal"
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#374151"
                            />
                            <XAxis
                                type="number"
                                stroke="#9CA3AF"
                                fontSize={12}
                            />
                            <YAxis
                                type="category"
                                dataKey="artist"
                                stroke="#9CA3AF"
                                fontSize={12}
                                width={100}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1F2937",
                                    border: "1px solid #374151",
                                    borderRadius: "8px",
                                    color: "#F3F4F6",
                                }}
                            />
                            <Bar
                                dataKey="participants"
                                fill="#8B5CF6"
                                name="Total Participants"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Prize Type Distribution */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <FaGift className="text-pink-400" />
                        Prize Type Distribution
                    </h2>
                    <div className="space-y-4">
                        {analyticsData.prizeDistribution.map((prize, index) => (
                            <div
                                key={prize.type}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{
                                            backgroundColor: [
                                                "#8B5CF6",
                                                "#10B981",
                                                "#F59E0B",
                                                "#EF4444",
                                                "#3B82F6",
                                            ][index % 5],
                                        }}
                                    />
                                    <span className="text-white font-medium">
                                        {prize.type}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-bold">
                                        {prize.count}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {prize.percentage.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                        <div className="flex justify-between text-white font-bold">
                            <span>Total Prizes:</span>
                            <span>{analyticsData.overview.totalPrizes}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
