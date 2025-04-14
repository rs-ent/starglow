/// app\queries\filesQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import {
    getFilesByPurposeAndBucket,
    getFileById,
    StoredFile,
    getMetadataFromIPFS,
    IPFSMetadata,
    getAllIPFSMetadata,
    IPFSUploadResult,
    getIpfsGroup,
    listIpfsGroups,
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

export const useIPFSMetadata = (cid?: string) => {
    return useQuery({
        queryKey: queryKeys.ipfs.metadata(cid || ""),
        queryFn: async () => {
            if (!cid) return null;
            return getMetadataFromIPFS(cid);
        },
        enabled: !!cid,
    });
};

export const useAllIPFSMetadata = (
    type: string = "nft-metadata",
    limit: number = 100
) => {
    return useQuery({
        queryKey: queryKeys.ipfs.all(type, limit),
        queryFn: () => getAllIPFSMetadata(type, limit),
    });
};

export function useIpfsGroups(limit: number = 10, offset: number = 0) {
    return useQuery({
        queryKey: queryKeys.ipfs.groups.list(limit, offset),
        queryFn: () => listIpfsGroups(limit, offset),
        staleTime: 1000 * 60, // 1분
    });
}

export function useIpfsGroup(groupId: string) {
    return useQuery({
        queryKey: queryKeys.ipfs.groups.byId(groupId),
        queryFn: () => getIpfsGroup(groupId),
        enabled: !!groupId,
        staleTime: 1000 * 60, // 1분
    });
}

export function useIpfsGroupFiles(groupId: string) {
    return useQuery({
        queryKey: queryKeys.ipfs.groups.files(groupId),
        queryFn: async () => {
            const result = await getIpfsGroup(groupId);
            return result.success ? result.group?.files : [];
        },
        enabled: !!groupId,
        staleTime: 1000 * 60, // 1분
    });
}
