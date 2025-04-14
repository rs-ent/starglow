/// app/queries/ipfsQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import {
    getIpfsFiles,
    getGroupFiles,
    getMetadata,
    getLinkableMetadata,
    getPinataGroups,
    getPinataGroupById,
    getPinataGroupByName,
} from "../actions/ipfs";
import { IpfsFile, Metadata } from "@prisma/client";

/**
 * Hook for fetching all IPFS files
 */
export function useIpfsFiles() {
    return useQuery({
        queryKey: queryKeys.ipfs.files.all,
        queryFn: () => getIpfsFiles(),
    });
}

/**
 * Hook for fetching files from a specific group
 */
export function useGroupFiles(groupId: string) {
    return useQuery({
        queryKey: queryKeys.ipfs.files.byGroup(groupId),
        queryFn: () => getGroupFiles(groupId),
        enabled: !!groupId,
    });
}

/**
 * Hook for fetching a specific metadata by ID
 */
export function useMetadata(metadataId: string) {
    return useQuery({
        queryKey: queryKeys.ipfs.metadata.byId(metadataId),
        queryFn: () => getMetadata(metadataId),
        enabled: !!metadataId,
    });
}

/**
 * Hook for fetching metadata by IPFS CID
 */
export function useIPFSMetadata(cid: string) {
    return useQuery({
        queryKey: queryKeys.ipfs.metadata.byCid(cid),
        queryFn: async () => {
            if (!cid) return null;

            try {
                // IPFS 게이트웨이 URL로 변환
                const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
                const response = await fetch(gatewayUrl);
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch metadata: ${response.statusText}`
                    );
                }
                const metadata = await response.json();
                return { metadata, cid };
            } catch (error) {
                console.error("Error fetching IPFS metadata:", error);
                throw error;
            }
        },
        enabled: !!cid,
    });
}

/**
 * Hook for fetching linkable metadata (not connected to any collection)
 */
export function useLinkableMetadata() {
    return useQuery({
        queryKey: queryKeys.ipfs.metadata.linkable,
        queryFn: () => getLinkableMetadata(),
    });
}

/**
 * Hook for fetching all Pinata groups
 */
export function usePinataGroups() {
    return useQuery({
        queryKey: queryKeys.ipfs.groups.all,
        queryFn: () => getPinataGroups(),
    });
}

/**
 * Hook for fetching a specific Pinata group by ID
 */
export function usePinataGroup(id: string) {
    return useQuery({
        queryKey: queryKeys.ipfs.groups.byId(id),
        queryFn: () => getPinataGroupById(id),
        enabled: !!id,
    });
}

/**
 * Hook for fetching a Pinata group by name
 */
export function usePinataGroupByName(name: string) {
    return useQuery({
        queryKey: queryKeys.ipfs.groups.byName(name),
        queryFn: () => getPinataGroupByName(name),
        enabled: !!name,
    });
}
