/// components/admin/x/Admin.X.TweetList.tsx

"use client";

import { Gift, CheckSquare, Square, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";
import { formatNumber } from "@/lib/utils/format";
import AdminXTweetCard from "./Admin.X.TweetCard";
import type { Author } from "@/app/actions/x/actions";

interface AdminXTweetListProps {
    author: Author | null;
    selectedTweetIds: Set<string>;
    onTweetSelect: (tweetId: string) => void;
    onSelectAll: () => void;
    onChartClick: (type: "author" | "tweet", targetId: string) => void;
    onRewardClick: () => void;
    onBack: () => void;
}

export default function AdminXTweetList({
    author,
    selectedTweetIds,
    onTweetSelect,
    onSelectAll,
    onChartClick,
    onRewardClick,
    onBack,
}: AdminXTweetListProps) {
    if (!author) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                        <div className="text-gray-600 text-5xl">👤</div>
                    </div>
                    <h2 className="text-xl font-medium text-gray-300">
                        계정을 선택하세요
                    </h2>
                </div>
            </div>
        );
    }

    const allSelected = author.tweets.every((t) =>
        selectedTweetIds.has(t.tweetId)
    );

    // Calculate total rewards
    const totalRewards = author.rewardsLogs
        .filter((log) => log.reason === "GLOWING Rewards")
        .reduce((sum, log) => sum + log.amount, 0);

    const rewardCount = author.rewardsLogs.filter(
        (log) => log.reason === "GLOWING Rewards"
    ).length;

    return (
        <div className="flex-1 flex flex-col bg-gray-925">
            {/* 헤더 */}
            <div className="bg-gray-900 p-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <img
                            src={
                                author.profileImageUrl || "/default-avatar.jpg"
                            }
                            alt=""
                            className="w-12 h-12 rounded-full ring-2 ring-gray-700"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                    "/default-avatar.jpg";
                            }}
                        />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-100">
                                {author.name || "Unknown"}
                            </h2>
                            <p className="text-gray-400">
                                @{author.username || "unknown"}
                            </p>
                            <p className="text-sm text-gray-500">
                                {author.tweets?.length || 0} tweets
                                {author.player && (
                                    <span className="ml-2 text-green-400">
                                        • Player Connected
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* GLOWING Rewards 정보 */}
                        {totalRewards > 0 && (
                            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg px-4 py-2 mr-2">
                                <div className="flex items-center gap-2">
                                    <Gift className="w-4 h-4 text-purple-400" />
                                    <div>
                                        <p className="text-sm font-semibold text-purple-300">
                                            {formatNumber(totalRewards)} GLOW
                                        </p>
                                        <p className="text-xs text-purple-400">
                                            {rewardCount} reward
                                            {rewardCount > 1 ? "s" : ""}{" "}
                                            received
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 선택된 트윗 수 표시 */}
                        {selectedTweetIds.size > 0 && (
                            <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg text-sm">
                                {selectedTweetIds.size} selected
                            </div>
                        )}

                        {/* Reward 버튼 */}
                        <button
                            onClick={onRewardClick}
                            disabled={
                                selectedTweetIds.size === 0 && !author.player
                            }
                            className={cn(
                                "p-2 rounded-lg transition-all group flex items-center gap-2",
                                selectedTweetIds.size > 0 || author.player
                                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                            )}
                            title={
                                !author.player
                                    ? "Author not connected to player account"
                                    : selectedTweetIds.size === 0
                                    ? "Select tweets to reward"
                                    : "Send rewards"
                            }
                        >
                            <Gift className="w-5 h-5" />
                            <span className="text-sm">Reward</span>
                        </button>

                        {/* Author Metrics 버튼 */}
                        <button
                            onClick={() =>
                                onChartClick("author", author.authorId)
                            }
                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all group"
                            title="View Author Metrics"
                        >
                            <img
                                src="/ui/navigation/nav-poll.svg"
                                alt="Metrics"
                                className="w-5 h-5 opacity-70 group-hover:opacity-100"
                            />
                        </button>

                        {/* 뒤로가기 버튼 */}
                        <button
                            onClick={onBack}
                            className="px-3 py-2 text-xs bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-all"
                        >
                            ← Back
                        </button>
                    </div>
                </div>

                {/* Rewards History Timeline (if any) */}
                {author.rewardsLogs.length > 0 && (
                    <div className="mt-4 bg-gray-800/50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Recent GLOWING Rewards
                        </h3>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {author.rewardsLogs
                                .filter(
                                    (log) => log.reason === "GLOWING Rewards"
                                )
                                .slice(0, 5)
                                .map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex items-center justify-between text-xs bg-gray-700/50 rounded px-3 py-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Gift className="w-3 h-3 text-purple-400" />
                                            <span className="text-gray-300">
                                                +{formatNumber(log.amount)} GLOW
                                            </span>
                                            {log.tweetIds.length > 0 && (
                                                <span className="text-gray-500">
                                                    ({log.tweetIds.length} tweet
                                                    {log.tweetIds.length > 1
                                                        ? "s"
                                                        : ""}
                                                    )
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-gray-500">
                                            {new Date(
                                                log.createdAt
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 트윗 리스트 */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* 전체 선택 체크박스 */}
                {author.tweets?.length > 0 && (
                    <div className="mb-4 flex items-center gap-2">
                        <button
                            onClick={onSelectAll}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            {allSelected ? (
                                <CheckSquare className="w-4 h-4" />
                            ) : (
                                <Square className="w-4 h-4" />
                            )}
                            Select All
                        </button>
                    </div>
                )}

                <div className="space-y-4">
                    {author.tweets?.length ? (
                        author.tweets.map((tweet) => (
                            <AdminXTweetCard
                                key={tweet.id}
                                tweet={tweet}
                                author={author}
                                isSelected={selectedTweetIds.has(tweet.tweetId)}
                                onSelect={() => onTweetSelect(tweet.tweetId)}
                                onChartClick={() =>
                                    onChartClick("tweet", tweet.tweetId)
                                }
                            />
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-600 text-4xl mb-3">
                                📝
                            </div>
                            <p className="text-gray-400">No tweets found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
