/// app\actions\paymentPostProcessor.ts

"use server";

import { Payment } from "@prisma/client";
import { ProductTable } from "@/lib/types/payment";
import { revalidatePath } from "next/cache";
import { transferNFTToUser } from "./nftTransfer";
import { prisma } from "@/lib/prisma/client";

export interface PaymentPostProcessorSuccess {
    success: true;
    data: any;
}

export interface PaymentPostProcessorError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
    };
}

export type PaymentPostProcessorResult =
    | PaymentPostProcessorSuccess
    | PaymentPostProcessorError;

export const paymentPostProcessor = async (
    payment: Payment
): Promise<PaymentPostProcessorResult> => {
    return processDistributor(payment);
};

export const processDistributor = async (
    payment: Payment
): Promise<PaymentPostProcessorResult> => {
    const table = payment.productTable as ProductTable;

    switch (table) {
        case "nfts": {
            const result = await processNFTs(payment);
            return result;
        }
        case "events": {
            const result = await processEvents(payment);
            return result;
        }
        default:
            return {
                success: false,
                error: {
                    code: "INVALID_PRODUCT_TABLE",
                    message: "Invalid product table",
                },
            };
    }
};

export async function processNFTs(
    payment: Payment
): Promise<PaymentPostProcessorResult> {
    const status = payment.status;

    switch (status) {
        case "PAID":
            try {
                // NFT 전송 실행
                const result = await transferNFTToUser({
                    paymentId: payment.id,
                    userId: payment.userId!,
                });

                if (!result.success) {
                    // 전송 실패 시 로깅 및 에러 처리
                    console.error("NFT transfer failed", {
                        paymentId: payment.id,
                        error: result.error,
                    });

                    // 결제 상태 업데이트 (실패)
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: "FAILED",
                            statusReason: result.error.message,
                        },
                    });

                    return {
                        success: false,
                        error: result.error,
                    };
                }

                // 결과 DB 업데이트
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: "COMPLETED",
                        completedAt: new Date(),
                        postProcessResult: result.data,
                        postProcessResultAt: new Date(),
                    },
                });

                // 캐시 무효화
                revalidatePath(`/payments/${payment.id}`);

                return {
                    success: true,
                    data: result.data,
                };
            } catch (error) {
                console.error("Unexpected error during NFT processing", {
                    paymentId: payment.id,
                    error,
                });

                return {
                    success: false,
                    error: {
                        code: "PROCESSING_FAILED",
                        message: "Failed to process NFT payment",
                        details:
                            error instanceof Error
                                ? error.message
                                : "Unknown error",
                    },
                };
            }
            break;
        case "FAILED": {
            return {
                success: false,
                error: {
                    code: "PROCESSING_FAILED",
                    message: "Failed to process NFT payment",
                },
            };
        }
        case "CANCELLED": {
            return {
                success: false,
                error: {
                    code: "PROCESSING_CANCELLED",
                    message: "Payment cancelled",
                },
            };
        }
        case "REFUNDED": {
            return {
                success: true,
                data: {
                    status: "REFUNDED",
                    refundedAt: new Date(),
                },
            };
        }
        default: {
            return {
                success: false,
                error: {
                    code: "INVALID_PAYMENT_STATUS",
                    message: "Invalid payment status",
                },
            };
        }
    }
}

export async function processEvents(
    payment: Payment
): Promise<PaymentPostProcessorResult> {
    const status = payment.status;

    switch (status) {
        case "PAID": {
            return {
                success: true,
                data: {
                    status: "PAID",
                    paidAt: new Date(),
                },
            };
        }
        case "FAILED": {
            return {
                success: false,
                error: {
                    code: "PROCESSING_FAILED",
                    message: "Failed to process event payment",
                },
            };
        }
        case "CANCELLED": {
            return {
                success: false,
                error: {
                    code: "PROCESSING_CANCELLED",
                    message: "Payment cancelled",
                },
            };
        }
        case "REFUNDED": {
            return {
                success: true,
                data: {
                    status: "REFUNDED",
                    refundedAt: new Date(),
                },
            };
        }
        default: {
            return {
                success: false,
                error: {
                    code: "INVALID_PAYMENT_STATUS",
                    message: "Invalid payment status",
                },
            };
        }
    }
}
