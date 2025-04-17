/// app/queries/paymentQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { getPayment, getPaymentsByUserId } from "@/app/actions/payment";
import { queryKeys } from "@/app/queryKeys";
import { Payment, PaymentStatus } from "@prisma/client";

export function usePaymentQuery(paymentId: string) {
    return useQuery<Payment | null>({
        queryKey: queryKeys.payment.byId(paymentId),
        queryFn: () => getPayment({ paymentId }),
        enabled: Boolean(paymentId),
    });
}

export function usePaymentsByUserIdQuery(userId: string) {
    return useQuery<Payment[]>({
        queryKey: queryKeys.payment.byUserId(userId),
        queryFn: () => getPaymentsByUserId({ userId }),
        enabled: Boolean(userId),
    });
}

export function usePaymentsByStatusQuery(
    userId: string,
    status: PaymentStatus
) {
    return useQuery<Payment[]>({
        queryKey: [...queryKeys.payment.byUserId(userId), status],
        queryFn: async () => {
            const payments = await getPaymentsByUserId({ userId });
            return payments.filter((payment) => payment.status === status);
        },
        enabled: Boolean(userId && status),
    });
}
