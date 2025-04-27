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
    getUserSelection,
    GetUserSelectionInput,
    GetUserSelectionResponse,
} from "../actions/polls";
import { Poll } from "@prisma/client";

export function usePollsQuery(input?: GetPollsInput) {
    return useQuery<Poll[]>({
        queryKey: pollKeys.list(input),
        queryFn: () => getPolls(input || {}),
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

export function useUserSelectionQuery(input?: GetUserSelectionInput) {
    return useQuery<GetUserSelectionResponse>({
        queryKey: pollKeys.selection(input?.pollId || ""),
        queryFn: () => getUserSelection(input),
    });
}

