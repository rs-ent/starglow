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
            if (
                variables?.transaction?.playerId &&
                variables?.transaction?.assetId
            ) {
                queryClient
                    .invalidateQueries({
                        queryKey: playerAssetsKeys.balances(
                            variables.transaction.playerId,
                            [variables.transaction.assetId]
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: playerAssetsKeys.detail(
                            variables.transaction.playerId,
                            variables.transaction.assetId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
    });
}

export function useBatchUpdatePlayerAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: batchUpdatePlayerAsset,
        onSuccess: (_data, variables) => {
            if (variables?.txs && variables.txs.length > 0) {
                const affectedPlayers = new Set<string>();
                const affectedAssets = new Set<string>();

                variables.txs.forEach((tx) => {
                    if (tx.playerId) affectedPlayers.add(tx.playerId);
                    if (tx.assetId) affectedAssets.add(tx.assetId);
                });

                affectedPlayers.forEach((playerId) => {
                    queryClient
                        .invalidateQueries({
                            queryKey: playerAssetsKeys.balances(
                                playerId,
                                Array.from(affectedAssets)
                            ),
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                });
            }
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
            if (variables?.playerId) {
                queryClient
                    .invalidateQueries({
                        queryKey: playerAssetsKeys.instances(variables),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                if (variables.assetId || variables.asset?.id) {
                    const assetId = variables.assetId || variables.asset?.id;
                    queryClient
                        .invalidateQueries({
                            queryKey: playerAssetsKeys.balances(
                                variables.playerId,
                                [assetId!]
                            ),
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                }
            }
        },
    });
}

export function useWithdrawPlayerAssetInstances() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: withdrawPlayerAssetInstances,
        onSuccess: (_data, variables) => {
            if (variables?.playerId) {
                queryClient
                    .invalidateQueries({
                        queryKey: playerAssetsKeys.instances(variables),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                if (variables.assetId || variables.asset?.id) {
                    const assetId = variables.assetId || variables.asset?.id;
                    queryClient
                        .invalidateQueries({
                            queryKey: playerAssetsKeys.balances(
                                variables.playerId,
                                [assetId!]
                            ),
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                }
            }
        },
    });
}

export function useAutoExpirePlayerAssetInstances() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: autoExpirePlayerAssetInstances,
        onSuccess: (data, _variables) => {
            if (data?.success && data.data?.affectedPlayers) {
                data.data.affectedPlayers.forEach((playerId) => {
                    queryClient
                        .invalidateQueries({
                            queryKey: playerAssetsKeys.instances({ playerId }),
                        })
                        .catch((error) => {
                            console.error(error);
                        });

                    queryClient
                        .invalidateQueries({
                            queryKey: playerAssetsKeys.balances(playerId, []),
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                });
            }
        },
    });
}
