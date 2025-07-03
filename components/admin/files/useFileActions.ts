"use client";

import { useCallback } from "react";
import {
    useDeleteFiles,
    useRegisterOrphanedFiles,
} from "@/app/mutations/filesMutations";
import { useToast } from "@/app/hooks/useToast";
import {
    isImageFile,
    downloadFile,
    confirmAction,
    getSelectedFileNames,
} from "./utils";
import type { StoredFile, OrphanedFile } from "@/app/actions/files";
import type { FileViewMode } from "./types";

interface UseFileActionsOptions {
    currentFiles: StoredFile[];
    selectedFiles: Set<string>;
    activeTab: FileViewMode;
    comparisonData?: {
        orphanedFiles: OrphanedFile[];
    } | null;
    onRefetch: () => Promise<void>;
    onRefetchComparison: () => Promise<void>;
    onClearSelections: () => void;
    onSetPreviewImages: (images: string[]) => void;
    onSetPreviewIndex: (index: number) => void;
    onSetIsPreviewOpen: (open: boolean) => void;
}

export function useFileActions({
    currentFiles,
    selectedFiles,
    activeTab,
    comparisonData,
    onRefetch,
    onRefetchComparison,
    onClearSelections,
    onSetPreviewImages,
    onSetPreviewIndex,
    onSetIsPreviewOpen,
}: UseFileActionsOptions) {
    const toast = useToast();
    const deleteFilesMutation = useDeleteFiles();
    const registerOrphanedFilesMutation = useRegisterOrphanedFiles();

    // 파일 선택 핸들러
    const handleFileSelect = useCallback(
        (
            fileId: string,
            checked: boolean,
            setSelectedFiles: (files: Set<string>) => void
        ) => {
            setSelectedFiles((prev) => {
                const newSet = new Set(prev);
                if (checked) {
                    newSet.add(fileId);
                } else {
                    newSet.delete(fileId);
                }
                return newSet;
            });
        },
        []
    );

    // 전체 선택 핸들러
    const handleSelectAll = useCallback(
        (
            checked: boolean,
            setSelectedFiles: (files: Set<string>) => void,
            setSelectAll: (value: boolean) => void
        ) => {
            setSelectAll(checked);
            if (checked) {
                setSelectedFiles(new Set(currentFiles.map((f) => f.id)));
            } else {
                setSelectedFiles(new Set());
            }
        },
        [currentFiles]
    );

    // 선택된 파일 삭제
    const handleDeleteSelected = useCallback(async () => {
        if (selectedFiles.size === 0) return;

        const fileNames = getSelectedFileNames(currentFiles, selectedFiles);

        if (
            !confirmAction(
                `정말로 ${selectedFiles.size}개의 파일을 삭제하시겠습니까?\n\n${fileNames}`
            )
        ) {
            return;
        }

        try {
            await deleteFilesMutation.mutateAsync(Array.from(selectedFiles));
            onClearSelections();
            await Promise.all([onRefetch(), onRefetchComparison()]);
            toast.success(`${selectedFiles.size}개 파일이 삭제되었습니다.`);
        } catch (error) {
            console.error("Error deleting files:", error);
            toast.error("파일 삭제에 실패했습니다.");
        }
    }, [
        selectedFiles,
        currentFiles,
        deleteFilesMutation,
        onRefetch,
        onRefetchComparison,
        onClearSelections,
        toast,
    ]);

    // 개별 파일 삭제
    const handleDeleteFile = useCallback(
        async (file: StoredFile) => {
            if (
                !confirmAction(`정말로 "${file.name}" 파일을 삭제하시겠습니까?`)
            ) {
                return;
            }

            try {
                await deleteFilesMutation.mutateAsync([file.id]);
                onClearSelections();
                await Promise.all([onRefetch(), onRefetchComparison()]);
                toast.success("파일이 삭제되었습니다.");
            } catch (error) {
                console.error("Error deleting file:", error);
                toast.error("파일 삭제에 실패했습니다.");
            }
        },
        [
            deleteFilesMutation,
            onRefetch,
            onRefetchComparison,
            onClearSelections,
            toast,
        ]
    );

    // 고아 파일들을 DB에 등록
    const handleRegisterOrphanedFiles = useCallback(
        async (orphanedFiles: OrphanedFile[]) => {
            if (!orphanedFiles || orphanedFiles.length === 0) return;

            const fileNames = orphanedFiles
                .map((f) => f.pathname.split("/").pop())
                .join(", ");

            if (
                !confirmAction(
                    `정말로 ${orphanedFiles.length}개의 고아 파일을 DB에 등록하시겠습니까?\n\n${fileNames}`
                )
            ) {
                return;
            }

            try {
                await registerOrphanedFilesMutation.mutateAsync(orphanedFiles);
                await Promise.all([onRefetch(), onRefetchComparison()]);
                toast.success(
                    `${orphanedFiles.length}개 파일이 등록되었습니다.`
                );
            } catch (error) {
                console.error("Error registering orphaned files:", error);
                toast.error("파일 등록에 실패했습니다.");
            }
        },
        [registerOrphanedFilesMutation, onRefetch, onRefetchComparison, toast]
    );

    // 선택된 고아 파일들을 등록
    const handleRegisterSelectedOrphaned = useCallback(async () => {
        if (activeTab !== "orphaned_files" || !comparisonData) return;

        const selectedOrphanedFiles = comparisonData.orphanedFiles.filter((f) =>
            selectedFiles.has(f.url)
        );

        await handleRegisterOrphanedFiles(selectedOrphanedFiles);
    }, [activeTab, comparisonData, selectedFiles, handleRegisterOrphanedFiles]);

    // 이미지 미리보기 열기
    const handlePreviewImage = useCallback(
        (file: StoredFile) => {
            if (!isImageFile(file)) return;

            const imageFiles = currentFiles.filter(isImageFile);
            const images = imageFiles.map((f) => f.url);
            const index = imageFiles.findIndex((f) => f.id === file.id);

            onSetPreviewImages(images);
            onSetPreviewIndex(index);
            onSetIsPreviewOpen(true);
        },
        [
            currentFiles,
            onSetPreviewImages,
            onSetPreviewIndex,
            onSetIsPreviewOpen,
        ]
    );

    // 파일 다운로드
    const handleDownload = useCallback((file: StoredFile) => {
        downloadFile(file);
    }, []);

    // 페이지네이션
    const handlePageChange = useCallback(
        (page: number, limit: number, setOffset: (offset: number) => void) => {
            setOffset((page - 1) * limit);
        },
        []
    );

    return {
        // 핸들러 함수들
        handleFileSelect,
        handleSelectAll,
        handleDeleteSelected,
        handleDeleteFile,
        handleRegisterSelectedOrphaned,
        handlePreviewImage,
        handleDownload,
        handlePageChange,

        // 상태
        isDeleting: deleteFilesMutation.isPending,
        isRegistering: registerOrphanedFilesMutation.isPending,
    };
}
