/// app/actions/raffles/web3/queries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import type {
    GetOnchainRafflesInput,
    GetRaffleFromContractInput,
    GetRaffleStatusInput,
    GetRaffleListInput,
    GetUserParticipationInput,
    GetLotteryResultInput,
} from "./actions-read";

import {
    getOnchainRaffles,
    getRaffleFromContract,
    getRaffleStatusFromContract,
    getRaffleListFromContract,
    getRaffleListStatusFromContract,
    getUserParticipation,
    getLotteryResult,
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

// 🎯 특정 래플 상세 정보 조회
export function useRaffleFromContractQuery(
    input?: GetRaffleFromContractInput,
    options?: {
        enabled?: boolean;
        staleTime?: number;
        gcTime?: number;
        refetchInterval?: number;
    }
) {
    return useQuery({
        queryKey: raffleQueryKeys.contract(
            input?.contractAddress ?? "",
            input?.raffleId ?? "",
            input?.dataKeys
        ),
        queryFn: () => getRaffleFromContract(input),
        staleTime: options?.staleTime ?? 1000 * 60 * 2, // 2분
        gcTime: options?.gcTime ?? 1000 * 60 * 10, // 10분
        enabled: Boolean(input),
        refetchInterval: options?.refetchInterval,
    });
}

// 📈 래플 상태만 조회 (빠른 업데이트용)
export function useRaffleStatusQuery(
    input?: GetRaffleStatusInput,
    options?: {
        enabled?: boolean;
        refetchInterval?: number;
        staleTime?: number;
    }
) {
    return useQuery({
        queryKey: raffleQueryKeys.status(
            input?.contractAddress ?? "",
            input?.raffleId ?? ""
        ),
        queryFn: () => getRaffleStatusFromContract(input),
        staleTime: options?.staleTime ?? 1000 * 30, // 30초 (실시간성 중요)
        gcTime: 1000 * 60 * 5, // 5분
        enabled: Boolean(input),
        refetchInterval: options?.refetchInterval ?? 1000 * 60, // 1분마다 자동 업데이트
    });
}

// 📋 래플 목록 (멀티콜) 조회
export function useRaffleListQuery(
    input?: GetRaffleListInput,
    options?: {
        enabled?: boolean;
        staleTime?: number;
        gcTime?: number;
    }
) {
    return useQuery({
        queryKey: raffleQueryKeys.raffleList(input?.raffles ?? []),
        queryFn: () => getRaffleListFromContract(input),
        staleTime: options?.staleTime ?? 1000 * 60 * 3, // 3분
        gcTime: options?.gcTime ?? 1000 * 60 * 15, // 15분
        enabled: Boolean(input),
    });
}

// ⚡ 래플 목록 상태만 조회 (초고속)
export function useRaffleListStatusQuery(
    input?: GetRaffleListInput,
    options?: {
        enabled?: boolean;
        refetchInterval?: number;
        staleTime?: number;
    }
) {
    return useQuery({
        queryKey: raffleQueryKeys.raffleListStatus(input?.raffles ?? []),
        queryFn: () => getRaffleListStatusFromContract(input),
        staleTime: options?.staleTime ?? 1000 * 15, // 15초 (실시간성 최고)
        gcTime: 1000 * 60 * 3, // 3분
        enabled: Boolean(input),
        refetchInterval: options?.refetchInterval ?? 1000 * 30, // 30초마다 상태 업데이트
    });
}

// 👤 사용자 참가 정보 조회
export function useUserParticipationQuery(
    input?: GetUserParticipationInput,
    options?: {
        enabled?: boolean;
        staleTime?: number;
        gcTime?: number;
        refetchInterval?: number;
    }
) {
    return useQuery({
        queryKey: raffleQueryKeys.userParticipation(
            input?.contractAddress ?? "",
            input?.raffleId ?? "",
            input?.playerId ?? ""
        ),
        queryFn: () => getUserParticipation(input),
        staleTime: options?.staleTime ?? 1000 * 60, // 1분 (사용자 데이터는 자주 확인)
        gcTime: options?.gcTime ?? 1000 * 60 * 20, // 20분
        enabled: Boolean(input),
        refetchInterval: options?.refetchInterval,
    });
}

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
            input?.contractAddress ?? "",
            input?.resultId ?? ""
        ),
        queryFn: () => getLotteryResult(input),
        staleTime: options?.staleTime ?? 1000 * 60 * 10, // 10분 (추첨 결과는 변경되지 않음)
        gcTime: options?.gcTime ?? 1000 * 60 * 60, // 1시간
        enabled: Boolean(input),
    });
}
