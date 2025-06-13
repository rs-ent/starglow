/// components/admin/x/Admin.X.Tweets.tsx

"use client";

import { useTweets } from "@/app/actions/x/hooks";
import type { Author } from "@/app/actions/x/actions";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils/tailwind";

type SortOption = "name" | "tweets" | "recent";

export default function AdminXTweets() {
    const {
        latestSyncData,
        isLatestSyncDataLoading,
        latestSyncDataError,
        refetchLatestSyncData,

        tweetAuthors,
        isTweetAuthorsLoading,
        tweetAuthorsError,
        refetchTweetAuthors,
    } = useTweets();

    const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(
        null
    );
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
        ? tweetAuthors?.find((author) => author.id === selectedAuthorId)
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
            setSelectedAuthorId(filteredAndSortedAuthors[0].id);
        }
    }, [filteredAndSortedAuthors]);

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

    return (
        <div className="flex h-screen bg-[rgba(255,255,255,0.1)]">
            <div className="w-80 bg-[rgba(255,255,255,0.05)] border-r border-[rgba(255,255,255,0.05)] flex flex-col">
                {/* 검색 및 정렬 영역 */}
                <div className="p-4 border-b border-[rgba(255,255,255,0.1)]">
                    {/* 검색 입력 */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search authors... (ESC to clear)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded-lg px-3 py-2 pl-9 text-sm text-[rgba(255,255,255,0.9)] placeholder-[rgba(255,255,255,0.5)] focus:outline-none focus:border-[rgba(255,255,255,0.4)] focus:bg-[rgba(255,255,255,0.15)]"
                        />
                        <div className="absolute left-3 top-2.5">
                            <svg
                                className="w-4 h-4 text-[rgba(255,255,255,0.5)]"
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
                            className="text-xs bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] rounded px-2 py-1 text-[rgba(255,255,255,0.9)] focus:outline-none focus:border-[rgba(255,255,255,0.4)]"
                        >
                            <option value="tweets">By Tweets</option>
                            <option value="name">By Name</option>
                            <option value="recent">By Recent</option>
                        </select>

                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="text-xs text-[rgba(255,255,255,0.7)] hover:text-[rgba(255,255,255,0.9)] underline"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* 통계 정보 */}
                    <div className="mt-3 flex justify-between text-xs text-[rgba(255,255,255,0.5)]">
                        <span>
                            {searchQuery
                                ? `${filteredAndSortedAuthors.length} found`
                                : `${tweetAuthors?.length || 0} total`}
                        </span>
                        {searchQuery && filteredAndSortedAuthors.length > 0 && (
                            <button
                                onClick={selectFirstResult}
                                className="text-[rgba(255,255,255,0.7)] hover:text-[rgba(255,255,255,0.9)] underline"
                            >
                                Select first
                            </button>
                        )}
                    </div>
                </div>

                {/* Authors 목록 */}
                <div className="flex-1 overflow-y-auto">
                    {filteredAndSortedAuthors.length > 0 ? (
                        filteredAndSortedAuthors.map((author, index) => (
                            <div
                                key={author.id}
                                onClick={() => setSelectedAuthorId(author.id)}
                                className={cn(
                                    "p-4 border-b border-[rgba(255,255,255,0.1)] cursor-pointer hover:bg-[rgba(255,255,255,0.1)] transition-colors",
                                    selectedAuthorId === author.id &&
                                        "bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.5)]"
                                )}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <img
                                            src={
                                                author.profileImageUrl ||
                                                "/default-avatar.png"
                                            }
                                            alt=""
                                            className="w-10 h-10 rounded-full"
                                            onError={(e) => {
                                                (
                                                    e.target as HTMLImageElement
                                                ).src = "/default-avatar.png";
                                            }}
                                        />
                                        {/* 순위 표시 (검색 시에만) */}
                                        {searchQuery && index < 3 && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[rgba(255,255,255,0.2)] rounded-full flex items-center justify-center text-xs text-[rgba(255,255,255,0.9)]">
                                                {index + 1}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[rgba(255,255,255,0.9)] truncate">
                                            {searchQuery ? (
                                                <HighlightText
                                                    text={
                                                        author.name || "Unknown"
                                                    }
                                                    query={searchQuery}
                                                />
                                            ) : (
                                                author.name || "Unknown"
                                            )}
                                        </p>
                                        <p className="text-xs text-[rgba(255,255,255,0.5)] truncate">
                                            @
                                            {searchQuery ? (
                                                <HighlightText
                                                    text={
                                                        author.username ||
                                                        "unknown"
                                                    }
                                                    query={searchQuery}
                                                />
                                            ) : (
                                                author.username || "unknown"
                                            )}
                                        </p>
                                        <div className="flex items-center space-x-2 text-xs text-[rgba(255,255,255,0.5)]">
                                            <span>
                                                {author.tweets?.length || 0}{" "}
                                                tweets
                                            </span>
                                            {sortBy === "recent" &&
                                                author.tweets?.[0] && (
                                                    <span>
                                                        •{" "}
                                                        {getRelativeTime(
                                                            author.tweets[0].createdAt.toLocaleString()
                                                        )}
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : searchQuery ? (
                        /* 검색 결과 없음 */
                        <div className="p-8 text-center">
                            <div className="text-[rgba(255,255,255,0.3)] text-4xl mb-3">
                                🔍
                            </div>
                            <p className="text-sm text-[rgba(255,255,255,0.6)]">
                                No authors found for "{searchQuery}"
                            </p>
                            <div className="mt-3 text-xs text-[rgba(255,255,255,0.4)] space-y-1">
                                <p>• Try shorter keywords</p>
                                <p>• Check spelling</p>
                                <p>• Use partial names</p>
                            </div>
                            <button
                                onClick={() => setSearchQuery("")}
                                className="mt-3 text-xs text-[rgba(255,255,255,0.7)] hover:text-[rgba(255,255,255,0.9)] underline"
                            >
                                Clear search
                            </button>
                        </div>
                    ) : (
                        /* 데이터 없음 */
                        <div className="p-8 text-center">
                            <div className="text-[rgba(255,255,255,0.3)] text-4xl mb-3">
                                👥
                            </div>
                            <p className="text-sm text-[rgba(255,255,255,0.6)]">
                                No authors available
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* 메인 패널 - Selected Author's Tweets */}
            <div className="flex-1 flex flex-col">
                {selectedAuthor ? (
                    <>
                        {/* 헤더 */}
                        <div className="bg-[rgba(255,255,255,0.04)] p-6 border-b border-[rgba(255,255,255,0.05)]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <img
                                        src={
                                            selectedAuthor.profileImageUrl ||
                                            "/default-avatar.png"
                                        }
                                        alt=""
                                        className="w-12 h-12 rounded-full"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                                "/default-avatar.png";
                                        }}
                                    />
                                    <div>
                                        <h2 className="text-xl font-semibold text-[rgba(255,255,255,0.9)]">
                                            {selectedAuthor.name || "Unknown"}
                                        </h2>
                                        <p className="text-[rgba(255,255,255,0.5)]">
                                            @
                                            {selectedAuthor.username ||
                                                "unknown"}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            {selectedAuthor.tweets?.length || 0}{" "}
                                            tweets
                                        </p>
                                    </div>
                                </div>

                                {/* 뒤로가기 버튼 */}
                                <button
                                    onClick={() => setSelectedAuthorId(null)}
                                    className="px-3 py-1 text-xs bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.7)] rounded hover:bg-[rgba(255,255,255,0.2)] hover:text-[rgba(255,255,255,0.9)] transition-colors"
                                >
                                    ← Back
                                </button>
                            </div>
                        </div>

                        {/* 트윗 리스트 */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-4">
                                {selectedAuthor.tweets?.length ? (
                                    selectedAuthor.tweets.map((tweet) => (
                                        <div
                                            key={tweet.id}
                                            className="bg-[rgba(255,255,255,0.8)] rounded-lg p-4 hover:bg-[rgba(255,255,255,1.0)] transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-xs text-[rgba(0,0,0,0.4)]">
                                                    {new Date(
                                                        tweet.createdAt
                                                    ).toLocaleString()}
                                                </p>
                                                <span className="text-xs bg-[rgba(255,255,255,0.1)] text-[rgba(0,0,0,0.2)] px-2 py-1 rounded">
                                                    ID: {tweet.tweetId}
                                                </span>
                                            </div>
                                            <p className="text-[rgba(0,0,0,0.9)] whitespace-pre-wrap">
                                                {tweet.text}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-[rgba(255,255,255,0.3)] text-4xl mb-3">
                                            📝
                                        </div>
                                        <p className="text-[rgba(255,255,255,0.6)]">
                                            No tweets found
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-[rgba(255,255,255,0.05)]">
                        <div className="text-center space-y-4 flex flex-col items-center">
                            <div className="flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.9)] p-4 w-40 h-40">
                                <div className="text-[rgba(255,255,255,0.5)] text-6xl">
                                    👤
                                </div>
                            </div>
                            <h2 className="text-xl font-medium text-[rgba(255,255,255,0.9)] mb-2">
                                계정을 선택하세요
                            </h2>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// 개선된 검색어 하이라이트 컴포넌트
function HighlightText({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <>{text}</>;

    const searchTerms = query
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter((term) => term.length > 0);

    // 더 효율적인 하이라이트 로직
    let result = text;
    searchTerms.forEach((term) => {
        const regex = new RegExp(`(${escapeRegExp(term)})`, "gi");
        result = result.replace(
            regex,
            "___HIGHLIGHT_START___$1___HIGHLIGHT_END___"
        );
    });

    const parts = result.split(/(___HIGHLIGHT_START___.*?___HIGHLIGHT_END___)/);

    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith("___HIGHLIGHT_START___")) {
                    const content = part.replace(
                        /___HIGHLIGHT_START___|___HIGHLIGHT_END___/g,
                        ""
                    );
                    return (
                        <span
                            key={index}
                            className="bg-[rgba(255,255,255,0.3)] text-[rgba(255,255,255,1)] px-1 rounded"
                        >
                            {content}
                        </span>
                    );
                }
                return part;
            })}
        </>
    );
}

// 유틸리티 함수들
function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
}
