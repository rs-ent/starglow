import { useQuery } from "@tanstack/react-query";
import { metadataKeys } from "../queryKeys";
import { Metadata } from "@prisma/client";
import {
    getCollectionMetadata,
    getLinkableCollectionMetadata,
} from "../actions/metadata";

export function useCollectionMetadata(metadataId: string) {
    return useQuery({
        queryKey: metadataKeys.detail(metadataId),
        queryFn: () => getCollectionMetadata(metadataId),
    });
}

export function useLinkableCollectionMetadata() {
    return useQuery({
        queryKey: metadataKeys.lists(),
        queryFn: () => getLinkableCollectionMetadata(),
    });
}

export function useNFTMetadataStatus(collectionAddress: string) {
    return useQuery({
        queryKey: metadataKeys.nfts(collectionAddress),
        queryFn: () => getCollectionMetadata(collectionAddress),
        enabled: !!collectionAddress,
    });
}
