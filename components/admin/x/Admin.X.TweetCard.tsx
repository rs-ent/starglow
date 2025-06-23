/// components/admin/x/Admin.X.TweetCard.tsx

"use client";

import { CheckSquare, Square, Gift } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";
import { formatNumber } from "@/lib/utils/format";
import type { TweetWithMetrics, Author } from "@/app/actions/x/actions";

interface AdminXTweetCardProps {
    tweet: TweetWithMetrics;
    author: Author;
    isSelected: boolean;
    onSelect: () => void;
    onChartClick: () => void;
}

export default function AdminXTweetCard({
    tweet,
    author,
    isSelected,
    onSelect,
    onChartClick,
}: AdminXTweetCardProps) {
    const latestMetrics = tweet.metricsHistory?.[0];
    const hasMedia = tweet.media?.length > 0;

    const tweetRewards = author.rewardsLogs.filter(
        (log) =>
            log.reason === "GLOWING Rewards" &&
            log.tweetIds.includes(tweet.tweetId)
    );

    const totalTweetRewards = tweetRewards.reduce(
        (sum, log) => sum + log.amount,
        0
    );
    const hasRewards = totalTweetRewards > 0;

    return (
        <div
            className={cn(
                "bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-all border relative",
                isSelected
                    ? "border-purple-500 bg-gray-750"
                    : "border-gray-700",
                hasRewards && "border-purple-400/50"
            )}
        >
            {hasRewards && (
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                    <Gift className="w-3 h-3" />
                    <span>{formatNumber(totalTweetRewards)} GLOW</span>
                </div>
            )}

            <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-3">
                    {/* 체크박스 */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect();
                        }}
                        className="mt-1"
                    >
                        {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-purple-500" />
                        ) : (
                            <Square className="w-5 h-5 text-gray-500 hover:text-gray-300" />
                        )}
                    </button>

                    <div className="flex-1">
                        <p className="text-xs text-gray-500">
                            {new Date(tweet.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {hasMedia && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded flex items-center space-x-1">
                            <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>{tweet.media.length}</span>
                        </span>
                    )}
                    <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                        ID: {tweet.tweetId}
                    </span>
                </div>
            </div>

            <p className="text-gray-100 whitespace-pre-wrap mb-3">
                {tweet.text}
            </p>

            {hasRewards && (
                <div className="mb-3 bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                    <p className="text-xs font-medium text-purple-300 mb-2">
                        Rewards History
                    </p>
                    <div className="space-y-1">
                        {tweetRewards.map((reward) => (
                            <div
                                key={reward.id}
                                className="flex items-center justify-between text-xs"
                            >
                                <span className="text-gray-300">
                                    +{formatNumber(reward.amount)} GLOW
                                </span>
                                <span className="text-gray-500">
                                    {new Date(
                                        reward.createdAt
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 미디어 표시 */}
            {hasMedia && (
                <div className="mb-3 grid grid-cols-2 gap-2">
                    {tweet.media.map((media) => (
                        <div
                            key={media.id}
                            className="relative rounded-lg overflow-hidden bg-gray-900"
                        >
                            {media.type === "photo" && media.url && (
                                <img
                                    src={media.url}
                                    alt={media.altText || "Tweet media"}
                                    className="w-full h-48 object-cover"
                                />
                            )}
                            {media.type === "video" && (
                                <div className="w-full h-48 flex items-center justify-center bg-gray-900">
                                    <div className="text-center">
                                        <svg
                                            className="w-12 h-12 text-gray-600 mx-auto mb-2"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <p className="text-xs text-gray-500">
                                            Video
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 메트릭스 표시 및 차트 버튼 */}
            <div className="flex items-center justify-between border-t border-gray-700 pt-3">
                {latestMetrics ? (
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                        {/* Reply */}
                        <div className="flex items-center space-x-1 hover:text-blue-400 transition-colors">
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
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                            <span>
                                {formatNumber(latestMetrics.replyCount)}
                            </span>
                        </div>

                        {/* Retweet */}
                        <div className="flex items-center space-x-1 hover:text-green-400 transition-colors">
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
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            <span>
                                {formatNumber(latestMetrics.retweetCount)}
                            </span>
                        </div>

                        {/* Like */}
                        <div className="flex items-center space-x-1 hover:text-red-400 transition-colors">
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
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                            <span>{formatNumber(latestMetrics.likeCount)}</span>
                        </div>

                        {/* Quote */}
                        <div className="flex items-center space-x-1 hover:text-yellow-400 transition-colors">
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
                                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                />
                            </svg>
                            <span>
                                {formatNumber(latestMetrics.quoteCount)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-gray-500">
                        No metrics available
                    </div>
                )}

                {/* Tweet 차트 버튼 */}
                <button
                    onClick={onChartClick}
                    className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-all group"
                    title="View Tweet Metrics"
                >
                    <img
                        src="/ui/navigation/nav-poll.svg"
                        alt="Metrics"
                        className="w-4 h-4 opacity-60 group-hover:opacity-100"
                    />
                </button>
            </div>
        </div>
    );
}
