/// app\mutations\filesMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    uploadFile,
    deleteFile,
    updateFileOrder,
    updateFilesOrder,
    StoredFile,
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