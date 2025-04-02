/// hooks\useAdmin.tsx

import { useState } from "react";
import { useQuest } from "./useQuest";
import { StoredImage } from "@prisma/client";

interface UseAdminReturn {
    // Banner Images
    uploadBannerImages: (files: File[]) => Promise<StoredImage[]>;
    deleteBannerImage: (id: string) => Promise<boolean>;
    updateBannerImageOrder: (
        imageId: string,
        newOrder: number
    ) => Promise<StoredImage>;
    isUploading: boolean;

    // Error Handling
    error: string | null;
    clearError: () => void;
}

export function useAdmin(): UseAdminReturn {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { getBannerImages } = useQuest();

    const clearError = () => setError(null);

    const uploadBannerImages = async (
        files: File[]
    ): Promise<StoredImage[]> => {
        setIsUploading(true);
        clearError();

        try {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append("files", file);
            });

            const response = await fetch(
                "/api/admin/quests/missions/banner-images",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error("Failed to upload images");
            }

            return await response.json();
        } catch (error) {
            console.error("Error uploading images:", error);
            setError("Failed to upload images");
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    const deleteBannerImage = async (imageId: string): Promise<boolean> => {
        clearError();

        try {
            const response = await fetch(
                `/api/admin/quests/missions/banner-images/${imageId}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete image");
            }

            return true;
        } catch (error) {
            console.error("Error deleting image:", error);
            setError("Failed to delete image");
            return false;
        }
    };

    const updateBannerImageOrder = async (
        imageId: string,
        newOrder: number
    ): Promise<StoredImage> => {
        clearError();

        try {
            const response = await fetch(
                "/api/admin/quests/missions/banner-images",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ imageId, newOrder }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to update image order");
            }

            return await response.json();
        } catch (error) {
            console.error("Error updating image order:", error);
            setError("Failed to update image order");
            throw error;
        }
    };

    return {
        uploadBannerImages,
        deleteBannerImage,
        updateBannerImageOrder,
        isUploading,
        error,
        clearError,
    };
}
