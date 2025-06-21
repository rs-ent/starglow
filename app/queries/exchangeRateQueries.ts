/// app/queries/exchangeRateQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import { getExchangeRateInfo, convertAmount } from "@/app/actions/exchangeRate";
import { queryKeys } from "@/app/queryKeys";

import type { ExchangeRateInfo } from "@/app/actions/exchangeRate";
import type { prismaTransaction } from "@/lib/types/payment";
import type * as PortOne from "@portone/browser-sdk/v2";

export function useExchangeRateQuery(
    fromCurrency: PortOne.Entity.Currency,
    toCurrency: PortOne.Entity.Currency
) {
    return useQuery<ExchangeRateInfo>({
        queryKey: queryKeys.exchangeRate.info,
        queryFn: () => getExchangeRateInfo({ fromCurrency, toCurrency }),
        staleTime: 24 * 60 * 60 * 1000,
    });
}

export function useConvertAmountQuery(
    amount: number,
    fromCurrency: PortOne.Entity.Currency,
    toCurrency: PortOne.Entity.Currency,
    exchangeRateInfo?: ExchangeRateInfo,
    tx?: prismaTransaction
) {
    return useQuery<{ converted: number; exchangeInfo: ExchangeRateInfo }>({
        queryKey: queryKeys.exchangeRate.convert(
            amount,
            fromCurrency,
            toCurrency
        ),
        queryFn: async () => {
            const convertedAmount = await convertAmount(
                amount,
                fromCurrency,
                toCurrency,
                exchangeRateInfo,
                tx
            );
            const exchangeInfo =
                exchangeRateInfo ||
                (await getExchangeRateInfo({ fromCurrency, toCurrency }));
            return { converted: convertedAmount, exchangeInfo };
        },
    });
}
