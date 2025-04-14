/// app\queries\filesQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import {
    getFilesByPurposeAndBucket,
    getFileById,
    StoredFile,
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
