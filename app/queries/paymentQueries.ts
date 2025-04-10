/// app/queries/paymentQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/app/queryKeys";
import { PaymentLog } from "@prisma/client";
import {
    getPaymentLog,
    getPaymentLogs,
    getPaymentLogsByStatus,
    getPortOneEnv,
} from "@/app/actions/payment";
import { PaymentStatus } from "@prisma/client";
import * as PortOne from "@portone/browser-sdk/v2";

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

export function usePortOneEnv(
    payMethod: PortOne.Entity.PayMethod,
    easyPayProvider?: PortOne.Entity.EasyPayProvider,
    cardProvider?: PortOne.Entity.Country
) {
    return useQuery({
        queryKey: queryKeys.payment.portOneEnv(
            payMethod,
            easyPayProvider,
            cardProvider
        ),
        queryFn: () => getPortOneEnv(payMethod, easyPayProvider, cardProvider),
        enabled: Boolean(payMethod),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });
}
