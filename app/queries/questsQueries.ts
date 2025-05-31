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
    getPlayerQuestLogs,
} from "../actions/quests";
import type {
    GetQuestsInput,
    PaginationInput,
    GetQuestInput,
    GetQuestLogsInput,
    GetClaimableQuestLogsInput,
    GetClaimedQuestLogsInput,
    GetPlayerQuestLogsInput,
} from "../actions/quests";
import { Quest, QuestLog } from "@prisma/client";

// 공통 캐싱 설정
const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5분
const DEFAULT_CACHE_TIME = 30 * 60 * 1000; // 30분
const BACKGROUND_FETCH_INTERVAL = 10 * 60 * 1000; // 10분

/**
 * 퀘스트 목록 조회 쿼리 훅
 * @param input 퀘스트 조회 조건
 * @param pagination 페이지네이션 정보
 * @param options 추가 쿼리 옵션
 */
export function useQuestsQuery({
    input,
    pagination,
    options = {},
}: {
    input?: GetQuestsInput;
    pagination?: PaginationInput;
    options?: {
        staleTime?: number;
        cacheTime?: number;
        refetchInterval?: number | false;
        enabled?: boolean;
    };
}) {
    return useQuery<{
        items: Quest[];
        totalItems: number;
        totalPages: number;
    }>({
        queryKey: questKeys.list(input, pagination),
        queryFn: () => getQuests({ input, pagination }),
        staleTime: options.staleTime ?? DEFAULT_STALE_TIME,
        gcTime: options.cacheTime ?? DEFAULT_CACHE_TIME,
        refetchInterval: options.refetchInterval ?? false,
        enabled: options.enabled ?? true,
        retry: (failureCount, error: any) => {
            // 404 오류는 재시도하지 않음
            if (error?.status === 404) return false;
            // 최대 3번까지 재시도
            return failureCount < 3;
        },
    });
}

/**
 * 단일 퀘스트 조회 쿼리 훅
 * @param input 퀘스트 ID 또는 조회 조건
 * @param options 추가 쿼리 옵션
 */
export function useQuestQuery(
    input?: GetQuestInput,
    options: {
        staleTime?: number;
        cacheTime?: number;
        refetchInterval?: number | false;
        enabled?: boolean;
    } = {}
) {
    return useQuery<Quest | null>({
        queryKey: questKeys.detail(input),
        queryFn: () => getQuest(input),
        staleTime: options.staleTime ?? DEFAULT_STALE_TIME,
        gcTime: options.cacheTime ?? DEFAULT_CACHE_TIME,
        refetchInterval: options.refetchInterval ?? false,
        enabled: options.enabled ?? !!input?.id,
        retry: (failureCount, error: any) => {
            if (error?.status === 404) return false;
            return failureCount < 3;
        },
    });
}

/**
 * 퀘스트 로그 조회 쿼리 훅
 * @param input 퀘스트 로그 조회 조건
 * @param pagination 페이지네이션 정보
 * @param options 추가 쿼리 옵션
 */
export function useQuestLogsQuery({
    input,
    pagination,
    options = {},
}: {
    input?: GetQuestLogsInput;
    pagination?: PaginationInput;
    options?: {
        staleTime?: number;
        cacheTime?: number;
        refetchInterval?: number | false;
        enabled?: boolean;
    };
}) {
    return useQuery<{
        items: QuestLog[];
        totalItems: number;
        totalPages: number;
    }>({
        queryKey: questKeys.logs(input, pagination),
        queryFn: () => getQuestLogs({ input, pagination }),
        staleTime: options.staleTime ?? DEFAULT_STALE_TIME,
        gcTime: options.cacheTime ?? DEFAULT_CACHE_TIME,
        refetchInterval: options.refetchInterval ?? false,
        enabled: options.enabled ?? true,
    });
}

/**
 * 청구 가능한 퀘스트 로그 조회 쿼리 훅
 * @param input 청구 가능한 퀘스트 로그 조회 조건
 * @param options 추가 쿼리 옵션
 */
export function useClaimableQuestLogsQuery({
    input,
    options = {},
}: {
    input?: GetClaimableQuestLogsInput;
    options?: {
        staleTime?: number;
        cacheTime?: number;
        refetchInterval?: number | false;
        enabled?: boolean;
    };
}) {
    return useQuery<QuestLog[]>({
        queryKey: questKeys.claimableLogs(input),
        queryFn: () => getClaimableQuestLogs(input),
        staleTime: options.staleTime ?? DEFAULT_STALE_TIME,
        gcTime: options.cacheTime ?? DEFAULT_CACHE_TIME,
        refetchInterval: options.refetchInterval ?? BACKGROUND_FETCH_INTERVAL, // 자동 갱신
        enabled: options.enabled ?? !!input?.playerId,
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

export function usePlayerQuestLogsQuery({
    input,
}: {
    input?: GetPlayerQuestLogsInput;
}) {
    return useQuery<QuestLog[]>({
        queryKey: questKeys.playerLogs(input),
        queryFn: () => getPlayerQuestLogs(input),
        enabled: !!input?.playerId,
    });
}
