/// app/actions/x/hooks.ts

"use client";

import {
    useLatestSyncDataQuery,
    useTweetsQuery,
    useTweetAuthorsQuery,
    useTweetMetricsHistoryQuery,
    useAuthorMetricsHistoryQuery,
    useAuthorByPlayerIdQuery,
} from "./queries";
import {
    useValidateRegisterXAuthorMutation,
    useCheckIsActiveXAuthorMutation,
    useConfirmRegisterXAuthorMutation,
} from "./mutations";
import {
    GetTweetMetricsHistoryInput,
    GetAuthorMetricsHistoryInput,
    GetAuthorByPlayerIdInput,
} from "./actions";

export interface useTweetsInput {
    getTweetMetricsHistoryInput?: GetTweetMetricsHistoryInput;
    getAuthorMetricsHistoryInput?: GetAuthorMetricsHistoryInput;
    getAuthorByPlayerIdInput?: GetAuthorByPlayerIdInput;
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

    const {
        data: authorByPlayerId,
        isLoading: isAuthorByPlayerIdLoading,
        error: authorByPlayerIdError,
        refetch: refetchAuthorByPlayerId,
    } = useAuthorByPlayerIdQuery(input?.getAuthorByPlayerIdInput);

    const {
        mutate: validateRegisterXAuthor,
        mutateAsync: validateRegisterXAuthorAsync,
        isPending: isValidateRegisterXAuthorPending,
        isError: isValidateRegisterXAuthorError,
        error: validateRegisterXAuthorError,
    } = useValidateRegisterXAuthorMutation();

    const {
        mutate: checkIsActiveXAuthor,
        mutateAsync: checkIsActiveXAuthorAsync,
        isPending: isCheckIsActiveXAuthorPending,
        isError: isCheckIsActiveXAuthorError,
        error: checkIsActiveXAuthorError,
    } = useCheckIsActiveXAuthorMutation();

    const {
        mutate: confirmRegisterXAuthor,
        mutateAsync: confirmRegisterXAuthorAsync,
        isPending: isConfirmRegisterXAuthorPending,
        isError: isConfirmRegisterXAuthorError,
        error: confirmRegisterXAuthorError,
    } = useConfirmRegisterXAuthorMutation();

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

        authorByPlayerId,
        isAuthorByPlayerIdLoading,
        authorByPlayerIdError,
        refetchAuthorByPlayerId,

        validateRegisterXAuthor,
        validateRegisterXAuthorAsync,
        isValidateRegisterXAuthorPending,
        isValidateRegisterXAuthorError,
        validateRegisterXAuthorError,

        checkIsActiveXAuthor,
        checkIsActiveXAuthorAsync,
        isCheckIsActiveXAuthorPending,
        isCheckIsActiveXAuthorError,
        checkIsActiveXAuthorError,

        confirmRegisterXAuthor,
        confirmRegisterXAuthorAsync,
        isConfirmRegisterXAuthorPending,
        isConfirmRegisterXAuthorError,
        confirmRegisterXAuthorError,
    };
}
