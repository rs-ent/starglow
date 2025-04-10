/// app/mutations/paymentMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/queryKeys";
import {
    createPayment,
    verifyPayment,
    cancelPayment,
    updatePaymentStatus,
} from "@/app/actions/payment";
import type {
    CreatePaymentProps,
    PaymentResponse,
    VerifyPaymentProps,
    CancelPaymentProps,
    UpdatePaymentStatusProps,
    VerifyPaymentResponse,
} from "@/app/actions/payment";

export function useCreatePayment() {
    const queryClient = useQueryClient();

    return useMutation<PaymentResponse, Error, CreatePaymentProps>({
        mutationFn: createPayment,
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.list(variables.userId),
                });
            }
        },
    });
}

export function useVerifyPaymentMutation() {
    const queryClient = useQueryClient();

    return useMutation<VerifyPaymentResponse, Error, VerifyPaymentProps>({
        mutationFn: verifyPayment,
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.byId(variables.paymentLogId),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.list(variables.userId),
                });
            }
        },
    });
}

export function useCancelPaymentMutation() {
    const queryClient = useQueryClient();

    return useMutation<PaymentResponse, Error, CancelPaymentProps>({
        mutationFn: cancelPayment,
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.byId(variables.paymentLogId),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.list(variables.userId),
                });
            }
        },
    });
}

export function useUpdatePaymentStatusMutation() {
    const queryClient = useQueryClient();

    return useMutation<PaymentResponse, Error, UpdatePaymentStatusProps>({
        mutationFn: updatePaymentStatus,
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.byId(variables.paymentId),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.byStatus(variables.status),
                });
            }
        },
    });
}
