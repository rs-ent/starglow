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

// 로깅 유틸리티 함수 추가
const isDev = process.env.NODE_ENV === "development";

function logDebug(message: string, data?: any, meta?: { [key: string]: any }) {
    if (isDev) {
        const timestamp = new Date().toISOString();
        const metaInfo = meta
            ? ` [${Object.entries(meta)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(", ")}]`
            : "";
        console.log(
            `[PAYMENT DEBUG ${timestamp}${metaInfo}] ${message}`,
            data || ""
        );
    }
}

function logInfo(message: string, data?: any, meta?: { [key: string]: any }) {
    const timestamp = new Date().toISOString();
    const metaInfo = meta
        ? ` [${Object.entries(meta)
              .map(([k, v]) => `${k}=${v}`)
              .join(", ")}]`
        : "";
    console.log(
        `[PAYMENT INFO ${timestamp}${metaInfo}] ${message}`,
        data || ""
    );
}

function logWarning(
    message: string,
    data?: any,
    meta?: { [key: string]: any }
) {
    const timestamp = new Date().toISOString();
    const metaInfo = meta
        ? ` [${Object.entries(meta)
              .map(([k, v]) => `${k}=${v}`)
              .join(", ")}]`
        : "";
    console.warn(
        `[PAYMENT WARNING ${timestamp}${metaInfo}] ${message}`,
        data || ""
    );
}

function logError(message: string, error?: any, meta?: { [key: string]: any }) {
    const timestamp = new Date().toISOString();
    const metaInfo = meta
        ? ` [${Object.entries(meta)
              .map(([k, v]) => `${k}=${v}`)
              .join(", ")}]`
        : "";
    console.error(
        `[PAYMENT ERROR ${timestamp}${metaInfo}] ${message}`,
        error || ""
    );

    // 개발 환경에서 오류 상세 정보 로깅
    if (isDev && error) {
        if (error instanceof Error) {
            console.error(
                `[PAYMENT ERROR DETAILS ${timestamp}] Name: ${error.name}`
            );
            console.error(
                `[PAYMENT ERROR DETAILS ${timestamp}] Message: ${error.message}`
            );
            console.error(
                `[PAYMENT ERROR DETAILS ${timestamp}] Stack: ${error.stack}`
            );
        } else if (error instanceof Response) {
            console.error(
                `[PAYMENT ERROR DETAILS ${timestamp}] Response Status: ${error.status}`
            );
            console.error(
                `[PAYMENT ERROR DETAILS ${timestamp}] Response Status Text: ${error.statusText}`
            );
            // 응답 본문 시도
            error
                .text()
                .then((text) => {
                    try {
                        const json = JSON.parse(text);
                        console.error(
                            `[PAYMENT ERROR DETAILS ${timestamp}] Response Body:`,
                            json
                        );
                    } catch (e) {
                        console.error(
                            `[PAYMENT ERROR DETAILS ${timestamp}] Response Text:`,
                            text
                        );
                    }
                })
                .catch((e) => {
                    console.error(
                        `[PAYMENT ERROR DETAILS ${timestamp}] Failed to read response body:`,
                        e
                    );
                });
        } else {
            console.error(
                `[PAYMENT ERROR DETAILS ${timestamp}] Raw error:`,
                error
            );
        }
    }
}

// 로깅 헬퍼 - 함수 진입/종료 측정
function createLogScope(name: string, initialData?: any) {
    if (!isDev)
        return {
            log: () => {},
            end: () => {},
            error: () => {},
        };

    const startTime = Date.now();
    const id = Math.random().toString(36).substring(2, 8);

    logDebug(`> ${name} started`, initialData, { id, function: name });

    return {
        log: (message: string, data?: any) => {
            logDebug(`| ${name} - ${message}`, data, {
                id,
                function: name,
                elapsed: `${Date.now() - startTime}ms`,
            });
        },
        end: (result?: any) => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            logDebug(`< ${name} completed in ${duration}ms`, result, {
                id,
                function: name,
            });
            return duration;
        },
        error: (error: any, message?: string) => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            logError(message || `${name} failed after ${duration}ms`, error, {
                id,
                function: name,
            });
            return duration;
        },
    };
}

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
    | "PAYMENT_RESPONSE_FAILED"
    | "INVALID_PAYMENT_AMOUNT"
    | "INVALID_PAYMENT_STATE"
    | "PAYMENT_NOT_COMPLETED";

// 중간 트랜잭션 결과를 위한 인터페이스
interface VerificationInProgress {
    continueVerification: true;
    payment: Payment;
    tx: prismaTransaction;
}

// 중복 결제 체크를 위한 함수 수정
async function checkRecentPayment(
    userId: string | undefined,
    productTable: ProductTable,
    productId: string,
    payMethod: PayMethod,
    easyPayProvider?: EasyPayProvider,
    cardProvider?: CardProvider,
    cooldownSeconds: number = 60 // 1분 기본 쿨다운
): Promise<{ isDuplicate: boolean; existingPaymentId?: string }> {
    const scope = createLogScope("checkRecentPayment", {
        userId: userId || "anonymous",
        productTable,
        productId,
        payMethod,
        easyPayProvider,
        cardProvider,
    });

    try {
        // 쿨다운 시간 내 동일 상품에 대한 결제 시도 확인
        const cooldownTime = new Date();
        cooldownTime.setSeconds(cooldownTime.getSeconds() - cooldownSeconds);

        scope.log(`Checking for recent payment within cooldown period`);
        const recentPayment = await prisma.payment.findFirst({
            where: {
                userId: userId,
                productTable: productTable,
                productId: productId,
                payMethod: payMethod,
                easyPayProvider: easyPayProvider,
                cardProvider: cardProvider,
                createdAt: {
                    gte: cooldownTime,
                },
                status: {
                    in: [PaymentStatus.PENDING, PaymentStatus.PAID],
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (recentPayment) {
            scope.log(`Recent payment found`, {
                paymentId: recentPayment.id,
                status: recentPayment.status,
                createdAt: recentPayment.createdAt,
            });
            scope.end({ isDuplicate: true, paymentId: recentPayment.id });
            return { isDuplicate: true, existingPaymentId: recentPayment.id };
        }

        scope.log(`No recent payment found`);
        scope.end({ isDuplicate: false });
        return { isDuplicate: false };
    } catch (error) {
        scope.error(error, `Failed to check recent payment`);
        return { isDuplicate: false };
    }
}

export interface CreatePaymentInput {
    userId?: string;
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

    redirectUrl?: string;
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

// 결제 생성 함수 수정
export async function createPayment(
    input: CreatePaymentInput
): Promise<CreatePaymentResponse> {
    const scope = createLogScope("createPayment", {
        userId: input.userId || "anonymous",
        productTable: input.productTable,
        productId: input.productId,
        payMethod: input.payMethod,
        redirectUrl: input.redirectUrl,
    });

    try {
        // 입력값 검증
        if (
            !input.productTable ||
            !input.productId ||
            !input.currency ||
            !input.payMethod
        ) {
            scope.log(`Invalid input - missing required fields`);
            scope.end({ success: false });
            return {
                success: false,
                error: {
                    code: "INVALID_INPUT",
                    message: "Required fields are missing",
                },
            };
        }

        // 중복 결제 체크
        const recentCheck = await checkRecentPayment(
            input.userId,
            input.productTable,
            input.productId,
            input.payMethod,
            input.easyPayProvider,
            input.cardProvider
        );

        if (recentCheck.isDuplicate) {
            scope.log(`Duplicate payment request detected`);
            return {
                success: false,
                error: {
                    code: "DUPLICATE_PAYMENT",
                    message:
                        "A payment for this product was recently initiated with the same payment method",
                    details: {
                        paymentId: recentCheck.existingPaymentId,
                        payMethod: input.payMethod,
                        easyPayProvider: input.easyPayProvider,
                        cardProvider: input.cardProvider,
                    },
                },
            };
        }

        scope.log(`Starting transaction`);
        const txStart = Date.now();
        const transaction = await prisma.$transaction(async (tx) => {
            const txScope = createLogScope("createPaymentTransaction", {
                productId: input.productId,
            });

            try {
                // StoreId 및 채널키 생성
                txScope.log(
                    `Getting store ID and channel key for payment method: ${input.payMethod}`
                );
                const { storeId, channelKey } = getStoreIdAndChannelKey(
                    input.payMethod,
                    input.easyPayProvider,
                    input.cardProvider
                );

                if (!storeId || !channelKey) {
                    txScope.log(`Invalid payment method configuration`);
                    txScope.end({
                        success: false,
                        code: "INVALID_PAYMENT_METHOD",
                    });
                    return {
                        success: false,
                        error: {
                            code: "INVALID_PAYMENT_METHOD",
                            message: "Invalid payment method",
                        },
                    };
                }

                txScope.log(`Payment method config retrieved`, {
                    storeId,
                    channelKey,
                });

                txScope.log(`Retrieving product information`);
                const { productPrice, defaultCurrency, productName } =
                    await getProduct({
                        productTable: input.productTable,
                        productId: input.productId,
                        tx,
                    });

                if (!productPrice || !defaultCurrency || !productName) {
                    txScope.log(`Product not found or invalid`);
                    txScope.end({ success: false, code: "INVALID_PRODUCT" });
                    return {
                        success: false,
                        error: {
                            code: "INVALID_PRODUCT",
                            message: "Product not found",
                        },
                    };
                }

                txScope.log(`Product info retrieved`, {
                    productPrice,
                    defaultCurrency,
                    productName,
                });

                txScope.log(`Getting exchange rate information`);
                const exchangeRateInfo = await getExchangeRateInfo({
                    fromCurrency: defaultCurrency,
                    toCurrency: input.currency,
                    tx,
                });

                txScope.log(`Exchange rate info retrieved`, {
                    rate: exchangeRateInfo.rate,
                    provider: exchangeRateInfo.provider,
                });

                txScope.log(`Calculating total price`);
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

                txScope.log(`Price calculation completed`, {
                    originalPrice: productPrice,
                    convertedPrice,
                    totalAmount,
                    promotionActivated,
                });

                txScope.log(`Creating payment record in database`);
                const paymentData = {
                    userId: input.userId ?? undefined,

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

                    redirectUrl: input.redirectUrl,
                };

                const payment = await tx.payment.create({
                    data: paymentData,
                });

                txScope.log(`Payment record created successfully`, {
                    paymentId: payment.id,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                });

                txScope.end({ success: true, paymentId: payment.id });
                return {
                    success: true,
                    data: payment,
                };
            } catch (error) {
                txScope.error(error, "Payment creation failed in transaction");
                return {
                    success: false,
                    error: {
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Payment creation failed",
                    },
                };
            }
        });

        scope.log(`Transaction completed in ${Date.now() - txStart}ms`);

        // Add detailed debugging for the transaction response
        console.log(
            "[SERVER] Payment creation transaction result:",
            JSON.stringify({
                success: transaction.success,
                paymentId: transaction.success
                    ? transaction?.data?.id
                    : undefined,
                error: transaction.success ? undefined : transaction.error,
            })
        );

        scope.end(transaction);
        return transaction as CreatePaymentResponse;
    } catch (error) {
        scope.error(error, "Payment creation failed");
        return {
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Payment creation failed",
                details: isDev ? error : undefined,
            },
        };
    }
}

export interface VerifyPaymentInput {
    paymentId: string;
    userId: string;
}

export interface VerifyPaymentSuccess {
    success: true;
    data: Payment;
    validatedPayment?: Payment;
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
    pgResponse,
}: {
    payment: Payment;
    status: PaymentStatus;
    statusReason: string;
    errorCode?: PaymentErrorCode;
    cancelAmount?: number;
    percentage?: Percentage;
    tx?: prismaTransaction;
    pgResponse?: any;
}): Promise<VerifyPaymentResponse> {
    const scope = createLogScope("updatePaymentStatus", {
        paymentId: payment.id,
        currentStatus: payment.status,
        newStatus: status,
        reason: statusReason,
        errorCode,
        cancelAmount,
        percentage: percentage ? Number(percentage) : undefined,
    });

    const importedPrismaClient = tx ?? prisma;

    try {
        // 취소 관련 상태인 경우 외부 API 호출이 필요
        if (
            status === PaymentStatus.EXPIRED ||
            status === PaymentStatus.CANCELLED ||
            status === PaymentStatus.FAILED ||
            status === PaymentStatus.REFUNDED
        ) {
            scope.log(`Handling cancellation/failure status: ${status}`);
            try {
                // 취소 로직이 있는 경우 처리
                if (
                    status === PaymentStatus.EXPIRED ||
                    status === PaymentStatus.FAILED ||
                    status === PaymentStatus.CANCELLED ||
                    status === PaymentStatus.REFUNDED
                ) {
                    // tx가 제공되면 트랜잭션 내에서 실행 중이므로 외부 API 호출을 피함
                    // 이 경우 상태만 업데이트하고 실제 취소는 별도 처리
                    if (tx) {
                        scope.log(
                            `In transaction - updating status only without API call`
                        );

                        const updateData: any = {
                            status,
                            statusReason,
                            ...(status === PaymentStatus.EXPIRED ||
                            status === PaymentStatus.FAILED
                                ? { failedAt: new Date() }
                                : status === PaymentStatus.CANCELLED
                                ? { cancelledAt: new Date() }
                                : status === PaymentStatus.REFUNDED
                                ? { refundedAt: new Date() }
                                : {}),
                        };

                        // pgResponse가 존재하면 추가
                        if (pgResponse) {
                            updateData.code = pgResponse.code ?? undefined;
                            updateData.message =
                                pgResponse.message ?? undefined;
                            updateData.paymentId =
                                pgResponse.paymentId ?? undefined;
                            updateData.pgCode = pgResponse.pgCode ?? undefined;
                            updateData.pgMessage =
                                pgResponse.pgMessage ?? undefined;
                            updateData.transactionType =
                                pgResponse.transactionType ?? undefined;
                            updateData.txId = pgResponse.txId ?? undefined;
                            updateData.pgResponse = pgResponse;
                            scope.log(`Adding PG response data to update`);
                        }

                        const updatedPayment =
                            await importedPrismaClient.payment.update({
                                where: { id: payment.id },
                                data: updateData,
                            });
                        scope.log(`Status updated to ${status} in DB`);

                        if (status === PaymentStatus.REFUNDED) {
                            scope.log(
                                `Refund status - returning success response`
                            );
                            scope.end({ success: true });
                            return {
                                success: true,
                                data: updatedPayment,
                            };
                        } else {
                            scope.log(
                                `Non-refund status - returning failure response`
                            );
                            const responseCode =
                                errorCode ??
                                (status === PaymentStatus.EXPIRED
                                    ? "PAYMENT_EXPIRED"
                                    : status === PaymentStatus.CANCELLED
                                    ? "PAYMENT_CANCELLED"
                                    : "PAYMENT_FAILED");
                            scope.end({ success: false, code: responseCode });
                            return {
                                success: false,
                                error: {
                                    code: responseCode,
                                    message: statusReason,
                                },
                            };
                        }
                    }

                    // 트랜잭션 외부에서는 API 호출 포함 처리
                    scope.log(`Outside transaction - calling cancel API`);
                    const { cancelledAmount, cancelResponseData } =
                        await portOneCancelPayment({
                            payment,
                            statusReason,
                            cancelAmount,
                            percentage:
                                status === PaymentStatus.EXPIRED ||
                                status === PaymentStatus.FAILED
                                    ? floatPercent(1.0)
                                    : percentage,
                        });
                    scope.log(`API call completed`, { cancelledAmount });

                    scope.log(`Updating payment record in DB`);
                    const updatedPayment = await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status,
                            statusReason,
                            ...(status === PaymentStatus.EXPIRED ||
                            status === PaymentStatus.FAILED
                                ? { failedAt: new Date() }
                                : status === PaymentStatus.CANCELLED
                                ? { cancelledAt: new Date() }
                                : status === PaymentStatus.REFUNDED
                                ? { refundedAt: new Date() }
                                : {}),
                            cancelAmount: cancelledAmount,
                            code: cancelResponseData.code ?? undefined,
                            message: cancelResponseData.message ?? undefined,
                            paymentId:
                                cancelResponseData.paymentId ?? undefined,
                            pgCode: cancelResponseData.pgCode ?? undefined,
                            pgMessage:
                                cancelResponseData.pgMessage ?? undefined,
                            transactionType:
                                cancelResponseData.transactionType ?? undefined,
                            txId: cancelResponseData.txId ?? undefined,
                            pgResponse: cancelResponseData,
                        },
                    });
                    scope.log(`Payment record updated`);

                    if (status === PaymentStatus.REFUNDED) {
                        scope.log(`Refund completed successfully`);
                        scope.end({ success: true });
                        return {
                            success: true,
                            data: updatedPayment,
                        };
                    } else {
                        scope.log(`Cancellation/failure status processed`);
                        const responseCode =
                            errorCode ??
                            (status === PaymentStatus.EXPIRED
                                ? "PAYMENT_EXPIRED"
                                : status === PaymentStatus.CANCELLED
                                ? "PAYMENT_CANCELLED"
                                : "PAYMENT_FAILED");
                        scope.end({ success: false, code: responseCode });
                        return {
                            success: false,
                            error: {
                                code: responseCode,
                                message: statusReason,
                            },
                        };
                    }
                }
            } catch (error) {
                const duration = scope.error(
                    error,
                    `Failed to update payment status to ${status}`
                );
                return {
                    success: false,
                    error: {
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Failed to update payment status: ${
                            error instanceof Error
                                ? error.message
                                : "Unknown error"
                        }`,
                        details: isDev
                            ? {
                                  error,
                                  processingTime: duration,
                                  paymentId: payment.id,
                                  status: status,
                              }
                            : undefined,
                    },
                };
            }
        }

        // PAID 상태 처리
        if (status === PaymentStatus.PAID) {
            scope.log(`Processing PAID status update`);
            try {
                scope.log(`Updating payment record to PAID in DB`);
                const updateData: any = {
                    status: PaymentStatus.PAID,
                    statusReason,
                    paidAt: new Date(),
                };

                // pgResponse가 존재하면 추가
                if (pgResponse) {
                    updateData.code = pgResponse.code ?? undefined;
                    updateData.message = pgResponse.message ?? undefined;
                    updateData.paymentId = pgResponse.paymentId ?? undefined;
                    updateData.pgCode = pgResponse.pgCode ?? undefined;
                    updateData.pgMessage = pgResponse.pgMessage ?? undefined;
                    updateData.transactionType =
                        pgResponse.transactionType ?? undefined;
                    updateData.txId = pgResponse.txId ?? undefined;
                    updateData.pgResponse = pgResponse;
                    scope.log(`Adding PG response data to update`);
                }

                const updatedPayment =
                    await importedPrismaClient.payment.update({
                        where: { id: payment.id },
                        data: updateData,
                    });
                scope.log(`Payment record updated to PAID`);

                scope.end({ success: true });
                return {
                    success: true,
                    data: updatedPayment,
                };
            } catch (error) {
                const duration = scope.error(
                    error,
                    `Failed to update payment status to PAID`
                );
                return {
                    success: false,
                    error: {
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Failed to update payment status: ${
                            error instanceof Error
                                ? error.message
                                : "Unknown error"
                        }`,
                        details: isDev
                            ? {
                                  error,
                                  processingTime: duration,
                                  paymentId: payment.id,
                              }
                            : undefined,
                    },
                };
            }
        }

        // 기타 상태
        scope.log(`Unhandled payment status: ${status}`);
        scope.end({ success: false, code: "INVALID_PAYMENT_STATE" });
        return {
            success: false,
            error: {
                code: "INVALID_PAYMENT_STATE",
                message: "Invalid payment state",
            },
        };
    } catch (error) {
        scope.error(error, `Unexpected error in updatePaymentStatus`);
        return {
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: `Unexpected error: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
                details: isDev ? error : undefined,
            },
        };
    }
}

// 결제 검증 함수 수정
export async function verifyPayment(
    input: VerifyPaymentInput
): Promise<VerifyPaymentResponse> {
    const startTime = Date.now();
    logDebug(`Payment verification started for ID: ${input.paymentId}`, input);

    try {
        // 입력값 검증
        if (!input.paymentId || !input.userId) {
            logWarning(`Invalid input for payment verification`, { input });
            return {
                success: false,
                error: {
                    code: "INVALID_INPUT",
                    message: "Required fields are missing",
                },
            };
        }

        // 미리 필요한 데이터를 병렬로 로드
        logDebug(`Fetching payment data for ID: ${input.paymentId}`);
        const payment = await getPayment({
            paymentId: input.paymentId,
        });

        if (!payment) {
            logWarning(`Payment not found: ${input.paymentId}`);
            return {
                success: false,
                error: {
                    code: "PAYMENT_NOT_FOUND",
                    message: "Payment not found",
                },
            };
        }

        logDebug(
            `Payment data retrieved`,
            isDev ? payment : { id: payment.id }
        );

        // 병렬로 검증 진행
        logDebug(`Starting parallel validations for payment: ${payment.id}`);
        const validationStart = Date.now();
        const [isUserAuthorized, isValidStatus] = await Promise.all([
            // 사용자 권한 검증
            payment.userId === input.userId,
            // 결제 상태 검증
            payment.status === PaymentStatus.PENDING,
        ]);
        logDebug(
            `Parallel validations completed in ${
                Date.now() - validationStart
            }ms`,
            {
                isUserAuthorized,
                isValidStatus,
            }
        );

        if (!isUserAuthorized) {
            logWarning(`Unauthorized payment access`, {
                paymentId: payment.id,
                paymentUserId: payment.userId,
                requestUserId: input.userId,
            });
            return await updatePaymentStatus({
                payment,
                status: PaymentStatus.FAILED,
                statusReason: "Unauthorized payment access",
                errorCode: "UNAUTHORIZED",
            });
        }

        if (!isValidStatus) {
            logWarning(`Invalid payment state`, {
                paymentId: payment.id,
                currentStatus: payment.status,
            });
            return await updatePaymentStatus({
                payment,
                status: PaymentStatus.FAILED,
                statusReason: "Invalid payment state",
                errorCode: "INVALID_PAYMENT_STATE",
            });
        }

        try {
            logDebug(`Starting transaction for payment: ${payment.id}`);
            const txStart = Date.now();

            // 트랜잭션 내에서 product 검증 및 금액 검증
            // 결과 타입을 명확하게 정의해 타입 안전성 강화
            interface ValidationSuccess {
                isValid: true;
            }

            interface ValidationError {
                isValid: false;
                code: PaymentErrorCode;
                message: string;
                details?: any;
            }

            type ValidationResult = ValidationSuccess | ValidationError;

            const validationResult =
                await prisma.$transaction<ValidationResult>(
                    async (tx) => {
                        try {
                            logDebug(`Getting product information`, {
                                productTable: payment.productTable,
                                productId: payment.productId,
                            });

                            const {
                                productPrice,
                                defaultCurrency,
                                productName,
                            } = await getProduct({
                                productTable:
                                    payment.productTable as ProductTable,
                                productId: payment.productId,
                                tx,
                            });

                            if (
                                !productPrice ||
                                !defaultCurrency ||
                                !productName
                            ) {
                                logWarning(`Product not found`, {
                                    productTable: payment.productTable,
                                    productId: payment.productId,
                                });
                                return {
                                    isValid: false,
                                    code: "PRODUCT_NOT_FOUND",
                                    message: "Product not found",
                                };
                            }

                            logDebug(`Product info retrieved`, {
                                productName,
                                productPrice,
                                defaultCurrency,
                            });

                            const exchangeRateInfo = {
                                rate: payment.exchangeRate,
                                provider: payment.exchangeRateProvider,
                                createdAt: payment.exchangeRateTimestamp,
                            } as ExchangeRateInfo;

                            logDebug(`Calculating total price`, {
                                productPrice,
                                fromCurrency: defaultCurrency,
                                toCurrency: payment.currency,
                                quantity: payment.quantity,
                                exchangeRate: payment.exchangeRate,
                            });

                            const {
                                convertedPrice,
                                totalAmount,
                                promotionActivated,
                            } = await getTotalPrice({
                                productPrice,
                                fromCurrency: defaultCurrency,
                                toCurrency: payment.currency as Currency,
                                quantity: payment.quantity,
                                promotionCode:
                                    payment.promotionCode ?? undefined,
                                exchangeRateInfo,
                                tx,
                            });

                            logDebug(`Price calculation result`, {
                                convertedPrice,
                                totalAmount,
                                promotionActivated,
                                expectedConvertedPrice: payment.convertedPrice,
                                expectedTotalAmount: payment.amount,
                            });

                            if (
                                convertedPrice !== payment.convertedPrice ||
                                totalAmount !== payment.amount
                            ) {
                                logWarning(`Payment amount mismatch`, {
                                    expected: {
                                        convertedPrice: payment.convertedPrice,
                                        totalAmount: payment.amount,
                                    },
                                    calculated: {
                                        convertedPrice,
                                        totalAmount,
                                    },
                                });
                                return {
                                    isValid: false,
                                    code: "INVALID_AMOUNT",
                                    message:
                                        "Payment amount is different with the server data",
                                };
                            }

                            // 검증 성공
                            logDebug(`Validation successful`);
                            return { isValid: true };
                        } catch (error) {
                            logError(`Transaction validation failed`, error);
                            return {
                                isValid: false,
                                code: "INTERNAL_SERVER_ERROR",
                                message: "Payment validation failed",
                                details: isDev ? error : undefined,
                            };
                        }
                    },
                    {
                        timeout: 10000, // 10초 타임아웃
                        maxWait: 15000, // 최대 대기 시간
                    }
                );

            logDebug(`Transaction completed in ${Date.now() - txStart}ms`);

            // 트랜잭션 검증 결과 확인
            if (!validationResult.isValid) {
                // 검증 실패 처리
                return await updatePaymentStatus({
                    payment,
                    status: PaymentStatus.FAILED,
                    statusReason:
                        validationResult.message ?? "Validation failed",
                    errorCode: validationResult.code,
                });
            }

            // PortOne API 호출로 최종 검증
            return await verifyPaymentWithPortOne(payment, input.paymentId);
        } catch (txError) {
            logError("Transaction execution failed", txError);
            return {
                success: false,
                error: {
                    code: "DATABASE_ERROR",
                    message: "Transaction execution failed",
                    details: isDev ? txError : undefined,
                },
            };
        }
    } catch (error) {
        logError("Payment verification failed", error);
        return {
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Payment verification failed",
                details: isDev ? error : undefined,
            },
        };
    }
}

// 외부 API 검증을 별도 함수로 분리하여 가독성 향상 및 재사용성 증가
async function verifyPaymentWithPortOne(
    payment: Payment,
    paymentId: string
): Promise<VerifyPaymentResponse> {
    try {
        logDebug(`Initiating PortOne API call for payment: ${payment.id}`);
        const apiCallStart = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            logWarning(`PortOne API call timed out after 5000ms`);
        }, 5000); // 5초 타임아웃

        try {
            // PortOne API로 결제 상태 검증 전에, 해당 결제가 이미 취소 또는 실패 메시지를 받았는지 확인
            if (payment.pgResponse) {
                try {
                    // PG 응답 파싱 시도
                    const pgResponse =
                        typeof payment.pgResponse === "string"
                            ? JSON.parse(payment.pgResponse)
                            : payment.pgResponse;

                    // 사용자 취소나 실패 코드 확인
                    if (
                        (pgResponse.code &&
                            (pgResponse.code === "1" ||
                                pgResponse.code !== "0")) ||
                        (pgResponse.message &&
                            (pgResponse.message.includes("취소") ||
                                pgResponse.message.includes("실패") ||
                                pgResponse.message.includes("오류"))) ||
                        (pgResponse.result &&
                            pgResponse.result.AuthResultMsg &&
                            (pgResponse.result.AuthResultMsg.includes("취소") ||
                                pgResponse.result.AuthResultMsg.includes(
                                    "실패"
                                )))
                    ) {
                        logWarning(`Payment was already cancelled or failed`, {
                            paymentId: payment.id,
                            responseCode: pgResponse.code,
                            responseMessage:
                                pgResponse.message ||
                                pgResponse.result?.AuthResultMsg,
                        });

                        return await updatePaymentStatus({
                            payment,
                            status: PaymentStatus.CANCELLED,
                            statusReason:
                                pgResponse.message ||
                                pgResponse.result?.AuthResultMsg ||
                                "User cancelled payment",
                            errorCode: "PAYMENT_CANCELLED",
                        });
                    }
                } catch (parseError) {
                    // 파싱 오류 무시하고 계속 진행 (PG 응답 형식이 예상과 다를 수 있음)
                    logWarning(
                        `Failed to parse PG response, continuing with verification`,
                        {
                            paymentId: payment.id,
                            error: parseError,
                        }
                    );
                }
            }

            const paymentResponse = await fetchWithRetry(
                `https://api.portone.io/payments/${encodeURIComponent(
                    paymentId
                )}`,
                {
                    headers: {
                        Authorization: `PortOne ${process.env.PORTONE_V2_API_SECRET}`,
                        "Content-Type": "application/json",
                    },
                    signal: controller.signal,
                }
            );

            logDebug(
                `PortOne API response received in ${
                    Date.now() - apiCallStart
                }ms: ${paymentResponse.status}`
            );

            if (!paymentResponse.ok) {
                logWarning(`Failed to fetch payment details from PortOne API`, {
                    status: paymentResponse.status,
                    statusText: paymentResponse.statusText,
                });

                // API가 4XX 오류를 반환했는데 결제가 없는 경우 (404)
                if (paymentResponse.status === 404) {
                    logWarning(`Payment not found in PortOne`, {
                        paymentId: payment.id,
                    });

                    // 클라이언트에서 취소된 경우일 수 있음, 취소 처리
                    return await updatePaymentStatus({
                        payment,
                        status: PaymentStatus.CANCELLED,
                        statusReason: "Payment was not found in PortOne API",
                        errorCode: "PAYMENT_CANCELLED",
                    });
                }

                return await updatePaymentStatus({
                    payment,
                    status: PaymentStatus.FAILED,
                    statusReason: "Failed to fetch payment details",
                    errorCode: "PAYMENT_RESPONSE_FAILED",
                });
            }

            const paymentResponseData = await paymentResponse.json();

            if (isDev) {
                logDebug(`PortOne API response data`, paymentResponseData);
            }

            // PortOne API 응답의 status 필드에 따른 처리
            // 참고: https://developers.portone.io/api/rest-v2/type-def#paymentstatus
            switch (paymentResponseData.status) {
                case "VIRTUAL_ACCOUNT_ISSUED":
                    // 가상계좌 발급 완료 (아직 입금 전)
                    return {
                        success: false,
                        error: {
                            code: "PAYMENT_NOT_COMPLETED",
                            message:
                                "Virtual account issued, waiting for deposit",
                        },
                    };

                case "PAID":
                    // 결제 완료 - 검증 성공
                    logInfo(`Payment successfully verified`, {
                        paymentId: payment.id,
                        paidAt: paymentResponseData.paidAt,
                    });

                    // 금액 검증 추가 (10원 이내 오차 허용)
                    const portOneAmount =
                        paymentResponseData.amount?.total ||
                        paymentResponseData.amount;

                    if (Math.abs(payment.amount - portOneAmount) > 10) {
                        logWarning(
                            `Payment amount mismatch between DB and PortOne API`,
                            {
                                dbAmount: payment.amount,
                                pgAmount: portOneAmount,
                            }
                        );
                        const result = await updatePaymentStatus({
                            payment,
                            status: PaymentStatus.FAILED,
                            statusReason: "Payment amount or currency mismatch",
                            errorCode: "INVALID_PAYMENT_AMOUNT",
                        });
                        return result;
                    }

                    // PG 응답 저장
                    logDebug(`PG response received`, paymentResponseData);

                    return await updatePaymentStatus({
                        payment,
                        status: PaymentStatus.PAID,
                        statusReason: "Successfully verified payment",
                        pgResponse: paymentResponseData,
                    });

                case "READY":
                    // 결제 준비 상태 - 아직 결제 진행 중
                    logWarning(`Payment is still in READY state`, {
                        paymentId: payment.id,
                    });
                    return {
                        success: false,
                        error: {
                            code: "PAYMENT_NOT_COMPLETED",
                            message: "Payment is still in preparation",
                        },
                    };

                case "FAILED":
                    // 결제 실패
                    logWarning(`Payment failed according to PortOne`, {
                        paymentId: payment.id,
                        reason:
                            paymentResponseData.failureReason ||
                            "Unknown failure reason",
                    });
                    return await updatePaymentStatus({
                        payment,
                        status: PaymentStatus.FAILED,
                        statusReason:
                            paymentResponseData.failureReason ||
                            "Payment failed",
                        errorCode: "PAYMENT_FAILED",
                        pgResponse: paymentResponseData,
                    });

                case "PAY_PENDING":
                    // 결제 완료 대기 중
                    logWarning(`Payment is in PAY_PENDING state`, {
                        paymentId: payment.id,
                    });
                    return {
                        success: false,
                        error: {
                            code: "PAYMENT_NOT_COMPLETED",
                            message: "Payment is waiting for completion",
                        },
                    };

                case "CANCELLED":
                case "PARTIAL_CANCELLED":
                    // 취소됨 또는 부분 취소됨
                    logWarning(`Payment was cancelled in PortOne`, {
                        paymentId: payment.id,
                        status: paymentResponseData.status,
                    });
                    return await updatePaymentStatus({
                        payment,
                        status: PaymentStatus.CANCELLED,
                        statusReason: "Payment was cancelled",
                        errorCode: "PAYMENT_CANCELLED",
                        pgResponse: paymentResponseData,
                    });

                default:
                    // 기타 상태
                    logWarning(`Payment has unexpected status from PortOne`, {
                        status: paymentResponseData.status,
                        paymentId: payment.id,
                    });

                    return await updatePaymentStatus({
                        payment,
                        status: PaymentStatus.FAILED,
                        statusReason: `Unexpected payment status: ${paymentResponseData.status}`,
                        errorCode: "INVALID_PAYMENT_STATE",
                        pgResponse: paymentResponseData,
                    });
            }
        } finally {
            clearTimeout(timeoutId);
        }
    } catch (error) {
        logError("External payment verification API call failed", error);
        // 외부 API 호출 실패 시에도 결제 실패로 처리
        return await updatePaymentStatus({
            payment,
            status: PaymentStatus.FAILED,
            statusReason: `External API error: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
            errorCode: "PAYMENT_RESPONSE_FAILED",
        });
    }
}

// fetchWithRetry 함수 최적화 및 개선
async function fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    maxRetries = 2,
    retryDelay = 500
): Promise<Response> {
    let retries = 0;
    let lastError: any = null;

    while (retries <= maxRetries) {
        try {
            logDebug(
                `API request attempt ${retries + 1}/${maxRetries + 1}: ${
                    options.method || "GET"
                } ${url}`
            );
            const startTime = Date.now();
            const response = await fetch(url, options);
            const duration = Date.now() - startTime;

            logDebug(
                `API response received in ${duration}ms: ${response.status}`
            );

            // 성공 또는 마지막 재시도면 바로 반환
            if (response.ok || retries >= maxRetries) {
                return response;
            }

            // 4xx 오류는 재시도해도 해결되지 않으므로 바로 반환
            if (response.status >= 400 && response.status < 500) {
                logWarning(
                    `API client error (${response.status}), not retrying`,
                    {
                        url,
                        status: response.status,
                        statusText: response.statusText,
                    }
                );
                return response;
            }

            logWarning(
                `API request failed (${response.status}), will retry (${
                    retries + 1
                }/${maxRetries})`,
                {
                    url,
                    status: response.status,
                    statusText: response.statusText,
                }
            );
        } catch (err) {
            lastError = err;
            logError(
                `API request error on attempt ${retries + 1}/${maxRetries + 1}`,
                err
            );
            if (retries >= maxRetries) {
                throw err;
            }
        }

        // 지수 백오프로 대기 시간 증가
        const waitTime = retryDelay * Math.pow(2, retries);
        logDebug(`Waiting ${waitTime}ms before retry...`);
        retries++;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // 코드가 여기까지 오는 경우는 없어야 하지만, TypeScript를 위한 안전장치
    throw lastError || new Error("Max retries reached");
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
    logDebug(`Initiating payment cancel for ID: ${payment.id}`, {
        statusReason,
        cancelAmount,
        percentage: percentage ? Number(percentage) : undefined,
    });

    try {
        const cancelledAmount =
            cancelAmount && cancelAmount > 0
                ? payment.amount - cancelAmount
                : percentage && percentage > 0
                ? payment.amount * percentage
                : payment.amount;

        logDebug(`Calculated cancelled amount: ${cancelledAmount}`, {
            originalAmount: payment.amount,
            cancellationMethod: cancelAmount
                ? "specificAmount"
                : percentage
                ? "percentage"
                : "fullAmount",
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            logWarning(
                `Cancel API call timed out after 5000ms for payment: ${payment.id}`
            );
        }, 5000); // 5초 타임아웃

        try {
            logDebug(
                `Sending cancel request to PortOne API for payment: ${payment.id}`
            );
            const apiStartTime = Date.now();
            const cancelResponse = await fetchWithRetry(
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
                    signal: controller.signal,
                }
            );

            logDebug(
                `Cancel API response received in ${
                    Date.now() - apiStartTime
                }ms: ${cancelResponse.status}`
            );

            if (!cancelResponse.ok) {
                logWarning(`Failed to cancel payment via PortOne API`, {
                    status: cancelResponse.status,
                    statusText: cancelResponse.statusText,
                });
                throw new Error(
                    `Failed to cancel payment: ${cancelResponse.status} ${cancelResponse.statusText}`
                );
            }

            const cancelResponseData = await cancelResponse.json();

            if (isDev) {
                logDebug(`Cancel API response data`, cancelResponseData);
            }

            logInfo(`Payment cancelled successfully`, {
                paymentId: payment.id,
                cancelledAmount,
            });

            return {
                cancelledAmount,
                cancelResponseData,
            };
        } finally {
            clearTimeout(timeoutId);
        }
    } catch (error) {
        logError("Failed to cancel payment", error);
        throw error;
    }
}

export interface CancelPaymentInput {
    payment: Payment;
    reason?: string;
    cancelAmount?: number;
    percentage?: Percentage;
}

export async function cancelPayment({
    payment,
    reason,
    cancelAmount,
    percentage,
}: CancelPaymentInput): Promise<VerifyPaymentResponse> {
    return await updatePaymentStatus({
        payment,
        status: PaymentStatus.CANCELLED,
        statusReason: reason ?? "Canceled by user",
        cancelAmount,
        percentage,
    });
}

export async function refundPayment({
    payment,
    reason,
    cancelAmount,
    percentage,
}: CancelPaymentInput): Promise<VerifyPaymentResponse> {
    return await updatePaymentStatus({
        payment,
        status: PaymentStatus.REFUNDED,
        statusReason: reason ?? "Refunded by user",
        cancelAmount,
        percentage,
    });
}

export async function getPayment({
    paymentId,
}: {
    paymentId: string;
}): Promise<Payment | null> {
    const scope = createLogScope("getPayment", { paymentId });

    try {
        scope.log(`Querying database for payment ID: ${paymentId}`);
        const result = await prisma.payment.findUnique({
            where: {
                id: paymentId,
            },
        });

        if (result) {
            scope.log(
                `Payment found`,
                isDev ? result : { id: result.id, status: result.status }
            );
        } else {
            scope.log(`Payment not found`);
        }

        scope.end();
        return result;
    } catch (error) {
        scope.error(error, `Failed to retrieve payment`);
        return null;
    }
}

export async function getPaymentsByUserId({
    userId,
}: {
    userId: string;
}): Promise<Payment[]> {
    const scope = createLogScope("getPaymentsByUserId", { userId });

    try {
        scope.log(`Querying database for payments by user ID: ${userId}`);
        const results = await prisma.payment.findMany({
            where: {
                userId,
            },
        });

        scope.log(
            `Found ${results.length} payments for user`,
            isDev
                ? results.map((p) => ({ id: p.id, status: p.status }))
                : undefined
        );

        scope.end();
        return results;
    } catch (error) {
        scope.error(error, `Failed to retrieve payments for user`);
        return [];
    }
}

export async function updatePaymentUserId(
    paymentId: string,
    userId: string
): Promise<Payment | null> {
    const scope = createLogScope("updatePaymentUserId", { paymentId, userId });

    try {
        // First check if the payment exists
        scope.log(`Checking if payment exists`);
        const payment = await prisma.payment.findUnique({
            where: {
                id: paymentId,
            },
        });

        if (!payment) {
            scope.log(`Payment not found`);
            scope.end(null);
            return null;
        }

        scope.log(`Payment found, current state`, {
            currentUserId: payment.userId,
            status: payment.status,
        });

        if (!payment.userId || payment.status === PaymentStatus.PENDING) {
            scope.log(
                `Updating payment user ID from ${
                    payment.userId || "null"
                } to ${userId}`
            );
            const updatedPayment = await prisma.payment.update({
                where: {
                    id: paymentId,
                },
                data: {
                    userId,
                },
            });
            scope.log(`User ID successfully updated`);
            scope.end(updatedPayment);
            return updatedPayment;
        }

        scope.log(`No update needed, returning existing payment`);
        scope.end(payment);
        return payment;
    } catch (error) {
        scope.error(error, `Failed to update payment user ID`);
        return null;
    }
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
                    userId: payment.userId!,
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

type Percentage = number & { __brand: "Percentage" };
function floatPercent(value: number): Percentage {
    if (value < 0 || value > 1) {
        throw new Error("Percentage must be between 0 and 1");
    }
    return value as Percentage;
}
