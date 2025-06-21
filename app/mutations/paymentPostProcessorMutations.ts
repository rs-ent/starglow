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
        onSuccess: (result, payment) => {
            // 성공 시 관련된 모든 쿼리 무효화
            queryClient.invalidateQueries({
                queryKey: paymentPostProcessorKeys.status(payment.id),
            });
            queryClient.invalidateQueries({
                queryKey: paymentPostProcessorKeys.result(payment.id),
            });

            // payment 관련 쿼리도 무효화
            queryClient.invalidateQueries({
                queryKey: ["payments", payment.id],
            });

            // 결과에 따라 추가 무효화
            if (payment.productTable === "nfts") {
                queryClient.invalidateQueries({
                    queryKey: ["nft"],
                });
            } else if (payment.productTable === "events") {
                queryClient.invalidateQueries({
                    queryKey: ["events"],
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
                // NFT 전송 성공 시 관련 쿼리 무효화
                queryClient.invalidateQueries({
                    queryKey: paymentPostProcessorKeys.nft.transfer(
                        input.paymentId
                    ),
                });
                queryClient.invalidateQueries({
                    queryKey: ["nft"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["payments", input.paymentId],
                });
            }
        },
    });
};

// NFT 에스크로 전송 뮤테이션
export const useNFTEscrowTransferMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: EscrowTransferNFTInput) => escrowTransferNFT(input),
        onSuccess: (result, input) => {
            if (result.success) {
                // 에스크로 전송 성공 시 관련 쿼리 무효화
                queryClient.invalidateQueries({
                    queryKey: paymentPostProcessorKeys.nft.escrowTransfer(
                        input.paymentId
                    ),
                });
                queryClient.invalidateQueries({
                    queryKey: ["nft"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["payments", input.paymentId],
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
            // 상태 업데이트 성공 시 관련 쿼리 무효화
            queryClient.invalidateQueries({
                queryKey: ["payments", paymentId],
            });
            queryClient.invalidateQueries({
                queryKey: paymentPostProcessorKeys.status(paymentId),
            });
        },
    });
};
