/// app/queries/pollsQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import {
    getPolls,
    getPoll,
    getPollDetail,
    tokenGatingPoll,
    getPollResult,
    getPollsResults,
    getUserSelection,
    getPollLogs,
    getPlayerPollLogs,
    getArtistAllActivePollCount,
    getPollsForAdmin,
} from "../actions/polls";
import { pollKeys } from "../queryKeys";

import type {
    GetPollsInput,
    GetPollDetailInput,
    TokenGatingPollInput,
    GetPollResultResponse,
    GetPollResultInput,
    GetPollsResultsInput,
    GetPollsResultsResponse,
    GetUserSelectionInput,
    GetUserSelectionResponse,
    PaginationInput,
    GetPollLogsInput,
    GetPlayerPollLogsInput,
    GetArtistAllActivePollCountInput,
    PollDetail,
    GetPlayerPollLogsResponse,
    PollListData,
} from "../actions/polls";
import type { TokenGatingData } from "../story/nft/actions";
import type { PollLog } from "@prisma/client";

export function usePollsQuery({
    input,
    pagination,
}: {
    input?: GetPollsInput;
    pagination?: PaginationInput;
}) {
    return useQuery<{
        items: PollListData[];
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

export function usePollsForAdminQuery({
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
        queryKey: [...pollKeys.list(input, pagination), "admin"],
        queryFn: () =>
            getPollsForAdmin({
                input: input || {},
                pagination: pagination,
            }),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}

export function usePollQuery(pollId: string) {
    return useQuery<PollListData | null>({
        queryKey: pollKeys.detail(pollId),
        queryFn: () => getPoll(pollId),
        enabled: !!pollId,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}

export function usePollDetailQuery(input: GetPollDetailInput) {
    return useQuery<PollDetail | null>({
        queryKey: pollKeys.detail(input.pollId),
        queryFn: () => getPollDetail(input),
        enabled: !!input.pollId,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}

export function useTokenGatingQuery(input?: TokenGatingPollInput) {
    return useQuery<TokenGatingData>({
        queryKey: [...pollKeys.tokenGating(input)],
        queryFn: () => tokenGatingPoll(input),
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 2,
    });
}

export function usePollResultQuery(input?: GetPollResultInput) {
    return useQuery<GetPollResultResponse>({
        queryKey: pollKeys.result(input?.pollId || ""),
        queryFn: () => getPollResult(input),
        refetchInterval: 1000 * 60 * 10,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}

export function usePollsResultsQuery(input?: GetPollsResultsInput) {
    return useQuery<GetPollsResultsResponse>({
        queryKey: pollKeys.results(input?.pollIds || []),
        queryFn: () => getPollsResults(input),
        refetchInterval: 1000 * 60 * 5,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}

export function useUserSelectionQuery(input?: GetUserSelectionInput) {
    return useQuery<GetUserSelectionResponse>({
        queryKey: pollKeys.selection(input?.pollId || ""),
        queryFn: () => getUserSelection(input),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}

export function usePollLogsQuery(input?: GetPollLogsInput) {
    return useQuery<PollLog[]>({
        queryKey: pollKeys.logs(input),
        queryFn: () => getPollLogs(input),
        enabled: !!input,
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 2,
    });
}

export function usePlayerPollLogsQuery(input?: GetPlayerPollLogsInput) {
    return useQuery<GetPlayerPollLogsResponse[]>({
        queryKey: pollKeys.playerLogs(input?.playerId || "", input?.pollId),
        queryFn: () => getPlayerPollLogs(input),
        enabled: !!input?.playerId,
        staleTime: 500,
        gcTime: 1000,
    });
}

export function useArtistAllActivePollCountQuery({
    input,
}: {
    input?: GetArtistAllActivePollCountInput;
}) {
    return useQuery<number>({
        queryKey: pollKeys.artistAllActivePollCount(input?.artistId),
        queryFn: () => getArtistAllActivePollCount(input),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        enabled: !!input?.artistId,
    });
}
