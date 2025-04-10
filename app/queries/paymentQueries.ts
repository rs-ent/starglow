/// app/queries/paymentQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/app/queryKeys";
import { PaymentLog } from "@prisma/client";
import {
    getPaymentLog,
    getPaymentLogs,
    getPaymentLogsByStatus,
} from "@/app/actions/payment";
import { PaymentStatus } from "@prisma/client";
export function usePaymentLog(paymentLogId: string) {
    return useQuery<PaymentLog>({
        queryKey: queryKeys.payment.byId(paymentLogId),
        queryFn: () => getPaymentLog(paymentLogId),
        enabled: Boolean(paymentLogId),
    });
}

export function usePaymentLogs(userId: string) {
    return useQuery<PaymentLog[]>({
        queryKey: queryKeys.payment.list(userId),
        queryFn: () => getPaymentLogs(userId),
        enabled: Boolean(userId),
    });
}

export function usePaymentLogsByStatus(status: PaymentStatus) {
    return useQuery<PaymentLog[]>({
        queryKey: queryKeys.payment.byStatus(status),
        queryFn: () => getPaymentLogsByStatus(status),
        enabled: Boolean(status),
    });
}
