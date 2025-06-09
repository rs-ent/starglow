/// app/queries/pollsQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { pollKeys } from "../queryKeys";
import {
    GetPollsInput,
    getPolls,
    getPoll,
    tokenGatingPoll,
    TokenGatingPollInput,
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
    getPollLogs,
    GetPollLogsInput,
    getPlayerPollLogs,
    GetPlayerPollLogsInput,
} from "../actions/polls";
import { Poll, PollLog } from "@prisma/client";
import { TokenGatingData } from "../story/nft/actions";

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
                pagination: pagination,
            }),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}

export function usePollQuery(id: string) {
    return useQuery<Poll | null>({
        queryKey: pollKeys.detail(id),
        queryFn: () => getPoll(id),
        enabled: !!id,
    });
}

export function useTokenGatingQuery(input?: TokenGatingPollInput) {
    return useQuery<TokenGatingData>({
        queryKey: [...pollKeys.tokenGating(input)],
        queryFn: () => tokenGatingPoll(input),
        staleTime: 1000 * 30,
    });
}

export function usePollResultQuery(input?: GetPollResultInput) {
    return useQuery<GetPollResultResponse>({
        queryKey: pollKeys.result(input?.pollId || ""),
        queryFn: () => getPollResult(input),
        refetchInterval: 1000 * 60 * 1,
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

export function usePollLogsQuery(input?: GetPollLogsInput) {
    return useQuery<PollLog[]>({
        queryKey: pollKeys.logs(input),
        queryFn: () => getPollLogs(input),
        enabled: !!input,
    });
}

export function usePlayerPollLogsQuery(input?: GetPlayerPollLogsInput) {
    return useQuery<PollLog[]>({
        queryKey: pollKeys.playerLogs(input?.playerId || ""),
        queryFn: () => getPlayerPollLogs(input),
        enabled: !!input?.playerId,
    });
}
