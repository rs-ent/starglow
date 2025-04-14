/// app/mutations/collectionMutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    mintTokens,
    setBaseURI,
    togglePause,
    toggleMinting,
    type MintTokensParams,
    type SetBaseURIParams,
    type TogglePauseParams,
    type ToggleMintingParams,
} from "../actions/collectionContracts";
import { collectionKeys } from "../queryKeys";

/**
 * Mutation for minting tokens
 */
export function useMintTokensMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: MintTokensParams) => mintTokens(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
        },
    });
}

/**
 * Mutation for setting base URI
 */
export function useSetBaseURIMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: SetBaseURIParams) => setBaseURI(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
        },
    });
}

/**
 * Mutation for toggling pause state
 */
export function useTogglePauseMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: TogglePauseParams) => togglePause(params),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: collectionKeys.status(variables.collectionAddress),
            });
            queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
        },
    });
}

/**
 * Mutation for toggling minting status
 */
export function useToggleMintingMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: ToggleMintingParams) => toggleMinting(params),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: collectionKeys.status(variables.collectionAddress),
            });
            queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
        },
    });
}
