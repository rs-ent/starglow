/// app/queries/rewardsLogsQueries.ts

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

import {
    getRewardsLogs,
    getRewardsLogsPaginated,
} from "../actions/rewardsLogs";
import { rewardLogsKeys } from "../queryKeys";

import type {
    GetRewardsLogsInput,
    GetRewardsLogsOutput,
} from "../actions/rewardsLogs";

export const useGetRewardsLogsQuery = (input?: GetRewardsLogsInput) => {
    return useQuery({
        queryKey: rewardLogsKeys.list(input),
        queryFn: () => getRewardsLogs({ input }),
        enabled: !!input?.playerId,
    });
};

// 무한 스크롤을 위한 쿼리 추가
export const useInfiniteRewardsLogsQuery = (input?: GetRewardsLogsInput) => {
    return useInfiniteQuery<
        GetRewardsLogsOutput,
        Error,
        GetRewardsLogsOutput,
        readonly ["reward-logs", "infinite", GetRewardsLogsInput | undefined],
        number
    >({
        queryKey: rewardLogsKeys.infinite(input),
        queryFn: ({ pageParam }: { pageParam: number }) =>
            getRewardsLogsPaginated(input, {
                currentPage: pageParam,
                itemsPerPage: 15,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage: GetRewardsLogsOutput) => {
            if (lastPage.currentPage < lastPage.totalPages) {
                return lastPage.currentPage + 1;
            }
            return undefined;
        },
        getPreviousPageParam: (firstPage: GetRewardsLogsOutput) => {
            if (firstPage.currentPage > 1) {
                return firstPage.currentPage - 1;
            }
            return undefined;
        },
        enabled: !!input?.playerId,
        staleTime: 1000 * 30,
        gcTime: 1000 * 60,
        refetchOnWindowFocus: false,
    });
};
