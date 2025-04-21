import { useMutation, useQueryClient } from "@tanstack/react-query";
import { metadataKeys } from "../queryKeys";
import {
    createCollectionMetadata,
    createNFTMetadata,
    linkCollectionMetadata,
    recoverNFTMetadata,
} from "../actions/metadata";
import type { METADATA_TYPE } from "../actions/metadata";
import type { CollectionContract } from "@prisma/client";
// 컬렉션 메타데이터 생성
export function useCreateCollectionMetadata() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            metadata,
            collectionKey,
        }: {
            metadata: METADATA_TYPE;
            collectionKey: string;
        }) => createCollectionMetadata(metadata, collectionKey),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: metadataKeys.lists() });
        },
    });
}

// NFT 메타데이터 생성
export function useCreateNFTMetadata() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (collection: CollectionContract) =>
            createNFTMetadata(collection),
        onSuccess: (_, collection) => {
            queryClient.invalidateQueries({
                queryKey: metadataKeys.nfts(collection.address),
            });
        },
    });
}

// 메타데이터와 컬렉션 연결
export function useLinkCollectionMetadata() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            metadataId,
            collectionAddress,
        }: {
            metadataId: string;
            collectionAddress: string;
        }) => linkCollectionMetadata(metadataId, collectionAddress),
        onSuccess: (_, variables) => {
            // 관련된 모든 쿼리 무효화
            queryClient.invalidateQueries({
                queryKey: metadataKeys.detail(variables.metadataId),
            });
            queryClient.invalidateQueries({
                queryKey: metadataKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: metadataKeys.collection(variables.collectionAddress),
            });
        },
    });
}

export function useRecoverNFTMetadata() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            collectionAddress,
            tokenId,
        }: {
            collectionAddress: string;
            tokenId: number;
        }) => recoverNFTMetadata({ collectionAddress, tokenId }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: metadataKeys.recovery.nft(
                    variables.collectionAddress,
                    variables.tokenId
                ),
            });

            queryClient.invalidateQueries({
                queryKey: metadataKeys.nfts(variables.collectionAddress),
            });
        },
    });
}
