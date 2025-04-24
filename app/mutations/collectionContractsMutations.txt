/// app/mutations/collectionMutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    mintTokens,
    setBaseURI,
    togglePause,
    toggleMinting,
    updateCollectionSettings,
    type MintTokensParams,
    type SetBaseURIParams,
    type TogglePauseParams,
    type ToggleMintingParams,
    type UpdateCollectionSettingsInput,
} from "../actions/collectionContracts";
import { collectionKeys } from "../queryKeys";

const handleMutationError = (error: unknown): string => {
    console.error("Mutation error:", error);
    return error instanceof Error ? error.message : "An unknown error occurred";
};

/**
 * Mutation for minting tokens
 */
export function useMintTokensMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: MintTokensParams) => {
            const result = await mintTokens(params);
            if (!result.success) {
                throw new Error(result.error || "Failed to mint tokens");
            }
            return result.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: collectionKeys.detail(variables.collectionAddress),
            });
        },
        onError: handleMutationError,
    });
}
/**
 * Mutation for setting base URI
 */
export function useSetBaseURIMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: SetBaseURIParams) => {
            const result = await setBaseURI(params);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: collectionKeys.detail(variables.collectionAddress),
            });
        },
        onError: handleMutationError,
    });
}

/**
 * Mutation for toggling pause state
 */
export function useTogglePauseMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: TogglePauseParams) => {
            const result = await togglePause(params);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: (_, variables) => {
            // 상태와 상세 정보 모두 무효화
            queryClient.invalidateQueries({
                queryKey: collectionKeys.status(variables.collectionAddress),
            });
            queryClient.invalidateQueries({
                queryKey: collectionKeys.detail(variables.collectionAddress),
            });
        },
        onError: handleMutationError,
    });
}

/**
 * Mutation for toggling minting status
 */
export function useToggleMintingMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: ToggleMintingParams) => {
            const result = await toggleMinting(params);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: (_, variables) => {
            // 상태와 상세 정보 모두 무효화
            queryClient.invalidateQueries({
                queryKey: collectionKeys.status(variables.collectionAddress),
            });
            queryClient.invalidateQueries({
                queryKey: collectionKeys.detail(variables.collectionAddress),
            });
        },
        onError: handleMutationError,
    });
}

export function useUpdateCollectionSettingsMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: UpdateCollectionSettingsInput) => {
            const result = await updateCollectionSettings(params);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: (_, variables) => {
            // 설정, 상세 정보, 리스트 모두 무효화
            queryClient.invalidateQueries({
                queryKey: collectionKeys.settings(variables.collectionId),
            });
            queryClient.invalidateQueries({
                queryKey: collectionKeys.detail(variables.collectionId),
            });
            queryClient.invalidateQueries({
                queryKey: collectionKeys.lists(),
            });
        },
        onError: handleMutationError,
    });
}
