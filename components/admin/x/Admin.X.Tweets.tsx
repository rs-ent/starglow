/// components/admin/x/Admin.X.Tweets.tsx

"use client";

import { useState, useMemo, useCallback } from "react";
import { useTweets } from "@/app/actions/x/hooks";

import AdminXChartModal from "./Admin.X.ChartModal";
import AdminXRewardModal from "./Admin.X.RewardModal";
import AdminXAuthorList from "./Admin.X.AuthorList";
import AdminXTweetList from "./Admin.X.TweetList";

// Dashboard에서 타입 import
import type { SortOption, SelectedTweetInfo } from "./Admin.X.Dashboard";
import type { Author } from "@/app/actions/x/actions";

export default function AdminXTweets() {
    const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(
        null
    );
    const [selectedTweetId, setSelectedTweetId] = useState<string | null>(null);
    const [selectedTweetIds, setSelectedTweetIds] = useState<Set<string>>(
        new Set()
    );
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("tweets");
    const [showMetricsModal, setShowMetricsModal] = useState(false);
    const [metricsModalType, setMetricsModalType] = useState<
        "author" | "tweet"
    >("author");

    const {
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

    // selectedAuthor를 먼저 정의
    const selectedAuthor = useMemo(() => {
        if (!selectedAuthorId || !tweetAuthors) return null;
        return tweetAuthors.find(
            (author) => author.authorId === selectedAuthorId
        ) as Author | undefined;
    }, [selectedAuthorId, tweetAuthors]);

    // 선택된 트윗 정보 가져오기
    const selectedTweetsInfo = useMemo((): SelectedTweetInfo[] => {
        if (!selectedAuthor) return [];

        return selectedAuthor.tweets
            .filter((tweet) => selectedTweetIds.has(tweet.tweetId))
            .map((tweet) => ({
                tweetId: tweet.tweetId,
                authorId: selectedAuthor.authorId,
                authorName:
                    selectedAuthor.name || selectedAuthor.username || "Unknown",
                text: tweet.text,
            }));
    }, [selectedAuthor, selectedTweetIds]);

    // 트윗 선택/해제 함수
    const toggleTweetSelection = useCallback((tweetId: string) => {
        setSelectedTweetIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(tweetId)) {
                newSet.delete(tweetId);
            } else {
                newSet.add(tweetId);
            }
            return newSet;
        });
    }, []);

    // 전체 선택/해제
    const toggleAllTweets = useCallback(() => {
        if (!selectedAuthor) return;

        const allTweetIds = selectedAuthor.tweets.map((t) => t.tweetId);
        const allSelected = allTweetIds.every((id) => selectedTweetIds.has(id));

        if (allSelected) {
            setSelectedTweetIds(new Set());
        } else {
            setSelectedTweetIds(new Set(allTweetIds));
        }
    }, [selectedAuthor, selectedTweetIds]);

    // Author 변경 시 선택 초기화
    const handleAuthorChange = useCallback((authorId: string) => {
        setSelectedAuthorId(authorId);
        setSelectedTweetIds(new Set());
    }, []);

    // 차트 클릭 핸들러
    const handleChartClick = useCallback(
        async (type: "author" | "tweet", targetId: string) => {
            if (type === "author") {
                setSelectedAuthorId(targetId);
                await refetchAuthorMetricsHistory();
                setShowMetricsModal(true);
                setMetricsModalType("author");
            } else if (type === "tweet") {
                setSelectedTweetId(targetId);
                await refetchTweetMetricsHistory();
                setShowMetricsModal(true);
                setMetricsModalType("tweet");
            }
        },
        [refetchAuthorMetricsHistory, refetchTweetMetricsHistory]
    );

    // 모달 제목 생성 함수
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

    // 로딩 상태
    if (isTweetAuthorsLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-white mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading authors...</p>
                </div>
            </div>
        );
    }

    // 에러 상태
    if (tweetAuthorsError) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-950">
                <div className="text-center">
                    <div className="text-red-400 text-4xl mb-4">⚠️</div>
                    <p className="text-red-400 mb-4">Error loading authors</p>
                    <button
                        onClick={() => refetchTweetAuthors()}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex h-screen bg-gray-950">
                <AdminXAuthorList
                    authors={(tweetAuthors || []) as Author[]}
                    selectedAuthorId={selectedAuthorId}
                    searchQuery={searchQuery}
                    sortBy={sortBy}
                    onSearchChange={setSearchQuery}
                    onSortChange={setSortBy}
                    onAuthorSelect={handleAuthorChange}
                />

                <AdminXTweetList
                    author={selectedAuthor || null}
                    selectedTweetIds={selectedTweetIds}
                    onTweetSelect={toggleTweetSelection}
                    onSelectAll={toggleAllTweets}
                    onChartClick={handleChartClick}
                    onRewardClick={() => setShowRewardModal(true)}
                    onBack={() => {
                        setSelectedAuthorId(null);
                        setSelectedTweetIds(new Set());
                    }}
                />
            </div>

            {/* 차트 모달 */}
            <AdminXChartModal
                isOpen={showMetricsModal}
                onClose={() => setShowMetricsModal(false)}
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

            {/* 리워드 모달 */}
            <AdminXRewardModal
                isOpen={showRewardModal}
                onClose={() => {
                    setShowRewardModal(false);
                    setSelectedTweetIds(new Set());
                }}
                selectedTweets={selectedTweetsInfo}
                selectedAuthor={
                    selectedAuthor
                        ? {
                              id: selectedAuthor.id,
                              authorId: selectedAuthor.authorId,
                              name: selectedAuthor.name || "",
                              username: selectedAuthor.username || "",
                              profileImageUrl:
                                  selectedAuthor.profileImageUrl || undefined,
                              playerId: selectedAuthor.player?.id,
                          }
                        : null
                }
            />
        </>
    );
}
