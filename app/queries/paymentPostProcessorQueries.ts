// app/queries/paymentPostProcessorQueries.ts

import { useQuery } from "@tanstack/react-query";

import { getPayment } from "@/app/actions/payment";
import { paymentPostProcessorKeys } from "@/app/queryKeys";

import type { TransferNFTSuccess } from "@/app/actions/nftTransfer";

// 결제 후처리 상태 조회
export const usePaymentPostProcessStatus = (paymentId: string) => {
    return useQuery({
        queryKey: paymentPostProcessorKeys.status(paymentId),
        queryFn: async () => {
            const payment = await getPayment({ paymentId });
            if (!payment) {
                throw new Error("Payment not found");
            }
            return {
                status: payment.status,
                statusReason: payment.statusReason,
                updatedAt: payment.updatedAt,
            };
        },
        enabled: !!paymentId,
    });
};

// 결제 후처리 결과 조회
export const usePaymentPostProcessResult = (paymentId: string) => {
    return useQuery({
        queryKey: paymentPostProcessorKeys.result(paymentId),
        queryFn: async () => {
            const payment = await getPayment({ paymentId });
            if (!payment) {
                throw new Error("Payment not found");
            }
            return {
                result: payment.postProcessResult,
                resultAt: payment.postProcessResultAt,
                completedAt: payment.completedAt,
            };
        },
        enabled: !!paymentId,
    });
};

// NFT 전송 상태 조회
export const useNFTTransferStatus = (paymentId: string) => {
    return useQuery({
        queryKey: paymentPostProcessorKeys.nft.transfer(paymentId),
        queryFn: async () => {
            const payment = await getPayment({ paymentId });
            if (!payment) {
                throw new Error("Payment not found");
            }

            if (payment.productTable !== "nfts") {
                throw new Error("Payment is not for NFT");
            }

            const result = payment.postProcessResult as
                | TransferNFTSuccess["data"]
                | null;

            return {
                isTransferred: payment.status === "COMPLETED",
                transferDetails: result,
                transferredAt: payment.postProcessResultAt,
            };
        },
        enabled: !!paymentId,
    });
};

// NFT 에스크로 전송 상태 조회
export const useNFTEscrowTransferStatus = (paymentId: string) => {
    return useQuery({
        queryKey: paymentPostProcessorKeys.nft.escrowTransfer(paymentId),
        queryFn: async () => {
            const payment = await getPayment({ paymentId });
            if (!payment) {
                throw new Error("Payment not found");
            }

            if (payment.productTable !== "nfts") {
                throw new Error("Payment is not for NFT");
            }

            const result = payment.postProcessResult as
                | TransferNFTSuccess["data"]
                | null;

            return {
                isTransferred: payment.status === "COMPLETED",
                transferDetails: result,
                transferredAt: payment.postProcessResultAt,
            };
        },
        enabled: !!paymentId,
    });
};

// 이벤트 처리 상태 조회
export const useEventProcessStatus = (paymentId: string) => {
    return useQuery({
        queryKey: paymentPostProcessorKeys.events.process(paymentId),
        queryFn: async () => {
            const payment = await getPayment({ paymentId });
            if (!payment) {
                throw new Error("Payment not found");
            }

            if (payment.productTable !== "events") {
                throw new Error("Payment is not for event");
            }

            return {
                isProcessed: payment.status === "COMPLETED",
                processResult: payment.postProcessResult,
                processedAt: payment.postProcessResultAt,
            };
        },
        enabled: !!paymentId,
    });
};
