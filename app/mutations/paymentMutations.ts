/// app/mutations/paymentMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    createPayment,
    verifyPayment,
    cancelPayment,
    refundPayment,
    updatePaymentUserId
} from "@/app/actions/payment";
import { queryKeys } from "@/app/queryKeys";

import type {
    CreatePaymentInput,
    VerifyPaymentInput,
    CreatePaymentResponse,
    VerifyPaymentResponse,
    CancelPaymentInput} from "@/app/actions/payment";
import type { Payment } from "@prisma/client";

export function useCreatePaymentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            input: CreatePaymentInput
        ): Promise<CreatePaymentResponse> => {
            console.log("Starting payment creation server action");
            const result = await createPayment(input);
            console.log(
                "Server action completed with result:",
                JSON.stringify({
                    success: result.success,
                    paymentId: result.success ? result.data.id : undefined,
                    error: result.success ? undefined : result.error,
                })
            );
            return result;
        },
        onSuccess: (data, variables) => {
            console.log("Mutation onSuccess handler called");

            if (data.success && data.data && data.data.id) {
                console.log(
                    `Setting query cache for payment ID: ${data.data.id}`
                );

                // Set the new payment data in the cache
                queryClient.setQueryData(
                    queryKeys.payment.byId(data.data.id),
                    data.data
                );

                // Invalidate related queries
                if (variables.userId) {
                    console.log(
                        `Invalidating queries for user ID: ${variables.userId}`
                    );
                    queryClient.invalidateQueries({
                        queryKey: queryKeys.payment.byUserId(variables.userId),
                    });
                }

                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.byStatus(data.data.status),
                });

                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.all,
                });
            } else if (
                !data.success &&
                data.error?.code === "DUPLICATE_PAYMENT" &&
                data.error?.details?.paymentId
            ) {
                // Handle duplicate payment case
                const existingPaymentId = data.error.details.paymentId;
                console.log(
                    `Handling duplicate payment, fetching data for ID: ${existingPaymentId}`
                );

                // Invalidate the query for the existing payment to ensure we get fresh data
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.byId(existingPaymentId),
                });

                if (variables.userId) {
                    queryClient.invalidateQueries({
                        queryKey: queryKeys.payment.byUserId(variables.userId),
                    });
                }
            } else {
                console.error(
                    "Cannot update cache - invalid payment data:",
                    data
                );
            }
        },
        onError: (error) => {
            console.error("Payment creation mutation error:", error);
        },
    });
}

export function useVerifyPaymentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            input: VerifyPaymentInput
        ): Promise<VerifyPaymentResponse> => {
            return verifyPayment(input);
        },
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.byUserId(variables.userId),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.byStatus(data.data.status),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.all,
                });

                queryClient.setQueryData(
                    queryKeys.payment.byId(data.data.id),
                    data.data
                );
            }
        },
    });
}

export function useCancelPaymentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            input: CancelPaymentInput
        ): Promise<VerifyPaymentResponse> => {
            return cancelPayment(input);
        },
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.byUserId(
                        variables.payment.userId!
                    ),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.byStatus(
                        variables.payment.status
                    ),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.all,
                });

                queryClient.setQueryData(
                    queryKeys.payment.byId(variables.payment.id),
                    data.data
                );
            }
        },
    });
}

export function useRefundPaymentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            input: CancelPaymentInput
        ): Promise<VerifyPaymentResponse> => {
            return refundPayment(input);
        },
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.byUserId(
                        variables.payment.userId!
                    ),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.byStatus(
                        variables.payment.status
                    ),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.all,
                });

                queryClient.setQueryData(
                    queryKeys.payment.byId(variables.payment.id),
                    data.data
                );
            }
        },
    });
}

export function useUpdatePaymentUserIdMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            paymentId,
            userId,
        }: {
            paymentId: string;
            userId: string;
        }): Promise<Payment | null> => {
            return updatePaymentUserId(paymentId, userId);
        },
        onSuccess: (updatedPayment) => {
            if (updatedPayment) {
                queryClient.setQueryData(
                    queryKeys.payment.byId(updatedPayment.id),
                    updatedPayment
                );

                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.byUserId(
                        updatedPayment.userId!
                    ),
                });

                queryClient.invalidateQueries({
                    queryKey: queryKeys.payment.all,
                });
            }
        },
    });
}
