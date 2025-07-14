/// app\actions\files.ts

"use server";

import { put, del, list } from "@vercel/blob";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "@/lib/prisma/client";

import { requireAuth } from "../auth/authUtils";

export interface StoredFile {
    id: string;
    url: string;
    name: string;
    type: string;
    size: number;
    purpose: string;
    bucket: string;
    order: number;
    createdAt: Date;
}

async function getImageDimensions(
    file: File
): Promise<{ width: number; height: number } | null> {
    if (!file.type.startsWith("image/")) return null;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const metadata = await sharp(buffer).metadata();

        return {
            width: metadata.width || 0,
            height: metadata.height || 0,
        };
    } catch (error) {
        console.error("Error getting image dimensions:", error);
        return null;
    }
}

async function optimizeImage(
    file: File,
    quality: number = 90
): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return sharp(buffer).webp({ quality }).toBuffer();
}

export async function uploadFile(
    file: File,
    purpose: string,
    bucket: string
): Promise<StoredFile> {
    await requireAuth();

    let optimizedBuffer: Buffer | null = null;
    let optimizedType = file.type;
    let optimizedSize = file.size;
    let dimensions: { width: number; height: number } | null = null;

    if (file.type.startsWith("image/")) {
        try {
            optimizedBuffer = await optimizeImage(file);
            optimizedType = "image/webp";
            optimizedSize = optimizedBuffer.length;

            dimensions = await getImageDimensions(file);
        } catch (error) {
            console.error("Error optimizing image:", error);
        }
    }

    const fileExt = optimizedBuffer ? "webp" : file.name.split(".").pop();
    const sizeSuffix = dimensions
        ? `_${dimensions.width}x${dimensions.height}`
        : "";
    const fileName = `${uuidv4()}${sizeSuffix}.${fileExt}`;

    const fileToUpload = optimizedBuffer || file;

    const { url } = await put(fileName, fileToUpload, {
        access: "public",
    });

    const storedFile = await prisma.storedFiles.create({
        data: {
            url,
            name: fileName,
            type: optimizedType,
            mimeType: optimizedType,
            sizeBytes: optimizedSize,
            order: 0,
            purpose,
            bucket,
            width: dimensions?.width || 0,
            height: dimensions?.height || 0,
        },
    });

    return {
        id: storedFile.id,
        url: storedFile.url,
        name: storedFile.name || fileName,
        type: storedFile.type || optimizedType,
        size: storedFile.sizeBytes || optimizedSize,
        purpose: storedFile.purpose || purpose,
        bucket: storedFile.bucket || bucket,
        order: storedFile.order || 0,
        createdAt: storedFile.createdAt,
    };
}

export async function deleteFile(id: string): Promise<boolean> {
    await requireAuth();

    const file = await prisma.storedFiles.findUnique({
        where: { id },
    });

    if (!file) {
        throw new Error("File not found");
    }

    // Vercel Blob에서 파일 삭제
    try {
        await del(file.url);
    } catch (error) {
        console.error("Error deleting file from Vercel Blob:", error);
        // Blob 삭제에 실패해도 DB에서는 삭제 진행
        // 실제 운영에서는 에러 처리 정책에 따라 결정
    }

    // DB에서 파일 정보 삭제
    await prisma.storedFiles.delete({
        where: { id },
    });

    return true;
}

export async function deleteFiles(ids: string[]): Promise<boolean> {
    await requireAuth();

    if (!ids || ids.length === 0) {
        throw new Error("No file IDs provided");
    }

    // DB에서 파일 정보 조회
    const files = await prisma.storedFiles.findMany({
        where: { id: { in: ids } },
        select: { id: true, url: true },
    });

    if (files.length === 0) {
        throw new Error("No files found");
    }

    // Vercel Blob에서 파일들 삭제
    const deletePromises = files.map(async (file) => {
        try {
            await del(file.url);
        } catch (error) {
            console.error(
                `Error deleting file ${file.id} from Vercel Blob:`,
                error
            );
            // 개별 파일 삭제 실패는 로그만 남기고 계속 진행
        }
    });

    await Promise.all(deletePromises);

    // DB에서 파일 정보들 삭제
    await prisma.storedFiles.deleteMany({
        where: { id: { in: ids } },
    });

    return true;
}

export async function uploadFiles(
    formData: FormData,
    purpose: string,
    bucket: string
): Promise<StoredFile[]> {
    await requireAuth();

    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
        throw new Error("No files provided");
    }

    const currentFiles = await prisma.storedFiles.findMany({
        where: { purpose },
        orderBy: { order: "desc" },
        take: 1,
    });
    const nextOrder =
        currentFiles.length > 0 ? (currentFiles[0].order || 0) + 1 : 0;

    const uploadedFiles = await Promise.all(
        files.map(async (file, index) => {
            let optimizedBuffer: Buffer | null = null;
            let optimizedType = file.type;
            let optimizedSize = file.size;
            let dimensions: { width: number; height: number } | null = null;

            if (file.type.startsWith("image/")) {
                try {
                    optimizedBuffer = await optimizeImage(file);
                    optimizedType = "image/webp";
                    optimizedSize = optimizedBuffer.length;

                    dimensions = await getImageDimensions(file);
                } catch (error) {
                    console.error("Error optimizing image:", error);
                }
            }

            const fileExt = optimizedBuffer
                ? "webp"
                : file.name.split(".").pop();
            const sizeSuffix = dimensions
                ? `_${dimensions.width}x${dimensions.height}`
                : "";
            const fileName = `${uuidv4()}${sizeSuffix}.${fileExt}`;

            const fileToUpload = optimizedBuffer || file;

            const { url } = await put(fileName, fileToUpload, {
                access: "public",
            });

            const storedFile = await prisma.storedFiles.create({
                data: {
                    url,
                    name: fileName,
                    type: optimizedType,
                    mimeType: optimizedType,
                    sizeBytes: optimizedSize,
                    purpose,
                    order: nextOrder + index,
                    bucket: bucket,
                    width: dimensions?.width || 0,
                    height: dimensions?.height || 0,
                },
            });

            return {
                id: storedFile.id,
                url: storedFile.url,
                name: storedFile.name || fileName,
                type: storedFile.type || optimizedType,
                size: storedFile.sizeBytes || optimizedSize,
                purpose: storedFile.purpose || purpose,
                bucket: storedFile.bucket || bucket,
                order: storedFile.order || nextOrder + index,
                createdAt: storedFile.createdAt,
            };
        })
    );

    return uploadedFiles;
}

export async function getFilesByPurposeAndBucket(
    purpose: string,
    bucket: string = "default"
): Promise<StoredFile[]> {
    await requireAuth();

    const files = await prisma.storedFiles.findMany({
        where: {
            purpose,
            bucket,
        },
        orderBy: {
            order: "asc",
        },
    });

    return files.map((file) => ({
        id: file.id,
        url: file.url,
        name: file.name || "",
        type: file.type || "",
        size: file.sizeBytes || 0,
        purpose: file.purpose || "",
        bucket: file.bucket || "",
        order: file.order || 0,
        createdAt: file.createdAt,
    }));
}

export interface GetAllFilesParams {
    search?: string;
    fileType?: string;
    purpose?: string;
    bucket?: string;
    sortBy?: "name" | "createdAt" | "size" | "type";
    sortOrder?: "asc" | "desc";
    limit?: number;
    offset?: number;
}

export async function getAllFiles(params?: GetAllFilesParams): Promise<{
    files: StoredFile[];
    total: number;
}> {
    await requireAuth();

    const {
        search,
        fileType,
        purpose,
        bucket,
        sortBy = "createdAt",
        sortOrder = "desc",
        limit = 50,
        offset = 0,
    } = params || {};

    // 필터 조건 구성
    const where: any = {};

    if (search) {
        where.name = {
            contains: search,
            mode: "insensitive",
        };
    }

    if (fileType) {
        where.type = {
            contains: fileType,
            mode: "insensitive",
        };
    }

    if (purpose) {
        where.purpose = purpose;
    }

    if (bucket) {
        where.bucket = bucket;
    }

    // 정렬 조건 구성
    const orderBy: any = {};
    if (sortBy === "name") {
        orderBy.name = sortOrder;
    } else if (sortBy === "size") {
        orderBy.sizeBytes = sortOrder;
    } else if (sortBy === "type") {
        orderBy.type = sortOrder;
    } else {
        orderBy.createdAt = sortOrder;
    }

    // 파일 조회 및 총 개수 조회
    const [files, total] = await Promise.all([
        prisma.storedFiles.findMany({
            where,
            orderBy,
            take: limit,
            skip: offset,
        }),
        prisma.storedFiles.count({
            where,
        }),
    ]);

    return {
        files: files.map((file) => ({
            id: file.id,
            url: file.url,
            name: file.name || "",
            type: file.type || "",
            size: file.sizeBytes || 0,
            purpose: file.purpose || "",
            bucket: file.bucket || "",
            order: file.order || 0,
            createdAt: file.createdAt,
        })),
        total,
    };
}

export async function getFileById(id?: string): Promise<StoredFile | null> {
    await requireAuth();

    const file = await prisma.storedFiles.findUnique({
        where: { id },
    });

    if (!file) {
        return null;
    }

    return {
        id: file.id,
        url: file.url,
        name: file.name || "",
        type: file.type || "",
        size: file.sizeBytes || 0,
        purpose: file.purpose || "",
        bucket: file.bucket || "",
        order: file.order || 0,
        createdAt: file.createdAt,
    };
}

export async function updateFileOrder(
    id: string,
    newOrder: number,
    purpose: string,
    bucket: string = "default"
): Promise<StoredFile> {
    await requireAuth();

    const updatedFile = await prisma.storedFiles.update({
        where: { id },
        data: { order: newOrder },
    });

    return {
        id: updatedFile.id,
        url: updatedFile.url,
        name: updatedFile.name || "",
        type: updatedFile.type || "",
        size: updatedFile.sizeBytes || 0,
        purpose: updatedFile.purpose || "",
        bucket: updatedFile.bucket || bucket,
        order: updatedFile.order || 0,
        createdAt: updatedFile.createdAt,
    };
}

export async function updateFilesOrder(
    files: { id: string; order: number }[],
    purpose: string,
    bucket: string = "default"
): Promise<StoredFile[]> {
    await requireAuth();

    const updatedFiles = await prisma.$transaction(
        files.map((file) =>
            prisma.storedFiles.update({
                where: { id: file.id },
                data: { order: file.order },
            })
        )
    );

    return updatedFiles.map((file) => ({
        id: file.id,
        url: file.url,
        name: file.name || "",
        type: file.type || "",
        size: file.sizeBytes || 0,
        purpose: file.purpose || "",
        bucket: file.bucket || bucket,
        order: file.order || 0,
        createdAt: file.createdAt,
    }));
}

export interface BlobFile {
    url: string;
    pathname: string;
    size: number;
    uploadedAt: Date;
    downloadUrl: string;
}

export interface OrphanedFile extends BlobFile {
    isOrphaned: true;
    reason: "missing_in_db" | "manual_upload" | "failed_db_insert";
}

export interface FileComparisonResult {
    dbFiles: StoredFile[];
    blobFiles: BlobFile[];
    orphanedFiles: OrphanedFile[];
    missingBlobs: StoredFile[]; // DB에는 있지만 Blob에는 없는 파일들
    totalDbFiles: number;
    totalBlobFiles: number;
    totalOrphanedFiles: number;
}

export async function getAllBlobFiles(): Promise<BlobFile[]> {
    await requireAuth();

    try {
        const { blobs } = await list();

        return blobs.map((blob) => ({
            url: blob.url,
            pathname: blob.pathname,
            size: blob.size,
            uploadedAt: blob.uploadedAt,
            downloadUrl: blob.downloadUrl,
        }));
    } catch (error) {
        console.error("Error fetching blob files:", error);
        throw new Error("Failed to fetch blob files");
    }
}

export async function compareDbAndBlobFiles(): Promise<FileComparisonResult> {
    await requireAuth();

    try {
        // 병렬로 DB 파일과 Blob 파일 목록 가져오기
        const [dbFilesData, blobFiles] = await Promise.all([
            getAllFiles({ limit: 10000 }), // 큰 limit으로 모든 파일 가져오기
            getAllBlobFiles(),
        ]);

        const dbFiles = dbFilesData.files;

        // URL을 기준으로 매핑 생성
        const dbFileUrls = new Set(dbFiles.map((f) => f.url));
        const blobFileUrls = new Set(blobFiles.map((f) => f.url));

        // 고아 파일들 찾기 (Blob에는 있지만 DB에는 없는 파일들)
        const orphanedFiles: OrphanedFile[] = blobFiles
            .filter((blobFile) => !dbFileUrls.has(blobFile.url))
            .map((blobFile) => ({
                ...blobFile,
                isOrphaned: true as const,
                reason: "missing_in_db" as const,
            }));

        // 누락된 Blob들 찾기 (DB에는 있지만 Blob에는 없는 파일들)
        const missingBlobs = dbFiles.filter(
            (dbFile) => !blobFileUrls.has(dbFile.url)
        );

        return {
            dbFiles,
            blobFiles,
            orphanedFiles,
            missingBlobs,
            totalDbFiles: dbFiles.length,
            totalBlobFiles: blobFiles.length,
            totalOrphanedFiles: orphanedFiles.length,
        };
    } catch (error) {
        console.error("Error comparing DB and Blob files:", error);
        throw new Error("Failed to compare DB and Blob files");
    }
}

export async function registerOrphanedFiles(
    orphanedFiles: OrphanedFile[]
): Promise<StoredFile[]> {
    await requireAuth();

    if (!orphanedFiles || orphanedFiles.length === 0) {
        throw new Error("No orphaned files provided");
    }

    try {
        const registeredFiles = await Promise.all(
            orphanedFiles.map(async (orphanedFile) => {
                // 파일명 추출 (pathname에서)
                const fileName =
                    orphanedFile.pathname.split("/").pop() || "unknown";

                // 파일 타입 추정
                const fileExtension =
                    fileName.split(".").pop()?.toLowerCase() || "";
                let mimeType = "application/octet-stream";

                if (
                    ["jpg", "jpeg", "png", "gif", "webp"].includes(
                        fileExtension
                    )
                ) {
                    mimeType = `image/${
                        fileExtension === "jpg" ? "jpeg" : fileExtension
                    }`;
                } else if (["mp4", "mov", "avi"].includes(fileExtension)) {
                    mimeType = `video/${fileExtension}`;
                } else if (["mp3", "wav", "flac"].includes(fileExtension)) {
                    mimeType = `audio/${fileExtension}`;
                } else if (["pdf"].includes(fileExtension)) {
                    mimeType = "application/pdf";
                }

                const storedFile = await prisma.storedFiles.create({
                    data: {
                        url: orphanedFile.url,
                        name: fileName,
                        type: mimeType,
                        mimeType: mimeType,
                        sizeBytes: orphanedFile.size,
                        purpose: "orphaned-recovery",
                        bucket: "recovered",
                        order: 0,
                        width: 0,
                        height: 0,
                    },
                });

                return {
                    id: storedFile.id,
                    url: storedFile.url,
                    name: storedFile.name || fileName,
                    type: storedFile.type || mimeType,
                    size: storedFile.sizeBytes || orphanedFile.size,
                    purpose: storedFile.purpose || "orphaned-recovery",
                    bucket: storedFile.bucket || "recovered",
                    order: storedFile.order || 0,
                    createdAt: storedFile.createdAt,
                };
            })
        );

        return registeredFiles;
    } catch (error) {
        console.error("Error registering orphaned files:", error);
        throw new Error("Failed to register orphaned files");
    }
}

export interface GetFilesMetadataByUrlsParams {
    urls: string[];
}

export async function getFilesMetadataByUrls(
    input?: GetFilesMetadataByUrlsParams
): Promise<
    Map<
        string,
        {
            width: number;
            height: number;
            focusX: number;
            focusY: number;
        }
    >
> {
    if (!input) {
        return new Map();
    }

    try {
        const uniqueUrls = [...new Set(input.urls)];
        const filesMap = new Map<
            string,
            { width: number; height: number; focusX: number; focusY: number }
        >();

        // URL이 없는 경우 빈 Map 즉시 반환
        if (uniqueUrls.length === 0) {
            return filesMap;
        }

        // 배치 처리
        const BATCH_SIZE = 100;
        for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
            const batchUrls = uniqueUrls.slice(i, i + BATCH_SIZE);

            // 각 URL에 대해 캐시된 메타데이터 가져오기
            const batchPromises = batchUrls.map(async (url) => {
                const file = await prisma.storedFiles.findUnique({
                    where: { url },
                    select: {
                        width: true,
                        height: true,
                        focusX: true,
                        focusY: true,
                    },
                });

                return file
                    ? {
                          width: file.width || 0,
                          height: file.height || 0,
                          focusX: file.focusX || 0.5,
                          focusY: file.focusY || 0.5,
                      }
                    : null;
            });

            const results = await Promise.all(batchPromises);

            batchUrls.forEach((url, index) => {
                const metadata = results[index];
                if (metadata) {
                    filesMap.set(url, metadata);
                }
            });
        }

        return filesMap;
    } catch (error) {
        console.error("Error getting files by urls:", error);
        return new Map();
    }
}
