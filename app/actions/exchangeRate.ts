"use server";

import { prisma } from "@/lib/prisma/client";
import { cache } from "react";
import * as PortOne from "@portone/browser-sdk/v2";

const EXCHANGE_RATE_UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const EXCHANGE_RATE_FALLBACK = 1300;

const DEFAULT_FROM_CURRENCY = "CURRENCY_USD" as const;
const DEFAULT_TO_CURRENCY = "CURRENCY_KRW" as const;

export interface ExchangeRateInfo {
    fromCurrency: PortOne.Entity.Currency;
    toCurrency: PortOne.Entity.Currency;
    rate: number;
    provider: string;
    createdAt: Date;
}

function convertToApiCurrency(currency: PortOne.Entity.Currency): string {
    return currency.replace("CURRENCY_", "");
}

export async function getExchangeRateInfo(
    fromCurrency: PortOne.Entity.Currency = DEFAULT_FROM_CURRENCY,
    toCurrency: PortOne.Entity.Currency = DEFAULT_TO_CURRENCY
): Promise<ExchangeRateInfo> {
    try {
        if (fromCurrency === toCurrency) {
            return {
                fromCurrency,
                toCurrency,
                rate: 1.0,
                provider: "fallback",
                createdAt: new Date(),
            };
        }
        const fromCurrencyStr = convertToApiCurrency(fromCurrency);
        const toCurrencyStr = convertToApiCurrency(toCurrency);

        const latestRate = await prisma.exchangeRate.findFirst({
            where: {
                fromCurrency: fromCurrencyStr,
                toCurrency: toCurrencyStr,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (
            latestRate &&
            Date.now() - latestRate.createdAt.getTime() <
                EXCHANGE_RATE_UPDATE_INTERVAL
        ) {
            return {
                fromCurrency,
                toCurrency,
                rate: latestRate.rate,
                provider: latestRate.provider,
                createdAt: latestRate.createdAt,
            };
        }

        const response = await fetch(
            `https://api.exchangerate-api.com/v4/latest/${fromCurrencyStr}`
        );
        const data = await response.json();
        const newRate = data.rates[toCurrencyStr];

        const savedRate = await prisma.exchangeRate.create({
            data: {
                fromCurrency: fromCurrencyStr,
                toCurrency: toCurrencyStr,
                rate: newRate,
                provider: "exchangerate-api",
            },
        });

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        await prisma.exchangeRate.deleteMany({
            where: {
                createdAt: {
                    lt: thirtyDaysAgo,
                },
            },
        });

        return {
            fromCurrency,
            toCurrency,
            rate: savedRate.rate,
            provider: savedRate.provider,
            createdAt: savedRate.createdAt,
        };
    } catch (error) {
        console.error("Error fetching exchange rate:", error);

        const fallbackRate = await prisma.exchangeRate.findFirst({
            where: {
                fromCurrency: convertToApiCurrency(fromCurrency),
                toCurrency: convertToApiCurrency(toCurrency),
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (fallbackRate) {
            return {
                fromCurrency,
                toCurrency,
                rate: fallbackRate.rate,
                provider: fallbackRate.provider,
                createdAt: fallbackRate.createdAt,
            };
        }

        return {
            fromCurrency,
            toCurrency,
            rate: EXCHANGE_RATE_FALLBACK,
            provider: "fallback",
            createdAt: new Date(),
        };
    }
}

export async function convertAmount(
    amount: number,
    fromCurrency: PortOne.Entity.Currency,
    toCurrency: PortOne.Entity.Currency
): Promise<{ converted: number; exchangeInfo: ExchangeRateInfo }> {
    const exchangeInfo = await getExchangeRateInfo(fromCurrency, toCurrency);
    let converted = amount * exchangeInfo.rate;
    if (toCurrency === "CURRENCY_USD") {
        converted = converted * 100;
    }

    return {
        converted: Math.round(converted),
        exchangeInfo,
    };
}
