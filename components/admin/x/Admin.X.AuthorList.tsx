/// components/admin/x/Admin.X.AuthorList.tsx

"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils/tailwind";
import { formatNumber } from "@/lib/utils/format";
import type { SortOption } from "./Admin.X.Dashboard";
import type { Author } from "@/app/actions/x/actions";

interface AdminXAuthorListProps {
    authors: Author[];
    selectedAuthorId: string | null;
    searchQuery: string;
    sortBy: SortOption;
    onSearchChange: (query: string) => void;
    onSortChange: (sort: SortOption) => void;
    onAuthorSelect: (authorId: string) => void;
}

export default function AdminXAuthorList({
    authors,
    selectedAuthorId,
    searchQuery,
    sortBy,
    onSearchChange,
    onSortChange,
    onAuthorSelect,
}: AdminXAuthorListProps) {
    // 검색 및 정렬 로직
    const filteredAndSortedAuthors = useMemo(() => {
        if (!authors) return [];

        let filtered = authors;

        // 검색 필터링
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            const searchTerms = query
                .split(/\s+/)
                .filter((term) => term.length > 0);

            filtered = filtered.filter((author) => {
                const name = author.name || "";
                const username = author.username || "";

                const searchableTexts = [
                    name.toLowerCase().replace(/\s+/g, ""),
                    username.toLowerCase().replace(/\s+/g, ""),
                    name.toLowerCase(),
                    username.toLowerCase(),
                ];

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
    }, [authors, searchQuery, sortBy]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            onSearchChange("");
        }
    };

    const selectFirstResult = () => {
        if (filteredAndSortedAuthors.length > 0) {
            onAuthorSelect(filteredAndSortedAuthors[0].authorId);
        }
    };

    // Helper function to calculate total rewards
    const getTotalRewards = (author: Author) => {
        return author.rewardsLogs
            .filter((log) => log.reason === "GLOWING Rewards")
            .reduce((sum, log) => sum + log.amount, 0);
    };

    return (
        <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
            {/* 검색 및 정렬 영역 */}
            <div className="p-4 border-b border-gray-800">
                {/* 검색 입력 */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search authors... (ESC to clear)"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
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
                            onSortChange(e.target.value as SortOption)
                        }
                        className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-100 focus:outline-none focus:border-blue-500"
                    >
                        <option value="tweets">By Tweets</option>
                        <option value="name">By Name</option>
                        <option value="recent">By Recent</option>
                    </select>

                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange("")}
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
                            : `${authors?.length || 0} total`}
                    </span>
                    {searchQuery && filteredAndSortedAuthors.length > 0 && (
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
                    filteredAndSortedAuthors.map((author) => {
                        const latestMetrics = author.metrics?.[0];
                        const totalRewards = getTotalRewards(author);
                        const hasRewards = totalRewards > 0;

                        return (
                            <div
                                key={author.id}
                                onClick={() => onAuthorSelect(author.authorId)}
                                className={cn(
                                    "p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800/50 transition-all",
                                    selectedAuthorId === author.authorId &&
                                        "bg-gray-800 border-l-2 border-l-blue-500"
                                )}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="relative flex flex-col items-center justify-center gap-1">
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
                                                ).src = "/default-avatar.jpg";
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

                                        <span
                                            className={cn(
                                                "text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full",
                                                hasRewards
                                                    ? "bg-purple-500/20 text-purple-100"
                                                    : "bg-gray-500/20 text-gray-400"
                                            )}
                                        >
                                            {hasRewards
                                                ? formatNumber(totalRewards)
                                                : "0"}
                                            GLOW
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-gray-100 truncate">
                                                {author.name || "Unknown"}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-400 truncate">
                                            @{author.username || "unknown"}
                                        </p>
                                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                                            <span className="text-blue-400 flex-shrink-0">
                                                {author.tweets?.length || 0}{" "}
                                                tweets
                                            </span>
                                            {latestMetrics && (
                                                <>
                                                    <span className="text-gray-600">
                                                        •
                                                    </span>
                                                    <span className="flex-shrink-0">
                                                        {formatNumber(
                                                            latestMetrics.followersCount
                                                        )}{" "}
                                                        followers
                                                    </span>
                                                </>
                                            )}
                                            {author.player && (
                                                <>
                                                    <span className="text-gray-600">
                                                        •
                                                    </span>
                                                    <span className="text-green-400 text-xs flex-shrink-0">
                                                        ✓ Connected
                                                    </span>
                                                </>
                                            )}
                                            {hasRewards && (
                                                <>
                                                    <span className="text-gray-600">
                                                        •
                                                    </span>
                                                    <span className="text-purple-400 text-xs flex-shrink-0">
                                                        {
                                                            author.rewardsLogs.filter(
                                                                (log) =>
                                                                    log.reason ===
                                                                    "GLOWING Rewards"
                                                            ).length
                                                        }{" "}
                                                        rewards
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
                        <div className="text-gray-600 text-4xl mb-3">👥</div>
                        <p className="text-sm text-gray-400">
                            No authors available
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
