/// app/queries/ipfsQueries.ts

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import {
    getIpfsFiles,
    getGroupFiles,
    getMetadata,
    getLinkableMetadata,
    getPinataGroupById,
    getPinataGroupByName,
    getPinataGroups,
    createMetadataFolder,
} from "../actions/ipfs";
import type { GroupResponseItem } from "pinata";
import type { IpfsFile, Metadata } from "@prisma/client";

/**
 * Fetches all IPFS files
 */
export function useIpfsFiles() {
    return useQuery({
        queryKey: queryKeys.ipfs.files.all,
        queryFn: () => getIpfsFiles(),
    });
}

/**
 * Fetches IPFS files by group ID
 */
export function useGroupFiles(groupId: string) {
    return useQuery({
        queryKey: queryKeys.ipfs.files.byGroup(groupId),
        queryFn: () => getGroupFiles(groupId),
        enabled: !!groupId,
    });
}

/**
 * Fetches metadata by ID
 */
export function useMetadata(metadataId: string) {
    return useQuery<Metadata>({
        queryKey: queryKeys.ipfs.metadata.byId(metadataId),
        queryFn: () => getMetadata(metadataId),
        enabled: !!metadataId,
    });
}

/**
 * Fetches all linkable (unlinked) metadata
 */
export function useLinkableMetadata() {
    return useQuery<Metadata[]>({
        queryKey: queryKeys.ipfs.metadata.linkable,
        queryFn: () => getLinkableMetadata(),
    });
}

/**
 * Fetches Pinata group by ID
 */
export function usePinataGroupById(groupId: string) {
    return useQuery<GroupResponseItem | null>({
        queryKey: queryKeys.ipfs.groups.byId(groupId),
        queryFn: () => getPinataGroupById(groupId),
        enabled: !!groupId,
    });
}

/**
 * Fetches Pinata group by name
 */
export function usePinataGroupByName(name: string) {
    return useQuery<GroupResponseItem | null>({
        queryKey: queryKeys.ipfs.groups.byName(name),
        queryFn: () => getPinataGroupByName(name),
        enabled: !!name,
    });
}

/**
 * Fetches all Pinata groups
 */
export function usePinataGroups() {
    return useQuery<GroupResponseItem[]>({
        queryKey: queryKeys.ipfs.groups.all,
        queryFn: () => getPinataGroups(),
    });
}

/**
 * 메타데이터 폴더 생성 쿼리
 */
export function useCreateMetadataFolder(metadataId: string, maxSupply: number) {
    return useQuery<Metadata>({
        queryKey: queryKeys.ipfs.metadata.folder(metadataId),
        queryFn: () => createMetadataFolder(metadataId, maxSupply),
        enabled: !!metadataId && maxSupply > 0,
    });
}
