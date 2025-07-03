"use client";

import Image from "next/image";
import { format } from "date-fns";
import { Eye, Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";
import { formatFileSize, getFileTypeIcon } from "./utils";
import type { FileListRowProps } from "./types";

export default function FileListRow({
    file,
    isSelected,
    onSelect,
    onPreview,
    onDownload,
    onDelete,
    isImage,
}: FileListRowProps) {
    return (
        <tr
            className={cn(
                "border-t border-gray-700 hover:bg-gray-700/30 transition-colors duration-200",
                isSelected && "bg-blue-500/10"
            )}
        >
            <td className="p-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelect(file.id, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
            </td>
            <td className="p-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center">
                    {isImage(file) ? (
                        <Image
                            src={file.url}
                            alt={file.name}
                            width={48}
                            height={48}
                            className="object-cover cursor-pointer"
                            onClick={() => onPreview(file)}
                        />
                    ) : (
                        <div className="text-lg text-gray-400">
                            {getFileTypeIcon(file.type)}
                        </div>
                    )}
                </div>
            </td>
            <td className="p-3">
                <div className="text-white font-medium truncate max-w-xs">
                    {file.name}
                </div>
            </td>
            <td className="p-3 text-gray-400">{file.type}</td>
            <td className="p-3 text-gray-400">{formatFileSize(file.size)}</td>
            <td className="p-3 text-gray-400">{file.purpose || "-"}</td>
            <td className="p-3 text-gray-400">
                {format(new Date(file.createdAt), "MMM dd, yyyy HH:mm")}
            </td>
            <td className="p-3">
                <div className="flex items-center gap-2">
                    {isImage(file) && (
                        <button
                            onClick={() => onPreview(file)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors duration-200"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onDownload(file)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors duration-200"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(file)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded transition-colors duration-200"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}
