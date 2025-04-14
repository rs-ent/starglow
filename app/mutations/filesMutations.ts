/// app\mutations\filesMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/queryKeys";
import {
    uploadFile,
    deleteFile,
    updateFileOrder,
    updateFilesOrder,
    StoredFile,
    uploadToIPFS,
    IPFSUploadResult,
    uploadFileToIPFS,
    uploadFilesToIPFS,
    IPFSFileUploadResult,
    uploadToIPFSGroup,
    createIpfsGroup,
    listIpfsGroups,
    getIpfsGroup,
} from "@/app/actions/files";

export function useUploadFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            file,
            purpose,
            bucket,
        }: {
            file: File;
            purpose: string;
            bucket: string;
        }) => {
            return uploadFile(file, purpose, bucket);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.byPurposeAndBucket(
                    variables.purpose,
                    variables.bucket
                ),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.byPurpose(variables.purpose),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.byBucket(variables.bucket),
            });
        },
    });
}

export function useUploadFiles() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            files,
            purpose,
            bucket = "default",
        }: {
            files: File[];
            purpose: string;
            bucket: string;
        }) => {
            return Promise.all(
                files.map((file) => uploadFile(file, purpose, bucket))
            );
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.byPurposeAndBucket(
                    variables.purpose,
                    variables.bucket
                ),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.byPurpose(variables.purpose),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.byBucket(variables.bucket),
            });
        },
    });
}

export function useDeleteFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            return deleteFile(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.all,
            });
        },
    });
}

export function useUpdateFileOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            newOrder,
            purpose,
            bucket = "default",
        }: {
            id: string;
            newOrder: number;
            purpose: string;
            bucket: string;
        }) => {
            return updateFileOrder(id, newOrder, purpose, bucket);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.byPurposeAndBucket(
                    variables.purpose,
                    variables.bucket
                ),
            });
        },
    });
}

export function useUpdateFilesOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            files,
            purpose,
            bucket = "default",
        }: {
            files: { id: string; order: number }[];
            purpose: string;
            bucket: string;
        }) => {
            return updateFilesOrder(files, purpose, bucket);
        },
        onSuccess: (data, variables) => {
            // Invalidate related queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.files.byPurposeAndBucket(
                    variables.purpose,
                    variables.bucket
                ),
            });
        },
    });
}

export function useUploadToIPFS() {
    return useMutation({
        mutationFn: async (data: any): Promise<IPFSUploadResult> => {
            return uploadToIPFS(data);
        },
    });
}

export function useUploadFileToIPFS() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            file,
            purpose,
            bucket,
            optimizeImages = true,
        }: {
            file: File;
            purpose: string;
            bucket: string;
            optimizeImages?: boolean;
        }) => {
            return uploadFileToIPFS(file, purpose, bucket, optimizeImages);
        },
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.files.byPurposeAndBucket(
                        variables.purpose,
                        variables.bucket
                    ),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.files.byPurpose(variables.purpose),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.files.byBucket(variables.bucket),
                });
            }
        },
    });
}

export function useUploadFilesToIPFS() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            files,
            purpose,
            bucket = "default",
            optimizeImages = true,
        }: {
            files: File[];
            purpose: string;
            bucket: string;
            optimizeImages?: boolean;
        }) => {
            return uploadFilesToIPFS(files, purpose, bucket, optimizeImages);
        },
        onSuccess: (data, variables) => {
            const hasSuccess = data.some((result) => result.success);
            if (hasSuccess) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.files.byPurposeAndBucket(
                        variables.purpose,
                        variables.bucket
                    ),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.files.byPurpose(variables.purpose),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.files.byBucket(variables.bucket),
                });
            }
        },
    });
}

export function useCreateIpfsGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            name,
            description,
            isPublic = false,
        }: {
            name: string;
            description?: string;
            isPublic?: boolean;
        }) => {
            return createIpfsGroup(name, description, isPublic);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.groups.all,
            });
        },
    });
}

export function useUploadToIPFSGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            data,
            groupName,
            groupId,
            description,
        }: {
            data: any;
            groupName?: string;
            groupId?: string;
            description?: string;
        }) => {
            return uploadToIPFSGroup(data, groupName, groupId, description);
        },
        onSuccess: (result) => {
            if (result.success && result.groupId) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.ipfs.groups.byId(result.groupId),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.ipfs.groups.files(result.groupId),
                });
            }
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.groups.all,
            });
        },
    });
}

export function useListIpfsGroups() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            limit = 10,
            offset = 0,
        }: {
            limit?: number;
            offset?: number;
        }) => {
            return listIpfsGroups(limit, offset);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.groups.all,
            });
        },
    });
}

export function useGetIpfsGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (groupId: string) => {
            return getIpfsGroup(groupId);
        },
        onSuccess: (data) => {
            if (data.success && data.group) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.ipfs.groups.byId(data.group.id),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.ipfs.groups.files(data.group.id),
                });
            }
        },
    });
}
