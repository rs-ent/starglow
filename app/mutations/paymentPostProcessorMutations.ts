/// app\mutations\paymentPostProcessorMutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    transferNFTToUser,
    escrowTransferNFT,
} from "@/app/actions/nftTransfer";
import { paymentPostProcessor } from "@/app/actions/paymentPostProcessor";
import { paymentPostProcessorKeys } from "@/app/queryKeys";

import type {
    TransferNFTInput,
    EscrowTransferNFTInput,
} from "@/app/actions/nftTransfer";
import type { Payment } from "@prisma/client";

// 기본 결제 후처리 뮤테이션
export const usePaymentPostProcessMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: paymentPostProcessor,
        onSuccess: (_result, payment) => {
            queryClient
                .invalidateQueries({
                    queryKey: paymentPostProcessorKeys.status(payment.id),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: paymentPostProcessorKeys.result(payment.id),
                })
                .catch((error) => {
                    console.error(error);
                });

            // payment 관련 쿼리도 무효화
            queryClient
                .invalidateQueries({
                    queryKey: ["payments", payment.id],
                })
                .catch((error) => {
                    console.error(error);
                });

            // 결과에 따라 추가 무효화
            if (payment.productTable === "nfts") {
                queryClient
                    .invalidateQueries({
                        queryKey: ["nft"],
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            } else if (payment.productTable === "events") {
                queryClient
                    .invalidateQueries({
                        queryKey: ["events"],
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
    });
};

// NFT 전송 뮤테이션
export const useNFTTransferMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: TransferNFTInput) => transferNFTToUser(input),
        onSuccess: (result, input) => {
            if (result.success) {
                queryClient
                    .invalidateQueries({
                        queryKey: paymentPostProcessorKeys.nft.transfer(
                            input.paymentId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                queryClient
                    .invalidateQueries({
                        queryKey: ["nft"],
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                queryClient
                    .invalidateQueries({
                        queryKey: ["payments", input.paymentId],
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
    });
};

export const useNFTEscrowTransferMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: EscrowTransferNFTInput) => escrowTransferNFT(input),
        onSuccess: (result, input) => {
            if (result.success) {
                queryClient
                    .invalidateQueries({
                        queryKey: paymentPostProcessorKeys.nft.escrowTransfer(
                            input.paymentId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                queryClient
                    .invalidateQueries({
                        queryKey: ["nft"],
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                queryClient
                    .invalidateQueries({
                        queryKey: ["payments", input.paymentId],
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
    });
};

// 결제 상태 업데이트 뮤테이션 (실패, 취소, 환불 등 처리)
export const usePaymentStatusUpdateMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            paymentId,
            status,
            reason,
        }: {
            paymentId: string;
            status: Payment["status"];
            reason?: string;
        }) => {
            const response = await fetch(`/api/payments/${paymentId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, reason }),
            });

            if (!response.ok) {
                throw new Error("Failed to update payment status");
            }

            return response.json();
        },
        onSuccess: (_, { paymentId }) => {
            queryClient
                .invalidateQueries({
                    queryKey: ["payments", paymentId],
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: paymentPostProcessorKeys.status(paymentId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
};
