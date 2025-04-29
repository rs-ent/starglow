/// app/queries/pollsQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { pollKeys } from "../queryKeys";
import {
    GetPollsInput,
    getPolls,
    getPoll,
    tokenGating,
    TokenGatingInput,
    TokenGatingResult,
    getPollResult,
    GetPollResultResponse,
    GetPollResultInput,
    getPollsResults,
    GetPollsResultsInput,
    GetPollsResultsResponse,
    getUserSelection,
    GetUserSelectionInput,
    GetUserSelectionResponse,
    PaginationInput,
} from "../actions/polls";
import { Poll } from "@prisma/client";

export function usePollsQuery({
    input,
    pagination,
}: {
    input?: GetPollsInput;
    pagination?: PaginationInput;
}) {
    return useQuery<{
        items: Poll[];
        totalItems: number;
        totalPages: number;
    }>({
        queryKey: pollKeys.list(input, pagination),
        queryFn: () =>
            getPolls({
                input: input || {},
                pagination: pagination || {
                    currentPage: 1,
                    itemsPerPage: Number.MAX_SAFE_INTEGER,
                },
            }),
    });
}

export function usePollQuery(id: string) {
    return useQuery<Poll | null>({
        queryKey: pollKeys.detail(id),
        queryFn: () => getPoll(id),
        enabled: !!id,
    });
}

export function useTokenGatingQuery(input?: TokenGatingInput) {
    return useQuery<TokenGatingResult>({
        queryKey: [...pollKeys.tokenGating(input)],
        queryFn: () => tokenGating(input),
        staleTime: 1000 * 60 * 5,
    });
}

export function usePollResultQuery(input?: GetPollResultInput) {
    return useQuery<GetPollResultResponse>({
        queryKey: pollKeys.result(input?.pollId || ""),
        queryFn: () => getPollResult(input),
        refetchInterval: 2000,
    });
}

export function usePollsResultsQuery(input?: GetPollsResultsInput) {
    return useQuery<GetPollsResultsResponse>({
        queryKey: pollKeys.results(input?.pollIds || []),
        queryFn: () => getPollsResults(input),
        refetchInterval: 1000 * 60 * 5,
    });
}

export function useUserSelectionQuery(input?: GetUserSelectionInput) {
    return useQuery<GetUserSelectionResponse>({
        queryKey: pollKeys.selection(input?.pollId || ""),
        queryFn: () => getUserSelection(input),
    });
}
