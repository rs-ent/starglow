/// app\actions\paymentValidation.ts
/// @description 결제 초기화/검증 관련 로직

"use server";

import { prisma } from "@/lib/prisma/client";
import { PaymentStatus } from "@prisma/client";
import { env } from "@/lib/config/env";
import { encrypt, decrypt } from "@/lib/utils/encryption";
import crypto from "crypto";
import {
    PaymentError,
    PaymentInitRequest,
    PaymentVerifyRequest,
    PaymentInitResponse,
    PaymentMethodType,
    CurrencyType,
} from "@/lib/types/payment";

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
        } = request;

        // 입력값 검증
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
                "Store ID is not configured",
                "CONFIG_ERROR"
            );
        }

        let channelKey: string = "";
        switch (method) {
            case PaymentMethodType.PAYPAL:
                channelKey = process.env.PORTONE_PAYPAL || "";
                break;
            case PaymentMethodType.CARD:
                channelKey = process.env.PORTONE_CARD || "";
                break;
            case PaymentMethodType.KAKAO_PAY:
                channelKey = process.env.PORTONE_KAKAO || "";
                break;
            case PaymentMethodType.TOSS_PAY:
                channelKey = process.env.PORTONE_TOSS || "";
                break;
            default:
                throw new PaymentError(
                    `Unsupported payment method: ${method}`,
                    "INVALID_METHOD"
                );
        }

        if (!channelKey) {
            throw new PaymentError(
                `Channel key not configured for payment method: ${method}`,
                "CONFIG_ERROR"
            );
        }

        if (table === "events") {
            const event = await prisma.events.findUnique({
                where: {
                    id: target,
                },
                select: {
                    title: true,
                    price: true,
                },
            });

            if (!event) {
                throw new PaymentError("Event not found", "NOT_FOUND");
            }

            const amount = event.price || 0;
            if (amount <= 0) {
                throw new PaymentError(
                    "Invalid price: price must be greater than 0",
                    "INVALID_PRICE"
                );
            }

            const totalAmount = amount * quantity;
            const orderName = `${event.title} x${quantity}`;

            const nonce = crypto.randomBytes(16).toString("hex");
            const timestamp = Date.now();
            const orderId = `${table}-${target}-${userId}-${timestamp}-${nonce}`;
            const paymentKey = encrypt(orderId);

            // 트랜잭션으로 데이터 일관성 보장
            const log = await prisma.paymentLog.create({
                data: {
                    userId,
                    sessionHash,
                    paymentKey,
                    nonce,
                    orderedProductId: `${table}-${target}-${timestamp}`,
                    orderedProductName: orderName,
                    amount,
                    currency: currency as string,
                    method: method as string,
                    status: PaymentStatus.INIT,
                    attemptCount: 0,
                },
            });

            const response: PaymentInitResponse = {
                paymentId: log.id,
                sessionHash,
                paymentKey,
                userId,
                amount,
                quantity,
                totalAmount,
                orderName,
                orderId,
                method: method as PaymentMethodType,
                currency: currency as CurrencyType,
                paymentConfig: {
                    storeId,
                    channelKey,
                },
            };

            return response;
        }

        throw new PaymentError(`Unsupported table: ${table}`, "INVALID_TABLE");
    } catch (error) {
        if (error instanceof PaymentError) {
            throw error;
        }
        // 예상치 못한 오류를 PaymentError로 변환
        console.error("Payment initialization failed:", error);
        throw new PaymentError(
            `Payment initialization failed: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
            "SYSTEM_ERROR"
        );
    }
}

export async function verifyPayment(request: PaymentVerifyRequest) {
    try {
        const {
            paymentId,
            sessionHash,
            paymentKey,
            userId,
            amount,
            currency,
            table,
            target,
            additionalData,
        } = request;

        // 입력값 검증
        if (!paymentId || !sessionHash || !paymentKey) {
            throw new PaymentError(
                "Missing required fields",
                "INVALID_REQUEST"
            );
        }

        const payment = await prisma.paymentLog.findUnique({
            where: {
                id: paymentId,
            },
            select: {
                sessionHash: true,
                userId: true,
                paymentKey: true,
                nonce: true,
                amount: true,
                currency: true,
                status: true,
                method: true,
            },
        });

        if (!payment) {
            throw new PaymentError("Payment not found", "NOT_FOUND");
        }

        if (payment.status === PaymentStatus.COMPLETED) {
            throw new PaymentError(
                "Payment already processed",
                "ALREADY_PROCESSED"
            );
        }

        if (payment.sessionHash !== sessionHash) {
            throw new PaymentError("Invalid session hash", "AUTH_FAILED");
        }

        if (payment.paymentKey !== paymentKey) {
            throw new PaymentError("Invalid payment key", "AUTH_FAILED");
        }

        const decryptedPaymentKey = decrypt(payment.paymentKey);
        const decryptedParts = decryptedPaymentKey.split("-");

        if (decryptedParts.length < 5) {
            throw new PaymentError("Invalid payment key format", "AUTH_FAILED");
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
                "Payment key verification failed",
                "AUTH_FAILED"
            );
        }

        if (amount !== payment.amount) {
            throw new PaymentError(
                `Invalid amount: expected ${payment.amount}, got ${amount}`,
                "AMOUNT_MISMATCH"
            );
        }

        if (currency !== payment.currency) {
            throw new PaymentError(
                `Invalid currency: expected ${payment.currency}, got ${currency}`,
                "CURRENCY_MISMATCH"
            );
        }

        const updatedPayment = await prisma.paymentLog.update({
            where: {
                id: paymentId,
            },
            data: {
                status: PaymentStatus.COMPLETED,
                attemptCount: { increment: 1 },
            },
        });

        return {
            success: true,
            status: PaymentStatus.COMPLETED,
            paymentId: updatedPayment.id,
        };
    } catch (error) {
        if (error instanceof PaymentError) {
            throw error;
        }
        // 예상치 못한 오류를 PaymentError로 변환
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
            throw new PaymentError("Payment not found", "NOT_FOUND");
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
            status: PaymentStatus.FAILED,
            paymentId: updatedPayment.id,
        };
    } catch (error) {
        if (error instanceof PaymentError) {
            throw error;
        }
        // 예상치 못한 오류를 PaymentError로 변환
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
