/// app/actions/raffles/onchain/queries-v2.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import {
    getRaffleListCardInfoV2,
    getRaffleListCardInfoBatchV2,
    getActiveRafflesV2,
    getAllRafflesV2,
    getFullRaffleInfoV2,
    getUserParticipationV2,
    getUserParticipationCountV2,
    getContractMetadataV2,
} from "./actions-read-v2";

import {
    checkRaffleParticipationV2,
    estimateParticipationGasV2,
} from "./actions-write-v2";

import { getBatchDrawProgress } from "./actions-admin-v2";

import { raffleV2QueryKeys } from "./queryKeys-v2";

import type {
    GetRaffleListCardInfoInput,
    GetRaffleListCardInfoBatchInput,
    GetActiveRafflesInput,
    GetAllRafflesInput,
    GetFullRaffleInfoInput,
    GetUserParticipationInput,
    GetUserParticipationCountInput,
    GetContractMetadataInput,
} from "./actions-read-v2";

// V2 전용 추가 Input 타입들 (actions-read-v2.ts에 없는 것들만)
export interface GetBatchDrawProgressV2Input {
    contractAddress: string;
    raffleId: string;
}

export interface GetParticipationCheckV2Input {
    contractAddress: string;
    raffleId: string;
    playerId: string;
}

export interface GetGasEstimateV2Input {
    contractAddress: string;
    raffleId: string;
    playerId: string;
}

// 📊 개별 래플 카드 정보 조회
export function useRaffleCardInfoV2Query(input?: GetRaffleListCardInfoInput) {
    return useQuery({
        queryKey: raffleV2QueryKeys.cardInfo(
            input?.contractAddress || "",
            input?.raffleId || ""
        ),
        queryFn: async () => {
            if (!input?.contractAddress || !input?.raffleId) return null;

            return getRaffleListCardInfoV2({
                contractAddress: input.contractAddress,
                raffleId: input.raffleId,
            });
        },
        enabled: Boolean(input?.contractAddress && input?.raffleId),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
    });
}

// 📊 배치 래플 카드 정보 조회
export function useRaffleCardInfoBatchV2Query(
    input?: GetRaffleListCardInfoBatchInput
) {
    return useQuery({
        queryKey: raffleV2QueryKeys.cardInfoBatch(input?.contractAddress || ""),
        queryFn: async () => {
            if (!input?.contractAddress) return null;

            return getRaffleListCardInfoBatchV2({
                contractAddress: input.contractAddress,
            });
        },
        enabled: Boolean(input?.contractAddress),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
    });
}

// 📊 활성 래플들 조회
export function useActiveRafflesV2Query(input?: GetActiveRafflesInput) {
    return useQuery({
        queryKey: raffleV2QueryKeys.activeRaffles(input?.contractAddress || ""),
        queryFn: async () => {
            if (!input?.contractAddress) return null;

            return getActiveRafflesV2({
                contractAddress: input.contractAddress,
            });
        },
        enabled: Boolean(input?.contractAddress),
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 10,
    });
}

// 📊 모든 래플들 조회
export function useAllRafflesV2Query(input?: GetAllRafflesInput) {
    return useQuery({
        queryKey: raffleV2QueryKeys.allRaffles(input?.isActive || "ACTIVE"),
        queryFn: async () => {
            return getAllRafflesV2(input || { isActive: "ACTIVE" });
        },
        enabled: Boolean(input?.isActive),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
    });
}

// 🔒 전체 래플 정보 상세 조회
export function useFullRaffleInfoV2Query(input?: GetFullRaffleInfoInput) {
    return useQuery({
        queryKey: raffleV2QueryKeys.fullRaffleInfo(
            input?.contractAddress || "",
            input?.raffleId || ""
        ),
        queryFn: async () => {
            if (!input?.contractAddress || !input?.raffleId) return null;

            return getFullRaffleInfoV2({
                contractAddress: input.contractAddress,
                raffleId: input.raffleId,
            });
        },
        enabled: Boolean(input?.contractAddress && input?.raffleId),
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 60,
    });
}

// 👤 사용자 참여 정보 조회
export function useUserParticipationV2Query(input?: GetUserParticipationInput) {
    return useQuery({
        queryKey: raffleV2QueryKeys.userParticipation(
            input?.contractAddress || "",
            input?.raffleId || "",
            input?.playerId || ""
        ),
        queryFn: async () => {
            if (!input?.contractAddress || !input?.raffleId || !input?.playerId)
                return null;

            return getUserParticipationV2({
                contractAddress: input.contractAddress,
                raffleId: input.raffleId,
                playerId: input.playerId,
            });
        },
        enabled: Boolean(
            input?.contractAddress && input?.raffleId && input?.playerId
        ),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,
    });
}

// 👤 사용자 참여 횟수 조회
export function useUserParticipationCountV2Query(
    input?: GetUserParticipationCountInput
) {
    return useQuery({
        queryKey: raffleV2QueryKeys.userParticipationCount(
            input?.contractAddress || "",
            input?.raffleId || "",
            input?.playerId || ""
        ),
        queryFn: async () => {
            if (!input?.contractAddress || !input?.raffleId || !input?.playerId)
                return null;

            return getUserParticipationCountV2({
                contractAddress: input.contractAddress,
                raffleId: input.raffleId,
                playerId: input.playerId,
            });
        },
        enabled: Boolean(
            input?.contractAddress && input?.raffleId && input?.playerId
        ),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 15,
    });
}

// 🏗️ 컨트랙트 메타데이터 조회
export function useContractMetadataV2Query(input?: GetContractMetadataInput) {
    return useQuery({
        queryKey: raffleV2QueryKeys.contractMetadata(
            input?.contractAddress || ""
        ),
        queryFn: async () => {
            if (!input?.contractAddress) return null;

            return getContractMetadataV2({
                contractAddress: input.contractAddress,
            });
        },
        enabled: Boolean(input?.contractAddress),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
    });
}

// 🎯 배치 추첨 진행률 조회
export function useBatchDrawProgressV2Query(
    input?: GetBatchDrawProgressV2Input
) {
    return useQuery({
        queryKey: raffleV2QueryKeys.batchDrawProgress(
            input?.contractAddress || "",
            input?.raffleId || ""
        ),
        queryFn: async () => {
            if (!input?.contractAddress || !input?.raffleId) return null;

            return getBatchDrawProgress({
                contractAddress: input.contractAddress,
                raffleId: input.raffleId,
            });
        },
        enabled: Boolean(input?.contractAddress && input?.raffleId),
        staleTime: 1000 * 10,
        gcTime: 1000 * 60 * 5,
    });
}

// ✅ 참여 가능 여부 확인
export function useParticipationCheckV2Query(
    input?: GetParticipationCheckV2Input
) {
    return useQuery({
        queryKey: raffleV2QueryKeys.participationCheck(
            input?.contractAddress || "",
            input?.raffleId || "",
            input?.playerId || ""
        ),
        queryFn: async () => {
            if (!input?.contractAddress || !input?.raffleId || !input?.playerId)
                return null;

            return checkRaffleParticipationV2({
                contractAddress: input.contractAddress,
                raffleId: input.raffleId,
                playerId: input.playerId,
            });
        },
        enabled: Boolean(
            input?.contractAddress && input?.raffleId && input?.playerId
        ),
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 5,
    });
}

// ⛽ 가스비 추정
export function useGasEstimateV2Query(input?: GetGasEstimateV2Input) {
    return useQuery({
        queryKey: raffleV2QueryKeys.gasEstimate(
            input?.contractAddress || "",
            input?.raffleId || "",
            input?.playerId || ""
        ),
        queryFn: async () => {
            if (!input?.contractAddress || !input?.raffleId || !input?.playerId)
                return null;

            return estimateParticipationGasV2({
                contractAddress: input.contractAddress,
                raffleId: input.raffleId,
                playerId: input.playerId,
            });
        },
        enabled: Boolean(
            input?.contractAddress && input?.raffleId && input?.playerId
        ),
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 5,
    });
}
