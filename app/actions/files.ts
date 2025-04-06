/// app\actions\files.ts

"use server";

import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma/client";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
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

    if (file.type.startsWith("image/")) {
        try {
            optimizedBuffer = await optimizeImage(file);
            optimizedType = "image/webp";
            optimizedSize = optimizedBuffer.length;
        } catch (error) {
            console.error("Error optimizing image:", error);
        }
    }

    const fileExt = optimizedBuffer ? "webp" : file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;

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

            if (file.type.startsWith("image/")) {
                try {
                    optimizedBuffer = await optimizeImage(file);
                    optimizedType = "image/webp";
                    optimizedSize = optimizedBuffer.length;
                } catch (error) {
                    console.error("Error optimizing image:", error);
                }
            }

            const fileExt = optimizedBuffer
                ? "webp"
                : file.name.split(".").pop();
            const fileName = `${uuidv4()}.${fileExt}`;

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
