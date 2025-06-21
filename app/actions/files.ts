/// app\actions\files.ts

"use server";

import { put } from "@vercel/blob";
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

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight,
            });
        };
        img.onerror = () => resolve(null);
        img.src = URL.createObjectURL(file);
    });
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

    await prisma.storedFiles.delete({
        where: { id },
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

export async function getFileById(id: string): Promise<StoredFile | null> {
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
