/// app/mutations/stakingMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    stake,
    unstake,
    createStakeReward,
    updateStakeReward,
    deleteStakeReward,
    findRewardableStakeTokens,
    claimStakeReward,
} from "@/app/actions/staking";
import { stakingKeys, collectionKeys, playerAssetsKeys } from "@/app/queryKeys";

export function useStakeMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: stake,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: collectionKeys.tokens.staked(
                        variables.collectionAddress
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useUnstakeMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: unstake,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: collectionKeys.tokens.staked(
                        variables.collectionAddress
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useCreateStakeRewardMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createStakeReward,
        onSuccess: (_data, _variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: stakingKeys.all,
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: stakingKeys.stakeRewards(),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useUpdateStakeRewardMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateStakeReward,
        onSuccess: (_data, _variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: stakingKeys.all,
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: stakingKeys.stakeRewards(),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useDeleteStakeRewardMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteStakeReward,
        onSuccess: (_data, _variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: stakingKeys.all,
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: stakingKeys.stakeRewards(),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useFindRewardableStakeTokensMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: findRewardableStakeTokens,
        onSuccess: (_data, _variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: stakingKeys.userStakeRewardLogs(),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useClaimStakeRewardMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: claimStakeReward,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: stakingKeys.userStakeRewardLogs(),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: stakingKeys.stakeRewards(),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.all,
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.balances(
                        variables.player.id,
                        variables.stakeRewardLogs.map((log) => log.assetId)
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
