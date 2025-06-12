/// app\queries\filesQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import {
    getFilesByPurposeAndBucket,
    getFileById,
    getFilesMetadataByUrls,
    GetFilesMetadataByUrlsParams,
} from "@/app/actions/files";
import { queryKeys } from "@/app/queryKeys";

export function useFilesByPurposeAndBucket(
    purpose: string,
    bucket: string = "default"
) {
    return useQuery({
        queryKey: queryKeys.files.byPurposeAndBucket(purpose, bucket),
        queryFn: () => getFilesByPurposeAndBucket(purpose, bucket),
    });
}

export function useFileById(id: string) {
    return useQuery({
        queryKey: queryKeys.files.byId(id),
        queryFn: () => getFileById(id),
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
