"use client";

import { cn } from "@/lib/utils/tailwind";
import { getPageRange } from "./utils";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
}: PaginationProps) {
    if (totalPages <= 1) {
        return null;
    }

    const visiblePages = getPageRange(currentPage, totalPages, 5);

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                    "px-3 py-2 rounded-lg transition-colors duration-200",
                    currentPage === 1
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-gray-300 hover:text-white hover:bg-gray-700"
                )}
            >
                Previous
            </button>

            {visiblePages.map((page) => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={cn(
                        "px-3 py-2 rounded-lg transition-colors duration-200",
                        page === currentPage
                            ? "bg-blue-600 text-white"
                            : "text-gray-300 hover:text-white hover:bg-gray-700"
                    )}
                >
                    {page}
                </button>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                    "px-3 py-2 rounded-lg transition-colors duration-200",
                    currentPage === totalPages
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-gray-300 hover:text-white hover:bg-gray-700"
                )}
            >
                Next
            </button>
        </div>
    );
}
