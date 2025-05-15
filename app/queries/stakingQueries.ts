/// app/queries/stakingQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { getStakeRewards, getUserStakeRewardLogs } from "@/app/actions/staking";
import type {
    GetStakeRewardInput,
    GetUserStakeRewardLogsInput,
} from "@/app/actions/staking";
import { stakingKeys } from "../queryKeys";

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
