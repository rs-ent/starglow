/// app/queries/exchangeRateQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/app/queryKeys";
import { getExchangeRateInfo, convertAmount } from "@/app/actions/exchangeRate";
import type { ExchangeRateInfo } from "@/app/actions/exchangeRate";
import * as PortOne from "@portone/browser-sdk/v2";

export function useExchangeRateQuery(
    fromCurrency: PortOne.Entity.Currency,
    toCurrency: PortOne.Entity.Currency
) {
    return useQuery<ExchangeRateInfo>({
        queryKey: queryKeys.exchangeRate.info,
        queryFn: () => getExchangeRateInfo(fromCurrency, toCurrency),
        // 24시간마다 갱신
        staleTime: 24 * 60 * 60 * 1000,
    });
}

export function useConvertAmountQuery(
    amount: number,
    fromCurrency: PortOne.Entity.Currency,
    toCurrency: PortOne.Entity.Currency
) {
    return useQuery<{ converted: number; exchangeInfo: ExchangeRateInfo }>({
        queryKey: queryKeys.exchangeRate.convert(
            amount,
            fromCurrency,
            toCurrency
        ),
        queryFn: () => convertAmount(amount, fromCurrency, toCurrency),
        // 24시간마다 갱신
        staleTime: 24 * 60 * 60 * 1000,
    });
}
