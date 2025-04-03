"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    uploadFile,
    deleteFile,
    getFilesByPurpose,
    getFilesByBucket,
    updateFileOrder,
    StoredFile,
} from "@/app/actions/files";
import { useToast } from "./useToast";
import { queryKeys } from "./queryKeys";

export function useFiles(purpose: string) {
    const [isUploading, setIsUploading] = useState(false);
    const toast = useToast();
    const queryClient = useQueryClient();

    // Query to fetch files by purpose
    const { data: files = [], isLoading } = useQuery({
        queryKey: queryKeys.files.byPurpose(purpose),
        queryFn: () => getFilesByPurpose(purpose),
    });

    // Mutation for uploading files
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            return uploadFile(file, purpose);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.byPurpose(purpose),
            });
            toast.success("File uploaded successfully");
        },
        onError: (error) => {
            console.error("Error uploading file:", error);
            toast.error("Failed to upload file");
        },
    });

    // Mutation for deleting files
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return deleteFile(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.byPurpose(purpose),
            });
            toast.success("File deleted successfully");
        },
        onError: (error) => {
            console.error("Error deleting file:", error);
            toast.error("Failed to delete file");
        },
    });

    // Mutation for updating file order
    const updateOrderMutation = useMutation({
        mutationFn: async ({
            id,
            newOrder,
        }: {
            id: string;
            newOrder: number;
        }) => {
            return updateFileOrder(id, newOrder);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.byPurpose(purpose),
            });
            toast.success("File order updated successfully");
        },
        onError: (error) => {
            console.error("Error updating file order:", error);
            toast.error("Failed to update file order");
        },
    });

    // Function to handle file upload
    const handleUpload = async (files: File[]): Promise<StoredFile[]> => {
        setIsUploading(true);
        try {
            const results = await Promise.all(
                files.map((file) => uploadMutation.mutateAsync(file))
            );
            return results;
        } finally {
            setIsUploading(false);
        }
    };

    // Function to handle file deletion
    const handleDelete = async (id: string): Promise<boolean> => {
        return await deleteMutation.mutateAsync(id);
    };

    // Function to handle file order update
    const handleUpdateOrder = async (
        id: string,
        newOrder: number
    ): Promise<StoredFile> => {
        return await updateOrderMutation.mutateAsync({ id, newOrder });
    };

    return {
        files,
        isLoading,
        isUploading,
        uploadFile: handleUpload,
        deleteFile: handleDelete,
        updateFileOrder: handleUpdateOrder,
    };
}

export function useFilesByBucket(bucket: string) {
    const [isUploading, setIsUploading] = useState(false);
    const toast = useToast();
    const queryClient = useQueryClient();

    // Query to fetch files by bucket
    const { data: files = [], isLoading } = useQuery({
        queryKey: queryKeys.files.byBucket(bucket),
        queryFn: () => getFilesByBucket(bucket),
    });

    // Mutation for uploading files
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            return uploadFile(file, "other", file.name);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.byBucket(bucket),
            });
            toast.success("File uploaded successfully");
        },
        onError: (error) => {
            console.error("Error uploading file:", error);
            toast.error("Failed to upload file");
        },
    });

    // Mutation for deleting files
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return deleteFile(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.byBucket(bucket),
            });
            toast.success("File deleted successfully");
        },
        onError: (error) => {
            console.error("Error deleting file:", error);
            toast.error("Failed to delete file");
        },
    });

    // Function to handle file upload
    const handleUpload = async (files: File[]): Promise<StoredFile[]> => {
        setIsUploading(true);
        try {
            const results = await Promise.all(
                files.map((file) => uploadMutation.mutateAsync(file))
            );
            return results;
        } finally {
            setIsUploading(false);
        }
    };

    // Function to handle file deletion
    const handleDelete = async (id: string): Promise<boolean> => {
        return await deleteMutation.mutateAsync(id);
    };

    return {
        files,
        isLoading,
        isUploading,
        uploadFile: handleUpload,
        deleteFile: handleDelete,
    };
}
