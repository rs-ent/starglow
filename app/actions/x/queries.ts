/// app/actions/x/queries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { xKeys } from "@/app/queryKeys";
import { getLatestSyncData, getTweets } from "./actions";

export function useLatestSyncDataQuery() {
    return useQuery({
        queryKey: xKeys.latestSyncData(),
        queryFn: getLatestSyncData,
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 3, // 3 minutes
        refetchOnWindowFocus: true,
    });
}

export function useTweetsQuery() {
    return useQuery({
        queryKey: xKeys.tweets(),
        queryFn: getTweets,
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 3, // 3 minutes
        refetchOnWindowFocus: true,
    });
}
