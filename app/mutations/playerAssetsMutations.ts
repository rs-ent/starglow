/// app/mutations/playerAssetsMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { playerAssetsKeys } from "../queryKeys";
import {
    updatePlayerAsset,
    batchUpdatePlayerAsset,
    deletePlayerAsset,
    validatePlayerAsset,
} from "../actions/playerAssets";

export function useUpdatePlayerAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updatePlayerAsset,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: playerAssetsKeys.list({
                    playerId: variables?.transaction?.playerId || "",
                    assetId: variables?.transaction?.assetId || "",
                }),
            });
            queryClient.invalidateQueries({
                queryKey: playerAssetsKeys.balances(
                    variables?.transaction?.playerId || "",
                    [variables?.transaction?.assetId || ""]
                ),
            });
        },
    });
}

export function useBatchUpdatePlayerAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: batchUpdatePlayerAsset,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: playerAssetsKeys.lists(),
            });
        },
    });
}

export function useDeletePlayerAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePlayerAsset,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: playerAssetsKeys.list({
                    playerId: variables?.playerId || "",
                }),
            });
        },
    });
}

export function useValidatePlayerAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: validatePlayerAsset,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: playerAssetsKeys.detail(
                    variables?.playerId || "",
                    variables?.assetId || ""
                ),
            });

            queryClient.invalidateQueries({
                queryKey: playerAssetsKeys.list({
                    playerId: variables?.playerId || "",
                }),
            });
        },
    });
}
