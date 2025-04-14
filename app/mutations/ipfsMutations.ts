/// app/mutations/ipfsMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import {
    uploadIpfsFiles,
    uploadMetadata,
    createNFTMetadata,
    linkNFTsToMetadata,
    linkMetadataToCollection,
    createPinataGroup,
} from "../actions/ipfs";
import type { METADATA_TYPE } from "../actions/ipfs";

/**
 * Hook for uploading files to IPFS
 */
export function useUploadFiles() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ files, groupId }: { files: File[]; groupId?: string }) =>
            uploadIpfsFiles(files, groupId),
        onSuccess: (_, { groupId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.files.all,
            });
            if (groupId) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.ipfs.files.byGroup(groupId),
                });
            }
        },
    });
}

/**
 * Hook for creating metadata
 */
export function useCreateMetadata() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            metadata,
            groupId,
            collectionId,
        }: {
            metadata: METADATA_TYPE;
            groupId?: string;
            collectionId?: string;
        }) => uploadMetadata(metadata, groupId, collectionId),
        onSuccess: (_, { groupId, collectionId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.all,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.linkable,
            });

            if (collectionId) {
                queryClient.invalidateQueries({
                    queryKey:
                        queryKeys.ipfs.metadata.byCollection(collectionId),
                });
            }

            if (groupId) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.ipfs.files.byGroup(groupId),
                });
            }
        },
    });
}

/**
 * Hook for batch creating NFT metadata
 */
export function useCreateNFTMetadata() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            collectionId,
            mintAmount,
            batchSize = 10,
        }: {
            collectionId: string;
            mintAmount: number;
            batchSize?: number;
        }) => createNFTMetadata(collectionId, mintAmount, batchSize),
        onSuccess: (_, { collectionId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.all,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.byCollection(collectionId),
            });
        },
    });
}

/**
 * Hook for linking NFTs to metadata
 */
export function useLinkNFTs() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            nftIds,
            collectionId,
        }: {
            nftIds: string[];
            collectionId: string;
        }) => linkNFTsToMetadata({ nftIds, collectionId }),
        onSuccess: (_, { collectionId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.all,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.byCollection(collectionId),
            });
        },
    });
}

/**
 * Hook for linking metadata to a collection
 */
export function useAttachMetadataToCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            metadataId,
            collectionId,
        }: {
            metadataId: string;
            collectionId: string;
        }) => linkMetadataToCollection(metadataId, collectionId),
        onSuccess: (_, { metadataId, collectionId }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.byId(metadataId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.byCollection(collectionId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.linkable,
            });
        },
    });
}

/**
 * Hook for creating a Pinata group
 */
export function useCreateGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (name: string) => createPinataGroup({ name }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.groups.all,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.groups.byName(data.name),
            });
        },
    });
}
