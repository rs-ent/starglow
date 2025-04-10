"use server";

import { prisma } from "@/lib/prisma/client";
import { getExchangeRateInfo } from "./exchangeRate";
import { PaymentStatus } from "@prisma/client";
import { encrypt, decrypt } from "@/lib/utils/encryption";
import { nanoid } from "nanoid";
import * as PortOne from "@portone/browser-sdk/v2";

export interface PaymentResponse {
    success: boolean;
    data?: {
        paymentLogId: string;
        storeId?: string;
        channelKey?: string;
        defaultAmount?: number;
        convertedAmount?: number;
        currency?: PortOne.Entity.Currency;
        nonce?: string;
        status?: PaymentStatus;
        failureReason?: string | null;
        virtualAccountInfo?: {
            accountNumber?: string;
            bankCode?: string;
            holderName?: string;
            dueDate?: Date;
        };
    };
    error?: string;
}

export interface CreatePaymentProps {
    sessionHash: string;
    userId: string;
    table: string;
    merchId: string;
    merchName: string;
    payMethod: PortOne.Entity.PayMethod;
    easyPayProvider?: PortOne.Entity.EasyPayProvider;
    cardProvider?: PortOne.Entity.Country;
    currency: PortOne.Entity.Currency;
    quantity: number;
}

const DEFAULT_CURRENCY = "CURRENCY_KRW" as const;

export async function createPayment({
    sessionHash,
    userId,
    table,
    merchId,
    merchName,
    payMethod,
    easyPayProvider,
    cardProvider,
    currency,
    quantity,
}: CreatePaymentProps) {
    try {
        let fromCurrency: PortOne.Entity.Currency = DEFAULT_CURRENCY;
        // 1. 상품 정보 조회
        function getDynamicQuery(table: string) {
            switch (table) {
                case "events":
                    fromCurrency = "CURRENCY_KRW" as PortOne.Entity.Currency;
                    return prisma.events.findUnique({
                        where: { id: merchId },
                        select: { price: true },
                    });
                default:
                    throw new Error(`Invalid table: ${table}`);
            }
        }

        const merch = await getDynamicQuery(table);
        if (!merch || !merch.price) {
            throw new Error(`Invalid product: ${merchId}`);
        }

        // 2. 채널 ID 결정
        function getChannelId(
            payMethod: PortOne.Entity.PayMethod,
            easyPayProvider?: PortOne.Entity.EasyPayProvider,
            cardProvider?: PortOne.Entity.Country
        ): string {
            switch (payMethod) {
                case "EASY_PAY":
                    if (!easyPayProvider)
                        throw new Error("Easy pay provider is required");
                    switch (easyPayProvider) {
                        case "EASY_PAY_PROVIDER_TOSSPAY":
                            return process.env.PORTONE_TOSS!;
                        case "EASY_PAY_PROVIDER_KAKAOPAY":
                            return process.env.PORTONE_KAKAO!;
                        default:
                            throw new Error(
                                `Invalid easy pay provider: ${easyPayProvider}`
                            );
                    }
                case "CARD":
                    switch (cardProvider) {
                        case "COUNTRY_KR":
                            return process.env.PORTONE_CARD!;
                        default:
                            return process.env.PORTONE_INTERCARD!;
                    }
                case "PAYPAL":
                    return process.env.PORTONE_PAYPAL!;
                default:
                    throw new Error(`Invalid pay method: ${payMethod}`);
            }
        }

        // 3. 환율 정보 조회 (KRW 기준)
        const exchangeRate = await getExchangeRateInfo(fromCurrency, currency);

        // 4. 결제 키 생성 및 암호화
        const nonce = nanoid(16);
        const paymentKey = `${userId}:${merchId}:${nonce}`;
        const encryptedPaymentKey = encrypt(paymentKey);

        // 5. 결제 로그 생성
        const logData = {
            status: PaymentStatus.INIT,
            sessionHash,
            paymentKey: encryptedPaymentKey,
            nonce,
            userId,
            attemptCount: 0,
            orderedProductId: merchId,
            orderedProductName: merchName,
            amount: merch.price * quantity,
            currency,
            convertedAmount: merch.price * quantity * exchangeRate.rate,
        };

        const paymentLog = await prisma.paymentLog.create({
            data: logData,
        });

        // 6. 응답 데이터 구성
        const response: PaymentResponse = {
            success: true,
            data: {
                paymentLogId: paymentLog.id,
                storeId: process.env.PORTONE_MID!,
                channelKey: getChannelId(
                    payMethod,
                    easyPayProvider,
                    cardProvider
                ),
                defaultAmount: merch.price * quantity,
                convertedAmount: merch.price * quantity * exchangeRate.rate,
                currency,
                nonce,
                status: PaymentStatus.INIT,
                failureReason: null,
            },
        };
        return response;
    } catch (error) {
        console.error("Payment creation failed:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to create payment",
        };
    }
}

export interface VerifyPaymentProps {
    paymentLogId: string;
    sessionHash: string;
    userId: string;
    merchId: string;
    nonce: string;
}

export async function verifyPayment({
    paymentLogId,
    sessionHash,
    userId,
    merchId,
    nonce,
}: VerifyPaymentProps) {
    if (!process.env.PORTONE_V2_API_SECRET) {
        throw new Error("PORTONE_V2_API_SECRET is not configured");
    }

    return await prisma.$transaction(async (tx) => {
        try {
            const log = await tx.paymentLog.findUnique({
                where: { id: paymentLogId },
                select: {
                    sessionHash: true,
                    paymentKey: true,
                    nonce: true,
                    userId: true,
                    orderedProductId: true,
                    orderedProductName: true,
                    amount: true,
                    currency: true,
                    convertedAmount: true,
                    status: true,
                },
            });

            if (!log) {
                throw new Error("Payment log not found");
            }

            if (log.status !== PaymentStatus.INIT) {
                await tx.paymentLog.update({
                    where: { id: paymentLogId },
                    data: {
                        status: PaymentStatus.FAILED,
                        failureReason: "Payment already processed",
                    },
                });
                throw new Error("Payment already processed");
            }

            if (log.sessionHash !== sessionHash) {
                await tx.paymentLog.update({
                    where: { id: paymentLogId },
                    data: {
                        status: PaymentStatus.FAILED,
                        failureReason: "Invalid session hash",
                    },
                });
                throw new Error("Invalid session hash");
            }

            const decryptedPaymentKey = decrypt(log.paymentKey);
            const [logUserId, logMerchId, logNonce] =
                decryptedPaymentKey.split(":");

            if (
                logUserId !== userId ||
                logMerchId !== merchId ||
                logNonce !== nonce
            ) {
                await tx.paymentLog.update({
                    where: { id: paymentLogId },
                    data: {
                        status: PaymentStatus.FAILED,
                        failureReason: "Invalid payment key",
                    },
                });
                throw new Error("Invalid payment key");
            }

            // 1. 포트원 결제내역 단건 조회 API 호출
            const paymentResponse = await fetch(
                `https://api.portone.io/payments/${encodeURIComponent(
                    paymentLogId
                )}`,
                {
                    headers: {
                        Authorization: `PortOne ${process.env.PORTONE_V2_API_SECRET}`,
                    },
                }
            );

            if (!paymentResponse.ok) {
                await tx.paymentLog.update({
                    where: { id: paymentLogId },
                    data: {
                        status: PaymentStatus.FAILED,
                        failureReason: "Failed to fetch payment details",
                    },
                });
                throw new Error("Failed to fetch payment details");
            }

            const payment = await paymentResponse.json();

            const expectedAmount = log.convertedAmount ?? log.amount;
            if (
                Math.abs(payment.amount.total - expectedAmount) > 0.01 ||
                payment.currency !== log.currency
            ) {
                await tx.paymentLog.update({
                    where: { id: paymentLogId },
                    data: {
                        status: PaymentStatus.FAILED,
                        failureReason: "Payment amount or currency mismatch",
                    },
                });
                throw new Error("Payment amount or currency mismatch");
            }

            switch (payment.status) {
                case "VIRTUAL_ACCOUNT_ISSUED":
                    await tx.paymentLog.update({
                        where: { id: paymentLogId },
                        data: {
                            status: PaymentStatus.VIRTUAL_ACCOUNT_ISSUED,
                            failureReason: "Virtual account issued",
                        },
                    });
                    return {
                        success: true,
                        status: "VIRTUAL_ACCOUNT_ISSUED",
                        data: payment,
                    };

                case "PAID":
                    await tx.paymentLog.update({
                        where: { id: paymentLogId },
                        data: {
                            status: PaymentStatus.COMPLETED,
                        },
                    });
                    return {
                        success: true,
                        status: "PAID",
                        data: payment,
                    };

                default:
                    await tx.paymentLog.update({
                        where: { id: paymentLogId },
                        data: {
                            status: PaymentStatus.FAILED,
                            failureReason: `Unexpected payment status: ${payment.status}`,
                        },
                    });
                    throw new Error(
                        `Unexpected payment status: ${payment.status}`
                    );
            }
        } catch (error) {
            // 이미 상태가 업데이트된 경우는 다시 업데이트하지 않도록
            const currentLog = await tx.paymentLog.findUnique({
                where: { id: paymentLogId },
                select: { status: true },
            });

            if (currentLog?.status === PaymentStatus.INIT) {
                await tx.paymentLog.update({
                    where: { id: paymentLogId },
                    data: {
                        status: PaymentStatus.FAILED,
                        failureReason:
                            error instanceof Error
                                ? error.message
                                : "Unknown error",
                    },
                });
            }

            console.error("Payment verification failed:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    });
}

export interface CancelPaymentProps {
    paymentLogId: string;
    userId: string;
    cancelReason: string;
}

export async function cancelPayment({
    paymentLogId,
    userId,
    cancelReason,
}: CancelPaymentProps) {
    if (!process.env.PORTONE_V2_API_SECRET) {
        throw new Error("PORTONE_V2_API_SECRET is not configured");
    }

    return await prisma.$transaction(async (tx) => {
        try {
            // 1. 결제 로그 조회 및 검증
            const log = await tx.paymentLog.findUnique({
                where: { id: paymentLogId },
                select: {
                    status: true,
                    userId: true,
                    convertedAmount: true,
                    currency: true,
                },
            });

            if (!log) {
                throw new Error("Payment log not found");
            }

            // 2. 권한 검증
            if (log.userId !== userId) {
                throw new Error("Unauthorized");
            }

            // 3. 상태 검증
            if (log.status !== PaymentStatus.COMPLETED) {
                throw new Error("Payment is not in completed status");
            }

            // 4. PortOne 취소 API 호출
            const cancelResponse = await fetch(
                `https://api.portone.io/payments/${encodeURIComponent(
                    paymentLogId
                )}/cancel`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `PortOne ${process.env.PORTONE_V2_API_SECRET}`,
                    },
                    body: JSON.stringify({
                        amount: log.convertedAmount,
                        currency: log.currency,
                        reason: cancelReason,
                    }),
                }
            );

            if (!cancelResponse.ok) {
                const errorData = await cancelResponse.json();
                throw new Error(
                    `Failed to cancel payment: ${
                        errorData.message || cancelResponse.statusText
                    }`
                );
            }

            // 5. 결제 로그 상태 업데이트
            const updatedLog = await tx.paymentLog.update({
                where: { id: paymentLogId },
                data: {
                    status: PaymentStatus.CANCELLED,
                    failureReason: cancelReason,
                    updatedAt: new Date(),
                },
            });

            return {
                success: true,
                data: {
                    paymentLogId: updatedLog.id,
                    status: updatedLog.status,
                    failureReason: updatedLog.failureReason,
                },
            };
        } catch (error) {
            console.error("Payment cancellation failed:", error);

            // 에러 발생 시 현재 상태 확인
            const currentLog = await tx.paymentLog.findUnique({
                where: { id: paymentLogId },
                select: { status: true },
            });

            // COMPLETED 상태일 때만 FAILED로 업데이트
            if (currentLog?.status === PaymentStatus.COMPLETED) {
                await tx.paymentLog.update({
                    where: { id: paymentLogId },
                    data: {
                        status: PaymentStatus.FAILED,
                        failureReason:
                            error instanceof Error
                                ? error.message
                                : "Unknown error",
                    },
                });
            }

            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to cancel payment",
            };
        }
    });
}

export interface WebhookPayload {
    eventType: "PAYMENT_STATUS_CHANGED";
    paymentId: string;
    status: "VIRTUAL_ACCOUNT_ISSUED" | "PAID" | "FAILED" | "CANCELLED";
    amount: number;
    currency: string;
    failureReason?: string;
    virtualAccountInfo?: {
        accountNumber: string;
        bankCode: string;
        customerName: string;
        dueDate: string;
    };
}

export async function handleWebhook(payload: WebhookPayload) {
    return await prisma.$transaction(async (tx) => {
        try {
            const { paymentId, status, failureReason, virtualAccountInfo } =
                payload;

            // 가상계좌 정보 유효성 검사
            if (status === "VIRTUAL_ACCOUNT_ISSUED" && !virtualAccountInfo) {
                throw new Error(
                    "Virtual account information is required for VIRTUAL_ACCOUNT_ISSUED status"
                );
            }

            const updatedLog = await tx.paymentLog.update({
                where: { id: paymentId },
                data: {
                    status: mapPortOneStatusToPaymentStatus(status),
                    failureReason,
                    ...(virtualAccountInfo && {
                        vbankNum: virtualAccountInfo.accountNumber,
                        vbankCode: virtualAccountInfo.bankCode,
                        vbankHolder: virtualAccountInfo.customerName,
                        vbankDate: new Date(virtualAccountInfo.dueDate),
                    }),
                    updatedAt: new Date(),
                },
            });

            return {
                success: true,
                data: {
                    paymentLogId: updatedLog.id,
                    status: updatedLog.status,
                    virtualAccountInfo:
                        status === "VIRTUAL_ACCOUNT_ISSUED"
                            ? {
                                  accountNumber: updatedLog.vbankNum,
                                  bankCode: updatedLog.vbankCode,
                                  holderName: updatedLog.vbankHolder,
                                  dueDate: updatedLog.vbankDate,
                              }
                            : undefined,
                },
            };
        } catch (error) {
            console.error("Webhook processing failed:", error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to process webhook",
            };
        }
    });
}

// PortOne 상태값을 내부 PaymentStatus로 매핑
function mapPortOneStatusToPaymentStatus(portoneStatus: string): PaymentStatus {
    switch (portoneStatus) {
        case "VIRTUAL_ACCOUNT_ISSUED":
            return PaymentStatus.VIRTUAL_ACCOUNT_ISSUED;
        case "PAID":
            return PaymentStatus.COMPLETED;
        case "CANCELLED":
            return PaymentStatus.CANCELLED;
        case "FAILED":
            return PaymentStatus.FAILED;
        default:
            return PaymentStatus.FAILED;
    }
}

export interface UpdatePaymentStatusProps {
    paymentId: string;
    status: PaymentStatus;
}

export async function updatePaymentStatus({
    paymentId,
    status,
}: UpdatePaymentStatusProps) {
    try {
        const updatedPayment = await prisma.paymentLog.update({
            where: { id: paymentId },
            data: {
                status,
                updatedAt: new Date(),
            },
        });

        return {
            success: true,
            data: {
                paymentLogId: updatedPayment.id,
                status: updatedPayment.status,
            },
        };
    } catch (error) {
        console.error("Payment status update failed:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to update payment status",
        };
    }
}

export async function getPaymentLog(paymentLogId: string) {
    try {
        const paymentLog = await prisma.paymentLog.findUnique({
            where: { id: paymentLogId },
        });

        if (!paymentLog) {
            throw new Error("Payment log not found");
        }

        return paymentLog;
    } catch (error) {
        console.error("Payment log retrieval failed:", error);
        throw error;
    }
}

export async function getPaymentLogs(userId: string) {
    try {
        const paymentLogs = await prisma.paymentLog.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        return paymentLogs;
    } catch (error) {
        console.error("Payment logs retrieval failed:", error);
        throw error;
    }
}

export async function getPaymentLogsByStatus(status: string) {
    try {
        const paymentLogs = await prisma.paymentLog.findMany({
            where: { status: status as PaymentStatus },
            orderBy: { createdAt: "desc" },
        });

        return paymentLogs;
    } catch (error) {
        console.error("Payment logs retrieval by status failed:", error);
        throw error;
    }
}
