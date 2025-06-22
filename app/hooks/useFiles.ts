"use client";

import { useState } from "react";

import {
    useUploadFiles,
    useDeleteFile,
    useUpdateFileOrder,
    useUpdateFilesOrder,
} from "@/app/mutations/filesMutations";
import {
    useFilesByPurposeAndBucket,
    useFileById,
    useFilesMetadataByUrls,
} from "@/app/queries/filesQueries";

import { useToast } from "./useToast";

import type {
    GetFilesMetadataByUrlsParams,
    StoredFile,
} from "@/app/actions/files";

export interface UseFilesInput {
    getFilesInput?: {
        purpose: string;
        bucket: string;
    };
    getFileInput?: {
        fileId: string;
    };
}

export function useFiles(input?: UseFilesInput) {
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingToIPFS, _setIsUploadingToIPFS] = useState(false);
    const toast = useToast();

    const uploadFilesMutation = useUploadFiles();
    const deleteFileMutation = useDeleteFile();
    const updateFileOrderMutation = useUpdateFileOrder();
    const updateFilesOrderMutation = useUpdateFilesOrder();

    const { data: files = [], isLoading } = useFilesByPurposeAndBucket(
        input?.getFilesInput?.purpose,
        input?.getFilesInput?.bucket
    );

    const { data: file, isLoading: isFileLoading } = useFileById(
        input?.getFileInput?.fileId
    );

    const uploadFiles = async (
        files: File[],
        purpose: string,
        bucket: string = "default"
    ): Promise<StoredFile[]> => {
        setIsUploading(true);
        try {
            const results = await uploadFilesMutation.mutateAsync({
                files,
                purpose,
                bucket,
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

    const deleteFiles = async (ids: string[]): Promise<boolean[]> => {
        try {
            const results = await Promise.all(
                ids.map((id) => deleteFileMutation.mutateAsync(id))
            );
            toast.success("Files deleted successfully");
            return results;
        } catch (error) {
            console.error("Error deleting files:", error);
            toast.error("Failed to delete files");
            throw error;
        }
    };

    const updateFileOrder = async (
        id: string,
        newOrder: number,
        purpose: string,
        bucket: string = "default"
    ): Promise<StoredFile> => {
        try {
            const result = await updateFileOrderMutation.mutateAsync({
                id,
                newOrder,
                purpose,
                bucket,
            });
            toast.success("File order updated successfully");
            return result;
        } catch (error) {
            console.error("Error updating file order:", error);
            toast.error("Failed to update file order");
            throw error;
        }
    };

    const updateFilesOrder = async (
        files: { id: string; order: number }[],
        purpose: string,
        bucket: string = "default"
    ): Promise<StoredFile[]> => {
        try {
            const results = await updateFilesOrderMutation.mutateAsync({
                files,
                purpose,
                bucket,
            });
            toast.success("Files order updated successfully");
            return results;
        } catch (error) {
            console.error("Error updating files order:", error);
            toast.error("Failed to update files order");
            throw error;
        }
    };

    return {
        isUploading,
        isUploadingToIPFS,
        files,
        isLoading,
        file,
        isFileLoading,
        uploadFiles,
        deleteFiles,
        updateFileOrder,
        updateFilesOrder,
    };
}

export interface UseFilesV2Input {
    getFilesMetadataInput?: GetFilesMetadataByUrlsParams;
}

export function useFilesV2(input?: UseFilesV2Input) {
    const {
        data: filesMetadata = new Map(),
        isLoading: isLoadingFilesMetadata,
        refetch: refetchFilesMetadata,
    } = useFilesMetadataByUrls(input?.getFilesMetadataInput);

    return {
        filesMetadata,
        isLoadingFilesMetadata,
        refetchFilesMetadata,
    };
}
