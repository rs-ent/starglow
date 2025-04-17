"use server";

import { prisma } from "@/lib/prisma/client";
import { cache } from "react";
import * as PortOne from "@portone/browser-sdk/v2";
import { PrismaClient } from "@prisma/client";

const EXCHANGE_RATE_UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const EXCHANGE_RATE_FALLBACK = 1300;

const DEFAULT_FROM_CURRENCY = "CURRENCY_USD" as const;
const DEFAULT_TO_CURRENCY = "CURRENCY_KRW" as const;

type prismaTransaction =
    | PrismaClient
    | Omit<
          PrismaClient,
          | "$connect"
          | "$disconnect"
          | "$on"
          | "$transaction"
          | "$use"
          | "$extends"
      >;

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

export async function getExchangeRateInfo({
    fromCurrency,
    toCurrency,
    tx,
}: {
    fromCurrency: PortOne.Entity.Currency;
    toCurrency: PortOne.Entity.Currency;
    tx?: prismaTransaction;
}): Promise<ExchangeRateInfo> {
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

        const latestRate = await (tx ?? prisma).exchangeRate.findFirst({
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

        const savedRate = await (tx ?? prisma).exchangeRate.create({
            data: {
                fromCurrency: fromCurrencyStr,
                toCurrency: toCurrencyStr,
                rate: newRate,
                provider: "exchangerate-api",
            },
        });

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        await (tx ?? prisma).exchangeRate.deleteMany({
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

        const fallbackRate = await (tx ?? prisma).exchangeRate.findFirst({
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
    toCurrency: PortOne.Entity.Currency,
    exchangeRateInfo?: ExchangeRateInfo,
    tx?: prismaTransaction
): Promise<number> {
    const exchangeInfo =
        exchangeRateInfo ??
        (await getExchangeRateInfo({ fromCurrency, toCurrency, tx }));

    let converted = amount * exchangeInfo.rate;
    if (toCurrency === "CURRENCY_USD") {
        converted = converted * 100;
    }

    return Math.round(converted);
}
