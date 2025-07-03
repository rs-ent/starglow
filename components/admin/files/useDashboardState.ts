"use client";

import { useState, useCallback } from "react";
import type {
    FileViewMode,
    DashboardState,
    UseDashboardStateOptions,
} from "./types";

export function useDashboardState(
    options: UseDashboardStateOptions = {}
): DashboardState {
    const { limit = 24 } = options;

    // 탭 상태
    const [activeTab, setActiveTab] = useState<FileViewMode>("db_files");

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
    const [offset, setOffset] = useState(0);

    // 필터 초기화
    const resetFilters = useCallback(() => {
        setSearch("");
        setFileType("");
        setPurpose("");
        setBucket("");
        setSortBy("createdAt");
        setSortOrder("desc");
        setOffset(0);
    }, []);

    // 선택 상태 초기화
    const clearSelections = useCallback(() => {
        setSelectedFiles(new Set());
        setSelectAll(false);
    }, []);

    // 탭 변경 시 선택 초기화
    const handleTabChange = useCallback(
        (tab: FileViewMode) => {
            setActiveTab(tab);
            clearSelections();
        },
        [clearSelections]
    );

    return {
        // 탭 상태
        activeTab,
        setActiveTab: handleTabChange,

        // 필터 및 정렬 상태
        search,
        setSearch,
        fileType,
        setFileType,
        purpose,
        setPurpose,
        bucket,
        setBucket,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        viewMode,
        setViewMode,

        // 선택 상태
        selectedFiles,
        setSelectedFiles,
        selectAll,
        setSelectAll,

        // 미리보기 상태
        previewImages,
        setPreviewImages,
        previewIndex,
        setPreviewIndex,
        isPreviewOpen,
        setIsPreviewOpen,

        // 페이지네이션
        limit,
        offset,
        setOffset,

        // 리셋 함수
        resetFilters,
        clearSelections,
    };
}
