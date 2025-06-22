/// app/queries/rewardsLogsQueries.ts

import { useQuery } from "@tanstack/react-query";

import { getRewardsLogs } from "../actions/rewardsLogs";
import { rewardLogsKeys } from "../queryKeys";

import type { GetRewardsLogsInput } from "../actions/rewardsLogs";

export const useGetRewardsLogsQuery = (input?: GetRewardsLogsInput) => {
    return useQuery({
        queryKey: rewardLogsKeys.list(input),
        queryFn: () => getRewardsLogs({ input }),
        enabled: !!input?.playerId,
    });
};
