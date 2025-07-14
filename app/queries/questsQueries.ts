/// app/queries/questsQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import {
    getQuests,
    getQuest,
    getQuestLogs,
    getClaimableQuestLogs,
    getClaimedQuestLogs,
    getPlayerQuestLogs,
    getActiveQuestLogs,
    getCompletedQuestLogs,
    tokenGatingQuest,
} from "../actions/quests";
import { questKeys } from "../queryKeys";

import type {
    GetQuestsInput,
    PaginationInput,
    GetQuestInput,
    GetQuestLogsInput,
    GetClaimableQuestLogsInput,
    GetClaimedQuestLogsInput,
    GetPlayerQuestLogsInput,
    GetActiveQuestLogsInput,
    GetCompletedQuestLogsInput,
    TokenGatingQuestInput,
    QuestWithArtistAndRewardAsset,
} from "../actions/quests";
import type { TokenGatingData } from "../story/nft/actions";
import type { Quest, QuestLog } from "@prisma/client";

export function useQuestsQuery({
    input,
    pagination,
}: {
    input?: GetQuestsInput;
    pagination?: PaginationInput;
}) {
    return useQuery<{
        items: QuestWithArtistAndRewardAsset[];
        totalItems: number;
        totalPages: number;
    }>({
        queryKey: questKeys.list(input, pagination),
        queryFn: () => getQuests({ input, pagination }),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}

export function useQuestQuery(input?: GetQuestInput) {
    return useQuery<Quest | null>({
        queryKey: questKeys.detail(input),
        queryFn: () => getQuest(input),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}

export function useQuestLogsQuery({
    input,
    pagination,
}: {
    input?: GetQuestLogsInput;
    pagination?: PaginationInput;
}) {
    return useQuery<{
        items: QuestLog[];
        totalItems: number;
        totalPages: number;
    }>({
        queryKey: questKeys.logs(input, pagination),
        queryFn: () => getQuestLogs({ input, pagination }),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}

export function useClaimableQuestLogsQuery({
    input,
}: {
    input?: GetClaimableQuestLogsInput;
}) {
    return useQuery<QuestLog[]>({
        queryKey: questKeys.claimableLogs(input),
        queryFn: () => getClaimableQuestLogs(input),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}

export function useClaimedQuestLogsQuery({
    input,
}: {
    input?: GetClaimedQuestLogsInput;
}) {
    return useQuery<QuestLog[]>({
        queryKey: questKeys.claimedLogs(input),
        queryFn: () => getClaimedQuestLogs(input),
        enabled: !!input,
        staleTime: 500,
        gcTime: 1000,
    });
}

export function usePlayerQuestLogsQuery({
    input,
}: {
    input?: GetPlayerQuestLogsInput;
}) {
    return useQuery<QuestLog[]>({
        queryKey: questKeys.playerLogs(input),
        queryFn: () => getPlayerQuestLogs(input),
        enabled: !!input?.playerId,
        staleTime: 500,
        gcTime: 1000,
    });
}

export function useTokenGatingQuestQuery({
    input,
}: {
    input?: TokenGatingQuestInput;
}) {
    return useQuery<TokenGatingData>({
        queryKey: [...questKeys.tokenGating(input)],
        queryFn: () => tokenGatingQuest(input),
        enabled: !!input?.questId && !!input?.userId,
        staleTime: 500,
        gcTime: 1000,
    });
}

export function useActiveQuestLogsQuery({
    input,
}: {
    input?: GetActiveQuestLogsInput;
}) {
    return useQuery<QuestLog[]>({
        queryKey: questKeys.activeLogs(input),
        queryFn: () => getActiveQuestLogs(input?.playerId || ""),
        enabled: !!input?.playerId,
        staleTime: 500,
        gcTime: 1000,
    });
}

export function useCompletedQuestLogsQuery({
    input,
}: {
    input?: GetCompletedQuestLogsInput;
}) {
    return useQuery<QuestLog[]>({
        queryKey: questKeys.completedLogs(input),
        queryFn: () => getCompletedQuestLogs(input?.playerId || ""),
        enabled: !!input?.playerId,
        staleTime: 500,
        gcTime: 1000,
    });
}
