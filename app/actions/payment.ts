/// app\actions\payment.ts

"use server";

import { PaymentStatus, PaymentPromotionDiscountType } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";
import { PRODUCT_MAP } from "@/lib/types/payment";

import { getExchangeRateInfo, convertAmount } from "./exchangeRate";

import type { ExchangeRateInfo } from "./exchangeRate";
import type {
    PayMethod,
    EasyPayProvider,
    CardProvider,
    ProductTable,
    Currency,
    prismaTransaction,
} from "@/lib/types/payment";
import type { Payment } from "@prisma/client";

// 로깅 유틸리티 함수 추가
const isDev = process.env.NODE_ENV === "development";

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
                    } catch {
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

async function getProduct<T extends ProductTable>({
    productTable,
    productId,
    tx,
}: {
    productTable: T;
    productId: string;
    tx?: prismaTransaction;
}): Promise<{
    productPrice: number | null;
    defaultCurrency: Currency | null;
    productName: string | null;
}> {
    if (!PRODUCT_MAP.product[productTable]) {
        return { productPrice: null, defaultCurrency: null, productName: null };
    }

    // 타입 안전성을 위해 클라이언트를 명시적으로 캐스팅
    const client = (tx || prisma) as typeof prisma;
    const product = (await PRODUCT_MAP.product[productTable]({
        productId,
        tx: client,
    })) as Record<string, any>;

    const productPrice = product[PRODUCT_MAP.amountField[productTable]] as
        | number
        | null;
    const defaultCurrency = PRODUCT_MAP.defaultCurrency[productTable];
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
        const client = tx ?? prisma;
        promotion = await client.paymentPromotion.findUnique({
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

// 중복 결제 체크를 위한 함수 수정
async function checkRecentPayment({
    input,
    cooldownSeconds = 10, // 10초 기본 쿨다운
}: {
    input: CreatePaymentInput;
    cooldownSeconds?: number;
}): Promise<{ isDuplicate: boolean; existingPaymentId?: string }> {
    try {
        // 쿨다운 시간 내 동일 상품에 대한 결제 시도 확인
        const cooldownTime = new Date();
        cooldownTime.setSeconds(cooldownTime.getSeconds() - cooldownSeconds);

        const recentPayment = await prisma.payment.findFirst({
            where: {
                userId: input.userId,
                productTable: input.productTable,
                productId: input.productId,
                productName: input.productName,
                payMethod: input.payMethod,
                quantity: input.quantity,
                currency: input.currency,
                easyPayProvider: input.easyPayProvider,
                cardProvider: input.cardProvider,
                promotionCode: input.promotionCode,
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
            return { isDuplicate: true, existingPaymentId: recentPayment.id };
        }
        return { isDuplicate: false };
    } catch (error) {
        console.error(error);
        return { isDuplicate: false };
    }
}

export interface CreatePaymentInput {
    userId?: string;
    productTable: ProductTable;
    productId: string;
    productName?: string;
    productDefaultCurrency?: Currency;

    needWallet?: boolean;

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
    try {
        // 입력값 검증
        if (
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

        // 중복 결제 체크
        const recentCheck = await checkRecentPayment({
            input,
            cooldownSeconds: 10,
        });

        if (recentCheck.isDuplicate) {
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

        const transaction = await prisma.$transaction(async (tx) => {
            try {
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
                        tx: tx as any,
                    });

                if (
                    productPrice === null ||
                    productPrice === undefined ||
                    !defaultCurrency ||
                    !productName
                ) {
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
                    tx: tx as any,
                });

                const { convertedPrice, totalAmount, promotionActivated } =
                    await getTotalPrice({
                        productPrice,
                        fromCurrency: defaultCurrency,
                        toCurrency: input.currency,
                        quantity: input.quantity,
                        promotionCode: input.promotionCode,
                        exchangeRateInfo,
                        tx: tx as any, // Prisma v6 트랜잭션 타입 호환성을 위한 캐스팅
                    });

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

                    needWallet: input.needWallet ?? false,

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
                return {
                    success: true,
                    data: payment,
                };
            } catch {
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
    receiverWalletAddress?: string;
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
    const importedPrismaClient = tx ?? prisma;

    try {
        // 취소 관련 상태인 경우 외부 API 호출이 필요
        if (
            status === PaymentStatus.EXPIRED ||
            status === PaymentStatus.CANCELLED ||
            status === PaymentStatus.FAILED ||
            status === PaymentStatus.REFUNDED
        ) {
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
                        }

                        const updatedPayment =
                            await importedPrismaClient.payment.update({
                                where: { id: payment.id },
                                data: updateData,
                            });

                        if (status === PaymentStatus.REFUNDED) {
                            return {
                                success: true,
                                data: updatedPayment,
                            };
                        } else {
                            const responseCode =
                                errorCode ??
                                (status === PaymentStatus.EXPIRED
                                    ? "PAYMENT_EXPIRED"
                                    : status === PaymentStatus.CANCELLED
                                    ? "PAYMENT_CANCELLED"
                                    : "PAYMENT_FAILED");
                            return {
                                success: false,
                                error: {
                                    code: responseCode,
                                    message: statusReason,
                                },
                            };
                        }
                    }

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

                    if (status === PaymentStatus.REFUNDED) {
                        return {
                            success: true,
                            data: updatedPayment,
                        };
                    } else {
                        const responseCode =
                            errorCode ??
                            (status === PaymentStatus.EXPIRED
                                ? "PAYMENT_EXPIRED"
                                : status === PaymentStatus.CANCELLED
                                ? "PAYMENT_CANCELLED"
                                : "PAYMENT_FAILED");
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
            try {
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
                }

                const updatedPayment =
                    await importedPrismaClient.payment.update({
                        where: { id: payment.id },
                        data: updateData,
                    });

                return {
                    success: true,
                    data: updatedPayment,
                };
            } catch (error) {
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
                                  paymentId: payment.id,
                              }
                            : undefined,
                    },
                };
            }
        }

        // 기타 상태
        return {
            success: false,
            error: {
                code: "INVALID_PAYMENT_STATE",
                message: "Invalid payment state",
            },
        };
    } catch (error) {
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

        // payment가 null이 아님이 확인되었으므로 이후 로직에서 안전하게 사용 가능
        let currentPayment = payment; // 변경 가능한 payment 참조 생성

        const [isUserAuthorized, isValidStatus] = await Promise.all([
            // 사용자 권한 검증
            payment.userId === input.userId,
            // 결제 상태 검증
            payment.status === PaymentStatus.PENDING,
        ]);

        if (!isUserAuthorized) {
            return await updatePaymentStatus({
                payment,
                status: PaymentStatus.FAILED,
                statusReason: "Unauthorized payment access",
                errorCode: "UNAUTHORIZED",
            });
        }

        if (!isValidStatus) {
            return await updatePaymentStatus({
                payment,
                status: PaymentStatus.FAILED,
                statusReason: "Invalid payment state",
                errorCode: "INVALID_PAYMENT_STATE",
            });
        }

        try {
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
                            if (currentPayment.needWallet) {
                                if (!input.receiverWalletAddress) {
                                    return {
                                        isValid: false,
                                        code: "INVALID_INPUT",
                                        message:
                                            "Receiver wallet address is missing",
                                    };
                                }

                                // 지갑 주소 업데이트
                                const updatedPayment = await tx.payment.update({
                                    where: { id: currentPayment.id },
                                    data: {
                                        receiverWalletAddress:
                                            input.receiverWalletAddress,
                                    },
                                });

                                currentPayment = updatedPayment;
                            }

                            const {
                                productPrice,
                                defaultCurrency,
                                productName,
                            } = await getProduct({
                                productTable:
                                    currentPayment.productTable as ProductTable,
                                productId: currentPayment.productId,
                                tx: tx as any, // Prisma v6 트랜잭션 타입 호환성을 위한 캐스팅
                            });

                            if (
                                productPrice === null ||
                                productPrice === undefined ||
                                !defaultCurrency ||
                                !productName
                            ) {
                                logWarning(`Product not found`, {
                                    productTable: currentPayment.productTable,
                                    productId: currentPayment.productId,
                                });
                                return {
                                    isValid: false,
                                    code: "PRODUCT_NOT_FOUND",
                                    message: "Product not found",
                                };
                            }

                            const exchangeRateInfo = {
                                rate: currentPayment.exchangeRate,
                                provider: currentPayment.exchangeRateProvider,
                                createdAt: currentPayment.exchangeRateTimestamp,
                            } as ExchangeRateInfo;

                            const { convertedPrice, totalAmount } =
                                await getTotalPrice({
                                    productPrice,
                                    fromCurrency: defaultCurrency,
                                    toCurrency:
                                        currentPayment.currency as Currency,
                                    quantity: currentPayment.quantity,
                                    promotionCode:
                                        currentPayment.promotionCode ??
                                        undefined,
                                    exchangeRateInfo,
                                    tx: tx as any,
                                });

                            if (
                                convertedPrice !==
                                    currentPayment.convertedPrice ||
                                totalAmount !== currentPayment.amount
                            ) {
                                return {
                                    isValid: false,
                                    code: "INVALID_AMOUNT",
                                    message:
                                        "Payment amount is different with the server data",
                                };
                            }

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
            return await verifyPaymentWithPortOne(
                currentPayment,
                input.paymentId
            );
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
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
                    console.error(parseError);
                }
            }

            let paymentResponse: Response;
            if (payment.amount === 0) {
                paymentResponse = {
                    status: 200,
                    ok: true,
                    json: async () => ({
                        status: "PAID",
                        paidAt: new Date().toISOString(),
                        amount: {
                            total: 0,
                        },
                    }),
                } as Response;
            } else {
                paymentResponse = await fetchWithRetry(
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
            }

            if (!paymentResponse.ok) {
                logWarning(`Failed to fetch payment details from PortOne API`, {
                    status: paymentResponse.status,
                    statusText: paymentResponse.statusText,
                });

                // API가 4XX 오류를 반환했는데 결제가 없는 경우 (404)
                if (paymentResponse.status === 404) {
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

                    return await updatePaymentStatus({
                        payment,
                        status: PaymentStatus.PAID,
                        statusReason: "Successfully verified payment",
                        pgResponse: paymentResponseData,
                    });

                case "READY":
                    return {
                        success: false,
                        error: {
                            code: "PAYMENT_NOT_COMPLETED",
                            message: "Payment is still in preparation",
                        },
                    };

                case "FAILED":
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
                    return {
                        success: false,
                        error: {
                            code: "PAYMENT_NOT_COMPLETED",
                            message: "Payment is waiting for completion",
                        },
                    };

                case "CANCELLED":
                case "PARTIAL_CANCELLED":
                    return await updatePaymentStatus({
                        payment,
                        status: PaymentStatus.CANCELLED,
                        statusReason: "Payment was cancelled",
                        errorCode: "PAYMENT_CANCELLED",
                        pgResponse: paymentResponseData,
                    });

                default:
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
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 2,
    retryDelay = 500
): Promise<Response> {
    let retries = 0;
    let lastError: any = null;

    while (retries <= maxRetries) {
        try {
            const response = await fetch(url, options);

            // 성공 또는 마지막 재시도면 바로 반환
            if (response.ok || retries >= maxRetries) {
                return response;
            }

            // 4xx 오류는 재시도해도 해결되지 않으므로 바로 반환
            if (response.status >= 400 && response.status < 500) {
                return response;
            }
        } catch (err) {
            lastError = err;
            if (retries >= maxRetries) {
                console.error(err);
                throw err;
            }
        }

        // 지수 백오프로 대기 시간 증가
        const waitTime = retryDelay * Math.pow(2, retries);
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
    try {
        const cancelledAmount =
            cancelAmount && cancelAmount > 0
                ? payment.amount - cancelAmount
                : percentage && percentage > 0
                ? payment.amount * percentage
                : payment.amount;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 5000); // 5초 타임아웃

        try {
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

            if (!cancelResponse.ok) {
                throw new Error(
                    `Failed to cancel payment: ${cancelResponse.status} ${cancelResponse.statusText}`
                );
            }

            const cancelResponseData = await cancelResponse.json();

            return {
                cancelledAmount,
                cancelResponseData,
            };
        } finally {
            clearTimeout(timeoutId);
        }
    } catch (error) {
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
    try {
        const result = await prisma.payment.findUnique({
            where: {
                id: paymentId,
            },
        });

        return result;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function getPaymentsByUserId({
    userId,
}: {
    userId: string;
}): Promise<Payment[]> {
    try {
        const results = await prisma.payment.findMany({
            where: {
                userId,
            },
        });

        return results;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function updatePaymentUserId(
    paymentId: string,
    userId: string
): Promise<Payment | null> {
    try {
        const payment = await prisma.payment.findUnique({
            where: {
                id: paymentId,
            },
        });

        if (!payment) {
            return null;
        }

        if (!payment.userId || payment.status === PaymentStatus.PENDING) {
            const updatedPayment = await prisma.payment.update({
                where: {
                    id: paymentId,
                },
                data: {
                    userId,
                },
            });
            return updatedPayment;
        }

        return payment;
    } catch (error) {
        console.error(error);
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
                console.error(`Unhandled webhook type: ${body.type}`);
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
