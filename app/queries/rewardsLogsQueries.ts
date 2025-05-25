/// app/queries/rewardsLogsQueries.ts

import { GetRewardsLogsInput, getRewardsLogs } from "../actions/rewardsLogs";
import { useQuery } from "@tanstack/react-query";
import { rewardLogsKeys } from "../queryKeys";

export const getRewardsLogsQuery = (input?: GetRewardsLogsInput) => {
    return useQuery({
        queryKey: rewardLogsKeys.list(input),
        queryFn: () => getRewardsLogs({ input }),
        enabled: !!input?.playerId,
    });
};
