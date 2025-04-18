import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    NFTWithRelations,
    NFTFilters,
    NFTPaginationParams,
} from "@/components/admin/onchain/OnChain.types";
import {
    fetchNFTs,
    fetchNFTDetails,
    updateNFTStatus,
    transferNFTOwnership,
} from "@/app/actions/nfts";

// 개별 훅으로 분리하여 재사용성 향상
export function useNFTs(filters: NFTFilters, pagination: NFTPaginationParams) {
    return useQuery({
        queryKey: ["nfts", filters, pagination],
        queryFn: () => fetchNFTs(filters, pagination),
    });
}

export function useNFTDetails(nftId: string | null) {
    return useQuery({
        queryKey: ["nft", nftId],
        queryFn: () => fetchNFTDetails(nftId!),
        enabled: !!nftId,
    });
}

export function useUpdateNFTStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateNFTStatus,
        onSuccess: (updatedNFT) => {
            // 관련된 모든 쿼리 무효화
            queryClient.invalidateQueries({ queryKey: ["nfts"] });
            queryClient.invalidateQueries({
                queryKey: ["nft", updatedNFT.id],
            });
        },
    });
}

export function useTransferNFTOwnership() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: transferNFTOwnership,
        onSuccess: (updatedNFT) => {
            // 관련된 모든 쿼리 무효화
            queryClient.invalidateQueries({ queryKey: ["nfts"] });
            queryClient.invalidateQueries({
                queryKey: ["nft", updatedNFT.id],
            });
        },
    });
}

// 필요한 경우 모든 훅을 한번에 사용할 수 있는 통합 훅 제공
export function useNFTManager() {
    return {
        useNFTs,
        useNFTDetails,
        useUpdateNFTStatus,
        useTransferNFTOwnership,
    };
}
