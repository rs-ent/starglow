/// app/actions/raffles/queries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import { raffleKeys } from "@/app/queryKeys";

import {
    getRaffles,
    getRaffleDetails,
    getPlayerParticipations,
    getUnrevealedCount,
    getRaffleParticipants,
    checkUserParticipation,
    getProbabilityAnalyticsData,
    getRevenueAnalyticsData,
    getParticipantAnalyticsData,
} from "./actions";

import type {
    GetRafflesInput,
    GetPlayerParticipationsInput,
    GetUnrevealedCountInput,
    GetRaffleParticipantsInput,
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
        staleTime: 1000 * 60, // 1분 (참여 후 즉시 반영을 위해 단축)
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
        refetchOnMount: true, // 마운트 시 항상 새로 가져오기
    });
}

/**
 * 플레이어 참여 현황 조회 쿼리 (다중 참여 지원)
 * 🎯 래플 참여 후 즉시 반영을 위해 짧은 staleTime 설정
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
        staleTime: 1000 * 30, // 30초 (즉시 반영을 위해 단축)
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
        refetchOnMount: true, // 마운트 시 항상 새로 가져오기
    });
}

/**
 * 미공개 결과 개수 조회 쿼리
 * 🎯 실시간 업데이트를 위한 최적화 설정
 */
export function useGetUnrevealedCountQuery(input?: GetUnrevealedCountInput) {
    return useQuery({
        queryKey: raffleKeys.unrevealedCount(
            input?.raffleId || "",
            input?.playerId || ""
        ),
        queryFn: () => getUnrevealedCount(input!),
        enabled: Boolean(input?.raffleId && input?.playerId),
        staleTime: 1000 * 15, // 15초 (더욱 짧게 - 실시간성 중요)
        gcTime: 1000 * 60 * 2, // 2 minutes
        refetchOnWindowFocus: true,
        refetchOnMount: true, // 마운트 시 항상 새로 가져오기
        refetchInterval: 1000 * 30, // 30초마다 자동 새로고침 (더 자주)
    });
}

export function useGetRaffleParticipantsQuery(
    input?: GetRaffleParticipantsInput
) {
    return useQuery({
        queryKey: raffleKeys.participants.all(input?.raffleId || ""),
        queryFn: () => getRaffleParticipants(input!),
        enabled: Boolean(input?.raffleId),
        staleTime: 1000 * 60, // 1 minute
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
    });
}

export function useCheckUserParticipationQuery(
    raffleId?: string,
    playerId?: string
) {
    return useQuery({
        queryKey: raffleKeys.userParticipation(raffleId || "", playerId || ""),
        queryFn: () => checkUserParticipation(raffleId!, playerId!),
        enabled: Boolean(raffleId && playerId),
        staleTime: 1000 * 30, // 30초
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
        refetchOnMount: true,
    });
}

// 🎯 Analytics 쿼리들

/**
 * 확률 분석 데이터 조회 쿼리
 * 실제 당첨 데이터와 이론적 확률을 비교 분석
 */
export function useProbabilityAnalyticsQuery(raffleIds?: string[]) {
    return useQuery({
        queryKey: raffleKeys.analytics.probability(raffleIds),
        queryFn: () => getProbabilityAnalyticsData(raffleIds),
        staleTime: 1000 * 60 * 5, // 5분 (분석 데이터는 자주 변경되지 않음)
        gcTime: 1000 * 60 * 15, // 15분
        refetchOnWindowFocus: false, // 포커스 시 자동 새로고침 비활성화
        refetchOnMount: true,
    });
}

/**
 * 수익성 분석 데이터 조회 쿼리
 * 래플별 수익성, ROI, 마진 등을 분석
 */
export function useRevenueAnalyticsQuery(raffleIds?: string[]) {
    return useQuery({
        queryKey: raffleKeys.analytics.revenue(raffleIds),
        queryFn: () => getRevenueAnalyticsData(raffleIds),
        staleTime: 1000 * 60 * 5, // 5분
        gcTime: 1000 * 60 * 15, // 15분
        refetchOnWindowFocus: false,
        refetchOnMount: true,
    });
}

/**
 * 참가자 행동 분석 데이터 조회 쿼리
 * 참가자별 참여 패턴, 세그먼트, 충성도 등을 분석
 */
export function useParticipantAnalyticsQuery(playerIds?: string[]) {
    return useQuery({
        queryKey: raffleKeys.analytics.participants(playerIds),
        queryFn: () => getParticipantAnalyticsData(playerIds),
        staleTime: 1000 * 60 * 10, // 10분 (참가자 데이터는 더 자주 변경될 수 있음)
        gcTime: 1000 * 60 * 20, // 20분
        refetchOnWindowFocus: false,
        refetchOnMount: true,
    });
}
