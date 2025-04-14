"use client";

import { useState, useCallback } from "react";
import {
    StoredFile,
    IPFSUploadResult,
    IPFSMetadata,
    IPFSFileUploadResult,
} from "@/app/actions/files";
import {
    useFilesByPurposeAndBucket,
    useFileById,
    useIPFSMetadata,
    useAllIPFSMetadata,
} from "@/app/queries/filesQueries";
import {
    useUploadFile,
    useUploadFiles,
    useDeleteFile,
    useUpdateFileOrder,
    useUpdateFilesOrder,
    useUploadToIPFS,
    useUploadFileToIPFS,
    useUploadFilesToIPFS,
    useUploadToIPFSGroup,
    useCreateIpfsGroup,
    useListIpfsGroups,
    useGetIpfsGroup,
} from "@/app/mutations/filesMutations";
import { useToast } from "./useToast";

export function useFiles() {
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingToIPFS, setIsUploadingToIPFS] = useState(false);
    const toast = useToast();

    const uploadFilesMutation = useUploadFiles();
    const deleteFileMutation = useDeleteFile();
    const updateFileOrderMutation = useUpdateFileOrder();
    const updateFilesOrderMutation = useUpdateFilesOrder();
    const uploadToIPFSMutation = useUploadToIPFS();
    const uploadFileToIPFSMutation = useUploadFileToIPFS();
    const uploadFilesToIPFSMutation = useUploadFilesToIPFS();
    const uploadToIPFSGroupMutation = useUploadToIPFSGroup();
    const createIpfsGroupMutation = useCreateIpfsGroup();
    const listIpfsGroupsMutation = useListIpfsGroups();
    const getIpfsGroupMutation = useGetIpfsGroup();

    const getFiles = (purpose: string, bucket: string = "default") => {
        const { data: files = [], isLoading } = useFilesByPurposeAndBucket(
            purpose,
            bucket
        );
        return { files, isLoading };
    };

    const getFilesById = (id: string) => {
        const { data: file, isLoading } = useFileById(id);
        return { file, isLoading };
    };

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

    const uploadMetadataToIPFS = async (
        data: any
    ): Promise<IPFSUploadResult> => {
        setIsUploadingToIPFS(true);
        try {
            const result = await uploadToIPFSMutation.mutateAsync(data);
            toast.success("Metadata uploaded to IPFS successfully");
            return result;
        } catch (error) {
            console.error("Error uploading metadata to IPFS:", error);
            toast.error("Failed to upload metadata to IPFS");
            throw error;
        } finally {
            setIsUploadingToIPFS(false);
        }
    };

    const getAllIPFSMetadata = (
        type: string = "nft-metadata",
        limit: number = 100
    ) => {
        const { data = [], isLoading, error } = useAllIPFSMetadata(type, limit);
        return { metadata: data, isLoading, error };
    };

    const uploadFilesToIPFS = async (
        files: File[],
        purpose: string,
        bucket: string = "default",
        optimizeImages: boolean = true
    ): Promise<IPFSFileUploadResult[]> => {
        setIsUploading(true);
        try {
            const results = await uploadFilesToIPFSMutation.mutateAsync({
                files,
                purpose,
                bucket,
                optimizeImages,
            });

            const successCount = results.filter((r) => r.success).length;
            if (successCount > 0) {
                toast.success(
                    `${successCount} files uploaded successfully to IPFS`
                );
            } else {
                toast.error("Failed to upload files to IPFS");
            }

            return results;
        } catch (error) {
            console.error("Error uploading files to IPFS:", error);
            toast.error("Failed to upload files to IPFS");
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    const uploadFileToIPFS = async (
        file: File,
        purpose: string,
        bucket: string = "default",
        optimizeImages: boolean = true
    ): Promise<IPFSFileUploadResult> => {
        setIsUploading(true);
        try {
            const result = await uploadFileToIPFSMutation.mutateAsync({
                file,
                purpose,
                bucket,
                optimizeImages,
            });

            if (result.success) {
                toast.success("File uploaded successfully to IPFS");
            } else {
                toast.error("Failed to upload file to IPFS");
            }

            return result;
        } catch (error) {
            console.error("Error uploading file to IPFS:", error);
            toast.error("Failed to upload file to IPFS");
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    const createIpfsGroup = async (
        name: string,
        description?: string,
        isPublic: boolean = false
    ) => {
        try {
            const result = await createIpfsGroupMutation.mutateAsync({
                name,
                description,
                isPublic,
            });
            if (result.success) {
                toast.success("IPFS group created successfully");
            } else {
                toast.error(result.error || "Failed to create IPFS group");
            }
            return result;
        } catch (error) {
            console.error("Error creating IPFS group:", error);
            toast.error("Failed to create IPFS group");
            throw error;
        }
    };

    const uploadMetadataToIPFSGroup = async (
        data: any,
        groupName?: string,
        groupId?: string,
        description?: string
    ): Promise<IPFSUploadResult> => {
        setIsUploadingToIPFS(true);
        try {
            const result = await uploadToIPFSGroupMutation.mutateAsync({
                data,
                groupName,
                groupId,
                description,
            });
            if (result.success) {
                toast.success("Metadata uploaded to IPFS group successfully");
            } else {
                toast.error(
                    result.error || "Failed to upload metadata to IPFS group"
                );
            }
            return result;
        } catch (error) {
            console.error("Error uploading metadata to IPFS group:", error);
            toast.error("Failed to upload metadata to IPFS group");
            throw error;
        } finally {
            setIsUploadingToIPFS(false);
        }
    };

    const uploadFilesToIPFSGroup = async (
        files: File[],
        purpose: string,
        bucket: string,
        options: {
            groupId?: string;
            groupName?: string;
            optimizeImages?: boolean;
        }
    ): Promise<IPFSFileUploadResult[]> => {
        setIsUploading(true);
        try {
            // First upload files normally
            const uploadResults = await uploadFilesToIPFS(
                files,
                purpose,
                bucket,
                options.optimizeImages
            );

            // Then add successful uploads to group if groupId or groupName is provided
            if (
                (options.groupId || options.groupName) &&
                uploadResults.length > 0
            ) {
                const groupResult = options.groupId
                    ? { success: true, group: { id: options.groupId } }
                    : await createIpfsGroup(options.groupName!);

                if (groupResult.success && groupResult.group) {
                    // Return results with group information
                    return uploadResults.map((result) => ({
                        ...result,
                        groupId: groupResult.group!.id,
                    }));
                }
            }

            return uploadResults;
        } catch (error) {
            console.error("Error uploading files to IPFS group:", error);
            toast.error("Failed to upload files to IPFS group");
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    const listGroups = async (limit: number = 10, offset: number = 0) => {
        try {
            const result = await listIpfsGroupsMutation.mutateAsync({
                limit,
                offset,
            });
            return {
                groups: result.groups || [],
                success: result.success,
                error: result.error,
            };
        } catch (error) {
            console.error("Error listing IPFS groups:", error);
            toast.error("Failed to list IPFS groups");
            throw error;
        }
    };

    const getGroup = async (groupId: string) => {
        try {
            const result = await getIpfsGroupMutation.mutateAsync(groupId);
            return {
                group: result.group,
                success: result.success,
                error: result.error,
            };
        } catch (error) {
            console.error("Error fetching IPFS group:", error);
            toast.error("Failed to fetch IPFS group");
            throw error;
        }
    };

    return {
        isUploading,
        isUploadingToIPFS,
        getFiles,
        getFilesById,
        uploadFiles,
        deleteFiles,
        updateFileOrder,
        updateFilesOrder,
        uploadMetadataToIPFS,
        getAllIPFSMetadata,
        uploadFileToIPFS,
        uploadFilesToIPFS,
        uploadMetadataToIPFSGroup,
        createIpfsGroup,
        uploadFilesToIPFSGroup,
        listGroups,
        getGroup,
    };
}
