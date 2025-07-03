/// app\mutations\filesMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    uploadFile,
    deleteFile,
    deleteFiles,
    updateFileOrder,
    updateFilesOrder,
    registerOrphanedFiles,
} from "@/app/actions/files";
import { queryKeys } from "@/app/queryKeys";

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
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.files.byPurposeAndBucket(
                        variables.purpose,
                        variables.bucket
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.files.byPurpose(variables.purpose),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.files.byBucket(variables.bucket),
                })
                .catch((error) => {
                    console.error(error);
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
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.files.byPurposeAndBucket(
                        variables.purpose,
                        variables.bucket
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.files.byPurpose(variables.purpose),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.files.byBucket(variables.bucket),
                })
                .catch((error) => {
                    console.error(error);
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
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.files.all,
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useDeleteFiles() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ids: string[]) => {
            return deleteFiles(ids);
        },
        onSuccess: () => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.files.all,
                })
                .catch((error) => {
                    console.error(error);
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
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.files.byPurposeAndBucket(
                        variables.purpose,
                        variables.bucket
                    ),
                })
                .catch((error) => {
                    console.error(error);
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
        onSuccess: (_data, variables) => {
            // Invalidate related queries
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.files.byPurposeAndBucket(
                        variables.purpose,
                        variables.bucket
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useRegisterOrphanedFiles() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (orphanedFiles: any[]) => {
            return registerOrphanedFiles(orphanedFiles);
        },
        onSuccess: () => {
            // 파일 비교 결과 및 전체 파일 목록 새로고침
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.files.comparison,
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.files.all,
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
