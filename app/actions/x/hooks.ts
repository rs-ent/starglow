/// app/actions/x/hooks.ts

"use client";

import {
    useLatestSyncDataQuery,
    useTweetsQuery,
    useTweetAuthorsQuery,
    useTweetMetricsHistoryQuery,
    useAuthorMetricsHistoryQuery,
} from "./queries";
import {
    GetTweetMetricsHistoryInput,
    GetAuthorMetricsHistoryInput,
} from "./actions";

export interface useTweetsInput {
    getTweetMetricsHistoryInput?: GetTweetMetricsHistoryInput;
    getAuthorMetricsHistoryInput?: GetAuthorMetricsHistoryInput;
}

export function useTweets(input?: useTweetsInput) {
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

    const {
        data: tweetMetricsHistory,
        isLoading: isTweetMetricsHistoryLoading,
        error: tweetMetricsHistoryError,
        refetch: refetchTweetMetricsHistory,
    } = useTweetMetricsHistoryQuery(input?.getTweetMetricsHistoryInput);

    const {
        data: authorMetricsHistory,
        isLoading: isAuthorMetricsHistoryLoading,
        error: authorMetricsHistoryError,
        refetch: refetchAuthorMetricsHistory,
    } = useAuthorMetricsHistoryQuery(input?.getAuthorMetricsHistoryInput);

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

        tweetMetricsHistory,
        isTweetMetricsHistoryLoading,
        tweetMetricsHistoryError,
        refetchTweetMetricsHistory,

        authorMetricsHistory,
        isAuthorMetricsHistoryLoading,
        authorMetricsHistoryError,
        refetchAuthorMetricsHistory,
    };
}
