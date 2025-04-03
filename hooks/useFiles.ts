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
    getFilesByPurposeAndBucket,
    getFileById,
} from "@/app/actions/files";
import { useToast } from "./useToast";
import { queryKeys } from "./queryKeys";

export function useFiles() {
    const [isUploading, setIsUploading] = useState(false);
    const toast = useToast();
    const queryClient = useQueryClient();

    // 파일 목록 조회 (purpose와 bucket 필수)
    const getFiles = (purpose: string, bucket: string = "default") => {
        const { data: files = [], isLoading } = useQuery({
            queryKey: queryKeys.files.byPurposeAndBucket(purpose, bucket),
            queryFn: () => getFilesByPurposeAndBucket(purpose, bucket),
        });

        return { files, isLoading };
    };

    // ID로 파일 조회
    const getFilesById = (id: string) => {
        const { data: file, isLoading } = useQuery({
            queryKey: queryKeys.files.byId(id),
            queryFn: () => getFileById(id),
        });

        return { file, isLoading };
    };

    // 파일 업로드
    const uploadFiles = async (
        files: File[],
        purpose: string,
        bucket: string = "default"
    ): Promise<StoredFile[]> => {
        setIsUploading(true);
        try {
            const results = await Promise.all(
                files.map((file) => uploadFile(file, purpose, bucket))
            );
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.byPurposeAndBucket(purpose, bucket),
            });
            toast.success("Files uploaded successfully");
            return results;
        } catch (error) {
            console.error("Error uploading files:", error);
            toast.error("Failed to upload files");
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    // 파일 삭제
    const deleteFiles = async (ids: string[]): Promise<boolean[]> => {
        try {
            const results = await Promise.all(ids.map((id) => deleteFile(id)));
            // 모든 관련 쿼리 무효화
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.all,
            });
            toast.success("Files deleted successfully");
            return results;
        } catch (error) {
            console.error("Error deleting files:", error);
            toast.error("Failed to delete files");
            throw error;
        }
    };

    // 파일 순서 변경
    const updateFileOrder = async (
        id: string,
        newOrder: number,
        purpose: string,
        bucket: string = "default"
    ): Promise<StoredFile> => {
        try {
            const result = await updateFileOrder(id, newOrder, purpose, bucket);
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.byPurposeAndBucket(purpose, bucket),
            });
            toast.success("File order updated successfully");
            return result;
        } catch (error) {
            console.error("Error updating file order:", error);
            toast.error("Failed to update file order");
            throw error;
        }
    };

    return {
        isUploading,
        getFiles,
        getFilesById,
        uploadFiles,
        deleteFiles,
        updateFileOrder,
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
