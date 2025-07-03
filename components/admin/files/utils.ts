import type { StoredFile } from "@/app/actions/files";

/**
 * 파일이 이미지인지 확인
 */
export const isImageFile = (file: StoredFile): boolean => {
    return file.type.startsWith("image/");
};

/**
 * 파일 크기를 읽기 쉬운 형태로 포맷팅
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * 파일 타입에 따른 아이콘 이모지 반환
 */
export const getFileTypeIcon = (fileType: string): string => {
    if (fileType.startsWith("video/")) return "🎥";
    if (fileType.startsWith("audio/")) return "🎵";
    if (fileType.includes("pdf")) return "📄";
    return "📁";
};

/**
 * 페이지네이션을 위한 페이지 범위 계산
 */
export const getPageRange = (
    currentPage: number,
    totalPages: number,
    maxVisible: number = 5
) => {
    const start = Math.max(
        1,
        Math.min(
            totalPages - maxVisible + 1,
            currentPage - Math.floor(maxVisible / 2)
        )
    );
    const end = Math.min(totalPages, start + maxVisible - 1);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

/**
 * 파일 다운로드 처리
 */
export const downloadFile = (file: StoredFile): void => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * 확인 다이얼로그 표시
 */
export const confirmAction = (message: string): boolean => {
    return window.confirm(message);
};

/**
 * 선택된 파일들의 이름 목록 생성 (최대 길이 제한)
 */
export const getSelectedFileNames = (
    files: StoredFile[],
    selectedIds: Set<string>,
    maxLength: number = 200
): string => {
    const selectedFiles = files.filter((f) => selectedIds.has(f.id));
    const fileNames = selectedFiles.map((f) => f.name).join(", ");

    if (fileNames.length <= maxLength) {
        return fileNames;
    }

    return fileNames.substring(0, maxLength) + "...";
};

/**
 * 파일 확장자에서 MIME 타입 추론
 */
export const getMimeTypeFromFilename = (filename: string): string => {
    const extension = filename.toLowerCase().split(".").pop();

    const mimeTypeMap: Record<string, string> = {
        // 이미지
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",
        bmp: "image/bmp",
        ico: "image/x-icon",

        // 비디오
        mp4: "video/mp4",
        webm: "video/webm",
        ogg: "video/ogg",
        avi: "video/x-msvideo",
        mov: "video/quicktime",
        wmv: "video/x-ms-wmv",

        // 오디오
        mp3: "audio/mpeg",
        wav: "audio/wav",
        flac: "audio/flac",
        m4a: "audio/mp4",

        // 문서
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ppt: "application/vnd.ms-powerpoint",
        pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

        // 텍스트
        txt: "text/plain",
        html: "text/html",
        css: "text/css",
        js: "text/javascript",
        json: "application/json",
        xml: "application/xml",

        // 압축
        zip: "application/zip",
        rar: "application/x-rar-compressed",
        "7z": "application/x-7z-compressed",
        tar: "application/x-tar",
        gz: "application/gzip",
    };

    return mimeTypeMap[extension || ""] || "application/octet-stream";
};
