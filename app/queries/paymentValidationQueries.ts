/// app\queries\paymentValidationQueries.ts

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/app/queryKeys";
import { PaymentStatus } from "@prisma/client";
import {
    getPayments,
    getPaymentById,
    getPaymentsByUserId,
} from "@/app/actions/paymentValidation";

export function usePaymentsQuery({
    status,
    page = 1,
    limit = 10,
    enabled = true,
}: {
    status?: PaymentStatus;
    page?: number;
    limit?: number;
    enabled?: boolean;
}) {
    return useQuery({
        queryKey: [...queryKeys.payments.all, status, page, limit],
        queryFn: () =>
            getPayments({
                status,
                page,
                limit,
            }),
        enabled,
    });
}

export function usePaymentByIdQuery(id: string) {
    return useQuery({
        queryKey: queryKeys.payments.byId(id),
        queryFn: () => getPaymentById(id),
        enabled: !!id,
    });
}

export function useUserPaymentsQuery(userId: string) {
    return useQuery({
        queryKey: queryKeys.payments.byUserId(userId),
        queryFn: () => getPaymentsByUserId(userId),
        enabled: !!userId,
    });
}
