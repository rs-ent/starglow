/// app/actions/x/queries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import { tweetKeys } from "@/app/queryKeys";

import {
    getLatestSyncData,
    getTweets,
    getTweetAuthors,
    getTweetMetricsHistory,
    getAuthorMetricsHistory,
    getAuthorByPlayerId
} from "./actions";

import type {
    GetTweetMetricsHistoryInput,
    GetAuthorMetricsHistoryInput,
    GetAuthorByPlayerIdInput} from "./actions";

export function useLatestSyncDataQuery() {
    return useQuery({
        queryKey: tweetKeys.latestSyncData(),
        queryFn: getLatestSyncData,
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 3, // 3 minutes
        refetchOnWindowFocus: true,
    });
}

export function useTweetAuthorsQuery() {
    return useQuery({
        queryKey: tweetKeys.authors(),
        queryFn: getTweetAuthors,
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 3, // 3 minutes
        refetchOnWindowFocus: true,
    });
}

export function useTweetsQuery() {
    return useQuery({
        queryKey: tweetKeys.tweets(),
        queryFn: getTweets,
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 3, // 3 minutes
        refetchOnWindowFocus: true,
    });
}

export function useTweetMetricsHistoryQuery(
    input?: GetTweetMetricsHistoryInput
) {
    return useQuery({
        queryKey: tweetKeys.tweetMetricsHistory(input || {}),
        queryFn: () => getTweetMetricsHistory(input),
        enabled: Boolean(input?.tweetId),
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 3, // 3 minutes
    });
}

export function useAuthorMetricsHistoryQuery(
    input?: GetAuthorMetricsHistoryInput
) {
    return useQuery({
        queryKey: tweetKeys.authorMetricsHistory(input || {}),
        queryFn: () => getAuthorMetricsHistory(input),
        enabled: Boolean(input?.authorId),
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 3, // 3 minutes
    });
}

export function useAuthorByPlayerIdQuery(input?: GetAuthorByPlayerIdInput) {
    return useQuery({
        queryKey: tweetKeys.authorByPlayerId(input?.playerId || ""),
        queryFn: () => getAuthorByPlayerId(input),
        enabled: Boolean(input?.playerId),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}
