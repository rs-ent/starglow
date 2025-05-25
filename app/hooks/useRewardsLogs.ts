/// app/hooks/useRewardsLogs.ts

import { getRewardsLogsQuery } from "../queries/rewardsLogsQueries";
import type { GetRewardsLogsInput } from "../actions/rewardsLogs";

export function useRewardsLogsGet({
    getRewardsLogsInput,
}: {
    getRewardsLogsInput?: GetRewardsLogsInput;
}) {
    const {
        data: rewardsLogs,
        isLoading: isRewardsLogsLoading,
        error: rewardsLogsError,
        refetch: refetchRewardsLogs,
    } = getRewardsLogsQuery(getRewardsLogsInput);

    const isLoading = isRewardsLogsLoading;
    const error = rewardsLogsError;

    const refetch = async () => Promise.all([refetchRewardsLogs()]);

    return {
        rewardsLogs,
        isRewardsLogsLoading,
        rewardsLogsError,

        isLoading,
        error,
        refetch,

        getRewardsLogsQuery,
    };
}
