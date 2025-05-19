/// app/hooks/useStaking.ts

"use client";

import {
    useStakeRewards,
    useUserStakeRewardLogs,
    useUserStakingTokens,
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
    GetUserStakingTokensInput,
    GetStakeRewardInput,
    GetUserStakeRewardLogsInput,
} from "@/app/actions/staking";

export function useStakingGet({
    getUserStakingTokensInput,
    getStakeRewardInput,
    getUserStakeRewardLogsInput,
}: {
    getUserStakingTokensInput?: GetUserStakingTokensInput;
    getStakeRewardInput?: GetStakeRewardInput;
    getUserStakeRewardLogsInput?: GetUserStakeRewardLogsInput;
}) {
    const {
        data: userStakingTokens,
        isLoading: isUserStakingTokensLoading,
        error: userStakingTokensError,
        refetch: refetchUserStakingTokens,
    } = useUserStakingTokens(getUserStakingTokensInput);

    const {
        data: stakeRewards,
        isLoading: isStakeRewardsLoading,
        error: stakeRewardsError,
        refetch: refetchStakeRewards,
    } = useStakeRewards(getStakeRewardInput);
    const {
        data: userStakeRewardLogs,
        isLoading: isUserStakeRewardLogsLoading,
        error: userStakeRewardLogsError,
        refetch: refetchUserStakeRewardLogs,
    } = useUserStakeRewardLogs(getUserStakeRewardLogsInput);

    const isLoading =
        isUserStakingTokensLoading ||
        isStakeRewardsLoading ||
        isUserStakeRewardLogsLoading;
    const error =
        userStakingTokensError || stakeRewardsError || userStakeRewardLogsError;

    const refetch = async () => {
        await Promise.all([
            refetchUserStakingTokens(),
            refetchStakeRewards(),
            refetchUserStakeRewardLogs(),
        ]);
    };

    return {
        userStakingTokens,
        isUserStakingTokensLoading,
        userStakingTokensError,

        stakeRewards,
        isStakeRewardsLoading,
        stakeRewardsError,

        userStakeRewardLogs,
        isUserStakeRewardLogsLoading,
        userStakeRewardLogsError,

        isLoading,

        error,

        refetch,
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
        isClaimingStakeReward,
        claimStakeRewardError,

        isLoading,

        error,
    };
}
