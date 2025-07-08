/// app/mutations/playerAssetsMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    updatePlayerAsset,
    batchUpdatePlayerAsset,
    deletePlayerAsset,
    validatePlayerAsset,
    grantPlayerAssetInstances,
    withdrawPlayerAssetInstances,
    autoExpirePlayerAssetInstances,
} from "@/app/actions/playerAssets/actions";
import { playerAssetsKeys } from "@/app/queryKeys";

export function useUpdatePlayerAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updatePlayerAsset,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.list({
                        playerId: variables?.transaction?.playerId || "",
                        assetId: variables?.transaction?.assetId || "",
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.balances(
                        variables?.transaction?.playerId || "",
                        [variables?.transaction?.assetId || ""]
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useBatchUpdatePlayerAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: batchUpdatePlayerAsset,
        onSuccess: (_data, _variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.lists(),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useDeletePlayerAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePlayerAsset,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.list({
                        playerId: variables?.playerId || "",
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useValidatePlayerAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: validatePlayerAsset,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.detail(
                        variables?.playerId || "",
                        variables?.assetId || ""
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.list({
                        playerId: variables?.playerId || "",
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useGrantPlayerAssetInstances() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: grantPlayerAssetInstances,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.instances(variables),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useWithdrawPlayerAssetInstances() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: withdrawPlayerAssetInstances,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.instances(variables),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useAutoExpirePlayerAssetInstances() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: autoExpirePlayerAssetInstances,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.instances(variables),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
