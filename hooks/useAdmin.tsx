/// hooks\useAdmin.tsx

import { useState } from "react";
import { StoredImage } from "@prisma/client";

interface UseAdminReturn {
    // Banner Images
    uploadBannerImages: (files: File[]) => Promise<void>;
    deleteBannerImage: (id: string) => Promise<boolean>;
    getBannerImages: () => Promise<StoredImage[]>;
    isUploading: boolean;

    // Error Handling
    error: string | null;
    clearError: () => void;
}

export function useAdmin(): UseAdminReturn {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = () => setError(null);

    const uploadBannerImages = async (files: File[]) => {
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

    const getBannerImages = async (): Promise<StoredImage[]> => {
        try {
            const response = await fetch(
                "/api/admin/quests/missions/banner-images"
            );
            if (!response.ok) {
                throw new Error("Failed to fetch banner images");
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching banner images:", error);
            setError("Failed to fetch banner images");
            throw error;
        }
    };

    return {
        uploadBannerImages,
        deleteBannerImage,
        getBannerImages,
        isUploading,
        error,
        clearError,
    };
}
