/// components/admin/files/Admin.Files.Dashboard.tsx

"use client";

import { useState, useMemo, useCallback } from "react";
import {
    Search,
    Filter,
    Grid,
    List,
    Trash2,
    Download,
    Eye,
    X,
} from "lucide-react";
import { format } from "date-fns";

import { useAllFiles } from "@/app/queries/filesQueries";
import { useDeleteFiles } from "@/app/mutations/filesMutations";
import { useToast } from "@/app/hooks/useToast";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import ImageVideoPopup from "@/components/atoms/ImageVideoPopup";

import type { GetAllFilesParams, StoredFile } from "@/app/actions/files";

import Image from "next/image";

export default function AdminFilesDashboard() {
    const toast = useToast();

    // 필터 및 정렬 상태
    const [search, setSearch] = useState("");
    const [fileType, setFileType] = useState("");
    const [purpose, setPurpose] = useState("");
    const [bucket, setBucket] = useState("");
    const [sortBy, setSortBy] = useState<
        "name" | "createdAt" | "size" | "type"
    >("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // 선택 상태
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    // 미리보기 상태
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // 페이지네이션
    const [limit] = useState(24);
    const [offset, setOffset] = useState(0);

    // 파일 데이터 조회
    const params: GetAllFilesParams = useMemo(
        () => ({
            search: search.trim() || undefined,
            fileType: fileType || undefined,
            purpose: purpose || undefined,
            bucket: bucket || undefined,
            sortBy,
            sortOrder,
            limit,
            offset,
        }),
        [search, fileType, purpose, bucket, sortBy, sortOrder, limit, offset]
    );

    const { data, isLoading, refetch } = useAllFiles(params);
    const files = data?.files || [];
    const total = data?.total || 0;

    // 삭제 mutation
    const deleteFilesMutation = useDeleteFiles();

    // 이미지인지 확인하는 함수
    const isImage = useCallback((file: StoredFile) => {
        return file.type.startsWith("image/");
    }, []);

    // 파일 크기 포맷팅
    const formatFileSize = useCallback((bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }, []);

    // 체크박스 핸들러
    const handleFileSelect = useCallback((fileId: string, checked: boolean) => {
        setSelectedFiles((prev) => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(fileId);
            } else {
                newSet.delete(fileId);
            }
            return newSet;
        });
    }, []);

    // 전체 선택 핸들러
    const handleSelectAll = useCallback(
        (checked: boolean) => {
            setSelectAll(checked);
            if (checked) {
                setSelectedFiles(new Set(files.map((f) => f.id)));
            } else {
                setSelectedFiles(new Set());
            }
        },
        [files]
    );

    // 선택된 파일 삭제
    const handleDeleteSelected = useCallback(async () => {
        if (selectedFiles.size === 0) return;

        const fileNames = files
            .filter((f) => selectedFiles.has(f.id))
            .map((f) => f.name)
            .join(", ");

        if (
            !confirm(
                `정말로 ${selectedFiles.size}개의 파일을 삭제하시겠습니까?\n\n${fileNames}`
            )
        ) {
            return;
        }

        try {
            await deleteFilesMutation.mutateAsync(Array.from(selectedFiles));
            setSelectedFiles(new Set());
            setSelectAll(false);
            await refetch();
            toast.success(`${selectedFiles.size}개 파일이 삭제되었습니다.`);
        } catch (error) {
            console.error("Error deleting files:", error);
            toast.error("파일 삭제에 실패했습니다.");
        }
    }, [selectedFiles, files, deleteFilesMutation, refetch, toast]);

    // 개별 파일 삭제
    const handleDeleteFile = useCallback(
        async (file: StoredFile) => {
            if (!confirm(`정말로 "${file.name}" 파일을 삭제하시겠습니까?`)) {
                return;
            }

            try {
                await deleteFilesMutation.mutateAsync([file.id]);
                setSelectedFiles((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(file.id);
                    return newSet;
                });
                await refetch();
                toast.success("파일이 삭제되었습니다.");
            } catch (error) {
                console.error("Error deleting file:", error);
                toast.error("파일 삭제에 실패했습니다.");
            }
        },
        [deleteFilesMutation, refetch, toast]
    );

    // 이미지 미리보기 열기
    const handlePreviewImage = useCallback(
        (file: StoredFile) => {
            if (!isImage(file)) return;

            const imageFiles = files.filter(isImage);
            const images = imageFiles.map((f) => f.url);
            const index = imageFiles.findIndex((f) => f.id === file.id);

            setPreviewImages(images);
            setPreviewIndex(index);
            setIsPreviewOpen(true);
        },
        [files, isImage]
    );

    // 파일 다운로드
    const handleDownload = useCallback((file: StoredFile) => {
        const link = document.createElement("a");
        link.href = file.url;
        link.download = file.name;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    // 필터 초기화
    const handleResetFilters = useCallback(() => {
        setSearch("");
        setFileType("");
        setPurpose("");
        setBucket("");
        setSortBy("createdAt");
        setSortOrder("desc");
        setOffset(0);
    }, []);

    // 페이지네이션
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    const handlePageChange = useCallback(
        (page: number) => {
            setOffset((page - 1) * limit);
        },
        [limit]
    );

    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1
                            className={cn(
                                "text-white font-bold",
                                getResponsiveClass(28).textClass
                            )}
                        >
                            File Management
                        </h1>
                        <p
                            className={cn(
                                "text-gray-400 mt-2",
                                getResponsiveClass(14).textClass
                            )}
                        >
                            Total {total} files
                        </p>
                    </div>

                    {/* 선택된 파일 삭제 버튼 */}
                    {selectedFiles.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            disabled={deleteFilesMutation.isPending}
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

                {/* 필터 및 검색 */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {/* 검색 */}
                        <div className="relative xl:col-span-2">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
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
                            onChange={(e) => setFileType(e.target.value)}
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
                            onChange={(e) => setPurpose(e.target.value)}
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
                            onChange={(e) => setBucket(e.target.value)}
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
                                onChange={(e) =>
                                    setSortBy(e.target.value as any)
                                }
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
                                    setSortOrder(
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
                            onClick={handleResetFilters}
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
                                onClick={() => setViewMode("grid")}
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
                                onClick={() => setViewMode("list")}
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

                {/* 전체 선택 체크박스 */}
                {files.length > 0 && (
                    <div className="flex items-center gap-3 px-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={(e) =>
                                    handleSelectAll(e.target.checked)
                                }
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-2"
                            />
                            <span
                                className={cn(
                                    "text-gray-300",
                                    getResponsiveClass(14).textClass
                                )}
                            >
                                Select All ({files.length})
                            </span>
                        </label>
                    </div>
                )}

                {/* 로딩 상태 */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                )}

                {/* 파일 리스트 */}
                {!isLoading && files.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-lg">
                            No files found
                        </div>
                    </div>
                )}

                {!isLoading && files.length > 0 && (
                    <>
                        {viewMode === "grid" ? (
                            /* 그리드 뷰 */
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                {files.map((file) => (
                                    <div
                                        key={file.id}
                                        className={cn(
                                            "relative group bg-gray-800/50 backdrop-blur-sm rounded-xl p-3",
                                            "border border-gray-700 hover:border-gray-600",
                                            "transition-all duration-200",
                                            selectedFiles.has(file.id) &&
                                                "ring-2 ring-blue-500"
                                        )}
                                    >
                                        {/* 체크박스 */}
                                        <label className="absolute top-2 left-2 z-10 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedFiles.has(
                                                    file.id
                                                )}
                                                onChange={(e) =>
                                                    handleFileSelect(
                                                        file.id,
                                                        e.target.checked
                                                    )
                                                }
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
                                                    onClick={() =>
                                                        handlePreviewImage(file)
                                                    }
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <div className="text-4xl text-gray-400">
                                                        {file.type.startsWith(
                                                            "video/"
                                                        )
                                                            ? "🎥"
                                                            : file.type.startsWith(
                                                                  "audio/"
                                                              )
                                                            ? "🎵"
                                                            : file.type.includes(
                                                                  "pdf"
                                                              )
                                                            ? "📄"
                                                            : "📁"}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 오버레이 버튼 */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                                                {isImage(file) && (
                                                    <button
                                                        onClick={() =>
                                                            handlePreviewImage(
                                                                file
                                                            )
                                                        }
                                                        className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors duration-200"
                                                    >
                                                        <Eye className="w-4 h-4 text-white" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        handleDownload(file)
                                                    }
                                                    className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors duration-200"
                                                >
                                                    <Download className="w-4 h-4 text-white" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteFile(file)
                                                    }
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
                                                    getResponsiveClass(12)
                                                        .textClass
                                                )}
                                            >
                                                {file.name}
                                            </div>
                                            <div
                                                className={cn(
                                                    "text-gray-400",
                                                    getResponsiveClass(10)
                                                        .textClass
                                                )}
                                            >
                                                {formatFileSize(file.size)}
                                            </div>
                                            <div
                                                className={cn(
                                                    "text-gray-500 truncate",
                                                    getResponsiveClass(9)
                                                        .textClass
                                                )}
                                            >
                                                {format(
                                                    new Date(file.createdAt),
                                                    "MMM dd, yyyy"
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* 리스트 뷰 */
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-700/50">
                                            <tr>
                                                <th className="w-12 p-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectAll}
                                                        onChange={(e) =>
                                                            handleSelectAll(
                                                                e.target.checked
                                                            )
                                                        }
                                                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                                    />
                                                </th>
                                                <th className="text-left p-3 text-gray-300">
                                                    Preview
                                                </th>
                                                <th className="text-left p-3 text-gray-300">
                                                    Name
                                                </th>
                                                <th className="text-left p-3 text-gray-300">
                                                    Type
                                                </th>
                                                <th className="text-left p-3 text-gray-300">
                                                    Size
                                                </th>
                                                <th className="text-left p-3 text-gray-300">
                                                    Purpose
                                                </th>
                                                <th className="text-left p-3 text-gray-300">
                                                    Date
                                                </th>
                                                <th className="text-left p-3 text-gray-300">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {files.map((file) => (
                                                <tr
                                                    key={file.id}
                                                    className={cn(
                                                        "border-t border-gray-700 hover:bg-gray-700/30 transition-colors duration-200",
                                                        selectedFiles.has(
                                                            file.id
                                                        ) && "bg-blue-500/10"
                                                    )}
                                                >
                                                    <td className="p-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedFiles.has(
                                                                file.id
                                                            )}
                                                            onChange={(e) =>
                                                                handleFileSelect(
                                                                    file.id,
                                                                    e.target
                                                                        .checked
                                                                )
                                                            }
                                                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center">
                                                            {isImage(file) ? (
                                                                <Image
                                                                    src={
                                                                        file.url
                                                                    }
                                                                    alt={
                                                                        file.name
                                                                    }
                                                                    width={48}
                                                                    height={48}
                                                                    className="object-cover cursor-pointer"
                                                                    onClick={() =>
                                                                        handlePreviewImage(
                                                                            file
                                                                        )
                                                                    }
                                                                />
                                                            ) : (
                                                                <div className="text-lg text-gray-400">
                                                                    {file.type.startsWith(
                                                                        "video/"
                                                                    )
                                                                        ? "🎥"
                                                                        : file.type.startsWith(
                                                                              "audio/"
                                                                          )
                                                                        ? "🎵"
                                                                        : file.type.includes(
                                                                              "pdf"
                                                                          )
                                                                        ? "📄"
                                                                        : "📁"}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="text-white font-medium truncate max-w-xs">
                                                            {file.name}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-gray-400">
                                                        {file.type}
                                                    </td>
                                                    <td className="p-3 text-gray-400">
                                                        {formatFileSize(
                                                            file.size
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-gray-400">
                                                        {file.purpose || "-"}
                                                    </td>
                                                    <td className="p-3 text-gray-400">
                                                        {format(
                                                            new Date(
                                                                file.createdAt
                                                            ),
                                                            "MMM dd, yyyy HH:mm"
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            {isImage(file) && (
                                                                <button
                                                                    onClick={() =>
                                                                        handlePreviewImage(
                                                                            file
                                                                        )
                                                                    }
                                                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors duration-200"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() =>
                                                                    handleDownload(
                                                                        file
                                                                    )
                                                                }
                                                                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors duration-200"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteFile(
                                                                        file
                                                                    )
                                                                }
                                                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded transition-colors duration-200"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* 페이지네이션 */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <button
                                    onClick={() =>
                                        handlePageChange(currentPage - 1)
                                    }
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

                                {Array.from(
                                    { length: Math.min(totalPages, 5) },
                                    (_, i) => {
                                        const page =
                                            Math.max(
                                                1,
                                                Math.min(
                                                    totalPages - 4,
                                                    currentPage - 2
                                                )
                                            ) + i;
                                        return (
                                            <button
                                                key={page}
                                                onClick={() =>
                                                    handlePageChange(page)
                                                }
                                                className={cn(
                                                    "px-3 py-2 rounded-lg transition-colors duration-200",
                                                    page === currentPage
                                                        ? "bg-blue-600 text-white"
                                                        : "text-gray-300 hover:text-white hover:bg-gray-700"
                                                )}
                                            >
                                                {page}
                                            </button>
                                        );
                                    }
                                )}

                                <button
                                    onClick={() =>
                                        handlePageChange(currentPage + 1)
                                    }
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
                        )}
                    </>
                )}
            </div>

            {/* 이미지 미리보기 팝업 */}
            <ImageVideoPopup
                images={previewImages}
                initialIndex={previewIndex}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
            />
        </div>
    );
}
