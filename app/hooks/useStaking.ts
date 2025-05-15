/// app/hooks/useStaking.ts

"use client";

import {
    useStakeRewards,
    useUserStakeRewardLogs,
} from "@/app/queries/stakingQueries";

import {
    useStakeMutation,
    useUnstakeMutation,
    useCreateStakeRewardMutation,
    useUpdateStakeRewardMutation,
    useDeleteStakeRewardMutation,
    useFindRewardableStakeTokensMutation,
    useClaimStakeRewardMutation,
} from "@/app/mutations/stakingMutations";

import type {
    GetStakeRewardInput,
    GetUserStakeRewardLogsInput,
} from "@/app/actions/staking";

export function useStakingGet({
    getStakeRewardInput,
    getUserStakeRewardLogsInput,
}: {
    getStakeRewardInput?: GetStakeRewardInput;
    getUserStakeRewardLogsInput?: GetUserStakeRewardLogsInput;
}) {
    const {
        data: stakeRewards,
        isLoading: isStakeRewardsLoading,
        error: stakeRewardsError,
    } = useStakeRewards(getStakeRewardInput);
    const {
        data: userStakeRewardLogs,
        isLoading: isUserStakeRewardLogsLoading,
        error: userStakeRewardLogsError,
    } = useUserStakeRewardLogs(getUserStakeRewardLogsInput);

    const isLoading = isStakeRewardsLoading || isUserStakeRewardLogsLoading;
    const error = stakeRewardsError || userStakeRewardLogsError;

    return {
        stakeRewards,
        isStakeRewardsLoading,
        stakeRewardsError,

        userStakeRewardLogs,
        isUserStakeRewardLogsLoading,
        userStakeRewardLogsError,

        isLoading,

        error,
    };
}

export function useStakingSet() {
    const {
        mutateAsync: stake,
        isPending: isStaking,
        error: stakeError,
    } = useStakeMutation();

    const {
        mutateAsync: unstake,
        isPending: isUnstaking,
        error: unstakeError,
    } = useUnstakeMutation();

    const {
        mutateAsync: createStakeReward,
        isPending: isCreatingStakeReward,
        error: createStakeRewardError,
    } = useCreateStakeRewardMutation();

    const {
        mutateAsync: updateStakeReward,
        isPending: isUpdatingStakeReward,
        error: updateStakeRewardError,
    } = useUpdateStakeRewardMutation();

    const {
        mutateAsync: deleteStakeReward,
        isPending: isDeletingStakeReward,
        error: deleteStakeRewardError,
    } = useDeleteStakeRewardMutation();

    const {
        mutateAsync: findRewardableStakeTokens,
        isPending: isFindingRewardableStakeTokens,
        error: findRewardableStakeTokensError,
    } = useFindRewardableStakeTokensMutation();

    const {
        mutateAsync: claimStakeReward,
        isPending: isClaimingStakeReward,
        error: claimStakeRewardError,
    } = useClaimStakeRewardMutation();

    const isLoading =
        isStaking ||
        isUnstaking ||
        isCreatingStakeReward ||
        isUpdatingStakeReward ||
        isDeletingStakeReward ||
        isFindingRewardableStakeTokens ||
        isClaimingStakeReward;

    const error =
        stakeError ||
        unstakeError ||
        createStakeRewardError ||
        updateStakeRewardError ||
        deleteStakeRewardError ||
        findRewardableStakeTokensError ||
        claimStakeRewardError;

    return {
        stake,
        unstake,
        createStakeReward,
        updateStakeReward,
        deleteStakeReward,
        findRewardableStakeTokens,
        claimStakeReward,

        isLoading,

        error,
    };
}
