/// app/actions/raffles/web3/queries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import type {
    GetOnchainRafflesInput,
    GetRaffleFromContractInput,
    GetUserParticipationInput,
    GetLotteryResultInput,
    GetRaffleCoreInfoForListCardInput,
    GetRaffleParticipantsInput,
    GetUserParticipationSummaryInput,
    GetUserParticipationDetailsInput,
} from "./actions-read";

import {
    getOnchainRaffles,
    getRaffleFromContract,
    getRaffleCoreInfoForListCard,
    getUserParticipation,
    getLotteryResult,
    getRaffleParticipants,
    getUserParticipationSummary,
    getUserParticipationDetails,
} from "./actions-read";
import { raffleQueryKeys } from "./queryKeys";

// 📊 온체인 래플 목록 조회
export function useOnchainRafflesQuery(
    input?: GetOnchainRafflesInput,
    options?: {
        enabled?: boolean;
        staleTime?: number;
        gcTime?: number;
    }
) {
    return useQuery({
        queryKey: raffleQueryKeys.list(input ?? {}),
        queryFn: () => getOnchainRaffles(input),
        enabled: Boolean(input),
        staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5분
        gcTime: options?.gcTime ?? 1000 * 60 * 30, // 30분
    });
}

// 🔒 래플 정적 데이터 조회 (변화 거의 없음 - 긴 캐시)
export function useRaffleFromContractQuery(
    input?: GetRaffleFromContractInput,
    options?: {
        enabled?: boolean;
        staleTime?: number;
        gcTime?: number;
    }
) {
    return useQuery({
        queryKey: raffleQueryKeys.contract(
            input?.contractAddress || "",
            input?.raffleId || "",
            input?.dataKeys
        ),
        queryFn: () => getRaffleFromContract(input),
        enabled: Boolean(input?.contractAddress && input?.raffleId),
        staleTime: options?.staleTime ?? 1000 * 60 * 5,
        gcTime: options?.gcTime ?? 1000 * 60 * 30,
    });
}

export function useRaffleCoreInfoForListCardQuery(
    input?: GetRaffleCoreInfoForListCardInput,
    options?: {
        enabled?: boolean;
        staleTime?: number;
        gcTime?: number;
    }
) {
    return useQuery({
        queryKey: raffleQueryKeys.contract(
            input?.contractAddress || "",
            input?.raffleId || "",
            ["basicInfo", "timing", "settings", "fee", "status"]
        ),
        queryFn: () => getRaffleCoreInfoForListCard(input),
        enabled: Boolean(input?.contractAddress && input?.raffleId),
        staleTime: options?.staleTime ?? 1000 * 60 * 5,
        gcTime: options?.gcTime ?? 1000 * 60 * 30,
    });
}

// 👤 사용자 참가 정보 조회 (사용자 액션에 따라 변화)
export function useUserParticipationQuery(
    input?: GetUserParticipationInput,
    options?: {
        enabled?: boolean;
        staleTime?: number;
        gcTime?: number;
    }
) {
    return useQuery({
        queryKey: raffleQueryKeys.userParticipation(
            input?.contractAddress || "",
            input?.raffleId || "",
            input?.userId || ""
        ),
        queryFn: () => getUserParticipation(input),
        enabled: Boolean(
            input?.contractAddress && input?.raffleId && input?.userId
        ),
        staleTime: options?.staleTime ?? 1000 * 60 * 5,
        gcTime: options?.gcTime ?? 1000 * 60 * 30,
    });
}

// 🎯 새로운 쿼리: 사용자 참여 요약 정보 조회 (가벼운 API)
export function useUserParticipationSummaryQuery(
    input?: GetUserParticipationSummaryInput,
    options?: {
        enabled?: boolean;
        staleTime?: number;
        gcTime?: number;
    }
) {
    return useQuery({
        queryKey: [
            ...raffleQueryKeys.userParticipation(
                input?.contractAddress || "",
                input?.raffleId || "",
                input?.userId || ""
            ),
            "summary",
        ],
        queryFn: () => getUserParticipationSummary(input),
        enabled: Boolean(
            input?.contractAddress && input?.raffleId && input?.userId
        ),
        staleTime: options?.staleTime ?? 1000 * 60 * 5,
        gcTime: options?.gcTime ?? 1000 * 60 * 30,
    });
}

// 🎯 새로운 쿼리: 사용자 참여 상세 정보 페이지네이션 조회
export function useUserParticipationDetailsQuery(
    input?: GetUserParticipationDetailsInput,
    options?: {
        enabled?: boolean;
        staleTime?: number;
        gcTime?: number;
    }
) {
    return useQuery({
        queryKey: [
            ...raffleQueryKeys.userParticipation(
                input?.contractAddress || "",
                input?.raffleId || "",
                input?.userId || ""
            ),
            "details",
            input?.page || 1,
            input?.limit || 20,
            input?.sortBy || "participatedAt",
            input?.sortOrder || "desc",
        ],
        queryFn: () => getUserParticipationDetails(input),
        enabled: Boolean(
            input?.contractAddress && input?.raffleId && input?.userId
        ),
        staleTime: options?.staleTime ?? 1000 * 60 * 5,
        gcTime: options?.gcTime ?? 1000 * 60 * 30,
    });
}

// 🎰 추첨 결과 조회 (불변 데이터 - 최장 캐시)
export function useLotteryResultQuery(
    input?: GetLotteryResultInput,
    options?: {
        enabled?: boolean;
        staleTime?: number;
        gcTime?: number;
    }
) {
    return useQuery({
        queryKey: raffleQueryKeys.lotteryResult(
            input?.contractAddress || "",
            input?.resultId || ""
        ),
        queryFn: () => getLotteryResult(input),
        enabled: Boolean(input?.contractAddress && input?.resultId),
        staleTime: options?.staleTime ?? 1000 * 60 * 5,
        gcTime: options?.gcTime ?? 1000 * 60 * 30,
    });
}

export function useRaffleParticipantsQuery(
    input?: GetRaffleParticipantsInput,
    options?: {
        enabled?: boolean;
        staleTime?: number;
        gcTime?: number;
    }
) {
    return useQuery({
        queryKey: raffleQueryKeys.raffleParticipants(
            input?.contractAddress || "",
            input?.raffleId || ""
        ),
        queryFn: () => getRaffleParticipants(input),
        enabled: Boolean(input?.contractAddress && input?.raffleId),
        staleTime: options?.staleTime ?? 1000 * 60 * 5,
        gcTime: options?.gcTime ?? 1000 * 60 * 30,
    });
}
