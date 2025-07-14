/// app/queries/questsQueries.ts

"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

import {
    getQuests,
    getQuest,
    getQuestLogs,
    getClaimableQuestLogs,
    getClaimedQuestLogs,
    getPlayerQuestLogs,
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

// 무한 스크롤을 위한 쿼리 추가
export function useInfiniteQuestsQuery(input?: GetQuestsInput) {
    return useInfiniteQuery<
        {
            items: QuestWithArtistAndRewardAsset[];
            totalItems: number;
            totalPages: number;
        },
        Error,
        {
            items: QuestWithArtistAndRewardAsset[];
            totalItems: number;
            totalPages: number;
        },
        readonly ["quests", "infinite", any],
        number
    >({
        queryKey: questKeys.infinite(input),
        queryFn: ({ pageParam }: { pageParam: number }) =>
            getQuests({
                input,
                pagination: {
                    currentPage: pageParam,
                    itemsPerPage: 10,
                },
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            // allPages.length는 현재까지 로드된 페이지 수
            // 다음 페이지가 존재하는지 totalPages와 비교
            const currentPage = allPages.length;
            if (currentPage < lastPage.totalPages) {
                return currentPage + 1;
            }
            return undefined;
        },
        getPreviousPageParam: (firstPage, allPages) => {
            // 첫 번째 페이지보다 이전 페이지가 있는지 확인
            const currentPage = allPages.length > 0 ? 1 : 0;
            if (currentPage > 1) {
                return currentPage - 1;
            }
            return undefined;
        },
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
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
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
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
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
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
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}
