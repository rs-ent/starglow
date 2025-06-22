import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    createCollectionMetadata,
    createNFTMetadata,
    linkCollectionMetadata,
    recoverNFTMetadata,
} from "../actions/metadata";
import { metadataKeys } from "../queryKeys";

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
            queryClient
                .invalidateQueries({ queryKey: metadataKeys.lists() })
                .catch((error) => {
                    console.error(error);
                });
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
            queryClient
                .invalidateQueries({
                    queryKey: metadataKeys.nfts(collection.address),
                })
                .catch((error) => {
                    console.error(error);
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
            queryClient
                .invalidateQueries({
                    queryKey: metadataKeys.detail(variables.metadataId),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: metadataKeys.lists(),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: metadataKeys.collection(
                        variables.collectionAddress
                    ),
                })
                .catch((error) => {
                    console.error(error);
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
            queryClient
                .invalidateQueries({
                    queryKey: metadataKeys.recovery.nft(
                        variables.collectionAddress,
                        variables.tokenId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({
                    queryKey: metadataKeys.nfts(variables.collectionAddress),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
