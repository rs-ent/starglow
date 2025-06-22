/// app/mutations/paymentMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    createPayment,
    verifyPayment,
    cancelPayment,
    refundPayment,
    updatePaymentUserId,
} from "@/app/actions/payment";
import { queryKeys } from "@/app/queryKeys";

import type {
    CreatePaymentInput,
    VerifyPaymentInput,
    CreatePaymentResponse,
    VerifyPaymentResponse,
    CancelPaymentInput,
} from "@/app/actions/payment";
import type { Payment } from "@prisma/client";

export function useCreatePaymentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            input: CreatePaymentInput
        ): Promise<CreatePaymentResponse> => {
            const result = await createPayment(input);
            return result;
        },
        onSuccess: (data, variables) => {
            if (data.success && data.data && data.data.id) {
                queryClient.setQueryData(
                    queryKeys.payment.byId(data.data.id),
                    data.data
                );

                if (variables.userId) {
                    queryClient
                        .invalidateQueries({
                            queryKey: queryKeys.payment.byUserId(
                                variables.userId
                            ),
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                }

                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.payment.byStatus(data.data.status),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.payment.all,
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            } else if (
                !data.success &&
                data.error?.code === "DUPLICATE_PAYMENT" &&
                data.error?.details?.paymentId
            ) {
                const existingPaymentId = data.error.details.paymentId;

                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.payment.byId(existingPaymentId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                if (variables.userId) {
                    queryClient
                        .invalidateQueries({
                            queryKey: queryKeys.payment.byUserId(
                                variables.userId
                            ),
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                }
            } else {
                console.error("Cannot update cache - invalid payment data");
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
                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.payment.byUserId(variables.userId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.payment.byStatus(data.data.status),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.payment.all,
                    })
                    .catch((error) => {
                        console.error(error);
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
                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.payment.byUserId(
                            variables.payment.userId!
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.payment.byStatus(
                            variables.payment.status
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.payment.all,
                    })
                    .catch((error) => {
                        console.error(error);
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
                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.payment.byUserId(
                            variables.payment.userId!
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.payment.byStatus(
                            variables.payment.status
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.payment.all,
                    })
                    .catch((error) => {
                        console.error(error);
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

                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.payment.byUserId(
                            updatedPayment.userId!
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.payment.all,
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
    });
}
