/// app/mutations/factoryContractsMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    saveFactoryContract,
    saveFactoryContractParams,
    updateFactoryContractCollections,
    deployFactoryContract,
    createCollection,
    DeployFactoryParams,
    CreateCollectionParams,
} from "../actions/factoryContracts";
import { QUERY_KEYS } from "../queryKeys";

/**
 * 팩토리 컨트랙트 저장 뮤테이션 훅
 */
export function useSaveFactoryContract() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: saveFactoryContractParams) => {
            const result = await saveFactoryContract(params);
            if (!result.success || !result.data) {
                throw new Error(
                    result.error || "Failed to save factory contract"
                );
            }
            return result.data;
        },
        onSuccess: (data) => {
            // Invalidate factory contract list queries
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.FACTORY_CONTRACTS],
            });
            queryClient.invalidateQueries({
                queryKey: [
                    QUERY_KEYS.FACTORY_CONTRACTS,
                    "active",
                    data.networkId,
                ],
            });
        },
    });
}

/**
 * 팩토리 컨트랙트 컬렉션 목록 업데이트 뮤테이션 훅
 */
export function useUpdateFactoryContractCollections() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: { id: string; collections: string[] }) => {
            const result = await updateFactoryContractCollections(
                params.id,
                params.collections
            );
            if (!result.success || !result.data) {
                throw new Error(
                    result.error ||
                        "Failed to update factory contract collections"
                );
            }
            return result.data;
        },
        onSuccess: () => {
            // Invalidate factory contract list queries
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.FACTORY_CONTRACTS],
            });
        },
    });
}

/**
 * 팩토리 컨트랙트 배포 뮤테이션 훅
 */
export function useDeployFactoryContract() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: DeployFactoryParams) => {
            const result = await deployFactoryContract(params);
            if (!result.success || !result.data) {
                throw new Error(
                    result.error || "Failed to deploy factory contract"
                );
            }
            return result.data;
        },
        onSuccess: () => {
            // Invalidate factory contract list queries
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.FACTORY_CONTRACTS],
            });
        },
    });
}

/**
 * 컬렉션 생성 뮤테이션 훅
 */
export function useCreateCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: CreateCollectionParams) => {
            const result = await createCollection(params);
            if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to create collection");
            }
            return result.data;
        },
        onSuccess: () => {
            // Invalidate collection and factory contract queries
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.COLLECTION_CONTRACTS],
            });
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.FACTORY_CONTRACTS],
            });
        },
    });
}
