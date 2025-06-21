/// app/hooks/usePayment.ts

"use client";

import { useState, useCallback } from "react";

import * as PortOne from "@portone/browser-sdk/v2";
import { PaymentStatus } from "@prisma/client";

import {
    VerifyPaymentResponse,
    CreatePaymentResponse,
} from "@/app/actions/payment";
import {
    useCreatePaymentMutation,
    useVerifyPaymentMutation,
    useCancelPaymentMutation,
    useRefundPaymentMutation,
    useUpdatePaymentUserIdMutation,
} from "@/app/mutations/paymentMutations";
import {
    usePaymentQuery,
    usePaymentsByUserIdQuery,
    usePaymentsByStatusQuery,
} from "@/app/queries/paymentQueries";
import {
    PayMethod,
    EasyPayProvider,
    CardProvider,
    Currency,
    ProductTable,
} from "@/lib/types/payment";

import type {
    CreatePaymentInput,
    VerifyPaymentInput,
    CancelPaymentInput} from "@/app/actions/payment";
import type { Payment} from "@prisma/client";

type PaymentHookReturn = {
    currentPaymentId: string | null;
    currentPayment: Payment | null | undefined;
    payments: Payment[] | undefined;
    paymentsByStatus: Payment[] | undefined;
    paidPayments: Payment[] | undefined;

    isLoadingPayments: boolean;
    isLoadingCurrentPayment: boolean;
    isLoadingPaymentsByStatus: boolean;
    isLoadingPaidPayments: boolean;

    initiatePayment: (input: CreatePaymentInput) => void;
    resetAndInitiatePayment: (input: CreatePaymentInput) => void;
    verifyPayment: (input: VerifyPaymentInput) => void;
    cancelPayment: (input: CancelPaymentInput) => void;
    refundPayment: (input: CancelPaymentInput) => void;
    updatePaymentUserId: (paymentId: string, userId: string) => void;

    isCreatingPayment: boolean;
    isVerifyingPayment: boolean;
    isCancellingPayment: boolean;
    isRefundingPayment: boolean;

    setUserId: (userId: string | null) => void;
    setCurrentPaymentId: (paymentId: string | null) => void;
};

export function usePayment(): PaymentHookReturn {
    const [userId, setUserId] = useState<string | null>(null);
    const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(
        null
    );

    // Mutations
    const createPaymentMutation = useCreatePaymentMutation();
    const verifyPaymentMutation = useVerifyPaymentMutation();
    const cancelPaymentMutation = useCancelPaymentMutation();
    const refundPaymentMutation = useRefundPaymentMutation();
    const updatePaymentUserIdMutation = useUpdatePaymentUserIdMutation();

    // Queries
    const { data: payments, isLoading: isLoadingPayments } =
        usePaymentsByUserIdQuery(userId ?? "");
    const { data: currentPayment, isLoading: isLoadingCurrentPayment } =
        usePaymentQuery(currentPaymentId ?? "");
    const { data: paymentsByStatus, isLoading: isLoadingPaymentsByStatus } =
        usePaymentsByStatusQuery(
            userId ?? "",
            currentPaymentId
                ? currentPayment?.status ?? PaymentStatus.PENDING
                : PaymentStatus.PENDING
        );
    const { data: paidPayments, isLoading: isLoadingPaidPayments } =
        usePaymentsByStatusQuery(userId ?? "", PaymentStatus.PAID);

    const initiatePayment = useCallback(
        (input: CreatePaymentInput) => {
            createPaymentMutation.mutate(input, {
                onSuccess: (response) => {
                    if (response.success) {
                        setCurrentPaymentId(response.data.id);
                    }
                },
            });
        },
        [createPaymentMutation]
    );

    const resetAndInitiatePayment = useCallback(
        (input: CreatePaymentInput) => {
            setCurrentPaymentId(null);
            console.log(
                "Payment creation started with input:",
                JSON.stringify({
                    productTable: input.productTable,
                    productId: input.productId,
                    userId: input.userId,
                    payMethod: input.payMethod,
                })
            );

            // Add a timestamp to track when the payment was started
            const startTime = Date.now();

            createPaymentMutation.mutate(input, {
                onSuccess: (response) => {
                    console.log(
                        `Payment creation completed in ${
                            Date.now() - startTime
                        }ms`
                    );
                    console.log(
                        "Payment creation response:",
                        JSON.stringify({
                            success: response.success,
                            paymentId: response.success
                                ? response.data.id
                                : undefined,
                            error: response.success
                                ? undefined
                                : response.error,
                        })
                    );

                    if (response.success && response.data && response.data.id) {
                        // Success case - new payment created
                        console.log("Setting payment ID to:", response.data.id);
                        setCurrentPaymentId(response.data.id);
                    } else if (
                        !response.success &&
                        response.error?.code === "DUPLICATE_PAYMENT" &&
                        response.error?.details?.paymentId
                    ) {
                        // Duplicate payment case - reuse the existing payment ID
                        const existingPaymentId =
                            response.error.details.paymentId;
                        console.log(
                            "Reusing existing payment ID for duplicate payment:",
                            existingPaymentId
                        );
                        setCurrentPaymentId(existingPaymentId);
                    } else {
                        console.error(
                            "Payment creation failed:",
                            response.success
                                ? "No payment ID returned"
                                : response.error
                        );

                        // If response is successful but no ID, this is unexpected - log more details
                        if (response.success) {
                            console.error(
                                "Unexpected response structure:",
                                JSON.stringify(response)
                            );
                        }
                    }
                },
                onError: (error) => {
                    console.error("Payment creation error:", error);
                },
            });
        },
        [createPaymentMutation]
    );

    const verifyPayment = useCallback(
        (input: VerifyPaymentInput) => {
            verifyPaymentMutation.mutate(input);
        },
        [verifyPaymentMutation]
    );

    const cancelPayment = useCallback(
        (input: CancelPaymentInput) => {
            cancelPaymentMutation.mutate(input);
        },
        [cancelPaymentMutation]
    );

    const refundPayment = useCallback(
        (input: CancelPaymentInput) => {
            refundPaymentMutation.mutate(input);
        },
        [refundPaymentMutation]
    );

    const updatePaymentUserId = useCallback(
        (paymentId: string, userId: string) => {
            updatePaymentUserIdMutation.mutate({ paymentId, userId });
        },
        [updatePaymentUserIdMutation]
    );

    return {
        currentPaymentId,
        currentPayment,
        payments,
        paymentsByStatus,
        paidPayments,

        isLoadingPayments,
        isLoadingCurrentPayment,
        isLoadingPaymentsByStatus,
        isLoadingPaidPayments,

        initiatePayment,
        resetAndInitiatePayment,
        verifyPayment,
        cancelPayment,
        refundPayment,
        updatePaymentUserId,

        isCreatingPayment: createPaymentMutation.isPending,
        isVerifyingPayment: verifyPaymentMutation.isPending,
        isCancellingPayment: cancelPaymentMutation.isPending,
        isRefundingPayment: refundPaymentMutation.isPending,

        setUserId,
        setCurrentPaymentId,
    };
}
