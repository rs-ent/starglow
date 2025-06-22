/// app/hooks/useExchangeRate.ts

"use client";

import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { getExchangeRateInfo, convertAmount } from "@/app/actions/exchangeRate";
import { queryKeys } from "@/app/queryKeys";

import type { ExchangeRateInfo } from "@/app/actions/exchangeRate";
import type * as PortOne from "@portone/browser-sdk/v2";

export function useExchangeRate() {
    const queryClient = useQueryClient();

    // 환율 정보 직접 조회
    const exchangeRateQuery = useCallback(
        async (
            fromCurrency: PortOne.Entity.Currency,
            toCurrency: PortOne.Entity.Currency
        ) => {
            return queryClient.fetchQuery<ExchangeRateInfo>({
                queryKey: queryKeys.exchangeRate.info(fromCurrency, toCurrency),
                queryFn: () =>
                    getExchangeRateInfo({ fromCurrency, toCurrency }),
                staleTime: 24 * 60 * 60 * 1000, // 24시간 캐싱
            });
        },
        [queryClient]
    );

    // 금액 변환 함수
    const convertAmountQuery = useCallback(
        async (
            amount: number,
            fromCurrency: PortOne.Entity.Currency,
            toCurrency: PortOne.Entity.Currency
        ) => {
            return queryClient.fetchQuery<{
                converted: number;
                exchangeInfo: ExchangeRateInfo;
            }>({
                queryKey: queryKeys.exchangeRate.convert(
                    amount,
                    fromCurrency,
                    toCurrency
                ),
                queryFn: async () => {
                    const exchangeInfo = await exchangeRateQuery(
                        fromCurrency,
                        toCurrency
                    );
                    const converted = await convertAmount(
                        amount,
                        fromCurrency,
                        toCurrency,
                        exchangeInfo
                    );
                    return { converted, exchangeInfo };
                },
            });
        },
        [queryClient, exchangeRateQuery]
    );

    return {
        getExchangeRate: exchangeRateQuery,
        convertAmount: convertAmountQuery,
    };
}
