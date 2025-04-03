"use server";

import { prisma } from "@/lib/prisma/client";
import { auth } from "@/app/auth/authSettings";
import { supabase } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { StoredImage } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getBannerImages(): Promise<StoredImage[]> {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const images = await prisma.storedImage.findMany({
            where: {
                onBanner: true,
            },
            orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        });

        return images;
    } catch (error) {
        console.error("Error fetching banner images:", error);
        throw error;
    }
}

export async function uploadBannerImages(
    formData: FormData
): Promise<StoredImage[]> {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            throw new Error("No files provided");
        }

        const uploadedImages = await Promise.all(
            files.map(async (file) => {
                const fileExt = file.name.split(".").pop();
                const fileName = `${uuidv4()}.${fileExt}`;
                const filePath = fileName;

                // Upload to Supabase Storage
                const { data: uploadData, error: uploadError } =
                    await supabase.storage
                        .from("banner-images")
                        .upload(filePath, file);

                if (uploadError) {
                    throw uploadError;
                }

                // Get public URL
                const {
                    data: { publicUrl },
                } = supabase.storage
                    .from("banner-images")
                    .getPublicUrl(filePath);

                // Save to database
                return prisma.storedImage.create({
                    data: {
                        url: publicUrl,
                        type: "banner",
                        alt: file.name,
                        mimeType: file.type,
                        sizeBytes: file.size,
                        onBanner: true,
                    },
                });
            })
        );

        revalidatePath("/admin/quests/missions");
        return uploadedImages;
    } catch (error) {
        console.error("Error uploading banner images:", error);
        throw error;
    }
}

export async function updateBannerImageOrder(
    imageId: string,
    newOrder: number
): Promise<StoredImage> {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        if (!imageId || typeof newOrder !== "number") {
            throw new Error("Invalid request");
        }

        const updatedImage = await prisma.storedImage.update({
            where: { id: imageId },
            data: { order: newOrder },
        });

        revalidatePath("/admin/quests/missions");
        return updatedImage;
    } catch (error) {
        console.error("Error updating image order:", error);
        throw error;
    }
}

export async function deleteBannerImage(id: string): Promise<boolean> {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        // Get image from database
        const image = await prisma.storedImage.findUnique({
            where: { id },
        });

        if (!image) {
            throw new Error("Image not found");
        }

        // Extract file path from URL
        const filePath = image.url.split("/").pop();
        if (!filePath) {
            throw new Error("Invalid file path");
        }

        // Delete from Supabase Storage
        const { error: storageError } = await supabase.storage
            .from("banner-images")
            .remove([filePath]);

        if (storageError) {
            console.error("Error deleting from storage:", storageError);
            throw new Error("Error deleting file");
        }

        // Delete from database
        await prisma.storedImage.delete({
            where: { id },
        });

        revalidatePath("/admin/quests/missions");
        return true;
    } catch (error) {
        console.error("Error deleting banner image:", error);
        throw error;
    }
}
