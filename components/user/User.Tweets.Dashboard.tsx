// components/user/User.Tweets.Dashboard.tsx

"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    TrendingUp,
    Gift,
    RefreshCcw,
    Search,
    Zap,
    BarChart3,
} from "lucide-react";

import { useTweets } from "@/app/actions/x/hooks";
import { useToast } from "@/app/hooks/useToast";
import { formatNumber } from "@/lib/utils/format";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import type { Player } from "@prisma/client";
import type { Author } from "@/app/actions/x/actions";

interface UserTweetsDashboardProps {
    player: Player;
    setShowTutorial: (show: boolean) => void;
}

type TimeFilter = "all" | "week" | "month";
type SortOption = "recent" | "popular" | "rewarded";

export default function UserTweetsDashboard({
    player,
    setShowTutorial,
}: UserTweetsDashboardProps) {
    const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
    const [sortBy, setSortBy] = useState<SortOption>("recent");
    const [searchQuery, setSearchQuery] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const toast = useToast();
    const {
        disconnectXAccountAsync,
        authorByPlayerId,
        isAuthorByPlayerIdLoading,
        refetchAuthorByPlayerId,
    } = useTweets({
        getAuthorByPlayerIdInput: {
            playerId: player.id,
        },
    });

    // Calculate statistics
    const stats = useMemo(() => {
        if (!authorByPlayerId) {
            return {
                totalGlows: 0,
                totalRewards: 0,
                totalEngagement: 0,
                glowsThisWeek: 0,
            };
        }

        const author = authorByPlayerId as Author;

        const totalRewards = author.rewardsLogs
            .filter((log) => log.reason === "GLOWING Rewards")
            .reduce((sum, log) => sum + log.amount, 0);

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const glowsThisWeek = author.tweets.filter(
            (tweet) => new Date(tweet.createdAt) >= weekAgo
        ).length;

        const totalEngagement = author.tweets.reduce((sum, tweet) => {
            const metrics = tweet.metricsHistory[0];
            return (
                sum +
                (metrics
                    ? metrics.likeCount +
                      metrics.retweetCount +
                      metrics.replyCount +
                      metrics.quoteCount
                    : 0)
            );
        }, 0);

        return {
            totalGlows: author.tweets.length,
            totalRewards,
            totalEngagement,
            glowsThisWeek,
        };
    }, [authorByPlayerId]);

    // Filter and sort tweets
    const filteredTweets = useMemo(() => {
        if (!authorByPlayerId) return [];

        const author = authorByPlayerId as Author;
        let tweets = [...author.tweets];

        // Time filter
        if (timeFilter !== "all") {
            const days = timeFilter === "week" ? 7 : 30;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            tweets = tweets.filter(
                (tweet) => new Date(tweet.createdAt) >= cutoffDate
            );
        }

        // Search filter
        if (searchQuery) {
            tweets = tweets.filter((tweet) =>
                tweet.text.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sort
        tweets.sort((a, b) => {
            switch (sortBy) {
                case "recent":
                    return (
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    );
                case "popular":
                    const aMetrics = a.metricsHistory[0];
                    const bMetrics = b.metricsHistory[0];
                    const aEngagement = aMetrics
                        ? aMetrics.likeCount + aMetrics.retweetCount
                        : 0;
                    const bEngagement = bMetrics
                        ? bMetrics.likeCount + bMetrics.retweetCount
                        : 0;
                    return bEngagement - aEngagement;
                case "rewarded":
                    const aRewards = author.rewardsLogs
                        .filter((log) => log.tweetIds.includes(a.tweetId))
                        .reduce((sum, log) => sum + log.amount, 0);
                    const bRewards = author.rewardsLogs
                        .filter((log) => log.tweetIds.includes(b.tweetId))
                        .reduce((sum, log) => sum + log.amount, 0);
                    return bRewards - aRewards;
                default:
                    return 0;
            }
        });

        return tweets;
    }, [authorByPlayerId, timeFilter, sortBy, searchQuery]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refetchAuthorByPlayerId();
            toast.success("Dashboard refreshed!");
        } catch (error) {
            console.error("Failed to refresh dashboard", error);
            toast.error("Failed to refresh dashboard");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDisconnectXAccount = async () => {
        const result = await disconnectXAccountAsync({ playerId: player.id });
        if (result.success) {
            toast.success("X account disconnected successfully");
        } else {
            toast.error(result.message || "Failed to disconnect X account");
        }
    };

    if (isAuthorByPlayerIdLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                >
                    <RefreshCcw className="w-8 h-8 text-purple-400" />
                </motion.div>
            </div>
        );
    }

    const author = authorByPlayerId as Author | null;

    return (
        <div
            className={cn(
                "flex flex-col w-full max-w-[1200px] mx-auto mb-[100px]",
                getResponsiveClass(20).paddingClass
            )}
        >
            {/* Header with Stats */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20",
                    "backdrop-blur-lg border border-purple-500/30",
                    "rounded-2xl p-6 mb-6 shadow-2xl"
                )}
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                        >
                            <Sparkles className="w-8 h-8 text-purple-400" />
                        </motion.div>
                        <h1
                            className={cn(
                                "font-bold text-transparent bg-clip-text",
                                "bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400",
                                getResponsiveClass(30).textClass
                            )}
                        >
                            MY GLOWs
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className={cn(
                                "p-2 bg-purple-500/20 rounded-lg",
                                "hover:bg-purple-500/30 transition-all",
                                "disabled:opacity-50"
                            )}
                        >
                            <RefreshCcw
                                className={cn(
                                    "w-5 h-5 text-purple-400",
                                    isRefreshing && "animate-spin"
                                )}
                            />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowTutorial(true)}
                            className={cn(
                                "p-2 bg-blue-500/20 rounded-lg",
                                "hover:bg-blue-500/30 transition-all"
                            )}
                        >
                            <BarChart3 className="w-5 h-5 text-blue-400" />
                        </motion.button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={cn(
                            "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
                            "border border-purple-500/20 rounded-xl p-4"
                        )}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <img
                                src="/icons/providers/x.svg"
                                alt="x"
                                className="w-4 h-4 object-contain"
                            />
                            <p className="text-xs text-purple-300">
                                Total GLOWs
                            </p>
                        </div>
                        <p
                            className={cn(
                                "font-bold text-white",
                                getResponsiveClass(25).textClass
                            )}
                        >
                            {formatNumber(stats.totalGlows)}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={cn(
                            "bg-gradient-to-br from-green-500/10 to-emerald-500/10",
                            "border border-green-500/20 rounded-xl p-4"
                        )}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Gift className="w-4 h-4 text-green-300" />
                            <p className="text-xs text-green-300">
                                Total Rewards
                            </p>
                        </div>
                        <p
                            className={cn(
                                "font-bold text-white",
                                getResponsiveClass(25).textClass
                            )}
                        >
                            {formatNumber(stats.totalRewards)} SGP
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={cn(
                            "bg-gradient-to-br from-blue-500/10 to-cyan-500/10",
                            "border border-blue-500/20 rounded-xl p-4"
                        )}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-blue-300" />
                            <p className="text-xs text-blue-300">Engagement</p>
                        </div>
                        <p
                            className={cn(
                                "font-bold text-white",
                                getResponsiveClass(25).textClass
                            )}
                        >
                            {formatNumber(stats.totalEngagement)}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className={cn(
                            "bg-gradient-to-br from-yellow-500/10 to-orange-500/10",
                            "border border-yellow-500/20 rounded-xl p-4"
                        )}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-4 h-4 text-yellow-300" />
                            <p className="text-xs text-yellow-300">This Week</p>
                        </div>
                        <p
                            className={cn(
                                "font-bold text-white",
                                getResponsiveClass(25).textClass
                            )}
                        >
                            {stats.glowsThisWeek} GLOWs
                        </p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Filters and Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={cn(
                    "bg-gradient-to-br from-gray-900/50 to-gray-800/50",
                    "backdrop-blur-lg border border-gray-700/50",
                    "rounded-xl p-4 mb-6 shadow-xl"
                )}
            >
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search your GLOWs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                "w-full bg-gray-800/50 border border-gray-700",
                                "rounded-lg px-10 py-2 text-white",
                                "placeholder-gray-500 focus:outline-none",
                                "focus:border-purple-500 transition-all"
                            )}
                        />
                    </div>

                    {/* Time Filter */}
                    <div className="flex gap-2">
                        {(["all", "week", "month"] as TimeFilter[]).map(
                            (filter) => (
                                <motion.button
                                    key={filter}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setTimeFilter(filter)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg font-medium transition-all",
                                        timeFilter === filter
                                            ? "bg-purple-500 text-white"
                                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                    )}
                                >
                                    {filter.charAt(0).toUpperCase() +
                                        filter.slice(1)}
                                </motion.button>
                            )
                        )}
                    </div>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) =>
                            setSortBy(e.target.value as SortOption)
                        }
                        className={cn(
                            "bg-gray-800 border border-gray-700 rounded-lg",
                            "px-4 py-2 text-white focus:outline-none",
                            "focus:border-purple-500 transition-all"
                        )}
                    >
                        <option value="recent">Most Recent</option>
                        <option value="popular">Most Popular</option>
                        <option value="rewarded">Most Rewarded</option>
                    </select>
                </div>
            </motion.div>

            {/* Tweets List */}
            <AnimatePresence mode="wait">
                {filteredTweets.length > 0 ? (
                    <motion.div
                        key="tweets"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {filteredTweets.map((tweet, index) => {
                            const metrics = tweet.metricsHistory[0];
                            const tweetRewards =
                                author?.rewardsLogs.filter((log) =>
                                    log.tweetIds.includes(tweet.tweetId)
                                ) || [];
                            const totalRewards = tweetRewards.reduce(
                                (sum, log) => sum + log.amount,
                                0
                            );

                            return (
                                <motion.div
                                    key={tweet.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={cn(
                                        "bg-gradient-to-br from-gray-900/50 to-gray-800/50",
                                        "backdrop-blur-lg border",
                                        totalRewards > 0
                                            ? "border-purple-500/30"
                                            : "border-gray-700/50",
                                        "rounded-xl p-5 shadow-xl hover:shadow-2xl",
                                        "transition-all hover:scale-[1.01]"
                                    )}
                                >
                                    {/* Tweet Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={
                                                    author?.profileImageUrl ||
                                                    "/default-avatar.jpg"
                                                }
                                                alt=""
                                                className="w-10 h-10 rounded-full ring-2 ring-purple-500/30"
                                            />
                                            <div>
                                                <p className="font-medium text-white">
                                                    {author?.name}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(
                                                        tweet.createdAt
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        {totalRewards > 0 && (
                                            <div className="flex items-center gap-1 bg-purple-500/20 px-3 py-1 rounded-full">
                                                <Gift className="w-4 h-4 text-purple-300" />
                                                <span className="text-sm font-medium text-purple-300">
                                                    {formatNumber(totalRewards)}{" "}
                                                    GLOW
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tweet Content */}
                                    <p className="text-gray-200 mb-4 whitespace-pre-wrap">
                                        {tweet.text}
                                    </p>

                                    {/* Tweet Metrics */}
                                    {metrics && (
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <div className="flex items-center gap-1">
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
                                                <span>
                                                    {formatNumber(
                                                        metrics.likeCount
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
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
                                                    {formatNumber(
                                                        metrics.retweetCount
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
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
                                                    {formatNumber(
                                                        metrics.replyCount
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                            "bg-gradient-to-br from-gray-900/50 to-gray-800/50",
                            "backdrop-blur-lg border border-gray-700/50",
                            "rounded-xl p-12 text-center shadow-xl"
                        )}
                    >
                        <div className="text-6xl mb-4">🚀</div>
                        <h3
                            className={cn(
                                "font-bold text-white mb-2",
                                getResponsiveClass(20).textClass
                            )}
                        >
                            No GLOWs Yet!
                        </h3>
                        <p className="text-gray-400">
                            Start posting with @StarglowP to earn rewards
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-8 flex justify-center gap-4"
            >
                <button
                    onClick={() => setShowTutorial(true)}
                    className="text-sm text-gray-400 hover:text-gray-300 underline"
                >
                    View Tutorial Again
                </button>
                <button
                    onClick={handleDisconnectXAccount}
                    className="text-sm text-gray-400 hover:text-gray-300 underline"
                >
                    Disconnect Account
                </button>
            </motion.div>
        </div>
    );
}
