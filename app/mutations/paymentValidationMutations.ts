/// app\mutations\paymentValidationMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/queryKeys";
import {
    initPaymentValidation,
    verifyPayment,
    recordPaymentFailure,
} from "@/app/actions/paymentValidation";
import { PaymentInitRequest, PaymentInitResponse } from "@/lib/types/payments";

export function usePaymentInit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (request: PaymentInitRequest) => {
            return initPaymentValidation(request);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.payments.byUserId(variables.userId),
            });
        },
    });
}

export function usePaymentComplete() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (request: PaymentInitResponse) => {
            return verifyPayment(request);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.payments.byUserId(variables.userId),
            });

            if (variables.paymentId) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payments.byId(variables.paymentId),
                });
            }

            queryClient.invalidateQueries({
                queryKey: queryKeys.payments.all,
            });
        },
    });
}

export function usePaymentFailed() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            paymentId,
            failureReason,
        }: {
            paymentId: string;
            failureReason: string;
        }) => {
            return recordPaymentFailure({ paymentId, failureReason });
        },
        onSuccess: async (data, variables) => {
            // Invalidate all payment-related queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.payments.all,
            });

            queryClient.invalidateQueries({
                queryKey: queryKeys.payments.byId(variables.paymentId),
            });
        },
    });
}
