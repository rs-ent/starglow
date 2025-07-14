/// app/hooks/useRewardsLogs.ts

import {
    useGetRewardsLogsQuery,
    useInfiniteRewardsLogsQuery,
} from "../queries/rewardsLogsQueries";

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

// 무한 스크롤을 위한 별도 hook
export function useInfiniteRewardsLogs(input?: GetRewardsLogsInput) {
    return useInfiniteRewardsLogsQuery(input);
}
