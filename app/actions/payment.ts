/// app\actions\payment.ts

"use server";

import * as PortOne from "@portone/browser-sdk/v2";
import { PaymentStatus, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { Payment, Events, PaymentPromotionDiscountType } from "@prisma/client";
import { encrypt, decrypt } from "@/lib/utils/encryption";
import {
    getExchangeRateInfo,
    convertAmount,
    ExchangeRateInfo,
} from "./exchangeRate";
import {
    PayMethod,
    EasyPayProvider,
    CardProvider,
    ProductTable,
    Currency,
    prismaTransaction,
    PRODUCT_MAP,
} from "@/lib/types/payment";

const PAYMENT_SECRET =
    process.env.PAYMENT_SECRET || "&^%$#-super-secret-v0-!##@!#";

function getStoreIdAndChannelKey(
    payMethod: PayMethod,
    easyPayProvider?: EasyPayProvider,
    cardProvider?: CardProvider
): { storeId: string; channelKey: string } {
    switch (payMethod) {
        case "EASY_PAY":
            if (!easyPayProvider)
                throw new Error("Easy pay provider is required");
            switch (easyPayProvider) {
                case "EASY_PAY_PROVIDER_TOSSPAY":
                    return {
                        storeId: process.env.PORTONE_MID!,
                        channelKey: process.env.PORTONE_TOSS!,
                    };
                case "EASY_PAY_PROVIDER_KAKAOPAY":
                    return {
                        storeId: process.env.PORTONE_MID!,
                        channelKey: process.env.PORTONE_KAKAO!,
                    };
                default:
                    throw new Error(
                        `Invalid easy pay provider: ${easyPayProvider}`
                    );
            }
        case "CARD":
            switch (cardProvider) {
                case "COUNTRY_KR":
                    return {
                        storeId: process.env.PORTONE_MID!,
                        channelKey: process.env.PORTONE_CARD!,
                    };
                default:
                    return {
                        storeId: process.env.PORTONE_MID!,
                        channelKey: process.env.PORTONE_INTERCARD!,
                    };
            }
        case "PAYPAL":
            return {
                storeId: process.env.PORTONE_MID!,
                channelKey: process.env.PORTONE_PAYPAL!,
            };
        default:
            throw new Error(`Invalid pay method: ${payMethod}`);
    }
}

function generateServerHash(clientHash: string, nonce: string) {
    const nowTime = new Date().getTime();
    return encrypt(`${clientHash}-${nonce}-${PAYMENT_SECRET}-${nowTime}`);
}

function validateServerHash(
    encryptedServerHash: string,
    clientHash: string,
    nonce: string
) {
    const decrypted = decrypt(encryptedServerHash);
    const [
        decryptedClientHash,
        decryptedNonce,
        decryptedSecret,
        decryptedNowTime,
    ] = decrypted.split("-");

    if (decryptedClientHash !== clientHash || decryptedNonce !== nonce) {
        return false;
    }

    if (decryptedSecret !== PAYMENT_SECRET) {
        return false;
    }

    return true;
}

async function getProduct({
    productTable,
    productId,
    tx,
}: {
    productTable: ProductTable;
    productId: string;
    tx?: prismaTransaction;
}): Promise<{
    productPrice: number | null;
    defaultCurrency: Currency | null;
    productName: string | null;
}> {
    // 서버의 저장된 상품 조회
    if (!PRODUCT_MAP.product[productTable]) {
        return { productPrice: null, defaultCurrency: null, productName: null };
    }

    const product = await PRODUCT_MAP.product[productTable]({ productId, tx });

    const productPrice = product[PRODUCT_MAP.amountField[productTable]] as
        | number
        | null;
    const defaultCurrency = PRODUCT_MAP.defaultCurrency[
        productTable
    ] as Currency | null;
    const productName = product[PRODUCT_MAP.nameField[productTable]] as
        | string
        | null;

    return { productPrice, defaultCurrency, productName };
}

async function getTotalPrice({
    productPrice,
    fromCurrency,
    toCurrency,
    quantity,
    promotionCode,
    exchangeRateInfo,
    tx,
}: {
    productPrice: number;
    fromCurrency: Currency;
    toCurrency: Currency;
    quantity: number;
    exchangeRateInfo: ExchangeRateInfo;
    promotionCode?: string;
    tx?: prismaTransaction;
}): Promise<{
    convertedPrice: number;
    totalAmount: number;
    promotionActivated: boolean;
}> {
    // 기본 가격
    let price = productPrice;

    // 프로모션 적용 여부
    let promotionActivated = false;
    let promotion = null;
    if (promotionCode) {
        promotion = await (tx ?? prisma).paymentPromotion.findUnique({
            where: {
                code: promotionCode,
            },
        });

        if (promotion && promotion.isActive) {
            promotionActivated = true;
            if (
                promotion.discountType ===
                PaymentPromotionDiscountType.percentage
            ) {
                price = price * (1 - promotion.discountValue / 100);
            } else if (
                promotion.discountType === PaymentPromotionDiscountType.amount
            ) {
                price = price - promotion.discountValue;
            }
        }
    }

    // 가격 최소 0원
    if (price < 0) {
        price = 0;
    }

    // 환율 변환
    const convertedPrice = await convertAmount(
        price,
        fromCurrency,
        toCurrency,
        exchangeRateInfo
    );

    // 총 결제 금액
    const totalAmount = convertedPrice * quantity;
    return { convertedPrice, totalAmount, promotionActivated };
}

export type PaymentErrorCode =
    | "INVALID_INPUT"
    | "PAYMENT_CANCELLED"
    | "PAYMENT_FAILED"
    | "DUPLICATE_PAYMENT"
    | "INVALID_PAYMENT_METHOD"
    | "INVALID_PRODUCT"
    | "INVALID_AMOUNT"
    | "PRODUCT_NOT_FOUND"
    | "PAYMENT_EXPIRED"
    | "DATABASE_ERROR"
    | "INTERNAL_SERVER_ERROR"
    | "PAYMENT_NOT_FOUND"
    | "UNAUTHORIZED"
    | "INVALID_SERVER_HASH"
    | "PAYMENT_RESPONSE_FAILED"
    | "INVALID_PAYMENT_AMOUNT"
    | "INVALID_PAYMENT_STATE";

export interface CreatePaymentInput {
    userId: string;
    productTable: ProductTable;
    productId: string;
    productName?: string;
    productDefaultCurrency?: Currency;

    quantity: number;
    currency: Currency;
    payMethod: PayMethod;
    easyPayProvider?: EasyPayProvider;
    cardProvider?: CardProvider;

    promotionCode?: string;

    clientHash: string;
    nonce: string;
}

export interface CreatePaymentSuccess {
    success: true;
    data: Payment;
}

export interface CreatePaymentError {
    success: false;
    error: {
        code: PaymentErrorCode;
        message: string;
        details?: any;
    };
}

export type CreatePaymentResponse = CreatePaymentSuccess | CreatePaymentError;

export async function createPayment(
    input: CreatePaymentInput
): Promise<CreatePaymentResponse> {
    try {
        // 입력값 검증
        if (
            !input.userId ||
            !input.productTable ||
            !input.productId ||
            !input.currency ||
            !input.payMethod
        ) {
            return {
                success: false,
                error: {
                    code: "INVALID_INPUT",
                    message: "Required fields are missing",
                },
            };
        }

        // 서버 해시 생성
        const serverHash = generateServerHash(input.clientHash, input.nonce);

        const transaction = await prisma.$transaction(async (tx) => {
            try {
                // 중복 결제 요청 체크
                const existingPayment = await tx.payment.findFirst({
                    where: {
                        clientHash: input.clientHash,
                        serverHash: serverHash,
                    },
                });

                if (existingPayment) {
                    return {
                        success: false,
                        error: {
                            code: "DUPLICATE_REQUEST",
                            message: "Duplicate payment request",
                            details: { paymentId: existingPayment.id },
                        },
                    };
                }

                // StoreId 및 채널키 생성
                const { storeId, channelKey } = getStoreIdAndChannelKey(
                    input.payMethod,
                    input.easyPayProvider,
                    input.cardProvider
                );

                if (!storeId || !channelKey) {
                    return {
                        success: false,
                        error: {
                            code: "INVALID_PAYMENT_METHOD",
                            message: "Invalid payment method",
                        },
                    };
                }

                const { productPrice, defaultCurrency, productName } =
                    await getProduct({
                        productTable: input.productTable,
                        productId: input.productId,
                        tx,
                    });

                if (!productPrice || !defaultCurrency || !productName) {
                    return {
                        success: false,
                        error: {
                            code: "INVALID_PRODUCT",
                            message: "Product not found",
                        },
                    };
                }

                const exchangeRateInfo = await getExchangeRateInfo({
                    fromCurrency: defaultCurrency,
                    toCurrency: input.currency,
                    tx,
                });

                const { convertedPrice, totalAmount, promotionActivated } =
                    await getTotalPrice({
                        productPrice,
                        fromCurrency: defaultCurrency,
                        toCurrency: input.currency,
                        quantity: input.quantity,
                        promotionCode: input.promotionCode,
                        exchangeRateInfo,
                        tx,
                    });

                // 결제 데이터 생성
                const paymentData = {
                    userId: input.userId,

                    storeId,
                    channelKey,

                    productTable: input.productTable,
                    productId: input.productId,
                    productName:
                        input.productName ||
                        `${productName} x${input.quantity}`,
                    productDefaultCurrency: defaultCurrency,

                    amount: totalAmount,
                    quantity: input.quantity,
                    currency: input.currency,
                    payMethod: input.payMethod,
                    easyPayProvider: input.easyPayProvider,
                    cardProvider: input.cardProvider,

                    exchangeRate: exchangeRateInfo.rate,
                    exchangeRateProvider: exchangeRateInfo.provider,
                    exchangeRateTimestamp: exchangeRateInfo.createdAt,
                    originalProductPrice: productPrice,
                    convertedPrice,

                    promotionCode: input.promotionCode,
                    isPromotionApplied: promotionActivated,

                    status: PaymentStatus.PENDING,
                    statusReason: "Payment initiated",

                    clientHash: input.clientHash,
                    serverHash: serverHash,
                    nonce: input.nonce,
                };

                const payment = await tx.payment.create({
                    data: paymentData,
                });

                return {
                    success: true,
                    data: payment,
                };
            } catch (error) {
                console.error("Payment creation failed", error);
                return {
                    success: false,
                    error: {
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Payment creation failed",
                    },
                };
            }
        });

        return transaction as CreatePaymentResponse;
    } catch (error) {
        console.error("Payment creation failed", error);
        return {
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Payment creation failed",
                details:
                    process.env.NODE_ENV === "development" ? error : undefined,
            },
        };
    }
}

export interface VerifyPaymentInput {
    paymentId: string;
    userId: string;
    clientHash: string;
    nonce: string;
}

export interface VerifyPaymentSuccess {
    success: true;
    data: Payment;
}

export interface VerifyPaymentError {
    success: false;
    error: {
        code: PaymentErrorCode;
        message: string;
        details?: any;
    };
}

export type VerifyPaymentResponse = VerifyPaymentSuccess | VerifyPaymentError;

async function updatePaymentStatus({
    payment,
    status,
    statusReason,
    errorCode,
    cancelAmount,
    percentage,
    tx,
}: {
    payment: Payment;
    status: PaymentStatus;
    statusReason: string;
    errorCode?: PaymentErrorCode;
    cancelAmount?: number;
    percentage?: Percentage;
    tx?: prismaTransaction;
}): Promise<VerifyPaymentResponse> {
    const importedPrismaClient = tx ?? prisma;

    switch (status) {
        case PaymentStatus.EXPIRED: {
            const { cancelledAmount, cancelResponseData } =
                await portOneCancelPayment({
                    payment,
                    statusReason,
                    percentage: floatPercent(1.0),
                });

            await importedPrismaClient.payment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.EXPIRED,
                    statusReason,
                    failedAt: new Date(),
                    cancelAmount: cancelledAmount,
                    pgResponse: cancelResponseData,
                },
            });

            return {
                success: false,
                error: {
                    code: errorCode ?? "PAYMENT_EXPIRED",
                    message: statusReason,
                },
            } as VerifyPaymentError;
        }

        case PaymentStatus.CANCELLED: {
            const { cancelledAmount, cancelResponseData } =
                await portOneCancelPayment({
                    payment,
                    statusReason,
                    percentage,
                    cancelAmount,
                });

            await importedPrismaClient.payment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.CANCELLED,
                    statusReason,
                    cancelledAt: new Date(),
                    cancelAmount: cancelledAmount,
                    pgResponse: cancelResponseData,
                },
            });

            return {
                success: false,
                error: {
                    code: errorCode ?? "PAYMENT_CANCELLED",
                    message: statusReason,
                },
            } as VerifyPaymentError;
        }

        case PaymentStatus.FAILED: {
            const { cancelledAmount, cancelResponseData } =
                await portOneCancelPayment({
                    payment,
                    statusReason,
                    percentage: floatPercent(1.0),
                });

            await importedPrismaClient.payment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.FAILED,
                    statusReason,
                    failedAt: new Date(),
                    cancelAmount: cancelledAmount,
                    pgResponse: cancelResponseData,
                },
            });

            return {
                success: false,
                error: {
                    code: errorCode ?? "PAYMENT_FAILED",
                    message: statusReason,
                },
            } as VerifyPaymentError;
        }

        case PaymentStatus.REFUNDED: {
            const { cancelledAmount, cancelResponseData } =
                await portOneCancelPayment({
                    payment,
                    statusReason,
                    cancelAmount,
                    percentage,
                });

            const updatedPayment = await importedPrismaClient.payment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.REFUNDED,
                    statusReason,
                    refundedAt: new Date(),
                    cancelAmount: cancelledAmount,
                    pgResponse: cancelResponseData,
                },
            });

            return {
                success: true,
                data: updatedPayment,
            } as VerifyPaymentSuccess;
        }

        case PaymentStatus.PAID: {
            const updatedPayment = await importedPrismaClient.payment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.PAID,
                    statusReason,
                    paidAt: new Date(),
                },
            });

            return {
                success: true,
                data: updatedPayment,
            } as VerifyPaymentSuccess;
        }

        default: {
            return {
                success: false,
                error: {
                    code: "INVALID_PAYMENT_STATE",
                    message: "Invalid payment state",
                },
            } as VerifyPaymentError;
        }
    }
}

export async function verifyPayment(
    input: VerifyPaymentInput
): Promise<VerifyPaymentResponse> {
    try {
        // 입력값 검증
        if (!input.paymentId || !input.userId) {
            return {
                success: false,
                error: {
                    code: "INVALID_INPUT",
                    message: "Required fields are missing",
                },
            };
        }

        // 결제 조회
        const transaction = await prisma.$transaction(async (tx) => {
            try {
                // 결제 조회
                const payment = await getPayment({
                    paymentId: input.paymentId,
                });

                if (!payment) {
                    return {
                        success: false,
                        error: {
                            code: "PAYMENT_NOT_FOUND",
                            message: "Payment not found",
                        },
                    };
                }

                // 결제 상태 확인
                if (payment.userId !== input.userId) {
                    return await updatePaymentStatus({
                        payment,
                        status: PaymentStatus.FAILED,
                        statusReason: "Unauthorized payment access",
                        tx,
                    });
                }

                // 서버 해시 검증
                const isValidServerHash = validateServerHash(
                    payment.serverHash,
                    input.clientHash,
                    input.nonce
                );

                if (!isValidServerHash) {
                    return await updatePaymentStatus({
                        payment,
                        status: PaymentStatus.FAILED,
                        statusReason: "Invalid server hash",
                        tx,
                    });
                }

                // 결제 상태 확인
                if (payment.status !== PaymentStatus.PENDING) {
                    return await updatePaymentStatus({
                        payment,
                        status: PaymentStatus.FAILED,
                        statusReason: "Invalid payment state",
                        tx,
                    });
                }

                const { productPrice, defaultCurrency, productName } =
                    await getProduct({
                        productTable: payment.productTable as ProductTable,
                        productId: payment.productId,
                        tx,
                    });

                if (!productPrice || !defaultCurrency || !productName) {
                    return await updatePaymentStatus({
                        payment,
                        status: PaymentStatus.FAILED,
                        statusReason: "Product not found",
                        tx,
                    });
                }

                const exchangeRateInfo = {
                    rate: payment.exchangeRate,
                    provider: payment.exchangeRateProvider,
                    createdAt: payment.exchangeRateTimestamp,
                } as ExchangeRateInfo;

                const { convertedPrice, totalAmount, promotionActivated } =
                    await getTotalPrice({
                        productPrice,
                        fromCurrency: defaultCurrency,
                        toCurrency: payment.currency as Currency,
                        quantity: payment.quantity,
                        promotionCode: payment.promotionCode ?? undefined,
                        exchangeRateInfo,
                        tx,
                    });

                if (
                    convertedPrice !== payment.convertedPrice ||
                    totalAmount !== payment.amount
                ) {
                    return await updatePaymentStatus({
                        payment,
                        status: PaymentStatus.FAILED,
                        statusReason:
                            "Payment amount is different with the server data",
                        tx,
                    });
                }

                const paymentResponse = await fetch(
                    `https://api.portone.io/payments/${encodeURIComponent(
                        input.paymentId
                    )}`,
                    {
                        headers: {
                            Authorization: `PortOne ${process.env.PORTONE_V2_API_SECRET}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!paymentResponse.ok) {
                    return await updatePaymentStatus({
                        payment,
                        status: PaymentStatus.FAILED,
                        statusReason: "Failed to fetch payment details",
                        tx,
                    });
                }

                const paymentResponseData = await paymentResponse.json();

                if (paymentResponseData.code === "PG_PROVIDER_ERROR") {
                    return await updatePaymentStatus({
                        payment,
                        status: PaymentStatus.FAILED,
                        statusReason: paymentResponseData.message,
                        tx,
                    });
                }

                if (Math.abs(payment.amount - paymentResponseData.amount) > 1) {
                    return await updatePaymentStatus({
                        payment,
                        status: PaymentStatus.FAILED,
                        statusReason: "Payment amount or currency mismatch",
                        tx,
                    });
                }

                // 결제 성공
                return await updatePaymentStatus({
                    payment,
                    status: PaymentStatus.PAID,
                    statusReason: "Successfully verified payment",
                    tx,
                });
            } catch (error) {
                console.error("Payment verification failed", error);
                return {
                    success: false,
                    error: {
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Payment verification failed",
                        details:
                            process.env.NODE_ENV === "development"
                                ? error
                                : undefined,
                    },
                };
            }
        });

        return transaction as VerifyPaymentResponse;
    } catch (error) {
        console.error("Payment verification failed", error);
        return {
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Payment verification failed",
                details:
                    process.env.NODE_ENV === "development" ? error : undefined,
            },
        };
    }
}

type Percentage = number & { __brand: "Percentage" };
function floatPercent(value: number): Percentage {
    if (value < 0 || value > 1) {
        throw new Error("Percentage must be between 0 and 1");
    }
    return value as Percentage;
}

async function portOneCancelPayment({
    payment,
    statusReason,
    cancelAmount,
    percentage,
}: {
    payment: Payment;
    statusReason?: string;
    cancelAmount?: number;
    percentage?: Percentage;
}): Promise<{
    cancelledAmount: number;
    cancelResponseData: any;
}> {
    try {
        const cancelledAmount =
            cancelAmount && cancelAmount > 0
                ? payment.amount - cancelAmount
                : percentage && percentage > 0
                ? payment.amount * percentage
                : payment.amount;

        const cancelResponse = await fetch(
            `https://api.portone.io/payments/${encodeURIComponent(
                payment.id
            )}/cancel`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `PortOne ${process.env.PORTONE_V2_API_SECRET}`,
                },
                body: JSON.stringify({
                    amount: cancelledAmount,
                    currency: payment.currency,
                    reason: statusReason ?? "Canceled by user",
                }),
            }
        );

        if (!cancelResponse.ok) {
            throw new Error("Failed to cancel payment");
        }

        const cancelResponseData = await cancelResponse.json();

        return {
            cancelledAmount,
            cancelResponseData,
        };
    } catch (error) {
        console.error("Failed to cancel payment", error);
        throw error;
    }
}

export async function cancelPayment({
    payment,
    cancelReason,
    cancelAmount,
    percentage,
}: {
    payment: Payment;
    cancelReason?: string;
    cancelAmount?: number;
    percentage?: Percentage;
}): Promise<VerifyPaymentResponse> {
    return await updatePaymentStatus({
        payment,
        status: PaymentStatus.CANCELLED,
        statusReason: cancelReason ?? "Canceled by user",
        cancelAmount,
        percentage,
    });
}

export async function refundPayment({
    payment,
    refundReason,
    cancelAmount,
    percentage,
}: {
    payment: Payment;
    refundReason?: string;
    cancelAmount?: number;
    percentage?: Percentage;
}): Promise<VerifyPaymentResponse> {
    return await updatePaymentStatus({
        payment,
        status: PaymentStatus.REFUNDED,
        statusReason: refundReason ?? "Refunded by user",
        cancelAmount,
        percentage,
    });
}

export async function getPayment({
    paymentId,
}: {
    paymentId: string;
}): Promise<Payment | null> {
    return await prisma.payment.findUnique({
        where: {
            id: paymentId,
        },
    });
}

export async function getPaymentsByUserId({
    userId,
}: {
    userId: string;
}): Promise<Payment[]> {
    return await prisma.payment.findMany({
        where: {
            userId,
        },
    });
}

export type PortOneWebhookBody = {
    type:
        | "Transaction.Ready"
        | "Transaction.Paid"
        | "Transaction.PartialCancelled"
        | "Transaction.Cancelled"
        | "Transaction.Failed"
        | "Transaction.PayPending"
        | "Transaction.CancelPending";
    data: {
        paymentId?: string;
        storeId?: string;
    };
};

export async function setCancelledAmount({
    paymentId,
}: {
    paymentId: string;
}): Promise<boolean> {
    const payment = await getPayment({ paymentId });
    if (!payment) {
        throw new Error("Payment not found");
    }

    const response = await fetch(
        `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
        {
            headers: {
                Authorization: `PortOne ${process.env.PORTONE_V2_API_SECRET}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to get cancelled amount");
    }

    const data = await response.json();
    if (data.status === "CANCELLED" || data.status === "PARTIAL_CANCELLED") {
        const cancelledAmount = data.amount.cancelled;
        await cancelPayment({
            payment,
            cancelAmount: cancelledAmount,
        });
        return true;
    }

    return false;
}

export async function handlePortOneWebhook(body: PortOneWebhookBody) {
    const paymentId = body.data.paymentId;
    const storeId = body.data.storeId;

    if (!paymentId) {
        throw new Error("Invalid webhook body");
    }

    // 스토어 ID 검증
    if (storeId && storeId !== process.env.PORTONE_MID) {
        throw new Error("Invalid store ID");
    }

    const payment = await getPayment({ paymentId });
    if (!payment) {
        throw new Error("Payment not found");
    }

    // 웹훅 이벤트 생성
    const webhookEvent = await prisma.webhookEvent.create({
        data: {
            paymentId: payment.id,
            description: body.type as string,
            payload: body,
        },
    });

    try {
        switch (body.type) {
            case "Transaction.Paid":
                await verifyPayment({
                    paymentId: payment.id,
                    userId: payment.userId,
                    clientHash: payment.clientHash,
                    nonce: payment.nonce,
                });
                break;
            case "Transaction.PartialCancelled": {
                const success = await setCancelledAmount({
                    paymentId: payment.id,
                });
                if (!success) {
                    throw new Error("Failed to set cancelled amount");
                }
                break;
            }
            case "Transaction.Cancelled": {
                const success = await setCancelledAmount({
                    paymentId: payment.id,
                });
                if (!success) {
                    throw new Error("Failed to set cancelled amount");
                }
                break;
            }
            case "Transaction.Failed":
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: PaymentStatus.FAILED,
                        statusReason: "PortOne Webhook sent failed",
                    },
                });
                break;
            default:
                console.log(`Unhandled webhook type: ${body.type}`);
        }

        // 웹훅 이벤트 처리 완료 시간 업데이트
        await prisma.webhookEvent.update({
            where: { id: webhookEvent.id },
            data: {
                description: `[${
                    body.type
                }] Processed at ${new Date().toISOString()}`,
            },
        });

        return { success: true };
    } catch (error) {
        // 에러 발생 시에도 웹훅 이벤트 처리 시간 업데이트
        await prisma.webhookEvent.update({
            where: { id: webhookEvent.id },
            data: {
                description: `[${
                    body.type
                }] Processed at ${new Date().toISOString()}`,
                payload: {
                    ...body,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
            },
        });

        throw error;
    }
}
