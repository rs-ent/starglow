/// components/admin/x/Admin.X.Tweets.tsx

"use client";

import { useTweets } from "@/app/actions/x/hooks";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils/tailwind";
import { formatNumber } from "@/lib/utils/format";
import AdminXChartModal from "./Admin.X.ChartModal";

type SortOption = "name" | "tweets" | "recent";

export default function AdminXTweets() {
    const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(
        null
    );
    const [selectedTweetId, setSelectedTweetId] = useState<string | null>(null);

    const {
        latestSyncData,
        isLatestSyncDataLoading,
        latestSyncDataError,
        refetchLatestSyncData,

        tweetAuthors,
        isTweetAuthorsLoading,
        tweetAuthorsError,
        refetchTweetAuthors,

        tweetMetricsHistory,
        isTweetMetricsHistoryLoading,
        tweetMetricsHistoryError,
        refetchTweetMetricsHistory,

        authorMetricsHistory,
        isAuthorMetricsHistoryLoading,
        authorMetricsHistoryError,
        refetchAuthorMetricsHistory,
    } = useTweets({
        getTweetMetricsHistoryInput: {
            tweetId: selectedTweetId,
        },
        getAuthorMetricsHistoryInput: {
            authorId: selectedAuthorId,
        },
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("tweets");

    // 더 안전하고 개선된 검색 로직
    const filteredAndSortedAuthors = useMemo(() => {
        if (!tweetAuthors) return [];

        let filtered = tweetAuthors;

        // 검색 필터링
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            const searchTerms = query
                .split(/\s+/)
                .filter((term) => term.length > 0);

            filtered = tweetAuthors.filter((author) => {
                // null 안전성 보장
                const name = author.name || "";
                const username = author.username || "";

                // 검색 대상 텍스트들
                const searchableTexts = [
                    name.toLowerCase().replace(/\s+/g, ""),
                    username.toLowerCase().replace(/\s+/g, ""),
                    name.toLowerCase(),
                    username.toLowerCase(),
                ];

                // 모든 검색어가 최소 하나의 텍스트에서 발견되어야 함
                return searchTerms.every((term) =>
                    searchableTexts.some((text) => text.includes(term))
                );
            });
        }

        // 정렬
        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return (a.name || "").localeCompare(b.name || "");
                case "tweets":
                    return (b.tweets?.length || 0) - (a.tweets?.length || 0);
                case "recent":
                    // 최근 트윗 기준 정렬
                    const aLatest = a.tweets?.[0]?.createdAt || "";
                    const bLatest = b.tweets?.[0]?.createdAt || "";
                    return (
                        new Date(bLatest).getTime() -
                        new Date(aLatest).getTime()
                    );
                default:
                    return 0;
            }
        });

        return sorted;
    }, [tweetAuthors, searchQuery, sortBy]);

    const selectedAuthor = selectedAuthorId
        ? tweetAuthors?.find((author) => author.authorId === selectedAuthorId)
        : null;

    // 키보드 네비게이션
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setSearchQuery("");
        }
    }, []);

    // 첫 번째 결과 선택
    const selectFirstResult = useCallback(() => {
        if (filteredAndSortedAuthors.length > 0) {
            setSelectedAuthorId(filteredAndSortedAuthors[0].authorId);
        }
    }, [filteredAndSortedAuthors]);

    // 컴포넌트 내부에 차트 모달 표시 상태 추가
    const [showMetricsModal, setShowMetricsModal] = useState(false);
    const [metricsModalType, setMetricsModalType] = useState<
        "author" | "tweet"
    >("author");

    // 모달 제목 생성 함수 추가
    const getModalTitle = () => {
        if (metricsModalType === "tweet" && selectedTweetId) {
            const tweet = selectedAuthor?.tweets.find(
                (t) => t.tweetId === selectedTweetId
            );
            return `Tweet Metrics: ${tweet?.text?.substring(0, 50)}...`;
        } else if (selectedAuthor) {
            return `Author Metrics: ${
                selectedAuthor.name || selectedAuthor.username || "Unknown"
            }`;
        }
        return "Metrics";
    };

    if (isTweetAuthorsLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[rgba(255,255,255,0.1)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-[rgba(255,255,255,0.3)] border-t-[rgba(255,255,255,0.8)] mx-auto mb-4"></div>
                    <p className="text-[rgba(255,255,255,0.7)]">
                        Loading authors...
                    </p>
                </div>
            </div>
        );
    }

    if (tweetAuthorsError) {
        return (
            <div className="flex items-center justify-center h-screen bg-[rgba(255,255,255,0.1)]">
                <div className="text-center">
                    <div className="text-red-400 text-4xl mb-4">⚠️</div>
                    <p className="text-red-400 mb-4">Error loading authors</p>
                    <button
                        onClick={() => refetchTweetAuthors()}
                        className="px-4 py-2 bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.9)] rounded-lg hover:bg-[rgba(255,255,255,0.2)] transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const handleChartClick = async (
        type: "author" | "tweet",
        targetId: string
    ) => {
        if (type === "author") {
            setSelectedAuthorId(targetId);
            await refetchAuthorMetricsHistory();
            console.log("Author Metrics", authorMetricsHistory);
            setShowMetricsModal(true);
            setMetricsModalType("author");
        } else if (type === "tweet") {
            setSelectedTweetId(targetId);
            await refetchTweetMetricsHistory();
            console.log("Tweet Metrics", tweetMetricsHistory);
            setShowMetricsModal(true);
            setMetricsModalType("tweet");
        }
    };

    return (
        <>
            <div className="flex h-screen bg-gray-950">
                <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
                    {/* 검색 및 정렬 영역 */}
                    <div className="p-4 border-b border-gray-800">
                        {/* 검색 입력 */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search authors... (ESC to clear)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pl-9 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                            <div className="absolute left-3 top-2.5">
                                <svg
                                    className="w-4 h-4 text-gray-400"
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
                            </div>
                        </div>

                        {/* 정렬 옵션 */}
                        <div className="mt-3 flex items-center justify-between">
                            <select
                                value={sortBy}
                                onChange={(e) =>
                                    setSortBy(e.target.value as SortOption)
                                }
                                className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-100 focus:outline-none focus:border-blue-500"
                            >
                                <option value="tweets">By Tweets</option>
                                <option value="name">By Name</option>
                                <option value="recent">By Recent</option>
                            </select>

                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* 통계 정보 */}
                        <div className="mt-3 flex justify-between text-xs text-gray-400">
                            <span>
                                {searchQuery
                                    ? `${filteredAndSortedAuthors.length} found`
                                    : `${tweetAuthors?.length || 0} total`}
                            </span>
                            {searchQuery &&
                                filteredAndSortedAuthors.length > 0 && (
                                    <button
                                        onClick={selectFirstResult}
                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        Select first
                                    </button>
                                )}
                        </div>
                    </div>

                    {/* Authors 목록 */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredAndSortedAuthors.length > 0 ? (
                            filteredAndSortedAuthors.map((author, index) => {
                                const latestMetrics = author.metrics?.[0];

                                return (
                                    <div
                                        key={author.id}
                                        onClick={() =>
                                            setSelectedAuthorId(author.authorId)
                                        }
                                        className={cn(
                                            "p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800/50 transition-all",
                                            selectedAuthorId ===
                                                author.authorId &&
                                                "bg-gray-800 border-l-2 border-l-blue-500"
                                        )}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="relative">
                                                <img
                                                    src={
                                                        author.profileImageUrl ||
                                                        "/default-avatar.jpg"
                                                    }
                                                    alt=""
                                                    className="w-10 h-10 rounded-full ring-2 ring-gray-700"
                                                    onError={(e) => {
                                                        (
                                                            e.target as HTMLImageElement
                                                        ).src =
                                                            "/default-avatar.jpg";
                                                    }}
                                                />
                                                {/* 인증 배지 */}
                                                {latestMetrics?.verified && (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <svg
                                                            className="w-3 h-3 text-white"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-100 truncate">
                                                    {author.name || "Unknown"}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">
                                                    @
                                                    {author.username ||
                                                        "unknown"}
                                                </p>
                                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                    <span className="text-blue-400">
                                                        {author.tweets
                                                            ?.length || 0}{" "}
                                                        tweets
                                                    </span>
                                                    {latestMetrics && (
                                                        <>
                                                            <span className="text-gray-600">
                                                                •
                                                            </span>
                                                            <span>
                                                                {formatNumber(
                                                                    latestMetrics.followersCount
                                                                )}{" "}
                                                                followers
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center">
                                <div className="text-gray-600 text-4xl mb-3">
                                    👥
                                </div>
                                <p className="text-sm text-gray-400">
                                    No authors available
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 메인 패널 - Selected Author's Tweets */}
                <div className="flex-1 flex flex-col bg-gray-925">
                    {selectedAuthor ? (
                        <>
                            {/* 헤더 */}
                            <div className="bg-gray-900 p-6 border-b border-gray-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <img
                                            src={
                                                selectedAuthor.profileImageUrl ||
                                                "/default-avatar.jpg"
                                            }
                                            alt=""
                                            className="w-12 h-12 rounded-full ring-2 ring-gray-700"
                                            onError={(e) => {
                                                (
                                                    e.target as HTMLImageElement
                                                ).src = "/default-avatar.jpg";
                                            }}
                                        />
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-100">
                                                {selectedAuthor.name ||
                                                    "Unknown"}
                                            </h2>
                                            <p className="text-gray-400">
                                                @
                                                {selectedAuthor.username ||
                                                    "unknown"}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {selectedAuthor.tweets
                                                    ?.length || 0}{" "}
                                                tweets
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {/* Author Metrics 버튼 */}
                                        <button
                                            onClick={() =>
                                                handleChartClick(
                                                    "author",
                                                    selectedAuthor.authorId
                                                )
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
                                            onClick={() =>
                                                setSelectedAuthorId(null)
                                            }
                                            className="px-3 py-2 text-xs bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-all"
                                        >
                                            ← Back
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 트윗 리스트 */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-4">
                                    {selectedAuthor.tweets?.length ? (
                                        selectedAuthor.tweets.map((tweet) => {
                                            const latestMetrics =
                                                tweet.metricsHistory?.[0];
                                            const hasMedia =
                                                tweet.media?.length > 0;

                                            return (
                                                <div
                                                    key={tweet.id}
                                                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-all border border-gray-700"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(
                                                                tweet.createdAt
                                                            ).toLocaleString()}
                                                        </p>
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
                                                                    <span>
                                                                        {
                                                                            tweet
                                                                                .media
                                                                                .length
                                                                        }
                                                                    </span>
                                                                </span>
                                                            )}
                                                            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                                                                ID:{" "}
                                                                {tweet.tweetId}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <p className="text-gray-100 whitespace-pre-wrap mb-3">
                                                        {tweet.text}
                                                    </p>

                                                    {/* 미디어 표시 */}
                                                    {hasMedia && (
                                                        <div className="mb-3 grid grid-cols-2 gap-2">
                                                            {tweet.media.map(
                                                                (media) => (
                                                                    <div
                                                                        key={
                                                                            media.id
                                                                        }
                                                                        className="relative rounded-lg overflow-hidden bg-gray-900"
                                                                    >
                                                                        {media.type ===
                                                                            "photo" &&
                                                                            media.url && (
                                                                                <img
                                                                                    src={
                                                                                        media.url
                                                                                    }
                                                                                    alt={
                                                                                        media.altText ||
                                                                                        "Tweet media"
                                                                                    }
                                                                                    className="w-full h-48 object-cover"
                                                                                />
                                                                            )}
                                                                        {media.type ===
                                                                            "video" && (
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
                                                                )
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* 메트릭스 표시 및 차트 버튼 */}
                                                    <div className="flex items-center justify-between border-t border-gray-700 pt-3">
                                                        {latestMetrics ? (
                                                            <div className="flex items-center space-x-4 text-xs text-gray-400">
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
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                                        />
                                                                    </svg>
                                                                    <span>
                                                                        {formatNumber(
                                                                            latestMetrics.replyCount
                                                                        )}
                                                                    </span>
                                                                </div>
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
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                                        />
                                                                    </svg>
                                                                    <span>
                                                                        {formatNumber(
                                                                            latestMetrics.retweetCount
                                                                        )}
                                                                    </span>
                                                                </div>
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
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                                        />
                                                                    </svg>
                                                                    <span>
                                                                        {formatNumber(
                                                                            latestMetrics.likeCount
                                                                        )}
                                                                    </span>
                                                                </div>
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
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                                                        />
                                                                    </svg>
                                                                    <span>
                                                                        {formatNumber(
                                                                            latestMetrics.quoteCount
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-gray-500">
                                                                No metrics
                                                                available
                                                            </div>
                                                        )}

                                                        {/* Tweet 차트 버튼 */}
                                                        <button
                                                            onClick={() =>
                                                                handleChartClick(
                                                                    "tweet",
                                                                    tweet.tweetId
                                                                )
                                                            }
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
                                        })
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="text-gray-600 text-4xl mb-3">
                                                📝
                                            </div>
                                            <p className="text-gray-400">
                                                No tweets found
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                                    <div className="text-gray-600 text-5xl">
                                        👤
                                    </div>
                                </div>
                                <h2 className="text-xl font-medium text-gray-300">
                                    계정을 선택하세요
                                </h2>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 차트 모달 */}
            <AdminXChartModal
                isOpen={showMetricsModal}
                onClose={() => {
                    setShowMetricsModal(false);
                }}
                type={metricsModalType}
                authorMetrics={authorMetricsHistory || []}
                tweetMetrics={tweetMetricsHistory || []}
                title={getModalTitle()}
                isLoading={
                    metricsModalType === "author"
                        ? isAuthorMetricsHistoryLoading
                        : isTweetMetricsHistoryLoading
                }
                error={
                    metricsModalType === "author"
                        ? authorMetricsHistoryError
                        : tweetMetricsHistoryError
                }
            />
        </>
    );
}

// 유틸리티 함수들
function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
