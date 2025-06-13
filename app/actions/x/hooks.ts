/// app/actions/x/hooks.ts

"use client";

import {
    useLatestSyncDataQuery,
    useTweetsQuery,
    useTweetAuthorsQuery,
} from "./queries";

export function useTweets() {
    const {
        data: latestSyncData,
        isLoading: isLatestSyncDataLoading,
        error: latestSyncDataError,
        refetch: refetchLatestSyncData,
    } = useLatestSyncDataQuery();

    const {
        data: tweetAuthors,
        isLoading: isTweetAuthorsLoading,
        error: tweetAuthorsError,
        refetch: refetchTweetAuthors,
    } = useTweetAuthorsQuery();

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

        tweetAuthors,
        isTweetAuthorsLoading,
        tweetAuthorsError,
        refetchTweetAuthors,

        tweets,
        isTweetsLoading,
        tweetsError,
        refetchTweets,
    };
}
