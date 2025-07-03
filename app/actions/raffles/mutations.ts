/// app/actions/raffles/mutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { raffleKeys, playerAssetsKeys } from "@/app/queryKeys";

import {
    createRaffle,
    updateRaffle,
    participateInRaffle,
    revealRaffleResult,
    revealAllRaffleResults,
    drawAllWinners,
    distributePrizes,
    bulkRevealResults,
} from "./actions";

/**
 * 래플 생성 뮤테이션 훅
 */
export function useCreateRaffleMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createRaffle,
        onMutate: async (_variables) => {
            await queryClient.cancelQueries({ queryKey: raffleKeys.all });
            await queryClient.cancelQueries({ queryKey: raffleKeys.lists() });

            const previousRaffles = queryClient.getQueryData(
                raffleKeys.lists()
            );

            return { previousRaffles };
        },
        onSuccess: (data, _variables, _context) => {
            queryClient
                .invalidateQueries({ queryKey: raffleKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({ queryKey: raffleKeys.lists() })
                .catch((error) => {
                    console.error(error);
                });

            if (data.success && data.data?.id) {
                queryClient
                    .invalidateQueries({
                        queryKey: raffleKeys.detail(data.data.id),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
        onError: (error, _variables, context) => {
            console.error("Error creating raffle:", error);

            if (context?.previousRaffles) {
                queryClient.setQueryData(
                    raffleKeys.lists(),
                    context.previousRaffles
                );
            }
        },
    });
}

/**
 * 래플 수정 뮤테이션 훅
 */
export function useUpdateRaffleMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateRaffle,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: raffleKeys.all });
            await queryClient.cancelQueries({ queryKey: raffleKeys.lists() });
            await queryClient.cancelQueries({
                queryKey: raffleKeys.detail(variables.id),
            });

            const previousRaffles = queryClient.getQueryData(
                raffleKeys.lists()
            );
            const previousRaffle = queryClient.getQueryData(
                raffleKeys.detail(variables.id)
            );

            return { previousRaffles, previousRaffle };
        },
        onSuccess: (data, variables, _context) => {
            if (!data.success) {
                throw new Error(data.error || "Error updating raffle");
            }

            queryClient
                .invalidateQueries({ queryKey: raffleKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({ queryKey: raffleKeys.lists() })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.detail(variables.id),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error, variables, context) => {
            console.error("Error updating raffle:", error);

            if (context?.previousRaffles) {
                queryClient.setQueryData(
                    raffleKeys.lists(),
                    context.previousRaffles
                );
            }

            if (context?.previousRaffle) {
                queryClient.setQueryData(
                    raffleKeys.detail(variables.id),
                    context.previousRaffle
                );
            }

            throw error;
        },
    });
}

/**
 * 래플 참가 뮤테이션 훅
 */
export function useParticipateRaffleMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: participateInRaffle,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: raffleKeys.detail(variables.raffleId),
            });
            await queryClient.cancelQueries({
                queryKey: raffleKeys.participants.all(variables.raffleId),
            });

            const previousRaffle = queryClient.getQueryData(
                raffleKeys.detail(variables.raffleId)
            );
            const previousParticipants = queryClient.getQueryData(
                raffleKeys.participants.all(variables.raffleId)
            );

            return { previousRaffle, previousParticipants };
        },
        onSuccess: (data, variables, _context) => {
            if (!data.success) {
                throw new Error(data.error || "Error participating in raffle");
            }

            // 래플 상세 정보 갱신
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.detail(variables.raffleId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 참가자 목록 갱신
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.participants.all(variables.raffleId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 🎯 핵심: 플레이어별 참가 목록 갱신 (Record 페이지용)
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.playerParticipations(
                        variables.raffleId,
                        variables.playerId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 🎯 핵심: 미공개 결과 개수 갱신 (Record 페이지용)
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.unrevealedCount(
                        variables.raffleId,
                        variables.playerId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 플레이어 에셋 잔액 갱신 (참가비 차감 반영)
            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.balances(variables.playerId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 즉시 공개 래플인 경우 당첨자 목록도 갱신
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.winners.all(variables.raffleId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 🎯 즉시 공개 래플인 경우 플레이어별 당첨자 목록도 갱신
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.winners.byPlayer(variables.playerId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error, variables, context) => {
            console.error("Error participating in raffle:", error);

            // 오류 발생 시 이전 상태로 롤백
            if (context?.previousRaffle) {
                queryClient.setQueryData(
                    raffleKeys.detail(variables.raffleId),
                    context.previousRaffle
                );
            }

            if (context?.previousParticipants) {
                queryClient.setQueryData(
                    raffleKeys.participants.all(variables.raffleId),
                    context.previousParticipants
                );
            }

            throw error;
        },
    });
}

/**
 * 래플 결과 공개 뮤테이션 훅 (즉시 공개용)
 */
export function useRevealRaffleResultMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: revealRaffleResult,
        onSuccess: (data, variables, _context) => {
            if (!data.success) {
                throw new Error(data.error || "Error revealing raffle result");
            }

            // 참가자 정보 갱신
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.participants.all(variables.raffleId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 플레이어별 참가 목록 갱신 (올바른 키 사용)
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.playerParticipations(
                        variables.raffleId,
                        variables.playerId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 미공개 결과 개수도 갱신
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.unrevealedCount(
                        variables.raffleId,
                        variables.playerId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error) => {
            console.error("Error revealing raffle result:", error);
            throw error;
        },
    });
}

/**
 * 일괄 추첨 뮤테이션 훅
 */
export function useDrawAllWinnersMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: drawAllWinners,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: raffleKeys.detail(variables.raffleId),
            });
            await queryClient.cancelQueries({
                queryKey: raffleKeys.winners.all(variables.raffleId),
            });

            const previousRaffle = queryClient.getQueryData(
                raffleKeys.detail(variables.raffleId)
            );
            const previousWinners = queryClient.getQueryData(
                raffleKeys.winners.all(variables.raffleId)
            );

            return { previousRaffle, previousWinners };
        },
        onSuccess: (data, variables, _context) => {
            if (!data.success) {
                throw new Error(data.error || "Error drawing winners");
            }

            // 래플 상세 정보 갱신
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.detail(variables.raffleId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 당첨자 목록 갱신
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.winners.all(variables.raffleId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 참가자 목록 갱신 (추첨 결과 반영)
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.participants.all(variables.raffleId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 래플 목록 갱신 (상태 변경 반영)
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.lists(),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error, variables, context) => {
            console.error("Error drawing winners:", error);

            // 오류 발생 시 이전 상태로 롤백
            if (context?.previousRaffle) {
                queryClient.setQueryData(
                    raffleKeys.detail(variables.raffleId),
                    context.previousRaffle
                );
            }

            if (context?.previousWinners) {
                queryClient.setQueryData(
                    raffleKeys.winners.all(variables.raffleId),
                    context.previousWinners
                );
            }

            throw error;
        },
    });
}

/**
 * 상품 배포 뮤테이션 훅
 */
export function useDistributePrizesMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: distributePrizes,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: raffleKeys.winners.all(variables.raffleId),
            });

            const previousWinners = queryClient.getQueryData(
                raffleKeys.winners.all(variables.raffleId)
            );

            return { previousWinners };
        },
        onSuccess: (data, variables, _context) => {
            if (!data.success) {
                throw new Error(data.error || "Error distributing prizes");
            }

            // 당첨자 목록 갱신 (배포 상태 반영)
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.winners.all(variables.raffleId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 특정 플레이어 대상 배포인 경우 해당 플레이어의 에셋 잔액 갱신
            if (variables.playerId) {
                queryClient
                    .invalidateQueries({
                        queryKey: playerAssetsKeys.balances(variables.playerId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: raffleKeys.winners.byPlayer(
                            variables.playerId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                // 🎯 상품 배포 후 Record 페이지 갱신 (배포 상태 반영)
                queryClient
                    .invalidateQueries({
                        queryKey: raffleKeys.playerParticipations(
                            variables.raffleId,
                            variables.playerId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }

            // 래플 상세 정보 갱신
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.detail(variables.raffleId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error, variables, context) => {
            console.error("Error distributing prizes:", error);

            // 오류 발생 시 이전 상태로 롤백
            if (context?.previousWinners) {
                queryClient.setQueryData(
                    raffleKeys.winners.all(variables.raffleId),
                    context.previousWinners
                );
            }

            throw error;
        },
    });
}

/**
 * 모든 래플 결과 공개 뮤테이션 훅 (다중 참여 지원)
 */
export function useRevealAllRaffleResultsMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: revealAllRaffleResults,
        onSuccess: (data, variables, _context) => {
            if (!data.success) {
                throw new Error(
                    data.error || "Error revealing all raffle results"
                );
            }

            // 참가자 정보 갱신
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.participants.all(variables.raffleId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 플레이어별 참가 목록 갱신 (올바른 키 사용)
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.playerParticipations(
                        variables.raffleId,
                        variables.playerId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 미공개 결과 개수도 갱신
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.unrevealedCount(
                        variables.raffleId,
                        variables.playerId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error) => {
            console.error("Error revealing all raffle results:", error);
            throw error;
        },
    });
}

/**
 * 일괄 결과 공개 뮤테이션 훅 (특정 참여 기록들만)
 */
export function useBulkRevealResultsMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: bulkRevealResults,
        onSuccess: (data, variables, _context) => {
            if (!data.success) {
                throw new Error(data.error || "Error bulk revealing results");
            }

            // 참가자 정보 갱신
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.participants.all(variables.raffleId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 플레이어별 참가 목록 갱신 (올바른 키 사용)
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.playerParticipations(
                        variables.raffleId,
                        variables.playerId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 미공개 결과 개수도 갱신
            queryClient
                .invalidateQueries({
                    queryKey: raffleKeys.unrevealedCount(
                        variables.raffleId,
                        variables.playerId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error) => {
            console.error("Error bulk revealing results:", error);
            throw error;
        },
    });
}
