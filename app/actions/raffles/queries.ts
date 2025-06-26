/// app/actions/raffles/queries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import { raffleKeys } from "@/app/queryKeys";

import {
    getRaffles,
    getRaffleDetails,
    getPlayerParticipations,
    getUnrevealedCount,
} from "./actions";

import type {
    GetRafflesInput,
    GetPlayerParticipationsInput,
    GetUnrevealedCountInput,
} from "./actions";

export function useGetRafflesQuery(input?: GetRafflesInput) {
    return useQuery({
        queryKey: raffleKeys.list(input),
        queryFn: () => getRaffles(input),
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: true,
    });
}

export function useGetRaffleDetailsQuery(raffleId?: string) {
    return useQuery({
        queryKey: raffleKeys.detail(raffleId || ""),
        queryFn: () => getRaffleDetails(raffleId!),
        enabled: Boolean(raffleId),
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
    });
}

/**
 * 플레이어 참여 현황 조회 쿼리 (다중 참여 지원)
 */
export function useGetPlayerParticipationsQuery(
    input?: GetPlayerParticipationsInput
) {
    return useQuery({
        queryKey: raffleKeys.playerParticipations(
            input?.raffleId || "",
            input?.playerId || ""
        ),
        queryFn: () => getPlayerParticipations(input!),
        enabled: Boolean(input?.raffleId && input?.playerId),
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
    });
}

/**
 * 미공개 결과 개수 조회 쿼리
 */
export function useGetUnrevealedCountQuery(input?: GetUnrevealedCountInput) {
    return useQuery({
        queryKey: raffleKeys.unrevealedCount(
            input?.raffleId || "",
            input?.playerId || ""
        ),
        queryFn: () => getUnrevealedCount(input!),
        enabled: Boolean(input?.raffleId && input?.playerId),
        staleTime: 1000 * 30, // 30 seconds (짧은 캐시 - 실시간성 중요)
        gcTime: 1000 * 60 * 2, // 2 minutes
        refetchOnWindowFocus: true,
        refetchInterval: 1000 * 60, // 1분마다 자동 새로고침
    });
}
