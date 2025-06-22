/// app/hooks/useRewardsLogs.ts

import { useGetRewardsLogsQuery } from "../queries/rewardsLogsQueries";

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
    } = useGetRewardsLogsQuery(getRewardsLogsInput);

    const isLoading = isRewardsLogsLoading;
    const error = rewardsLogsError;

    const refetch = async () => Promise.all([refetchRewardsLogs()]);

    return {
        rewardsLogs,
        isRewardsLogsLoading,
        rewardsLogsError,
        refetchRewardsLogs,

        isLoading,
        error,
        refetch,

        useGetRewardsLogsQuery,
    };
}
