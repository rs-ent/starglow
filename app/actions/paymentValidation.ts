/// app\actions\paymentValidation.ts
/// @description This file contains the action for validating the payment of a user

"use server";

import { prisma } from "@/lib/prisma/client";
import { PaymentStatus } from "@prisma/client";
import { env } from "@/lib/config/env";
import { encrypt, decrypt } from "@/lib/utils/encryption";
import crypto from "crypto";
import {
    PaymentError,
    PaymentInitRequest,
    PaymentInitResponse,
    PaymentMethodType,
    EasyPayProviderType,
    CurrencyType,
    CardProvider,
} from "@/lib/types/payment";

const EXCHANGE_RATE_UPDATE_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours

interface TableConfig {
    priceField: string;
    defaultCurrency: CurrencyType;
    titleField: string;
}

const TABLE_CONFIGS: Record<string, TableConfig> = {
    events: {
        priceField: "price",
        defaultCurrency: CurrencyType.KRW,
        titleField: "title",
    },
};

export interface ExchangeRateInfo {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    provider: string;
    createdAt: Date;
}

async function getLatestExchangeRate(): Promise<number> {
    try {
        const latestRate = await prisma.exchangeRate.findFirst({
            where: {
                fromCurrency: "USD",
                toCurrency: "KRW",
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
            return latestRate.rate;
        }

        const response = await fetch(
            "https://api.exchangerate-api.com/v4/latest/USD"
        );
        const data = await response.json();
        const newRate = data.rates.KRW;

        await prisma.exchangeRate.create({
            data: {
                fromCurrency: "USD",
                toCurrency: "KRW",
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

        return newRate;
    } catch (error) {
        console.error("Error fetching exchange rate:", error);

        const fallbackRate = await prisma.exchangeRate.findFirst({
            where: {
                fromCurrency: "USD",
                toCurrency: "KRW",
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (fallbackRate) {
            return fallbackRate.rate;
        }

        return 1300;
    }
}

export async function getExchangeRateInfo(
    fromCurrency: string = "USD",
    toCurrency: string = "KRW"
): Promise<ExchangeRateInfo> {
    try {
        const latestRate = await prisma.exchangeRate.findFirst({
            where: {
                fromCurrency,
                toCurrency,
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
            return latestRate;
        }

        const response = await fetch(
            `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
        );
        const data = await response.json();
        const newRate = data.rates[toCurrency];

        // Store new rate in DB
        const savedRate = await prisma.exchangeRate.create({
            data: {
                fromCurrency,
                toCurrency,
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

        return savedRate;
    } catch (error) {
        console.error("Error fetching exchange rate:", error);

        const fallbackRate = await prisma.exchangeRate.findFirst({
            where: {
                fromCurrency,
                toCurrency,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (fallbackRate) {
            return fallbackRate;
        }

        return {
            fromCurrency,
            toCurrency,
            rate: 1300,
            provider: "fallback",
            createdAt: new Date(),
        };
    }
}

export async function convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string
): Promise<number> {
    const rate = await getExchangeRateInfo(fromCurrency, toCurrency);
    return Math.round(amount * rate.rate * 100) / 100;
}

export async function initPaymentValidation(
    request: PaymentInitRequest
): Promise<PaymentInitResponse> {
    try {
        const {
            sessionHash,
            userId,
            table,
            target,
            quantity,
            currency,
            method,
            easyPayProvider,
            cardProvider,
        } = request;

        if (!sessionHash || !userId || !table || !target) {
            throw new PaymentError(
                "Missing required fields",
                "INVALID_REQUEST"
            );
        }

        if (quantity <= 0) {
            throw new PaymentError(
                "Quantity must be greater than 0",
                "INVALID_QUANTITY"
            );
        }

        const storeId = env.PORTONE_MID;
        if (!storeId) {
            throw new PaymentError(
                "Store ID is not set",
                "INVALID_CONFIGURATION"
            );
        }

        let channelKey: string = "";
        console.log("Method: ", method);
        console.log("Easy Pay Provider: ", easyPayProvider);
        console.log("Card Provider: ", cardProvider);
        switch (method) {
            case PaymentMethodType.PAYPAL:
                channelKey = env.PORTONE_PAYPAL;
                break;
            case PaymentMethodType.CARD:
                if (cardProvider === CardProvider.INTERNATIONAL) {
                    channelKey = env.PORTONE_INTERCARD;
                } else {
                    channelKey = env.PORTONE_CARD;
                }
                break;
            case PaymentMethodType.EASY_PAY:
                if (easyPayProvider === EasyPayProviderType.TOSSPAY) {
                    channelKey = env.PORTONE_TOSS;
                } else if (easyPayProvider === EasyPayProviderType.KAKAOPAY) {
                    channelKey = env.PORTONE_KAKAO;
                } else {
                    throw new PaymentError(
                        `Unsupported easy pay provider: ${easyPayProvider}`,
                        "INVALID_EASYPAY_PROVIDER"
                    );
                }
                break;
            default:
                throw new PaymentError(
                    `Unsupported payment method: ${method}`,
                    "INVALID_METHOD"
                );
        }

        if (!channelKey) {
            throw new PaymentError(
                `Channel key is not set for ${method}`,
                "INVALID_CONFIGURATION"
            );
        }

        const tableConfig = TABLE_CONFIGS[table];
        if (!tableConfig) {
            throw new PaymentError(
                `Unsupported table: ${table}`,
                "INVALID_TABLE"
            );
        }

        let baseAmount: number = 0;
        let sourceCurrency: CurrencyType = CurrencyType.KRW;
        let itemTitle: string = "";
        let orderedProductId: string = "";

        if (table === "events") {
            const event = await prisma.events.findUnique({
                where: { id: target },
                select: {
                    id: true,
                    [tableConfig.priceField]: true,
                    [tableConfig.titleField]: true,
                },
            });

            if (!event) {
                throw new PaymentError(
                    `Event not found: ${target}`,
                    "INVALID_TARGET"
                );
            }

            itemTitle = event[tableConfig.titleField] as string;
            baseAmount = (event[tableConfig.priceField] as number) || 0;
            sourceCurrency = tableConfig.defaultCurrency;
            orderedProductId = event.id;
        }

        if (baseAmount <= 0) {
            throw new PaymentError(
                "Price must be greater than 0",
                "INVALID_PRICE"
            );
        }

        let amount = baseAmount;
        let exchangeRate: number | null = null;

        if (currency !== sourceCurrency) {
            if (
                sourceCurrency === CurrencyType.KRW &&
                currency === CurrencyType.USD
            ) {
                exchangeRate = await getLatestExchangeRate();
                amount = (baseAmount / exchangeRate) * 100;
            } else if (
                sourceCurrency === CurrencyType.USD &&
                currency === CurrencyType.KRW
            ) {
                exchangeRate = await getLatestExchangeRate();
                amount = Math.round(baseAmount * exchangeRate * 100) / 100;
            }
        }

        const totalAmount = amount * quantity;
        const orderName = `${itemTitle} x${quantity}`;

        const nonce = crypto.randomBytes(16).toString("hex");
        const timestamp = Date.now();
        const orderId = `${table}-${target}-${userId}-${timestamp}-${nonce}`;
        const paymentKey = encrypt(orderId);

        const log = await prisma.paymentLog.create({
            data: {
                userId,
                sessionHash,
                paymentKey,
                nonce,
                orderedProductId: orderedProductId || "",
                orderedProductName: orderName,
                amount: baseAmount * quantity,
                convertedAmount: totalAmount,
                exchangeRate,
                currency: currency as string,
                method: method as string,
                easyPayProvider: easyPayProvider as string,
                cardProvider: cardProvider as string,
                status: PaymentStatus.INIT,
                attemptCount: 0,
            },
        });

        const response: PaymentInitResponse = {
            paymentId: log.id,
            sessionHash,
            userId,
            amount,
            quantity,
            totalAmount,
            table,
            target,
            orderName,
            orderId,
            method: method as PaymentMethodType,
            easyPayProvider: easyPayProvider as EasyPayProviderType,
            cardProvider: cardProvider as CardProvider,
            currency: currency as CurrencyType,
            paymentConfig: {
                storeId,
                channelKey,
            },
        };

        return response;
    } catch (error) {
        console.error("Payment initialization failed:", error);
        throw new PaymentError(
            `Payment initialization failed: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
            "SYSTEM_ERROR"
        );
    }
}

export async function verifyPayment(request: PaymentInitResponse) {
    try {
        const {
            paymentId,
            sessionHash,
            userId,
            table,
            target,
            amount,
            quantity,
            totalAmount,
            orderName,
            orderId,
            method,
            easyPayProvider,
            cardProvider,
            currency,
            paymentConfig,
        } = request;

        if (!paymentId || !sessionHash || !userId || !table || !target) {
            throw new PaymentError(
                "Missing required fields",
                "INVALID_REQUEST"
            );
        }

        const payment = await prisma.paymentLog.findUnique({
            where: { id: paymentId },
            select: {
                sessionHash: true,
                paymentKey: true,
                userId: true,
                nonce: true,
                amount: true,
                convertedAmount: true,
                exchangeRate: true,
                currency: true,
                status: true,
                method: true,
            },
        });

        if (!payment) {
            throw new PaymentError("Payment not found", "PAYMENT_NOT_FOUND");
        }

        if (payment.status === PaymentStatus.COMPLETED) {
            return {
                status: "SUCCESS",
                message: "Payment already completed",
            };
        }

        if (payment.sessionHash !== sessionHash) {
            throw new PaymentError(
                "Invalid session hash",
                "INVALID_SESSION_HASH"
            );
        }

        if (payment.userId !== userId) {
            throw new PaymentError("Invalid user", "INVALID_USER");
        }

        const decryptedPaymentKey = decrypt(payment.paymentKey);
        const decryptedParts = decryptedPaymentKey.split("-");

        if (decryptedParts.length < 5) {
            throw new PaymentError(
                "Invalid payment key",
                "INVALID_PAYMENT_KEY"
            );
        }

        const [
            decryptedTable,
            decryptedTarget,
            decryptedUserId,
            ,
            decryptedNonce,
        ] = decryptedParts;

        if (
            decryptedTable !== table ||
            decryptedTarget !== target ||
            decryptedUserId !== userId ||
            decryptedNonce !== payment.nonce
        ) {
            throw new PaymentError(
                "Invalid payment key",
                "INVALID_PAYMENT_KEY"
            );
        }

        const updatedPayment = await prisma.paymentLog.update({
            where: { id: paymentId },
            data: {
                status: PaymentStatus.COMPLETED,
                attemptCount: { increment: 1 },
            },
        });

        return {
            success: true,
            status: updatedPayment.status as string,
            paymentId: updatedPayment.id,
        };
    } catch (error) {
        if (error instanceof PaymentError) {
            throw error;
        }

        console.error("Payment verification failed:", error);
        throw new PaymentError(
            `Payment verification failed: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
            "SYSTEM_ERROR"
        );
    }
}

export async function recordPaymentFailure({
    paymentId,
    failureReason,
}: {
    paymentId: string;
    failureReason: string;
}) {
    try {
        if (!paymentId) {
            throw new PaymentError("Payment ID is required", "INVALID_REQUEST");
        }

        const payment = await prisma.paymentLog.findUnique({
            where: { id: paymentId },
        });

        if (!payment) {
            throw new PaymentError("Payment not found", "PAYMENT_NOT_FOUND");
        }

        const updatedPayment = await prisma.paymentLog.update({
            where: { id: paymentId },
            data: {
                status: PaymentStatus.FAILED,
                failureReason,
                attemptCount: { increment: 1 },
            },
        });

        return {
            success: true,
            status: PaymentStatus.FAILED as string,
            paymentId: updatedPayment.id,
        };
    } catch (error) {
        if (error instanceof PaymentError) {
            throw error;
        }

        console.error("Recording payment failure failed:", error);
        throw new PaymentError(
            `Recording payment failure failed: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
            "SYSTEM_ERROR"
        );
    }
}
export async function getPaymentsByUserId(userId: string) {
    try {
        if (!userId) {
            throw new PaymentError("User ID is required", "INVALID_REQUEST");
        }

        const payments = await prisma.paymentLog.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        return payments;
    } catch (error) {
        console.error("Getting payments by user ID failed:", error);
        throw new PaymentError(
            `Getting payments by user ID failed: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
            "QUERY_ERROR"
        );
    }
}

export async function getPaymentById(id: string) {
    try {
        if (!id) {
            throw new PaymentError("Payment ID is required", "INVALID_REQUEST");
        }

        const payment = await prisma.paymentLog.findUnique({
            where: { id },
        });

        if (!payment) {
            throw new PaymentError("Payment not found", "NOT_FOUND");
        }

        return payment;
    } catch (error) {
        console.error("Getting payment by ID failed:", error);
        throw new PaymentError(
            `Getting payment by ID failed: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
            "QUERY_ERROR"
        );
    }
}

export async function getPayments({
    status,
    page = 1,
    limit = 10,
}: {
    status?: PaymentStatus;
    page?: number;
    limit?: number;
}) {
    try {
        if (page < 1 || limit < 1) {
            throw new PaymentError(
                "Invalid pagination parameters",
                "INVALID_REQUEST"
            );
        }

        const skip = (page - 1) * limit;
        const where = status ? { status } : {};

        const payments = await prisma.paymentLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        });

        const total = await prisma.paymentLog.count({ where });

        return {
            payments,
            total,
            page,
            limit,
            pageCount: Math.ceil(total / limit),
        };
    } catch (error) {
        console.error("Getting payments failed:", error);
        throw new PaymentError(
            `Getting payments failed: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
            "QUERY_ERROR"
        );
    }
}
