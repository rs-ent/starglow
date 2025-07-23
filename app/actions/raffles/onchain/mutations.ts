/// app/actions/raffles/web3/mutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { raffleQueryKeys } from "./queryKeys";
import { participate, participateAndDraw, batchDraw } from "./actions-write";

function formatErrorMessage(error: any): string {
    const errorMessage = error?.message || "Unknown error occurred";

    if (error?.isRevert) {
        if (errorMessage.toLowerCase().includes("already participated")) {
            return "You have already participated in this raffle";
        }
        if (
            errorMessage.toLowerCase().includes("raffle ended") ||
            errorMessage.toLowerCase().includes("not active")
        ) {
            return "This raffle is no longer active";
        }
        if (errorMessage.toLowerCase().includes("insufficient")) {
            return "Insufficient balance to participate";
        }
        if (errorMessage.toLowerCase().includes("already drawn")) {
            return "This raffle has already been drawn";
        }

        if (
            errorMessage
                .toLowerCase()
                .includes("transaction reverted by smart contract") ||
            errorMessage.toLowerCase().includes("possible reasons:")
        ) {
            return "Looks like network is busy now. Please try again!";
        }

        return errorMessage.includes("reverted:")
            ? errorMessage
            : `Smart contract error: ${errorMessage}`;
    }

    if (
        errorMessage.toLowerCase().includes("user rejected") ||
        errorMessage.toLowerCase().includes("user denied")
    ) {
        return "Transaction was cancelled by user";
    }

    if (errorMessage.toLowerCase().includes("timeout")) {
        return "Transaction timeout. Please check your transaction status or try again.";
    }

    if (
        errorMessage.toLowerCase().includes("network") ||
        errorMessage.toLowerCase().includes("rpc") ||
        errorMessage.toLowerCase().includes("connection")
    ) {
        return "Network connection issue. Please check your internet and try again.";
    }

    if (
        errorMessage.toLowerCase().includes("replacement") ||
        errorMessage.toLowerCase().includes("underpriced")
    ) {
        return "Gas price issue. Please try again with a higher gas fee.";
    }

    return errorMessage;
}

export function useParticipateMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: Parameters<typeof participate>[0]) => {
            const result = await participate(params);
            if (!result.success) {
                const errorMessage = formatErrorMessage({
                    message: result.error,
                });
                throw new Error(errorMessage);
            }
            return result.data;
        },
        onSuccess: (data, variables) => {
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
        },
        onError: (error) => {
            console.error("❌ Participation error:", error);
            if ((error as any)?.message?.includes("reverted")) {
                console.warn(
                    "🔄 User attempted to participate but smart contract reverted"
                );
            }
        },
    });
}

// 🎲 즉시 추첨 래플 참가 Mutation
export function useParticipateAndDrawMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            params: Parameters<typeof participateAndDraw>[0]
        ) => {
            const result = await participateAndDraw(params);
            if (!result.success) {
                const errorMessage = formatErrorMessage({
                    message: result.error,
                });
                throw new Error(errorMessage);
            }
            return result.data;
        },
        onSuccess: (data, variables) => {
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
        },
        onError: (error) => {
            console.error("❌ ParticipateAndDraw error:", error);
            if ((error as any)?.message?.includes("reverted")) {
                console.warn(
                    "🔄 User attempted instant draw but smart contract reverted"
                );
            }
        },
    });
}

// 🔢 배치 추첨 Mutation (관리자용)
export function useBatchDrawMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: Parameters<typeof batchDraw>[0]) => {
            const result = await batchDraw(params);
            if (!result.success) {
                const errorMessage = formatErrorMessage({
                    message: result.error,
                });
                throw new Error(errorMessage);
            }
            return result.data;
        },
        onSuccess: (data, variables) => {
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
        },
        onError: (error) => {
            console.error("❌ BatchDraw error:", error);
            if ((error as any)?.message?.includes("reverted")) {
                console.warn(
                    "🔄 Admin attempted batch draw but smart contract reverted"
                );
            }
        },
    });
}
