/// app\hooks\usePaymentValidation.ts

"use client";

import { useState } from "react";
import {
    usePaymentInit,
    usePaymentComplete,
    usePaymentFailed,
} from "@/app/mutations/paymentValidationMutations";
import {
    usePaymentsQuery,
    usePaymentByIdQuery,
    useUserPaymentsQuery,
} from "@/app/queries/paymentValidationQueries";
import { PaymentStatus } from "@prisma/client";
import {
    PaymentInitRequest,
    PaymentVerifyRequest,
    PaymentInitResponse,
} from "@/lib/types/payment";
import { useToast } from "./useToast";

export function usePayments() {
    const toast = useToast();
    const [isInitializing, setIsInitializing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const paymentInitMutation = usePaymentInit();
    const paymentCompleteMutation = usePaymentComplete();
    const paymentFailedMutation = usePaymentFailed();

    const initializePayment = async (request: PaymentInitRequest) => {
        setIsInitializing(true);
        try {
            const response = await paymentInitMutation.mutateAsync(request);
            return response;
        } catch (error) {
            console.error("Payment initialization failed:", error);
            throw error;
        } finally {
            setIsInitializing(false);
        }
    };

    const completePayment = async (request: PaymentVerifyRequest) => {
        setIsProcessing(true);
        try {
            const response = await paymentCompleteMutation.mutateAsync(request);
            if (response?.success) {
                toast.success("Payment processed successfully");
                return response;
            } else {
                throw new Error("Payment processing failed");
            }
        } catch (error) {
            console.error("Payment completion failed:", error);
            toast.error(`Payment processing failed: ${error}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const failedPayment = async (paymentId: string, failureReason: string) => {
        setIsProcessing(true);
        try {
            const response = await paymentFailedMutation.mutateAsync({
                paymentId,
                failureReason,
            });
            if (response?.success) {
                toast.error("Payment failed");
                return response;
            } else {
                throw new Error("Payment failed");
            }
        } catch (error) {
            console.error("Payment failed:", error);
            toast.error(`Payment failed: ${error}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        initializePayment,
        completePayment,
        failedPayment,
        isInitializing,
        isProcessing,
    };
}

export function usePaymentHistory(userId: string) {
    const { data: payments, isLoading, error } = useUserPaymentsQuery(userId);

    return {
        payments,
        isLoading,
        error,
    };
}

export function usePaymentDetail(paymentId: string) {
    const { data: payment, isLoading, error } = usePaymentByIdQuery(paymentId);

    return {
        payment,
        isLoading,
        error,
    };
}

export function usePaymentsList({
    status,
    page = 1,
    limit = 10,
}: {
    status?: PaymentStatus;
    page?: number;
    limit?: number;
}) {
    const {
        data: paymentsData,
        isLoading,
        error,
    } = usePaymentsQuery({
        status,
        page,
        limit,
    });

    return {
        payments: paymentsData?.payments || [],
        total: paymentsData?.total || 0,
        totalPages: paymentsData?.pageCount || 0,
        isLoading,
        error,
    };
}
