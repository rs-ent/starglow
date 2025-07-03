import type { StoredFile, OrphanedFile, BlobFile } from "@/app/actions/files";

export type FileViewMode =
    | "db_files"
    | "blob_files"
    | "orphaned_files"
    | "missing_blobs";

export interface FileGridItemProps {
    file: StoredFile;
    isSelected: boolean;
    onSelect: (fileId: string, checked: boolean) => void;
    onPreview: (file: StoredFile) => void;
    onDownload: (file: StoredFile) => void;
    onDelete: (file: StoredFile) => void;
    isImage: (file: StoredFile) => boolean;
}

export interface FileListRowProps extends FileGridItemProps {}

export interface FileFiltersProps {
    search: string;
    fileType: string;
    purpose: string;
    bucket: string;
    sortBy: "name" | "createdAt" | "size" | "type";
    sortOrder: "asc" | "desc";
    viewMode: "grid" | "list";
    onSearchChange: (value: string) => void;
    onFileTypeChange: (value: string) => void;
    onPurposeChange: (value: string) => void;
    onBucketChange: (value: string) => void;
    onSortByChange: (value: "name" | "createdAt" | "size" | "type") => void;
    onSortOrderChange: (value: "asc" | "desc") => void;
    onViewModeChange: (value: "grid" | "list") => void;
    onResetFilters: () => void;
}

export interface FileTabsProps {
    activeTab: FileViewMode;
    onTabChange: (tab: FileViewMode) => void;
    comparisonData?: {
        totalDbFiles: number;
        totalBlobFiles: number;
        totalOrphanedFiles: number;
        missingBlobs: StoredFile[];
    } | null;
}

export interface FileActionsProps {
    activeTab: FileViewMode;
    selectedFiles: Set<string>;
    onDeleteSelected: () => void;
    onRegisterSelected: () => void;
    isDeleting: boolean;
    isRegistering: boolean;
}

export interface FileSelectionProps {
    selectAll: boolean;
    totalFiles: number;
    activeTab: FileViewMode;
    onSelectAll: (checked: boolean) => void;
}

export interface UseDashboardStateOptions {
    limit?: number;
}

export interface DashboardState {
    // 탭 상태
    activeTab: FileViewMode;
    setActiveTab: (tab: FileViewMode) => void;

    // 필터 및 정렬 상태
    search: string;
    setSearch: (value: string) => void;
    fileType: string;
    setFileType: (value: string) => void;
    purpose: string;
    setPurpose: (value: string) => void;
    bucket: string;
    setBucket: (value: string) => void;
    sortBy: "name" | "createdAt" | "size" | "type";
    setSortBy: (value: "name" | "createdAt" | "size" | "type") => void;
    sortOrder: "asc" | "desc";
    setSortOrder: (value: "asc" | "desc") => void;
    viewMode: "grid" | "list";
    setViewMode: (value: "grid" | "list") => void;

    // 선택 상태
    selectedFiles: Set<string>;
    setSelectedFiles: (files: Set<string>) => void;
    selectAll: boolean;
    setSelectAll: (value: boolean) => void;

    // 미리보기 상태
    previewImages: string[];
    setPreviewImages: (images: string[]) => void;
    previewIndex: number;
    setPreviewIndex: (index: number) => void;
    isPreviewOpen: boolean;
    setIsPreviewOpen: (open: boolean) => void;

    // 페이지네이션
    limit: number;
    offset: number;
    setOffset: (offset: number) => void;

    // 리셋 함수
    resetFilters: () => void;
    clearSelections: () => void;
}
