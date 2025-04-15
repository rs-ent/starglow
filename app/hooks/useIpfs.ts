/// app/hooks/useIpfs.ts

import { useState } from "react";
import type { IpfsFile, Metadata, NFT } from "@prisma/client";
import type { GroupResponseItem, UploadResponse } from "pinata";
import type { METADATA_TYPE } from "../actions/ipfs";

// Import queries
import {
    useIpfsFiles,
    useGroupFiles,
    useMetadata,
    useLinkableMetadata,
    usePinataGroupById,
    usePinataGroupByName,
    usePinataGroups,
    useCreateMetadataFolder,
} from "../queries/ipfsQueries";

// Import mutations
import {
    useUploadIpfsFile,
    useUploadIpfsFiles,
    useUploadMetadata,
    useLinkMetadataToCollection,
    useCreateNFTMetadata,
    useLinkNFTsToMetadata,
    useCreatePinataGroup,
    useCreateMetadataFolder as useCreateMetadataFolderMutation,
} from "../mutations/ipfsMutations";

/**
 * Main hook for IPFS operations
 * Combines all IPFS queries and mutations for comprehensive IPFS management
 */
export function useIpfs() {
    const [selectedGroupId, setSelectedGroupId] = useState<
        string | undefined
    >();
    const [selectedFileId, setSelectedFileId] = useState<string | undefined>();
    const [selectedMetadataId, setSelectedMetadataId] = useState<
        string | undefined
    >();

    // Queries
    const ipfsFilesQuery = useIpfsFiles();
    const groupFilesQuery = useGroupFiles(selectedGroupId || "");
    const metadataQuery = useMetadata(selectedMetadataId || "");
    const linkableMetadataQuery = useLinkableMetadata();
    const pinataGroupByIdQuery = usePinataGroupById(selectedGroupId || "");
    const pinataGroupsQuery = usePinataGroups();

    // Mutations
    const uploadFileMutation = useUploadIpfsFile();
    const uploadFilesMutation = useUploadIpfsFiles();
    const uploadMetadataMutation = useUploadMetadata();
    const linkMetadataToCollectionMutation = useLinkMetadataToCollection();
    const createNFTMetadataMutation = useCreateNFTMetadata();
    const linkNFTsToMetadataMutation = useLinkNFTsToMetadata();
    const createPinataGroupMutation = useCreatePinataGroup();
    const createMetadataFolderMutation = useCreateMetadataFolderMutation();

    // Helper functions
    const selectGroup = (groupId: string) => {
        setSelectedGroupId(groupId);
    };

    const selectFile = (fileId: string) => {
        setSelectedFileId(fileId);
    };

    const selectMetadata = (metadataId: string) => {
        setSelectedMetadataId(metadataId);
    };

    const uploadFile = async (
        file: File,
        options?: {
            groupId?: string;
            gateway?: string;
            network?: string;
        }
    ) => {
        return uploadFileMutation.mutateAsync({
            file,
            groupId: options?.groupId || selectedGroupId,
            gateway: options?.gateway || "ipfs://",
            network: options?.network,
        });
    };

    const uploadFiles = async (
        files: File[],
        options?: {
            groupId?: string;
            gateway?: string;
            network?: string;
        }
    ) => {
        return uploadFilesMutation.mutateAsync({
            files,
            groupId: options?.groupId || selectedGroupId,
            gateway: options?.gateway || "ipfs://",
            network: options?.network,
        });
    };

    const uploadNftMetadata = async (
        metadata: METADATA_TYPE,
        options?: {
            groupId?: string;
            collectionId?: string;
            gateway?: string;
            network?: string;
        }
    ) => {
        return uploadMetadataMutation.mutateAsync({
            metadata,
            groupId: options?.groupId || selectedGroupId,
            collectionId: options?.collectionId,
            gateway: options?.gateway || "ipfs://",
            network: options?.network,
        });
    };

    const createGroup = async (name: string) => {
        const group = await createPinataGroupMutation.mutateAsync({ name });
        return group;
    };

    const getPinataGroupByName = async (name: string) => {
        const groupByNameQuery = usePinataGroupByName(name);
        return groupByNameQuery.data;
    };

    const createBatchNFTMetadata = async (
        collectionId: string,
        mintAmount: number,
        batchSize = 10
    ) => {
        return createNFTMetadataMutation.mutateAsync({
            collectionId,
            mintAmount,
            batchSize,
        });
    };

    const linkNFTsToMetadata = async ({
        nftIds,
        collectionId,
    }: {
        nftIds: string[];
        collectionId: string;
    }) => {
        return linkNFTsToMetadataMutation.mutateAsync({ nftIds, collectionId });
    };

    const linkMetadataToCollection = async (
        metadataFolderId: string,
        collectionId: string
    ) => {
        return linkMetadataToCollectionMutation.mutateAsync({
            metadataFolderId,
            collectionId,
        });
    };

    const createFolder = async (
        metadataId: string,
        maxSupply: number,
        gateway?: string
    ) => {
        return createMetadataFolderMutation.mutateAsync({
            metadataId,
            maxSupply,
            gateway,
        });
    };

    return {
        // State
        selectedGroupId,
        selectedFileId,
        selectedMetadataId,

        // Queries data
        files: ipfsFilesQuery.data,
        groupFiles: groupFilesQuery.data,
        metadata: metadataQuery.data,
        linkableMetadata: linkableMetadataQuery.data,
        selectedGroup: pinataGroupByIdQuery.data,
        groups: pinataGroupsQuery.data,

        // Query loading states
        isLoadingFiles: ipfsFilesQuery.isLoading,
        isLoadingGroupFiles: groupFilesQuery.isLoading,
        isLoadingMetadata: metadataQuery.isLoading,
        isLoadingLinkableMetadata: linkableMetadataQuery.isLoading,
        isLoadingGroup: pinataGroupByIdQuery.isLoading,
        isLoadingGroups: pinataGroupsQuery.isLoading,

        // Mutation loading states
        isUploading:
            uploadFileMutation.isPending || uploadFilesMutation.isPending,
        isUploadingMetadata: uploadMetadataMutation.isPending,
        isCreatingGroup: createPinataGroupMutation.isPending,
        isCreatingNFTMetadata: createNFTMetadataMutation.isPending,
        isLinkingNFTs: linkNFTsToMetadataMutation.isPending,
        isLinkingMetadata: linkMetadataToCollectionMutation.isPending,
        isCreatingFolder: createMetadataFolderMutation.isPending,
        isLinkingToCollection: linkMetadataToCollectionMutation.isPending,

        // Setters
        selectGroup,
        selectFile,
        selectMetadata,

        // Actions
        uploadFile,
        uploadFiles,
        uploadNftMetadata,
        createGroup,
        getPinataGroupByName,
        createBatchNFTMetadata,
        linkNFTsToMetadata,
        linkMetadataToCollection,
        createFolder,

        // Original queries and mutations for advanced usage
        queries: {
            ipfsFilesQuery,
            groupFilesQuery,
            metadataQuery,
            linkableMetadataQuery,
            pinataGroupByIdQuery,
            pinataGroupsQuery,
            useCreateMetadataFolder,
        },
        mutations: {
            uploadFileMutation,
            uploadFilesMutation,
            uploadMetadataMutation,
            linkMetadataToCollectionMutation,
            createNFTMetadataMutation,
            linkNFTsToMetadataMutation,
            createPinataGroupMutation,
            createMetadataFolderMutation,
        },
    };
}
