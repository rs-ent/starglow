/// app/hooks/usePaymentPostProcessor.ts

import { useCallback } from "react";
import { usePaymentPostProcessMutation } from "@/app/mutations/paymentPostProcessorMutations";
import {
    usePaymentPostProcessStatus,
    usePaymentPostProcessResult,
    useNFTTransferStatus,
    useNFTEscrowTransferStatus,
    useEventProcessStatus,
} from "@/app/queries/paymentPostProcessorQueries";
import { useToast } from "@/app/hooks/useToast";
import { Payment } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";

interface UsePaymentPostProcessorOptions {
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
    onSettled?: () => void;
}

// 공통으로 사용되는 transferDetails 타입
type TransferDetails = {
    txHash: string;
    receiverAddress: string;
    networkName?: string;
    transferDetails?: {
        from: string;
        to: string;
        tokenId: string;
        networkId: string;
        networkName: string;
        escrowWalletId: string;
    };
};

// NFT 전송 관련 타입
type NFTTransferDetails = {
    type: "NFT_TRANSFER";
    isTransferred: boolean;
    transferDetails: TransferDetails | null;
    transferredAt: Date | null;
};

// NFT 에스크로 전송 관련 타입
type NFTEscrowTransferDetails = {
    type: "NFT_ESCROW_TRANSFER";
    isTransferred: boolean;
    transferDetails: TransferDetails | null;
    transferredAt: Date | null;
};

// 이벤트 처리 관련 타입
type EventProcessDetails = {
    type: "EVENT_PROCESS";
    isProcessed: boolean;
    processResult: JsonValue;
    processedAt: Date | null;
};

// getDetails의 반환 타입
export type PaymentPostProcessorDetails =
    | NFTTransferDetails
    | NFTEscrowTransferDetails
    | EventProcessDetails
    | null;

export const usePaymentPostProcessor = (
    paymentId: string,
    options: UsePaymentPostProcessorOptions = {}
) => {
    const toast = useToast();
    const { onSuccess, onError, onSettled } = options;

    // Mutations
    const { mutate: processPayment, isPending: isProcessing } =
        usePaymentPostProcessMutation();

    // Queries
    const {
        data: status,
        isLoading: isLoadingStatus,
        error: statusError,
    } = usePaymentPostProcessStatus(paymentId);

    const {
        data: result,
        isLoading: isLoadingResult,
        error: resultError,
    } = usePaymentPostProcessResult(paymentId);

    // NFT 관련 상태 (조건부로 실행)
    const { data: nftTransferStatus, isLoading: isLoadingNFTTransfer } =
        useNFTTransferStatus(paymentId);

    const { data: nftEscrowStatus, isLoading: isLoadingNFTEscrow } =
        useNFTEscrowTransferStatus(paymentId);

    // 이벤트 관련 상태 (조건부로 실행)
    const { data: eventStatus, isLoading: isLoadingEvent } =
        useEventProcessStatus(paymentId);

    // 결제 후처리 실행
    const handleProcess = useCallback(
        async (payment: Payment) => {
            try {
                processPayment(payment, {
                    onSuccess: (data) => {
                        if (data && data.success) {
                            toast.success("Payment processed successfully");
                            onSuccess?.(data);
                        } else if (data && !data.success) {
                            toast.error(data.error.message);
                            onError?.(new Error(data.error.message));
                        }
                    },
                    onError: (error) => {
                        toast.error(
                            error instanceof Error
                                ? error.message
                                : "Failed to process payment"
                        );
                        onError?.(
                            error instanceof Error
                                ? error
                                : new Error("Failed to process payment")
                        );
                    },
                    onSettled,
                });
            } catch (error) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Failed to process payment"
                );
                onError?.(
                    error instanceof Error
                        ? error
                        : new Error("Failed to process payment")
                );
            }
        },
        [processPayment, toast, onSuccess, onError, onSettled]
    );

    // 현재 처리 상태 확인
    const isLoading =
        isLoadingStatus ||
        isLoadingResult ||
        isLoadingNFTTransfer ||
        isLoadingNFTEscrow ||
        isLoadingEvent ||
        isProcessing;

    // 에러 상태 확인
    const error = statusError || resultError;

    // 처리 완료 여부 확인
    const isCompleted = status?.status === "COMPLETED";

    // 현재 상태에 따른 상세 정보
    const getDetails: () => PaymentPostProcessorDetails = useCallback(() => {
        if (status?.status === "COMPLETED") {
            if (nftTransferStatus?.isTransferred) {
                return {
                    type: "NFT_TRANSFER",
                    ...nftTransferStatus,
                };
            }
            if (nftEscrowStatus?.isTransferred) {
                return {
                    type: "NFT_ESCROW_TRANSFER",
                    ...nftEscrowStatus,
                };
            }
            if (eventStatus?.isProcessed) {
                return {
                    type: "EVENT_PROCESS",
                    ...eventStatus,
                };
            }
        }
        return null;
    }, [status, nftTransferStatus, nftEscrowStatus, eventStatus]);

    return {
        // 상태
        status,
        result,
        nftTransferStatus,
        nftEscrowStatus,
        eventStatus,

        // 로딩 상태
        isLoading,

        // 에러
        error,

        // 완료 여부
        isCompleted,

        // 액션
        processPayment: handleProcess,

        // 상세 정보
        details: getDetails(),
    };
};
