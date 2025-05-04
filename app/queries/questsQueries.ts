/// app/queries/questsQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { questKeys } from "../queryKeys";
import {
    getQuests,
    getQuest,
    getQuestLogs,
    getClaimableQuestLogs,
    getClaimedQuestLogs,
} from "../actions/quests";
import type {
    GetQuestsInput,
    PaginationInput,
    GetQuestInput,
    GetQuestLogsInput,
    GetClaimableQuestLogsInput,
    GetClaimedQuestLogsInput,
} from "../actions/quests";
import { Quest, QuestLog } from "@prisma/client";

export function useQuestsQuery({
    input,
    pagination,
}: {
    input?: GetQuestsInput;
    pagination?: PaginationInput;
}) {
    return useQuery<{
        items: Quest[];
        totalItems: number;
        totalPages: number;
    }>({
        queryKey: questKeys.list(input, pagination),
        queryFn: () => getQuests({ input, pagination }),
    });
}

export function useQuestQuery(input?: GetQuestInput) {
    return useQuery<Quest | null>({
        queryKey: questKeys.detail(input),
        queryFn: () => getQuest(input),
        enabled: !!input,
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
        enabled: !!input,
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
    });
}
