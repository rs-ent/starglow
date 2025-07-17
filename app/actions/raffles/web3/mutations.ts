/// app/actions/raffles/web3/mutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { raffleQueryKeys } from "./queryKeys";
import { participate, participateAndDraw, batchDraw } from "./actions-write";

// 🎯 일반 래플 참가 Mutation
export function useParticipateMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: participate,
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient
                    .invalidateQueries({
                        queryKey: raffleQueryKeys.status(
                            variables.contractAddress,
                            variables.raffleId
                        ),
                    })
                    .catch((error) => {
                        console.error("❌ Participate mutation error:", error);
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: raffleQueryKeys.userParticipation(
                            variables.contractAddress,
                            variables.raffleId,
                            variables.playerId
                        ),
                    })
                    .catch((error) => {
                        console.error("❌ Participate mutation error:", error);
                    });

                // 래플 목록 상태 업데이트 (참가자 수 증가)
                queryClient
                    .invalidateQueries({
                        queryKey: raffleQueryKeys.raffleListStatus([
                            {
                                contractAddress: variables.contractAddress,
                                raffleId: variables.raffleId,
                            },
                        ]),
                    })
                    .catch((error) => {
                        console.error("❌ Participate mutation error:", error);
                    });
            } else {
                throw new Error(data.error || "Failed to participate");
            }
        },
    });
}

// 🎲 즉시 추첨 래플 참가 Mutation
export function useParticipateAndDrawMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: participateAndDraw,
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient
                    .invalidateQueries({
                        queryKey: raffleQueryKeys.status(
                            variables.contractAddress,
                            variables.raffleId
                        ),
                    })
                    .catch((error) => {
                        console.error(
                            "❌ ParticipateAndDraw mutation error:",
                            error
                        );
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: raffleQueryKeys.userParticipation(
                            variables.contractAddress,
                            variables.raffleId,
                            variables.playerId
                        ),
                    })
                    .catch((error) => {
                        console.error(
                            "❌ ParticipateAndDraw mutation error:",
                            error
                        );
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: raffleQueryKeys.raffleListStatus([
                            {
                                contractAddress: variables.contractAddress,
                                raffleId: variables.raffleId,
                            },
                        ]),
                    })
                    .catch((error) => {
                        console.error(
                            "❌ ParticipateAndDraw mutation error:",
                            error
                        );
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: raffleQueryKeys.contract(
                            variables.contractAddress,
                            variables.raffleId
                        ),
                    })
                    .catch((error) => {
                        console.error(
                            "❌ ParticipateAndDraw mutation error:",
                            error
                        );
                    });
            } else {
                throw new Error(data.error || "Failed to participate and draw");
            }
        },
    });
}

// 🔢 배치 추첨 Mutation (관리자용)
export function useBatchDrawMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: batchDraw,
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient
                    .invalidateQueries({
                        queryKey: raffleQueryKeys.status(
                            variables.contractAddress,
                            variables.raffleId
                        ),
                    })
                    .catch((error) => {
                        console.error("❌ BatchDraw mutation error:", error);
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: raffleQueryKeys.raffleListStatus([
                            {
                                contractAddress: variables.contractAddress,
                                raffleId: variables.raffleId,
                            },
                        ]),
                    })
                    .catch((error) => {
                        console.error("❌ BatchDraw mutation error:", error);
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: raffleQueryKeys.contract(
                            variables.contractAddress,
                            variables.raffleId
                        ),
                    })
                    .catch((error) => {
                        console.error("❌ BatchDraw mutation error:", error);
                    });
            } else {
                throw new Error(data.error || "Failed to batch draw");
            }
        },
    });
}
