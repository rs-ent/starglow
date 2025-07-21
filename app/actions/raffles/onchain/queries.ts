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
} from "./actions-read";

import {
    getOnchainRaffles,
    getRaffleFromContract,
    getRaffleCoreInfoForListCard,
    getUserParticipation,
    getLotteryResult,
    getRaffleParticipants,
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
        refetchInterval?: number;
    }
) {
    // 정적 데이터만 포함하는지 확인
    const isStaticDataOnly = input?.dataKeys?.every((key) =>
        ["basicInfo", "timing", "settings", "fee", "prizes"].includes(key)
    );

    // 정적 데이터 전용 최적화
    const staticDataOptimization = isStaticDataOnly
        ? {
              staleTime: 1000 * 60 * 15, // 15분 (매우 긴 캐시)
              gcTime: 1000 * 60 * 60, // 1시간 (메모리에 오래 보관)
              refetchOnWindowFocus: false, // 포커스 시 자동 새로고침 안함
              refetchOnReconnect: false, // 재연결 시 자동 새로고침 안함
          }
        : {
              staleTime: 1000 * 60 * 2, // 2분 (기본값)
              gcTime: 1000 * 60 * 30, // 30분
              refetchOnWindowFocus: true, // 포커스 시 새로고침
              refetchOnReconnect: true, // 재연결 시 새로고침
          };

    return useQuery({
        queryKey: raffleQueryKeys.contract(
            input?.contractAddress ?? "",
            input?.raffleId ?? "",
            input?.dataKeys
        ),
        queryFn: () => getRaffleFromContract(input),
        enabled: Boolean(input),
        refetchInterval: options?.refetchInterval,
        ...staticDataOptimization,
        // 사용자 옵션으로 오버라이드 가능
        staleTime: options?.staleTime ?? staticDataOptimization.staleTime,
        gcTime: options?.gcTime ?? staticDataOptimization.gcTime,
    });
}

export function useRaffleCoreInfoForListCardQuery(
    input?: GetRaffleCoreInfoForListCardInput,
    options?: {
        enabled?: boolean;
        refetchInterval?: number;
        staleTime?: number;
    }
) {
    return useQuery({
        queryKey: raffleQueryKeys.raffleListCard(
            `${input?.contractAddress ?? ""}-${input?.raffleId ?? ""}`
        ),
        queryFn: () => getRaffleCoreInfoForListCard(input),
        enabled: Boolean(input),
        staleTime: options?.staleTime ?? 1000 * 30, // 30초 (초단기 캐시)
        gcTime: 1000 * 60 * 5, // 5분 (빠른 정리)
        refetchInterval: options?.refetchInterval ?? 1000 * 30, // 30초마다 업데이트
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });
}

// 👤 사용자 참가 정보 조회 (사용자 액션에 따라 변화)
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
            input?.userId ?? ""
        ),
        queryFn: () => getUserParticipation(input),
        enabled: Boolean(input && input.userId),
        // 사용자 데이터 최적화
        staleTime: options?.staleTime ?? 1000 * 15, // 15초 (중간 캐시)
        gcTime: options?.gcTime ?? 1000 * 60 * 5, // 5분
        refetchInterval: options?.refetchInterval, // 수동 새로고침 (참여 후 호출)
        refetchOnWindowFocus: true, // 포커스 시 새로고침
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
            input?.contractAddress ?? "",
            input?.resultId ?? ""
        ),
        queryFn: () => getLotteryResult(input),
        enabled: Boolean(input),
        // 불변 데이터 최적화
        staleTime: options?.staleTime ?? 1000 * 60 * 60 * 2, // 2시간 (매우 긴 캐시)
        gcTime: options?.gcTime ?? 1000 * 60 * 60 * 24, // 24시간 (장기 보관)
        refetchOnWindowFocus: false, // 자동 새로고침 불필요
        refetchOnReconnect: false, // 재연결 새로고침 불필요
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
            input?.contractAddress ?? "",
            input?.raffleId ?? ""
        ),
        queryFn: () => getRaffleParticipants(input),
        enabled: Boolean(input),
        staleTime: options?.staleTime ?? 1000 * 30, // 30초
        gcTime: options?.gcTime ?? 1000 * 60 * 5, // 5분
    });
}
