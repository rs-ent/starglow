/// components/admin/files/Admin.Files.Dashboard.tsx

"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { useAllFiles, useFileComparison } from "@/app/queries/filesQueries";
import ImageVideoPopup from "@/components/atoms/ImageVideoPopup";

import {
    useDashboardState,
    useFileActions,
    FileFilters,
    FileTabs,
    FileActions,
    FileSelection,
    FileGridItem,
    FileListRow,
    Pagination,
    isImageFile,
    getMimeTypeFromFilename,
} from "./";

import type { GetAllFilesParams } from "@/app/actions/files";

export default function AdminFilesDashboard() {
    // 상태 관리 훅
    const state = useDashboardState();

    // 파일 데이터 조회
    const params: GetAllFilesParams = useMemo(
        () => ({
            search: state.search.trim() || undefined,
            fileType: state.fileType || undefined,
            purpose: state.purpose || undefined,
            bucket: state.bucket || undefined,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
            limit: state.limit,
            offset: state.offset,
        }),
        [
            state.search,
            state.fileType,
            state.purpose,
            state.bucket,
            state.sortBy,
            state.sortOrder,
            state.limit,
            state.offset,
        ]
    );

    const { data, isLoading, refetch } = useAllFiles(params);
    const { files, total } = useMemo(() => {
        return {
            files: data?.files || [],
            total: data?.total || 0,
        };
    }, [data]);

    // 파일 비교 데이터 조회
    const {
        data: comparisonData,
        isLoading: isComparisonLoading,
        refetch: refetchComparison,
    } = useFileComparison();

    // 현재 탭에 따른 파일 데이터 결정
    const currentFiles = useMemo(() => {
        if (!comparisonData) return [];

        switch (state.activeTab) {
            case "db_files":
                return files;
            case "blob_files":
                return comparisonData.blobFiles.map((blobFile) => {
                    const fileName =
                        blobFile.pathname.split("/").pop() || "unknown";
                    return {
                        id: blobFile.url,
                        url: blobFile.url,
                        name: fileName,
                        type: getMimeTypeFromFilename(fileName),
                        size: blobFile.size,
                        purpose: "blob-storage",
                        bucket: "blob",
                        order: 0,
                        createdAt: blobFile.uploadedAt,
                    };
                });
            case "orphaned_files":
                return comparisonData.orphanedFiles.map((orphanedFile) => {
                    const fileName =
                        orphanedFile.pathname.split("/").pop() || "unknown";
                    return {
                        id: orphanedFile.url,
                        url: orphanedFile.url,
                        name: fileName,
                        type: getMimeTypeFromFilename(fileName),
                        size: orphanedFile.size,
                        purpose: "orphaned",
                        bucket: "orphaned",
                        order: 0,
                        createdAt: orphanedFile.uploadedAt,
                    };
                });
            case "missing_blobs":
                return comparisonData.missingBlobs;
            default:
                return files;
        }
    }, [state.activeTab, files, comparisonData]);

    const currentTotal = useMemo(() => {
        if (!comparisonData) return total;

        switch (state.activeTab) {
            case "db_files":
                return total;
            case "blob_files":
                return comparisonData.totalBlobFiles;
            case "orphaned_files":
                return comparisonData.totalOrphanedFiles;
            case "missing_blobs":
                return comparisonData.missingBlobs.length;
            default:
                return total;
        }
    }, [state.activeTab, total, comparisonData]);

    // 파일 작업 로직 훅
    const actions = useFileActions({
        currentFiles,
        selectedFiles: state.selectedFiles,
        activeTab: state.activeTab,
        comparisonData,
        onRefetch: async () => {
            await refetch();
        },
        onRefetchComparison: async () => {
            await refetchComparison();
        },
        onClearSelections: state.clearSelections,
        onSetPreviewImages: state.setPreviewImages,
        onSetPreviewIndex: state.setPreviewIndex,
        onSetIsPreviewOpen: state.setIsPreviewOpen,
    });

    // 페이지네이션 계산
    const totalPages = Math.ceil(total / state.limit);
    const currentPage = Math.floor(state.offset / state.limit) + 1;

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
                            {state.activeTab === "db_files" &&
                                `Total ${currentTotal} DB files`}
                            {state.activeTab === "blob_files" &&
                                `Total ${currentTotal} Blob files`}
                            {state.activeTab === "orphaned_files" &&
                                `${currentTotal} Orphaned files`}
                            {state.activeTab === "missing_blobs" &&
                                `${currentTotal} Missing Blob files`}
                        </p>
                    </div>

                    {/* 액션 버튼들 */}
                    <FileActions
                        activeTab={state.activeTab}
                        selectedFiles={state.selectedFiles}
                        onDeleteSelected={actions.handleDeleteSelected}
                        onRegisterSelected={
                            actions.handleRegisterSelectedOrphaned
                        }
                        isDeleting={actions.isDeleting}
                        isRegistering={actions.isRegistering}
                    />
                </div>

                {/* 탭 메뉴 */}
                <FileTabs
                    activeTab={state.activeTab}
                    onTabChange={state.setActiveTab}
                    comparisonData={comparisonData}
                />

                {/* 필터 및 검색 */}
                <FileFilters
                    search={state.search}
                    fileType={state.fileType}
                    purpose={state.purpose}
                    bucket={state.bucket}
                    sortBy={state.sortBy}
                    sortOrder={state.sortOrder}
                    viewMode={state.viewMode}
                    onSearchChange={state.setSearch}
                    onFileTypeChange={state.setFileType}
                    onPurposeChange={state.setPurpose}
                    onBucketChange={state.setBucket}
                    onSortByChange={state.setSortBy}
                    onSortOrderChange={state.setSortOrder}
                    onViewModeChange={state.setViewMode}
                    onResetFilters={state.resetFilters}
                />

                {/* 전체 선택 체크박스 */}
                <FileSelection
                    selectAll={state.selectAll}
                    totalFiles={currentFiles.length}
                    activeTab={state.activeTab}
                    onSelectAll={(checked) =>
                        actions.handleSelectAll(
                            checked,
                            state.setSelectedFiles,
                            state.setSelectAll
                        )
                    }
                />

                {/* 로딩 상태 */}
                {(isLoading || isComparisonLoading) && (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                        <span className="ml-3 text-gray-400">
                            {isComparisonLoading
                                ? "Comparing files..."
                                : "Loading files..."}
                        </span>
                    </div>
                )}

                {/* 파일 리스트 */}
                {!isLoading &&
                    !isComparisonLoading &&
                    currentFiles.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-lg">
                                {state.activeTab === "orphaned_files"
                                    ? "No orphaned files found"
                                    : state.activeTab === "missing_blobs"
                                    ? "No missing blob files found"
                                    : "No files found"}
                            </div>
                            {state.activeTab === "orphaned_files" && (
                                <p className="text-gray-500 text-sm mt-2">
                                    All Blob files are properly registered in
                                    the database
                                </p>
                            )}
                        </div>
                    )}

                {!isLoading &&
                    !isComparisonLoading &&
                    currentFiles.length > 0 && (
                        <>
                            {state.viewMode === "grid" ? (
                                /* 그리드 뷰 */
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                    {currentFiles.map((file) => (
                                        <FileGridItem
                                            key={file.id}
                                            file={file}
                                            isSelected={state.selectedFiles.has(
                                                file.id
                                            )}
                                            onSelect={(fileId, checked) =>
                                                actions.handleFileSelect(
                                                    fileId,
                                                    checked,
                                                    state.setSelectedFiles
                                                )
                                            }
                                            onPreview={
                                                actions.handlePreviewImage
                                            }
                                            onDownload={actions.handleDownload}
                                            onDelete={actions.handleDeleteFile}
                                            isImage={isImageFile}
                                        />
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
                                                            checked={
                                                                state.selectAll
                                                            }
                                                            onChange={(e) =>
                                                                actions.handleSelectAll(
                                                                    e.target
                                                                        .checked,
                                                                    state.setSelectedFiles,
                                                                    state.setSelectAll
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
                                                {currentFiles.map((file) => (
                                                    <FileListRow
                                                        key={file.id}
                                                        file={file}
                                                        isSelected={state.selectedFiles.has(
                                                            file.id
                                                        )}
                                                        onSelect={(
                                                            fileId,
                                                            checked
                                                        ) =>
                                                            actions.handleFileSelect(
                                                                fileId,
                                                                checked,
                                                                state.setSelectedFiles
                                                            )
                                                        }
                                                        onPreview={
                                                            actions.handlePreviewImage
                                                        }
                                                        onDownload={
                                                            actions.handleDownload
                                                        }
                                                        onDelete={
                                                            actions.handleDeleteFile
                                                        }
                                                        isImage={isImageFile}
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* 페이지네이션 */}
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={(page) =>
                                    actions.handlePageChange(
                                        page,
                                        state.limit,
                                        state.setOffset
                                    )
                                }
                            />
                        </>
                    )}
            </div>

            {/* 이미지 미리보기 팝업 */}
            <ImageVideoPopup
                images={state.previewImages}
                initialIndex={state.previewIndex}
                isOpen={state.isPreviewOpen}
                onClose={() => state.setIsPreviewOpen(false)}
            />
        </div>
    );
}
