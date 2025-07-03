"use client";

import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import type { FileSelectionProps } from "./types";

export default function FileSelection({
    selectAll,
    totalFiles,
    activeTab,
    onSelectAll,
}: FileSelectionProps) {
    if (totalFiles === 0) {
        return null;
    }

    const getTabDescription = () => {
        switch (activeTab) {
            case "orphaned_files":
                return "• Files exist in Blob but not in DB";
            case "missing_blobs":
                return "• Files exist in DB but not in Blob";
            case "blob_files":
                return "• All files in Vercel Blob storage";
            case "db_files":
                return "• All files registered in database";
            default:
                return "";
        }
    };

    return (
        <div className="flex items-center gap-3 px-4">
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <span
                    className={cn(
                        "text-gray-300",
                        getResponsiveClass(14).textClass
                    )}
                >
                    Select All ({totalFiles})
                </span>
            </label>

            {/* 탭별 설명 */}
            <div
                className={cn(
                    "text-gray-500",
                    getResponsiveClass(12).textClass
                )}
            >
                {getTabDescription()}
            </div>
        </div>
    );
} 