"use client";

import { Trash2, Download } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import type { FileActionsProps } from "./types";

export default function FileActions({
    activeTab,
    selectedFiles,
    onDeleteSelected,
    onRegisterSelected,
    isDeleting,
    isRegistering,
}: FileActionsProps) {
    if (selectedFiles.size === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-3">
            {/* 고아 파일 등록 버튼 */}
            {activeTab === "orphaned_files" && (
                <button
                    onClick={onRegisterSelected}
                    disabled={isRegistering}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg",
                        "bg-green-600 hover:bg-green-700 text-white",
                        "transition-colors duration-200",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        getResponsiveClass(14).textClass
                    )}
                >
                    <Download className="w-4 h-4" />
                    Register {selectedFiles.size} files
                </button>
            )}

            {/* 선택된 파일 삭제 버튼 */}
            {activeTab !== "missing_blobs" && (
                <button
                    onClick={onDeleteSelected}
                    disabled={isDeleting}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg",
                        "bg-red-600 hover:bg-red-700 text-white",
                        "transition-colors duration-200",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        getResponsiveClass(14).textClass
                    )}
                >
                    <Trash2 className="w-4 h-4" />
                    Delete {selectedFiles.size} files
                </button>
            )}
        </div>
    );
}
