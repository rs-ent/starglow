/// app/hooks/useIpfs.ts

"use client";

// Re-export all query hooks
export {
    useIpfsFiles,
    useGroupFiles,
    useMetadata,
    useLinkableMetadata,
    usePinataGroups,
    usePinataGroup,
    usePinataGroupByName,
} from "../queries/ipfsQueries";

// Re-export all mutation hooks
export {
    useUploadFiles,
    useCreateMetadata,
    useCreateNFTMetadata,
    useLinkNFTs,
    useAttachMetadataToCollection,
    useCreateGroup,
} from "../mutations/ipfsMutations";
