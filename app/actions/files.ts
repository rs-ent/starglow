"use server";

import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma/client";
import { auth } from "@/app/auth/authSettings";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

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

export async function uploadFile(
    file: File,
    purpose: string,
    name?: string
): Promise<StoredFile> {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        // Get the current highest order for the purpose
        const currentFiles = await prisma.storedFiles.findMany({
            where: { purpose },
            orderBy: { order: "desc" },
            take: 1,
        });
        const nextOrder =
            currentFiles.length > 0 ? (currentFiles[0].order || 0) + 1 : 0;

        // Generate a unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = name || `${uuidv4()}.${fileExt}`;

        // Upload to Vercel Blob
        const { url } = await put(fileName, file, {
            access: "public",
        });

        // Save to database
        const storedFile = await prisma.storedFiles.create({
            data: {
                url,
                name: fileName,
                type: file.type,
                mimeType: file.type,
                sizeBytes: file.size,
                purpose,
                order: nextOrder,
                bucket: "vercel-blob",
            },
        });

        return {
            id: storedFile.id,
            url: storedFile.url,
            name: storedFile.name || fileName,
            type: storedFile.type || file.type,
            size: storedFile.sizeBytes || file.size,
            purpose: storedFile.purpose || purpose,
            order: storedFile.order || nextOrder,
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
    purpose: string = "other"
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
                const fileExt = file.name.split(".").pop();
                const fileName = `${uuidv4()}.${fileExt}`;

                const { url } = await put(fileName, file, {
                    access: "public",
                });

                const storedFile = await prisma.storedFiles.create({
                    data: {
                        url,
                        name: fileName,
                        type: file.type,
                        mimeType: file.type,
                        sizeBytes: file.size,
                        purpose,
                        order: nextOrder + index,
                        bucket: "vercel-blob",
                    },
                });

                return {
                    id: storedFile.id,
                    url: storedFile.url,
                    name: storedFile.name || fileName,
                    type: storedFile.type || file.type,
                    size: storedFile.sizeBytes || file.size,
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

export async function updateFileOrder(
    fileId: string,
    newOrder: number
): Promise<StoredFile> {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const updatedFile = await prisma.storedFiles.update({
            where: { id: fileId },
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
