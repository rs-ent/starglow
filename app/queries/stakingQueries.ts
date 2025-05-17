/// app/queries/stakingQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import {
    getStakeRewards,
    getUserStakeRewardLogs,
    getUserStakingTokens,
} from "@/app/actions/staking";
import type {
    GetStakeRewardInput,
    GetUserStakeRewardLogsInput,
    GetUserStakingTokensInput,
} from "@/app/actions/staking";
import { stakingKeys } from "../queryKeys";

export const useUserStakingTokens = (input?: GetUserStakingTokensInput) => {
    return useQuery({
        queryKey: stakingKeys.userStakingTokens(input),
        queryFn: () => getUserStakingTokens(input),
        enabled: !!input,
    });
};

export const useStakeRewards = (input?: GetStakeRewardInput) => {
    return useQuery({
        queryKey: stakingKeys.stakeRewards(input),
        queryFn: () => getStakeRewards(input),
        enabled: !!input,
    });
};

export const useUserStakeRewardLogs = (input?: GetUserStakeRewardLogsInput) => {
    return useQuery({
        queryKey: stakingKeys.userStakeRewardLogs(input),
        queryFn: () => getUserStakeRewardLogs(input),
        enabled: !!input,
    });
};
