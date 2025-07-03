"use client";

import { Search, Filter, Grid, List, X } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import type { FileFiltersProps } from "./types";

export default function FileFilters({
    search,
    fileType,
    purpose,
    bucket,
    sortBy,
    sortOrder,
    viewMode,
    onSearchChange,
    onFileTypeChange,
    onPurposeChange,
    onBucketChange,
    onSortByChange,
    onSortOrderChange,
    onViewModeChange,
    onResetFilters,
}: FileFiltersProps) {
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* 검색 */}
                <div className="relative xl:col-span-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className={cn(
                            "w-full pl-10 pr-4 py-2 rounded-lg",
                            "bg-gray-700/50 border border-gray-600",
                            "text-white placeholder-gray-400",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            getResponsiveClass(14).textClass
                        )}
                    />
                </div>

                {/* 파일 타입 */}
                <select
                    value={fileType}
                    onChange={(e) => onFileTypeChange(e.target.value)}
                    className={cn(
                        "px-3 py-2 rounded-lg",
                        "bg-gray-700/50 border border-gray-600",
                        "text-white",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500",
                        getResponsiveClass(14).textClass
                    )}
                >
                    <option value="">All Types</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="audio">Audio</option>
                    <option value="application">Documents</option>
                </select>

                {/* Purpose */}
                <input
                    type="text"
                    placeholder="Purpose"
                    value={purpose}
                    onChange={(e) => onPurposeChange(e.target.value)}
                    className={cn(
                        "px-3 py-2 rounded-lg",
                        "bg-gray-700/50 border border-gray-600",
                        "text-white placeholder-gray-400",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500",
                        getResponsiveClass(14).textClass
                    )}
                />

                {/* Bucket */}
                <input
                    type="text"
                    placeholder="Bucket"
                    value={bucket}
                    onChange={(e) => onBucketChange(e.target.value)}
                    className={cn(
                        "px-3 py-2 rounded-lg",
                        "bg-gray-700/50 border border-gray-600",
                        "text-white placeholder-gray-400",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500",
                        getResponsiveClass(14).textClass
                    )}
                />

                {/* 정렬 */}
                <div className="flex gap-2">
                    <select
                        value={sortBy}
                        onChange={(e) => onSortByChange(e.target.value as any)}
                        className={cn(
                            "flex-1 px-3 py-2 rounded-lg",
                            "bg-gray-700/50 border border-gray-600",
                            "text-white",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500",
                            getResponsiveClass(14).textClass
                        )}
                    >
                        <option value="createdAt">Date</option>
                        <option value="name">Name</option>
                        <option value="size">Size</option>
                        <option value="type">Type</option>
                    </select>

                    <button
                        onClick={() =>
                            onSortOrderChange(
                                sortOrder === "asc" ? "desc" : "asc"
                            )
                        }
                        className={cn(
                            "px-3 py-2 rounded-lg",
                            "bg-gray-700/50 border border-gray-600",
                            "text-white hover:bg-gray-600/50",
                            "transition-colors duration-200"
                        )}
                    >
                        {sortOrder === "asc" ? "↑" : "↓"}
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                {/* 필터 초기화 */}
                <button
                    onClick={onResetFilters}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                        "text-gray-400 hover:text-white hover:bg-gray-700/50",
                        "transition-colors duration-200",
                        getResponsiveClass(13).textClass
                    )}
                >
                    <X className="w-4 h-4" />
                    Reset Filters
                </button>

                {/* 뷰 모드 */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onViewModeChange("grid")}
                        className={cn(
                            "p-2 rounded-lg transition-colors duration-200",
                            viewMode === "grid"
                                ? "bg-blue-600 text-white"
                                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                        )}
                    >
                        <Grid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onViewModeChange("list")}
                        className={cn(
                            "p-2 rounded-lg transition-colors duration-200",
                            viewMode === "list"
                                ? "bg-blue-600 text-white"
                                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                        )}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
