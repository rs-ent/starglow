/// app/actions/x/hooks.ts

"use client";

import { useLatestSyncDataQuery, useTweetsQuery } from "./queries";

export function useX() {
    const {
        data: latestSyncData,
        isLoading: isLatestSyncDataLoading,
        error: latestSyncDataError,
        refetch: refetchLatestSyncData,
    } = useLatestSyncDataQuery();

    const {
        data: tweets,
        isLoading: isTweetsLoading,
        error: tweetsError,
        refetch: refetchTweets,
    } = useTweetsQuery();

    return {
        latestSyncData,
        isLatestSyncDataLoading,
        latestSyncDataError,
        refetchLatestSyncData,

        tweets,
        isTweetsLoading,
        tweetsError,
        refetchTweets,
    };
}
