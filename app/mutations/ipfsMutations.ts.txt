/// app/mutations/ipfsMutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import {
    uploadIpfsFile,
    uploadIpfsFiles,
    uploadMetadata,
    linkMetadataToCollection,
    createNFTMetadata,
    linkNFTsToMetadata,
    createPinataGroup,
    createMetadataFolder,
    METADATA_TYPE,
} from "../actions/ipfs";
import type { GroupResponseItem, UploadResponse } from "pinata";
import type { Metadata, NFT } from "@prisma/client";

/**
 * Mutation for uploading a single file to IPFS
 */
export function useUploadIpfsFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            file,
            groupId,
            gateway = "ipfs://",
            network,
        }: {
            file: File;
            groupId?: string;
            gateway?: string;
            network?: string;
        }) => {
            return uploadIpfsFile(file, groupId, gateway, network);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.files.all,
            });

            if (variables.groupId) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.ipfs.files.byGroup(variables.groupId),
                });
            }
        },
    });
}

/**
 * Mutation for uploading multiple files to IPFS
 */
export function useUploadIpfsFiles() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            files,
            gateway = "ipfs://",
            network,
            groupId,
        }: {
            files: File[];
            gateway?: string;
            network?: string;
            groupId?: string;
        }) => {
            return uploadIpfsFiles(files, gateway, network, groupId);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.files.all,
            });

            if (variables.groupId) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.ipfs.files.byGroup(variables.groupId),
                });
            }
        },
    });
}

/**
 * Mutation for uploading NFT metadata
 */
export function useUploadMetadata() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            metadata,
            groupId,
            collectionId,
            gateway = "ipfs://",
            network,
        }: {
            metadata: METADATA_TYPE;
            groupId?: string;
            collectionId?: string;
            gateway?: string;
            network?: string;
        }) => {
            return uploadMetadata(
                metadata,
                groupId,
                collectionId,
                gateway,
                network
            );
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.all,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.linkable,
            });

            if (variables.collectionId) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.ipfs.metadata.byCollection(
                        variables.collectionId
                    ),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.collection.byId(variables.collectionId),
                });
            }

            if (data.id) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.ipfs.metadata.byId(data.id),
                });
            }
        },
    });
}

/**
 * Mutation for linking metadata to a collection
 */
export function useLinkMetadataToCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            metadataFolderId,
            collectionId,
        }: {
            metadataFolderId: string;
            collectionId: string;
        }) => {
            return linkMetadataToCollection(metadataFolderId, collectionId);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.all,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.byId(
                    variables.metadataFolderId
                ),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.folder(
                    variables.metadataFolderId
                ),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.collection.byId(variables.collectionId),
            });
        },
    });
}

/**
 * Mutation for creating NFT metadata in batches
 */
export function useCreateNFTMetadata() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            collectionId,
            mintAmount,
            batchSize = 10,
        }: {
            collectionId: string;
            mintAmount: number;
            batchSize?: number;
        }) => {
            return createNFTMetadata(collectionId, mintAmount, batchSize);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.all,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.linkable,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.byCollection(
                    variables.collectionId
                ),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.collection.byId(variables.collectionId),
            });
        },
    });
}

/**
 * Mutation for linking NFTs to metadata
 */
export function useLinkNFTsToMetadata() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            nftIds,
            collectionId,
            gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY ?? "ipfs://",
        }: {
            nftIds: string[];
            collectionId: string;
            gateway?: string;
        }) => {
            return linkNFTsToMetadata({ nftIds, collectionId, gateway });
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.all,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.linkable,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.byCollection(
                    variables.collectionId
                ),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.collection.byId(variables.collectionId),
            });

            // Invalidate each NFT's query
            data.forEach((nft) => {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.nft.byId(nft.id),
                });
            });

            // Invalidate the collection's NFTs query
            queryClient.invalidateQueries({
                queryKey: queryKeys.nft.byCollection(variables.collectionId),
            });
        },
    });
}

/**
 * Mutation for creating a Pinata group
 */
export function useCreatePinataGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ name }: { name: string }) => {
            return createPinataGroup({ name });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.groups.all,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.groups.byId(data.id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.groups.byName(data.name),
            });
        },
    });
}

/**
 * Mutation for creating a metadata folder
 */
export function useCreateMetadataFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            metadataId,
            maxSupply,
            gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY ?? "ipfs://",
        }: {
            metadataId: string;
            maxSupply: number;
            gateway?: string;
        }) => {
            return createMetadataFolder(metadataId, maxSupply, gateway);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.all,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.byId(variables.metadataId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.ipfs.metadata.folder(variables.metadataId),
            });
        },
    });
}
