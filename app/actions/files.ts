"use server";

import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma/client";
import { auth } from "@/app/auth/authSettings";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

export interface StoredFile {
    id: string;
    url: string;
    name: string;
    type: string;
    size: number;
    purpose: string;
    order: number;
    createdAt: Date;
}

/**
 * 이미지 파일을 WebP 형식으로 변환하고 압축합니다.
 * @param file 원본 파일
 * @param quality 압축 품질 (0-100)
 * @returns 최적화된 이미지 버퍼
 */
async function optimizeImage(
    file: File,
    quality: number = 80
): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return sharp(buffer).webp({ quality }).toBuffer();
}

export async function uploadFile(
    file: File,
    purpose: string,
    name?: string,
    bucket: string = "vercel-blob"
): Promise<StoredFile> {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        // 이미지 파일인 경우 최적화
        let optimizedBuffer: Buffer | null = null;
        let optimizedType = file.type;
        let optimizedSize = file.size;

        if (file.type.startsWith("image/")) {
            try {
                optimizedBuffer = await optimizeImage(file);
                optimizedType = "image/webp";
                optimizedSize = optimizedBuffer.length;
            } catch (error) {
                console.error("Error optimizing image:", error);
                // 최적화 실패 시 원본 사용
            }
        }

        // 파일 이름 생성
        const fileExt = optimizedBuffer ? "webp" : file.name.split(".").pop();
        const fileName = name || `${uuidv4()}.${fileExt}`;

        // 최적화된 이미지가 있으면 그것을 사용, 없으면 원본 사용
        const fileToUpload = optimizedBuffer || file;

        // Vercel Blob에 업로드
        const { url } = await put(fileName, fileToUpload, {
            access: "public",
        });

        // 데이터베이스에 저장
        const storedFile = await prisma.storedFiles.create({
            data: {
                url,
                name: fileName,
                type: optimizedType,
                mimeType: optimizedType,
                sizeBytes: optimizedSize,
                purpose,
                order: 0, // 기본값
                bucket: bucket,
            },
        });

        return {
            id: storedFile.id,
            url: storedFile.url,
            name: storedFile.name || fileName,
            type: storedFile.type || optimizedType,
            size: storedFile.sizeBytes || optimizedSize,
            purpose: storedFile.purpose || purpose,
            order: storedFile.order || 0,
            createdAt: storedFile.createdAt,
        };
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
}

export async function deleteFile(id: string): Promise<boolean> {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        // Get file from database
        const file = await prisma.storedFiles.findUnique({
            where: { id },
        });

        if (!file) {
            throw new Error("File not found");
        }

        // Delete from database
        await prisma.storedFiles.delete({
            where: { id },
        });

        revalidatePath("/");
        return true;
    } catch (error) {
        console.error("Error deleting file:", error);
        throw error;
    }
}

export async function getFilesByPurpose(
    purpose: string
): Promise<StoredFile[]> {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const files = await prisma.storedFiles.findMany({
            where: {
                purpose,
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
            order: file.order || 0,
            createdAt: file.createdAt,
        }));
    } catch (error) {
        console.error("Error fetching files:", error);
        throw error;
    }
}

export async function getFilesByBucket(bucket: string): Promise<StoredFile[]> {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const files = await prisma.storedFiles.findMany({
            where: {
                bucket,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return files.map((file) => ({
            id: file.id,
            url: file.url,
            name: file.name || "",
            type: file.type || "",
            size: file.sizeBytes || 0,
            purpose: file.purpose || "",
            order: file.order || 0,
            createdAt: file.createdAt,
        }));
    } catch (error) {
        console.error("Error fetching files by bucket:", error);
        throw error;
    }
}

export async function uploadFiles(
    formData: FormData,
    purpose: string = "other",
    bucket: string = "vercel-blob"
): Promise<StoredFile[]> {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const files = formData.getAll("files") as File[];
        if (!files || files.length === 0) {
            throw new Error("No files provided");
        }

        // Get the current highest order for the purpose
        const currentFiles = await prisma.storedFiles.findMany({
            where: { purpose },
            orderBy: { order: "desc" },
            take: 1,
        });
        const nextOrder =
            currentFiles.length > 0 ? (currentFiles[0].order || 0) + 1 : 0;

        const uploadedFiles = await Promise.all(
            files.map(async (file, index) => {
                // 이미지 파일인 경우 최적화
                let optimizedBuffer: Buffer | null = null;
                let optimizedType = file.type;
                let optimizedSize = file.size;

                if (file.type.startsWith("image/")) {
                    try {
                        optimizedBuffer = await optimizeImage(file);
                        optimizedType = "image/webp";
                        optimizedSize = optimizedBuffer.length;
                    } catch (error) {
                        console.error("Error optimizing image:", error);
                        // 최적화 실패 시 원본 사용
                    }
                }

                // 파일 이름 생성
                const fileExt = optimizedBuffer
                    ? "webp"
                    : file.name.split(".").pop();
                const fileName = `${uuidv4()}.${fileExt}`;

                // 최적화된 이미지가 있으면 그것을 사용, 없으면 원본 사용
                const fileToUpload = optimizedBuffer || file;

                // Vercel Blob에 업로드
                const { url } = await put(fileName, fileToUpload, {
                    access: "public",
                });

                // 데이터베이스에 저장
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
                    },
                });

                return {
                    id: storedFile.id,
                    url: storedFile.url,
                    name: storedFile.name || fileName,
                    type: storedFile.type || optimizedType,
                    size: storedFile.sizeBytes || optimizedSize,
                    purpose: storedFile.purpose || purpose,
                    order: storedFile.order || nextOrder + index,
                    createdAt: storedFile.createdAt,
                };
            })
        );

        revalidatePath("/admin/files");
        return uploadedFiles;
    } catch (error) {
        console.error("Error uploading files:", error);
        throw error;
    }
}

export async function getFilesByPurposeAndBucket(
    purpose: string,
    bucket: string = "default"
): Promise<StoredFile[]> {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

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
            order: file.order || 0,
            createdAt: file.createdAt,
        }));
    } catch (error) {
        console.error("Error fetching files by purpose and bucket:", error);
        throw error;
    }
}

export async function getFileById(id: string): Promise<StoredFile | null> {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

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
            order: file.order || 0,
            createdAt: file.createdAt,
        };
    } catch (error) {
        console.error("Error fetching file by id:", error);
        throw error;
    }
}

export async function updateFileOrder(
    id: string,
    newOrder: number,
    purpose: string,
    bucket: string = "default"
): Promise<StoredFile> {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const updatedFile = await prisma.storedFiles.update({
            where: { id },
            data: { order: newOrder },
        });

        revalidatePath("/admin/files");
        return {
            id: updatedFile.id,
            url: updatedFile.url,
            name: updatedFile.name || "",
            type: updatedFile.type || "",
            size: updatedFile.sizeBytes || 0,
            purpose: updatedFile.purpose || "",
            order: updatedFile.order || 0,
            createdAt: updatedFile.createdAt,
        };
    } catch (error) {
        console.error("Error updating file order:", error);
        throw error;
    }
}
