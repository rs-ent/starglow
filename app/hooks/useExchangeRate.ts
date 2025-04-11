/// app/hooks/useExchangeRate.ts

"use client";

import * as PortOne from "@portone/browser-sdk/v2";
import {
    useExchangeRateQuery,
    useConvertAmountQuery,
} from "@/app/queries/exchangeRateQueries";

export function useExchangeRate() {
    const getExchangeRate = (
        fromCurrency: PortOne.Entity.Currency,
        toCurrency: PortOne.Entity.Currency
    ) => useExchangeRateQuery(fromCurrency, toCurrency);

    const convertAmount = (
        amount: number,
        fromCurrency: PortOne.Entity.Currency,
        toCurrency: PortOne.Entity.Currency
    ) => useConvertAmountQuery(amount, fromCurrency, toCurrency);

    return {
        getExchangeRate,
        convertAmount,
    };
}
