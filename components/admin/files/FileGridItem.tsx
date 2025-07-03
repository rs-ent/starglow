"use client";

import Image from "next/image";
import { format } from "date-fns";
import { Eye, Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { formatFileSize, getFileTypeIcon } from "./utils";
import type { FileGridItemProps } from "./types";

export default function FileGridItem({
    file,
    isSelected,
    onSelect,
    onPreview,
    onDownload,
    onDelete,
    isImage,
}: FileGridItemProps) {
    return (
        <div
            className={cn(
                "relative group bg-gray-800/50 backdrop-blur-sm rounded-xl p-3",
                "border border-gray-700 hover:border-gray-600",
                "transition-all duration-200",
                isSelected && "ring-2 ring-blue-500"
            )}
        >
            {/* 체크박스 */}
            <label className="absolute top-2 left-2 z-10 cursor-pointer">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelect(file.id, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
            </label>

            {/* 파일 미리보기 */}
            <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-gray-700">
                {isImage(file) ? (
                    <Image
                        src={file.url}
                        alt={file.name}
                        fill
                        className="object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                        onClick={() => onPreview(file)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-4xl text-gray-400">
                            {getFileTypeIcon(file.type)}
                        </div>
                    </div>
                )}

                {/* 오버레이 버튼 */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    {isImage(file) && (
                        <button
                            onClick={() => onPreview(file)}
                            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors duration-200"
                        >
                            <Eye className="w-4 h-4 text-white" />
                        </button>
                    )}
                    <button
                        onClick={() => onDownload(file)}
                        className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors duration-200"
                    >
                        <Download className="w-4 h-4 text-white" />
                    </button>
                    <button
                        onClick={() => onDelete(file)}
                        className="p-2 bg-red-500/80 backdrop-blur-sm rounded-lg hover:bg-red-600/90 transition-colors duration-200"
                    >
                        <Trash2 className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>

            {/* 파일 정보 */}
            <div className="space-y-1">
                <div
                    className={cn(
                        "text-white font-medium truncate",
                        getResponsiveClass(12).textClass
                    )}
                >
                    {file.name}
                </div>
                <div
                    className={cn(
                        "text-gray-400",
                        getResponsiveClass(10).textClass
                    )}
                >
                    {formatFileSize(file.size)}
                </div>
                <div
                    className={cn(
                        "text-gray-500 truncate",
                        getResponsiveClass(9).textClass
                    )}
                >
                    {format(new Date(file.createdAt), "MMM dd, yyyy")}
                </div>
            </div>
        </div>
    );
}
