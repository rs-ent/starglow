/// app/hooks/useFactoryContracts.ts

"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
    useFactories,
    useFactoryCollections,
} from "../queries/factoryContractsQueries";
import {
    useDeployFactoryMutation,
    useUpdateFactoryMutation,
    useCreateCollectionMutation,
    useDeleteCollectionMutation,
} from "../mutations/factoryContractsMutations";
import { factoryKeys } from "../queryKeys";

// GET 훅 (조회 기능)
export interface UseFactoryGetProps {
    networkId?: string;
    factoryId?: string;
    includeInactive?: boolean;
    enabled?: boolean;
}

export function useFactoryGet({
    networkId,
    factoryId,
    includeInactive = false,
}: UseFactoryGetProps) {
    // 모든 Factory 조회 (networkId가 있는 경우만)
    const factoriesQuery = useFactories({
        networkId: networkId || "",
        includeInactive,
    });

    // Factory의 컬렉션 목록 조회 (factoryId가 있는 경우만)
    const collectionsQuery = useFactoryCollections({
        factoryId: factoryId || "",
        networkId,
    });

    return {
        // 데이터
        factories: factoriesQuery.data?.data,
        collections: collectionsQuery.data?.data,

        // 상태
        isLoading:
            (networkId ? factoriesQuery.isLoading : false) ||
            (factoryId ? collectionsQuery.isLoading : false),
        error: factoriesQuery.error || collectionsQuery.error,

        // 개별 쿼리 상태
        isLoadingFactories: networkId ? factoriesQuery.isLoading : false,
        isLoadingCollections: factoryId ? collectionsQuery.isLoading : false,

        // 원본 쿼리 객체 (고급 사용 사례용)
        factoriesQuery,
        collectionsQuery,
    };
}

// SET 훅 (수정 기능)
export interface UseFactorySetProps {
    networkId: string;
    walletId?: string;
}

export function useFactorySet({ networkId, walletId }: UseFactorySetProps) {
    const queryClient = useQueryClient();

    // Mutations
    const deployMutation = useDeployFactoryMutation();
    const updateMutation = useUpdateFactoryMutation();
    const createCollectionMutation = useCreateCollectionMutation();
    const deleteCollectionMutation = useDeleteCollectionMutation();

    return {
        // 작업 함수들
        deployFactory: deployMutation.mutateAsync,
        updateFactory: updateMutation.mutateAsync,
        createCollection: createCollectionMutation.mutateAsync,
        deleteCollection: deleteCollectionMutation.mutateAsync,

        // 작업 상태
        isProcessing:
            deployMutation.isPending ||
            updateMutation.isPending ||
            createCollectionMutation.isPending ||
            deleteCollectionMutation.isPending,

        // 개별 작업 상태
        isDeploying: deployMutation.isPending,
        isUpdating: updateMutation.isPending,
        isCreatingCollection: createCollectionMutation.isPending,
        isDeletingCollection: deleteCollectionMutation.isPending,

        // 에러
        error:
            deployMutation.error ||
            updateMutation.error ||
            createCollectionMutation.error ||
            deleteCollectionMutation.error,

        // 원본 mutation 객체들 (고급 사용 사례용)
        deployMutation,
        updateMutation,
        createCollectionMutation,
        deleteCollectionMutation,

        // 캐시 갱신
        refresh: async () => {
            if (networkId) {
                await queryClient.invalidateQueries({
                    queryKey: factoryKeys.byNetwork(networkId),
                });
            } else {
                // networkId가 없으면 모든 팩토리 쿼리 무효화
                await queryClient.invalidateQueries({
                    queryKey: factoryKeys.all,
                });
            }
        },
    };
}
