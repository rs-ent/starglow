/// app\queries\paymentValidationQueries.ts

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/app/queryKeys";
import { PaymentStatus } from "@prisma/client";
import {
    getPayments,
    getPaymentById,
    getPaymentsByUserId,
    getExchangeRateInfo,
    convertAmount,
    ExchangeRateInfo,
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

export function useExchangeRate(
    fromCurrency: string = "USD",
    toCurrency: string = "KRW",
    enabled: boolean = true
) {
    return useQuery<ExchangeRateInfo, Error>({
        queryKey: [...queryKeys.exchangeRate.info, fromCurrency, toCurrency],
        queryFn: () => getExchangeRateInfo(fromCurrency, toCurrency),
        enabled,
        gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
        staleTime: 1000 * 60 * 30, // Consider data fresh for 30 minutes
    });
}

export function useConvertedAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    enabled: boolean = true
) {
    return useQuery<number, Error>({
        queryKey: [
            ...queryKeys.exchangeRate.convert,
            amount,
            fromCurrency,
            toCurrency,
        ],
        queryFn: () => convertAmount(amount, fromCurrency, toCurrency),
        enabled,
        gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
        staleTime: 1000 * 60 * 30, // Consider data fresh for 30 minutes
    });
}
