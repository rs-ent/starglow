/// components/admin/x/Admin.X.ChartModal.tsx

"use client";

import { useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { formatNumber } from "@/lib/utils/format";
import { TweetMetrics, TweetAuthorMetrics } from "@prisma/client";
import { cn } from "@/lib/utils/tailwind";

interface AdminXChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "author" | "tweet";
    authorMetrics?: TweetAuthorMetrics[];
    tweetMetrics?: TweetMetrics[];
    title: string;
    isLoading?: boolean;
    error?: any;
}

type TimeRange = 7 | 14 | 30;

// 차트 데이터 타입 정의
type AuthorChartData = {
    date: string;
    time: number;
    followers: number;
    following: number;
    tweets: number;
    listed: number;
};

type TweetChartData = {
    date: string;
    time: number;
    replies: number;
    retweets: number;
    likes: number;
    quotes: number;
};

export default function AdminXChartModal({
    isOpen,
    onClose,
    type,
    authorMetrics = [],
    tweetMetrics = [],
    title,
    isLoading,
    error,
}: AdminXChartModalProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>(30);

    if (!isOpen) return null;

    // 시간 범위에 따른 데이터 필터링
    const filterDataByTimeRange = (data: any[]) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - timeRange);

        return data.filter((item) => new Date(item.recordedAt) >= cutoffDate);
    };

    // 차트 데이터 준비 - 타입 명시
    const prepareChartData = (): AuthorChartData[] | TweetChartData[] => {
        if (type === "author" && authorMetrics.length > 0) {
            const filteredData = filterDataByTimeRange(authorMetrics);
            const chartData = filteredData.map((metric) => ({
                date: new Date(metric.recordedAt).toLocaleDateString(),
                time: new Date(metric.recordedAt).getTime(),
                followers: metric.followersCount,
                following: metric.followingCount,
                tweets: metric.tweetCount,
                listed: metric.listedCount,
            }));
            console.log("Original metrics:", authorMetrics);
            console.log("Filtered data:", filteredData);
            console.log("Final chart data:", chartData);
            return chartData;
        } else if (type === "tweet" && tweetMetrics.length > 0) {
            const filteredData = filterDataByTimeRange(tweetMetrics);
            const chartData = filteredData.map((metric) => ({
                date: new Date(metric.recordedAt).toLocaleDateString(),
                time: new Date(metric.recordedAt).getTime(),
                replies: metric.replyCount,
                retweets: metric.retweetCount,
                likes: metric.likeCount,
                quotes: metric.quoteCount,
            }));
            console.log("Original metrics:", tweetMetrics);
            console.log("Filtered data:", filteredData);
            console.log("Final chart data:", chartData);
            return chartData;
        }
        return [];
    };

    const chartData = prepareChartData();

    // 다크 테마 차트 색상
    const colors = {
        author: {
            followers: "#60A5FA", // blue-400
            following: "#34D399", // emerald-400
            tweets: "#FBBF24", // amber-400
            listed: "#A78BFA", // violet-400
        },
        tweet: {
            replies: "#60A5FA", // blue-400
            retweets: "#34D399", // emerald-400
            likes: "#F87171", // red-400
            quotes: "#FBBF24", // amber-400
        },
    };

    // 커스텀 툴팁
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-700">
                    <p className="text-gray-300 text-sm font-medium mb-2">
                        {label}
                    </p>
                    {payload.map((entry: any, index: number) => (
                        <div
                            key={index}
                            className="flex items-center space-x-2 text-xs"
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.stroke }}
                            />
                            <span className="text-gray-400">{entry.name}:</span>
                            <span className="text-gray-100 font-medium">
                                {formatNumber(entry.value)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderChart = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-96">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-blue-500"></div>
                        <p className="text-gray-400 text-sm mt-4">
                            Loading metrics...
                        </p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="text-red-400 text-4xl mb-4">⚠️</div>
                        <p className="text-red-400 mb-2">
                            Error loading metrics
                        </p>
                        <p className="text-sm text-gray-500">{error.message}</p>
                    </div>
                </div>
            );
        }

        if (chartData.length === 0) {
            return (
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="text-gray-600 text-4xl mb-4">📊</div>
                        <p className="text-gray-400">
                            No metrics data available
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Data will appear here once metrics are collected
                        </p>
                    </div>
                </div>
            );
        }

        // 개선된 데이터 범위 계산 (Y축 스케일)
        const getDataRange = () => {
            const allValues: number[] = [];
            chartData.forEach((item) => {
                Object.entries(item).forEach(([key, value]) => {
                    if (
                        key !== "date" &&
                        key !== "time" &&
                        typeof value === "number"
                    ) {
                        allValues.push(value);
                    }
                });
            });

            // 데이터가 없는 경우
            if (allValues.length === 0) {
                return { min: 0, max: 10 };
            }

            const dataMax = Math.max(...allValues);
            const dataMin = Math.min(...allValues);

            // 최소값은 항상 0으로 설정
            const adjustedMin = 0;

            // 최대값이 0이 아닌 경우에만 1.2를 곱하고, 0인 경우 기본값 10 설정
            const adjustedMax = dataMax > 0 ? Math.ceil(dataMax * 1.2) : 10;

            // 최대값이 1 이하인 경우 최소 2로 설정하여 변화를 볼 수 있게 함
            return {
                min: adjustedMin,
                max: Math.max(adjustedMax, 2),
            };
        };

        const { min, max } = getDataRange();

        // 현재 값 가져오기 함수 - 타입 안전하게
        const getCurrentValue = (key: string): number => {
            const lastData = chartData[chartData.length - 1];
            if (!lastData) return 0;

            if (type === "author") {
                const authorData = lastData as AuthorChartData;
                return (
                    authorData[
                        key as keyof Omit<AuthorChartData, "date" | "time">
                    ] || 0
                );
            } else {
                const tweetData = lastData as TweetChartData;
                return (
                    tweetData[
                        key as keyof Omit<TweetChartData, "date" | "time">
                    ] || 0
                );
            }
        };

        return (
            <div className="flex flex-col space-y-4">
                {/* 차트 */}
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                            strokeOpacity={0.3}
                        />
                        <XAxis
                            dataKey="date"
                            stroke="#9CA3AF"
                            tick={{ fontSize: 12, fill: "#9CA3AF" }}
                            tickLine={{ stroke: "#4B5563" }}
                        />
                        <YAxis
                            stroke="#9CA3AF"
                            tick={{ fontSize: 12, fill: "#9CA3AF" }}
                            tickFormatter={(value) => formatNumber(value)}
                            tickLine={{ stroke: "#4B5563" }}
                            domain={[min, max]}
                            allowDecimals={false}
                            scale="linear"
                        />
                        <Tooltip content={<CustomTooltip />} />

                        {type === "author" ? (
                            <>
                                <Line
                                    type="monotone"
                                    dataKey="followers"
                                    stroke={colors.author.followers}
                                    strokeWidth={3}
                                    name="Followers"
                                    dot={{
                                        r: 8,
                                        fill: colors.author.followers,
                                        stroke: colors.author.followers,
                                        strokeWidth: 2,
                                        fillOpacity: 1,
                                    }}
                                    activeDot={{
                                        r: 10,
                                        fill: colors.author.followers,
                                        stroke: colors.author.followers,
                                        strokeWidth: 2,
                                        fillOpacity: 1,
                                    }}
                                    connectNulls
                                />
                                <Line
                                    type="monotone"
                                    dataKey="following"
                                    stroke={colors.author.following}
                                    strokeWidth={3}
                                    name="Following"
                                    dot={{
                                        r: 8,
                                        fill: colors.author.following,
                                        stroke: colors.author.following,
                                        strokeWidth: 2,
                                        fillOpacity: 1,
                                    }}
                                    activeDot={{
                                        r: 10,
                                        fill: colors.author.following,
                                        stroke: colors.author.following,
                                        strokeWidth: 2,
                                        fillOpacity: 1,
                                    }}
                                    connectNulls
                                />
                                <Line
                                    type="monotone"
                                    dataKey="tweets"
                                    stroke={colors.author.tweets}
                                    strokeWidth={3}
                                    name="Tweets"
                                    dot={{
                                        r: 8,
                                        fill: colors.author.tweets,
                                        stroke: colors.author.tweets,
                                        strokeWidth: 2,
                                        fillOpacity: 1,
                                    }}
                                    activeDot={{
                                        r: 10,
                                        fill: colors.author.tweets,
                                        stroke: colors.author.tweets,
                                        strokeWidth: 2,
                                        fillOpacity: 1,
                                    }}
                                    connectNulls
                                />
                                <Line
                                    type="monotone"
                                    dataKey="listed"
                                    stroke={colors.author.listed}
                                    strokeWidth={3}
                                    name="Listed"
                                    dot={{
                                        r: 8,
                                        fill: colors.author.listed,
                                        stroke: colors.author.listed,
                                        strokeWidth: 2,
                                        fillOpacity: 1,
                                    }}
                                    activeDot={{
                                        r: 10,
                                        fill: colors.author.listed,
                                        stroke: colors.author.listed,
                                        strokeWidth: 2,
                                        fillOpacity: 1,
                                    }}
                                    connectNulls
                                />
                            </>
                        ) : (
                            <>
                                <Line
                                    type="monotone"
                                    dataKey="replies"
                                    stroke={colors.tweet.replies}
                                    strokeWidth={3}
                                    name="Replies"
                                    dot={{
                                        r: 8,
                                        fill: colors.tweet.replies,
                                        stroke: colors.tweet.replies,
                                        strokeWidth: 2,
                                        fillOpacity: 1,
                                    }}
                                    activeDot={{
                                        r: 10,
                                        fill: colors.tweet.replies,
                                        stroke: colors.tweet.replies,
                                        strokeWidth: 2,
                                        fillOpacity: 1,
                                    }}
                                    connectNulls
                                />
                                <Line
                                    type="monotone"
                                    dataKey="retweets"
                                    stroke={colors.tweet.retweets}
                                    strokeWidth={3}
                                    name="Retweets"
                                    dot={{
                                        r: 8,
                                        fill: colors.tweet.retweets,
                                        stroke: colors.tweet.retweets,
                                        strokeWidth: 2,
                                        fillOpacity: 1,
                                    }}
                                    activeDot={{
                                        r: 10,
                                        fill: colors.tweet.retweets,
                                        stroke: colors.tweet.retweets,
                                        strokeWidth: 2,
                                        fillOpacity: 1,
                                    }}
                                    connectNulls
                                />
                                <Line
                                    type="monotone"
                                    dataKey="likes"
                                    stroke={colors.tweet.likes}
                                    strokeWidth={3}
                                    name="Likes"
                                    dot={{
                                        r: 8,
                                        fill: colors.tweet.likes,
                                        stroke: colors.tweet.likes,
                                        strokeWidth: 2,
                                        fillOpacity: 1,
                                    }}
                                    activeDot={{
                                        r: 10,
                                        fill: colors.tweet.likes,
                                        stroke: colors.tweet.likes,
                                        strokeWidth: 2,
                                        fillOpacity: 1,
                                    }}
                                    connectNulls
                                />
                                <Line
                                    type="monotone"
                                    dataKey="quotes"
                                    stroke={colors.tweet.quotes}
                                    strokeWidth={3}
                                    name="Quotes"
                                    dot={{
                                        r: 8,
                                        fill: colors.tweet.quotes,
                                        stroke: colors.tweet.quotes,
                                        strokeWidth: 2,
                                        fillOpacity: 1,
                                    }}
                                    activeDot={{
                                        r: 10,
                                        fill: colors.tweet.quotes,
                                        stroke: colors.tweet.quotes,
                                        strokeWidth: 2,
                                        fillOpacity: 1,
                                    }}
                                    connectNulls
                                />
                            </>
                        )}
                    </LineChart>
                </ResponsiveContainer>

                {/* 커스텀 Legend - 타입 안전하게 수정 */}
                <div className="px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {type === "author" ? (
                            <>
                                <LegendItem
                                    color={colors.author.followers}
                                    label="Followers"
                                    value={getCurrentValue("followers")}
                                />
                                <LegendItem
                                    color={colors.author.following}
                                    label="Following"
                                    value={getCurrentValue("following")}
                                />
                                <LegendItem
                                    color={colors.author.tweets}
                                    label="Tweets"
                                    value={getCurrentValue("tweets")}
                                />
                                <LegendItem
                                    color={colors.author.listed}
                                    label="Listed"
                                    value={getCurrentValue("listed")}
                                />
                            </>
                        ) : (
                            <>
                                <LegendItem
                                    color={colors.tweet.replies}
                                    label="Replies"
                                    value={getCurrentValue("replies")}
                                />
                                <LegendItem
                                    color={colors.tweet.retweets}
                                    label="Retweets"
                                    value={getCurrentValue("retweets")}
                                />
                                <LegendItem
                                    color={colors.tweet.likes}
                                    label="Likes"
                                    value={getCurrentValue("likes")}
                                />
                                <LegendItem
                                    color={colors.tweet.quotes}
                                    label="Quotes"
                                    value={getCurrentValue("quotes")}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* 배경 오버레이 */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* 모달 컨테이너 */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-800">
                    {/* 헤더 */}
                    <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 backdrop-blur-sm">
                        <p className="text-xl font-body font-semibold text-gray-100">
                            {title}
                        </p>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-200 transition-colors p-1 hover:bg-gray-800 rounded-lg"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* 시간 범위 선택 */}
                    <div className="px-6 py-4 border-b border-gray-800 bg-gray-850">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">
                                Time Range:
                            </span>
                            <div className="flex space-x-2">
                                {([7, 14, 30] as TimeRange[]).map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={cn(
                                            "px-3 py-1.5 text-sm rounded-lg transition-all",
                                            timeRange === range
                                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                        )}
                                    >
                                        {range} days
                                    </button>
                                ))}
                            </div>

                            {chartData.length > 0 && (
                                <div className="ml-auto text-xs text-gray-500">
                                    {chartData.length} data points
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 차트 영역 */}
                    <div className="p-6 bg-gray-925 overflow-y-auto max-h-[60vh]">
                        {renderChart()}
                    </div>
                </div>
            </div>
        </>
    );
}

// Legend 아이템 컴포넌트
function LegendItem({
    color,
    label,
    value,
}: {
    color: string;
    label: string;
    value: number;
}) {
    return (
        <div className="flex items-center space-x-2 p-2 bg-gray-800/50 rounded-lg">
            <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
            />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 truncate">{label}</p>
                <p className="text-sm font-medium text-gray-200">
                    {formatNumber(value)}
                </p>
            </div>
        </div>
    );
}
