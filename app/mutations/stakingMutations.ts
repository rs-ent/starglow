/// app/mutations/stakingMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stakingKeys, collectionKeys, playerAssetsKeys } from "@/app/queryKeys";
import {
    stake,
    unstake,
    createStakeReward,
    updateStakeReward,
    deleteStakeReward,
    findRewardableStakeTokens,
    claimStakeReward,
} from "@/app/actions/staking";

export function useStakeMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: stake,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: collectionKeys.tokens.staked(
                    variables.collectionAddress
                ),
            });
        },
    });
}

export function useUnstakeMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: unstake,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: collectionKeys.tokens.staked(
                    variables.collectionAddress
                ),
            });
        },
    });
}

export function useCreateStakeRewardMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createStakeReward,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: stakingKeys.all,
            });
            queryClient.invalidateQueries({
                queryKey: stakingKeys.stakeRewards(),
            });
        },
    });
}

export function useUpdateStakeRewardMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateStakeReward,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: stakingKeys.all,
            });
            queryClient.invalidateQueries({
                queryKey: stakingKeys.stakeRewards(),
            });
        },
    });
}

export function useDeleteStakeRewardMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteStakeReward,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: stakingKeys.all,
            });
            queryClient.invalidateQueries({
                queryKey: stakingKeys.stakeRewards(),
            });
        },
    });
}

export function useFindRewardableStakeTokensMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: findRewardableStakeTokens,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: stakingKeys.userStakeRewardLogs(),
            });
        },
    });
}

export function useClaimStakeRewardMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: claimStakeReward,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: stakingKeys.userStakeRewardLogs(),
            });
            queryClient.invalidateQueries({
                queryKey: stakingKeys.stakeRewards(),
            });
            queryClient.invalidateQueries({
                queryKey: playerAssetsKeys.all,
            });
            queryClient.invalidateQueries({
                queryKey: playerAssetsKeys.balances(
                    variables.player.id,
                    variables.stakeRewardLogs.map((log) => log.assetId)
                ),
            });
        },
    });
}
