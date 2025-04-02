/// hooks\useAdmin.tsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StoredImage } from "@prisma/client";
import {
    getBannerImages as getBannerImagesAction,
    uploadBannerImages as uploadBannerImagesAction,
    deleteBannerImage as deleteBannerImageAction,
    updateBannerImageOrder as updateBannerImageOrderAction,
} from "@/app/actions/admin/banner-images";

interface UseAdminReturn {
    // Banner Images
    uploadBannerImages: (files: File[]) => Promise<StoredImage[]>;
    deleteBannerImage: (id: string) => Promise<boolean>;
    updateBannerImageOrder: (
        imageId: string,
        newOrder: number
    ) => Promise<StoredImage>;
    getBannerImages: () => Promise<StoredImage[]>;
    isUploading: boolean;
    bannerImages: StoredImage[] | undefined;
    isLoading: boolean;

    // Error Handling
    error: string | null;
    clearError: () => void;
}

export function useAdmin(): UseAdminReturn {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const clearError = () => setError(null);

    // Fetch banner images with TanStack Query
    const { data: bannerImages, isLoading } = useQuery({
        queryKey: ["bannerImages"],
        queryFn: getBannerImagesAction,
    });

    // Upload banner images mutation
    const uploadMutation = useMutation({
        mutationFn: async (files: Blob[]) => {
            console.log("Files received in uploadMutation:", files);
            const formData = new FormData();
            files.forEach((file) => {
                console.log("Appending file to FormData:", file);
                formData.append("files", file);
            });
            console.log("FormData entries:", Array.from(formData.entries()));
            return uploadBannerImagesAction(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bannerImages"] });
        },
        onError: (error: Error) => {
            console.error("Error uploading images:", error);
            setError("Failed to upload images");
        },
    });

    // Delete banner image mutation
    const deleteMutation = useMutation({
        mutationFn: deleteBannerImageAction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bannerImages"] });
        },
        onError: (error: Error) => {
            console.error("Error deleting image:", error);
            setError("Failed to delete image");
        },
    });

    // Update banner image order mutation
    const updateOrderMutation = useMutation({
        mutationFn: ({
            imageId,
            newOrder,
        }: {
            imageId: string;
            newOrder: number;
        }) => updateBannerImageOrderAction(imageId, newOrder),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bannerImages"] });
        },
        onError: (error: Error) => {
            console.error("Error updating image order:", error);
            setError("Failed to update image order");
        },
    });

    const uploadBannerImages = async (
        files: File[]
    ): Promise<StoredImage[]> => {
        setIsUploading(true);
        clearError();

        try {
            const result = await uploadMutation.mutateAsync(
                files.map((file) => new Blob([file]))
            );
            return result;
        } catch (error) {
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    const deleteBannerImage = async (imageId: string): Promise<boolean> => {
        clearError();

        try {
            return await deleteMutation.mutateAsync(imageId);
        } catch (error) {
            return false;
        }
    };

    const updateBannerImageOrder = async (
        imageId: string,
        newOrder: number
    ): Promise<StoredImage> => {
        clearError();

        try {
            return await updateOrderMutation.mutateAsync({ imageId, newOrder });
        } catch (error) {
            throw error;
        }
    };

    const getBannerImages = async (): Promise<StoredImage[]> => {
        try {
            return await getBannerImagesAction();
        } catch (error) {
            console.error("Error fetching banner images:", error);
            throw error;
        }
    };

    return {
        uploadBannerImages,
        deleteBannerImage,
        updateBannerImageOrder,
        getBannerImages,
        isUploading,
        bannerImages,
        isLoading,
        error,
        clearError,
    };
}
