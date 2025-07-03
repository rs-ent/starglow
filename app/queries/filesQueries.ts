/// app\queries\filesQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import {
    getFilesByPurposeAndBucket,
    getFileById,
    getFilesMetadataByUrls,
    getAllFiles,
} from "@/app/actions/files";
import { queryKeys } from "@/app/queryKeys";

import type {
    GetFilesMetadataByUrlsParams,
    GetAllFilesParams,
} from "@/app/actions/files";

export function useFilesByPurposeAndBucket(purpose?: string, bucket?: string) {
    return useQuery({
        queryKey: queryKeys.files.byPurposeAndBucket(
            purpose || "",
            bucket || "default"
        ),
        queryFn: () =>
            getFilesByPurposeAndBucket(purpose || "", bucket || "default"),
        enabled: !!purpose || !!bucket,
    });
}

export function useFileById(id?: string) {
    return useQuery({
        queryKey: queryKeys.files.byId(id || ""),
        queryFn: () => getFileById(id),
        enabled: !!id,
    });
}

export function useFilesMetadataByUrls(input?: GetFilesMetadataByUrlsParams) {
    return useQuery({
        queryKey: queryKeys.files.metadataByUrls(input?.urls || []),
        queryFn: () => getFilesMetadataByUrls(input),
        enabled: input?.urls && input.urls.length > 0,
        staleTime: 3600 * 24, // 1 day
        gcTime: 3600 * 24 * 30, // 30 days
    });
}

export function useAllFiles(params?: GetAllFilesParams) {
    return useQuery({
        queryKey: queryKeys.files.allWithFilters(params),
        queryFn: () => getAllFiles(params),
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    });
}
