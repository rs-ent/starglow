"use client";

import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import type { FileTabsProps, FileViewMode } from "./types";

export default function FileTabs({
    activeTab,
    onTabChange,
    comparisonData,
}: FileTabsProps) {
    const tabs: Array<{
        key: FileViewMode;
        label: string;
        count: number;
        highlight?: boolean;
        warning?: boolean;
    }> = [
        {
            key: "db_files",
            label: "DB Files",
            count: comparisonData?.totalDbFiles || 0,
        },
        {
            key: "blob_files",
            label: "Blob Files",
            count: comparisonData?.totalBlobFiles || 0,
        },
        {
            key: "orphaned_files",
            label: "Orphaned Files",
            count: comparisonData?.totalOrphanedFiles || 0,
            highlight: true,
        },
        {
            key: "missing_blobs",
            label: "Missing Blobs",
            count: comparisonData?.missingBlobs?.length || 0,
            warning: true,
        },
    ];

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 border border-gray-700">
            <div className="flex gap-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => onTabChange(tab.key)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200",
                            getResponsiveClass(14).textClass,
                            activeTab === tab.key
                                ? "bg-blue-600 text-white shadow-lg"
                                : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                        )}
                    >
                        <span>{tab.label}</span>
                        <span
                            className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                activeTab === tab.key
                                    ? "bg-blue-500 text-white"
                                    : tab.highlight
                                    ? "bg-orange-500 text-white"
                                    : tab.warning
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-600 text-gray-300"
                            )}
                        >
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
