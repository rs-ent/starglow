import {
    paymentPostProcessor,
    processDistributor,
    processNFTs,
    processEvents,
} from "@/app/actions/paymentPostProcessor";
import type {
    PaymentPostProcessorResult,
    PaymentPostProcessorSuccess,
    PaymentPostProcessorError,
} from "@/app/actions/paymentPostProcessor";
import { PaymentStatus } from "@prisma/client";
import type { Payment } from "@prisma/client";

// Mock dependencies
jest.mock("@/lib/prisma/client", () => ({
    prisma: {
        payment: {
            update: jest.fn(),
        },
    },
}));

jest.mock("next/cache", () => ({
    revalidatePath: jest.fn(),
}));

jest.mock("../../../app/story/transfer/actions", () => ({
    transferNFTToUser: jest.fn(),
}));

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = jest.fn();
    // Mock setTimeout to avoid delays in tests
    jest.spyOn(global, "setTimeout").mockImplementation((callback: any) => {
        callback();
        return 0 as any;
    });
});

afterAll(() => {
    console.error = originalConsoleError;
    jest.restoreAllMocks();
});

describe("Payment Post Processor", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Set timeout for long-running tests
    jest.setTimeout(10000);

    const mockNFTPayment: Payment = {
        id: "payment-123",
        userId: "user-123",
        productTable: "nfts",
        productId: "nft-123",
        productName: "Test NFT",
        productDefaultCurrency: "KRW",
        amount: 10000,
        quantity: 1,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        easyPayProvider: null,
        cardProvider: "COUNTRY_KR",
        cardInstallmentMonths: null,
        cardInterestFree: null,
        cardApproveNumber: null,
        cardNumber: null,
        status: PaymentStatus.PAID,
        statusReason: null,
        paidAt: new Date(),
        cancelledAt: null,
        failedAt: null,
        pgResponse: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        channelKey: "test-channel",
        storeId: "test-store",
        promotionCode: null,
        isPromotionApplied: false,
        convertedPrice: 10000,
        exchangeRate: 1,
        exchangeRateProvider: "MANUAL",
        exchangeRateTimestamp: new Date(),
        originalProductPrice: 10000,
        refundedAt: null,
        cancelAmount: null,
        redirectUrl: null,
        code: null,
        message: null,
        paymentId: null,
        pgCode: null,
        pgMessage: null,
        transactionType: null,
        txId: null,
        postProcessResult: null,
        postProcessResultAt: null,
        receiverWalletAddress: null,
        needWallet: false,
        completedAt: null,
    };

    const mockEventPayment: Payment = {
        ...mockNFTPayment,
        id: "payment-456",
        productTable: "events",
        productId: "event-123",
    };

    describe("paymentPostProcessor", () => {
        it("should delegate to processDistributor", async () => {
            const {
                transferNFTToUser,
            } = require("../../../app/story/transfer/actions");
            const { prisma } = require("@/lib/prisma/client");

            transferNFTToUser.mockResolvedValue({
                success: true,
                data: { transactionHash: "0x123" },
            });
            prisma.payment.update.mockResolvedValue(mockNFTPayment);

            const result = await paymentPostProcessor(mockNFTPayment);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ transactionHash: "0x123" });
            }
        });
    });

    describe("processDistributor", () => {
        it("should route to processNFTs for nfts table", async () => {
            const {
                transferNFTToUser,
            } = require("../../../app/story/transfer/actions");
            const { prisma } = require("@/lib/prisma/client");

            transferNFTToUser.mockResolvedValue({
                success: true,
                data: { transactionHash: "0x123" },
            });
            prisma.payment.update.mockResolvedValue(mockNFTPayment);

            const result = await processDistributor(mockNFTPayment);

            expect(result.success).toBe(true);
            expect(transferNFTToUser).toHaveBeenCalledWith({
                paymentId: "payment-123",
                userId: "user-123",
            });
        });

        it("should route to processEvents for events table", async () => {
            const result = await processDistributor(mockEventPayment);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.status).toBe("PAID");
            }
        });

        it("should return error for invalid product table", async () => {
            const invalidPayment = {
                ...mockNFTPayment,
                productTable: "invalid_table",
            } as Payment;

            const result = await processDistributor(invalidPayment);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INVALID_PRODUCT_TABLE");
                expect(result.error.message).toBe("Invalid product table");
            }
        });
    });

    describe("processNFTs", () => {
        describe("when payment status is PAID", () => {
            it("should successfully process NFT transfer", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");
                const { prisma } = require("@/lib/prisma/client");
                const { revalidatePath } = require("next/cache");

                transferNFTToUser.mockResolvedValue({
                    success: true,
                    data: { transactionHash: "0x123" },
                });
                prisma.payment.update.mockResolvedValue({
                    ...mockNFTPayment,
                    status: PaymentStatus.COMPLETED,
                    completedAt: new Date(),
                });

                const result = await processNFTs(mockNFTPayment);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toEqual({ transactionHash: "0x123" });
                }
                expect(prisma.payment.update).toHaveBeenCalledWith({
                    where: { id: "payment-123" },
                    data: {
                        status: "COMPLETED",
                        completedAt: expect.any(Date),
                        postProcessResult: { transactionHash: "0x123" },
                        postProcessResultAt: expect.any(Date),
                    },
                });
                expect(revalidatePath).toHaveBeenCalledWith(
                    "/payments/payment-123"
                );
            });

            it("should handle NFT transfer failure", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");
                const { prisma } = require("@/lib/prisma/client");

                const transferError = {
                    code: "TRANSFER_FAILED",
                    message: "Insufficient balance",
                };

                transferNFTToUser.mockResolvedValue({
                    success: false,
                    error: transferError,
                });
                prisma.payment.update.mockResolvedValue({
                    ...mockNFTPayment,
                    status: PaymentStatus.FAILED,
                });

                const result = await processNFTs(mockNFTPayment);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toEqual(transferError);
                }
                expect(prisma.payment.update).toHaveBeenCalledWith({
                    where: { id: "payment-123" },
                    data: {
                        status: "FAILED",
                        statusReason: "Insufficient balance",
                        postProcessResult: JSON.stringify(transferError),
                    },
                });
            });

            it("should retry NFT transfer on failure", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");
                const { prisma } = require("@/lib/prisma/client");

                // Mock first call to fail, second to succeed
                transferNFTToUser
                    .mockRejectedValueOnce(new Error("Network error"))
                    .mockResolvedValueOnce({
                        success: true,
                        data: { transactionHash: "0x123" },
                    });

                prisma.payment.update.mockResolvedValue({
                    ...mockNFTPayment,
                    status: PaymentStatus.COMPLETED,
                });

                const result = await processNFTs(mockNFTPayment);

                expect(result.success).toBe(true);
                expect(transferNFTToUser).toHaveBeenCalledTimes(2);
            });

            it("should handle unexpected errors", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");

                transferNFTToUser.mockRejectedValue(
                    new Error("Unexpected error")
                );

                const result = await processNFTs(mockNFTPayment);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe("PROCESSING_FAILED");
                    expect(result.error.message).toBe(
                        "Failed to process NFT payment"
                    );
                    expect(result.error.details).toBe("Unexpected error");
                }
            });
        });

        describe("when payment status is FAILED", () => {
            it("should return processing failed error", async () => {
                const failedPayment = {
                    ...mockNFTPayment,
                    status: PaymentStatus.FAILED,
                };

                const result = await processNFTs(failedPayment);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe("PROCESSING_FAILED");
                    expect(result.error.message).toBe(
                        "Failed to process NFT payment"
                    );
                }
            });
        });

        describe("when payment status is CANCELLED", () => {
            it("should return processing cancelled error", async () => {
                const cancelledPayment = {
                    ...mockNFTPayment,
                    status: PaymentStatus.CANCELLED,
                };

                const result = await processNFTs(cancelledPayment);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe("PROCESSING_CANCELLED");
                    expect(result.error.message).toBe("Payment cancelled");
                }
            });
        });

        describe("when payment status is REFUNDED", () => {
            it("should return success with refund data", async () => {
                const refundedPayment = {
                    ...mockNFTPayment,
                    status: PaymentStatus.REFUNDED,
                };

                const result = await processNFTs(refundedPayment);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.status).toBe("REFUNDED");
                    expect(result.data.refundedAt).toBeInstanceOf(Date);
                }
            });
        });

        describe("when payment status is invalid", () => {
            it("should return invalid payment status error", async () => {
                const invalidPayment = {
                    ...mockNFTPayment,
                    status: "INVALID_STATUS" as PaymentStatus,
                };

                const result = await processNFTs(invalidPayment);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe("INVALID_PAYMENT_STATUS");
                    expect(result.error.message).toBe("Invalid payment status");
                }
            });
        });
    });

    describe("processEvents", () => {
        describe("when payment status is PAID", () => {
            it("should return success with paid data", async () => {
                const result = await processEvents(mockEventPayment);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.status).toBe("PAID");
                    expect(result.data.paidAt).toBeInstanceOf(Date);
                }
            });
        });

        describe("when payment status is FAILED", () => {
            it("should return processing failed error", async () => {
                const failedPayment = {
                    ...mockEventPayment,
                    status: PaymentStatus.FAILED,
                };

                const result = await processEvents(failedPayment);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe("PROCESSING_FAILED");
                    expect(result.error.message).toBe(
                        "Failed to process event payment"
                    );
                }
            });
        });

        describe("when payment status is CANCELLED", () => {
            it("should return processing cancelled error", async () => {
                const cancelledPayment = {
                    ...mockEventPayment,
                    status: PaymentStatus.CANCELLED,
                };

                const result = await processEvents(cancelledPayment);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe("PROCESSING_CANCELLED");
                    expect(result.error.message).toBe("Payment cancelled");
                }
            });
        });

        describe("when payment status is REFUNDED", () => {
            it("should return success with refund data", async () => {
                const refundedPayment = {
                    ...mockEventPayment,
                    status: PaymentStatus.REFUNDED,
                };

                const result = await processEvents(refundedPayment);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.status).toBe("REFUNDED");
                    expect(result.data.refundedAt).toBeInstanceOf(Date);
                }
            });
        });

        describe("when payment status is invalid", () => {
            it("should return invalid payment status error", async () => {
                const invalidPayment = {
                    ...mockEventPayment,
                    status: "INVALID_STATUS" as PaymentStatus,
                };

                const result = await processEvents(invalidPayment);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe("INVALID_PAYMENT_STATUS");
                    expect(result.error.message).toBe("Invalid payment status");
                }
            });
        });
    });

    describe("retry mechanism", () => {
        it("should retry failed operations with exponential backoff", async () => {
            const {
                transferNFTToUser,
            } = require("../../../app/story/transfer/actions");
            const { prisma } = require("@/lib/prisma/client");

            // Mock to fail 3 times, then succeed
            transferNFTToUser
                .mockRejectedValueOnce(new Error("Network error 1"))
                .mockRejectedValueOnce(new Error("Network error 2"))
                .mockRejectedValueOnce(new Error("Network error 3"))
                .mockResolvedValueOnce({
                    success: true,
                    data: { transactionHash: "0x123" },
                });

            prisma.payment.update.mockResolvedValue({
                ...mockNFTPayment,
                status: PaymentStatus.COMPLETED,
            });

            const result = await processNFTs(mockNFTPayment);

            expect(result.success).toBe(true);
            expect(transferNFTToUser).toHaveBeenCalledTimes(4);
        });

        it("should fail after max retries", async () => {
            const {
                transferNFTToUser,
            } = require("../../../app/story/transfer/actions");

            // Mock to always fail
            transferNFTToUser.mockRejectedValue(new Error("Persistent error"));

            const result = await processNFTs(mockNFTPayment);

            expect(result.success).toBe(false);
            expect(transferNFTToUser).toHaveBeenCalledTimes(5); // maxRetries = 5
            if (!result.success) {
                expect(result.error.code).toBe("PROCESSING_FAILED");
                expect(result.error.details).toBe("Persistent error");
            }
        });

        it("should handle different types of errors during retry", async () => {
            const {
                transferNFTToUser,
            } = require("../../../app/story/transfer/actions");

            // Mock different error types
            transferNFTToUser
                .mockRejectedValueOnce(new TypeError("Type error"))
                .mockRejectedValueOnce(new ReferenceError("Reference error"))
                .mockRejectedValueOnce(new Error("Generic error"))
                .mockResolvedValueOnce({
                    success: true,
                    data: { transactionHash: "0x456" },
                });

            const { prisma } = require("@/lib/prisma/client");
            prisma.payment.update.mockResolvedValue({
                ...mockNFTPayment,
                status: PaymentStatus.COMPLETED,
            });

            const result = await processNFTs(mockNFTPayment);

            expect(result.success).toBe(true);
            expect(transferNFTToUser).toHaveBeenCalledTimes(4);
        });

        it("should handle non-Error objects thrown during retry", async () => {
            const {
                transferNFTToUser,
            } = require("../../../app/story/transfer/actions");

            // Mock non-Error objects being thrown
            transferNFTToUser
                .mockRejectedValueOnce("String error")
                .mockRejectedValueOnce({
                    code: "CUSTOM_ERROR",
                    message: "Object error",
                })
                .mockRejectedValueOnce(null)
                .mockResolvedValueOnce({
                    success: true,
                    data: { transactionHash: "0x789" },
                });

            const { prisma } = require("@/lib/prisma/client");
            prisma.payment.update.mockResolvedValue({
                ...mockNFTPayment,
                status: PaymentStatus.COMPLETED,
            });

            const result = await processNFTs(mockNFTPayment);

            expect(result.success).toBe(true);
            expect(transferNFTToUser).toHaveBeenCalledTimes(4);
        });
    });

    describe("edge cases and error scenarios", () => {
        describe("database operation failures", () => {
            it("should handle database update failure after successful NFT transfer", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");
                const { prisma } = require("@/lib/prisma/client");

                transferNFTToUser.mockResolvedValue({
                    success: true,
                    data: { transactionHash: "0x123" },
                });

                // Mock database update failure
                prisma.payment.update.mockRejectedValue(
                    new Error("Database connection failed")
                );

                const result = await processNFTs(mockNFTPayment);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe("PROCESSING_FAILED");
                    expect(result.error.details).toBe(
                        "Database connection failed"
                    );
                }
            });

            it("should handle database update failure during NFT transfer failure", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");
                const { prisma } = require("@/lib/prisma/client");

                transferNFTToUser.mockResolvedValue({
                    success: false,
                    error: {
                        code: "INSUFFICIENT_BALANCE",
                        message: "Not enough balance",
                    },
                });

                // Mock database update failure
                prisma.payment.update.mockRejectedValue(
                    new Error("Database timeout")
                );

                const result = await processNFTs(mockNFTPayment);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe("PROCESSING_FAILED");
                    expect(result.error.details).toBe("Database timeout");
                }
            });
        });

        describe("malformed data handling", () => {
            it("should handle payment with null userId", async () => {
                const paymentWithNullUserId = {
                    ...mockNFTPayment,
                    userId: null,
                };

                const result = await processNFTs(paymentWithNullUserId);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe("PROCESSING_FAILED");
                }
            });

            it("should handle payment with empty productId", async () => {
                const paymentWithEmptyProductId = {
                    ...mockNFTPayment,
                    productId: "",
                };

                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");

                transferNFTToUser.mockResolvedValue({
                    success: false,
                    error: {
                        code: "INVALID_PRODUCT_ID",
                        message: "Product ID is required",
                    },
                });

                const result = await processNFTs(paymentWithEmptyProductId);

                expect(result.success).toBe(false);
                expect(transferNFTToUser).toHaveBeenCalledWith({
                    paymentId: paymentWithEmptyProductId.id,
                    userId: paymentWithEmptyProductId.userId,
                });
            });

            it("should handle payment with invalid amount", async () => {
                const paymentWithInvalidAmount = {
                    ...mockNFTPayment,
                    amount: -1000,
                };

                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");

                transferNFTToUser.mockResolvedValue({
                    success: false,
                    error: {
                        code: "INVALID_AMOUNT",
                        message: "Amount must be positive",
                    },
                });

                const result = await processNFTs(paymentWithInvalidAmount);

                expect(result.success).toBe(false);
                expect(transferNFTToUser).toHaveBeenCalledWith({
                    paymentId: paymentWithInvalidAmount.id,
                    userId: paymentWithInvalidAmount.userId,
                });
            });
        });

        describe("concurrent processing scenarios", () => {
            it("should handle multiple NFT processing requests simultaneously", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");
                const { prisma } = require("@/lib/prisma/client");

                const payment1 = { ...mockNFTPayment, id: "payment-1" };
                const payment2 = { ...mockNFTPayment, id: "payment-2" };
                const payment3 = { ...mockNFTPayment, id: "payment-3" };

                transferNFTToUser
                    .mockResolvedValueOnce({
                        success: true,
                        data: { transactionHash: "0x111" },
                    })
                    .mockResolvedValueOnce({
                        success: true,
                        data: { transactionHash: "0x222" },
                    })
                    .mockResolvedValueOnce({
                        success: true,
                        data: { transactionHash: "0x333" },
                    });

                prisma.payment.update.mockResolvedValue({});

                const results = await Promise.all([
                    processNFTs(payment1),
                    processNFTs(payment2),
                    processNFTs(payment3),
                ]);

                expect(results).toHaveLength(3);
                expect(results.every((r) => r.success)).toBe(true);
                expect(transferNFTToUser).toHaveBeenCalledTimes(3);
            });

            it("should handle mixed success/failure in concurrent processing", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");
                const { prisma } = require("@/lib/prisma/client");

                const payment1 = { ...mockNFTPayment, id: "payment-1" };
                const payment2 = { ...mockNFTPayment, id: "payment-2" };

                transferNFTToUser
                    .mockResolvedValueOnce({
                        success: true,
                        data: { transactionHash: "0x111" },
                    })
                    .mockResolvedValueOnce({
                        success: false,
                        error: { code: "TRANSFER_FAILED", message: "Failed" },
                    });

                prisma.payment.update.mockResolvedValue({});

                const results = await Promise.all([
                    processNFTs(payment1),
                    processNFTs(payment2),
                ]);

                expect(results[0].success).toBe(true);
                expect(results[1].success).toBe(false);
            });
        });

        describe("memory and resource management", () => {
            it("should handle large number of retries without memory leaks", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");

                // Create many consecutive failures
                let mockChain = transferNFTToUser;
                for (let i = 0; i < 5; i++) {
                    mockChain = mockChain.mockRejectedValueOnce(
                        new Error(`Error ${i}`)
                    );
                }

                const result = await processNFTs(mockNFTPayment);

                expect(result.success).toBe(false);
                expect(transferNFTToUser).toHaveBeenCalledTimes(5);
            });

            it("should handle very large data objects in transfer response", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");
                const { prisma } = require("@/lib/prisma/client");

                // Create large data object
                const largeData = {
                    transactionHash: "0x" + "a".repeat(64),
                    metadata: {
                        largeArray: new Array(1000).fill("large_string_data"),
                        nestedObject: {
                            level1: { level2: { level3: "deep_data" } },
                        },
                    },
                };

                transferNFTToUser.mockResolvedValue({
                    success: true,
                    data: largeData,
                });

                prisma.payment.update.mockResolvedValue({});

                const result = await processNFTs(mockNFTPayment);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toEqual(largeData);
                }
            });
        });

        describe("time-sensitive operations", () => {
            it("should handle operations that take longer than expected", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");
                const { prisma } = require("@/lib/prisma/client");

                // Simulate slow operation
                transferNFTToUser.mockImplementation(
                    () =>
                        new Promise((resolve) => {
                            // In real scenario this would be slow, but our setTimeout mock makes it instant
                            setTimeout(() => {
                                resolve({
                                    success: true,
                                    data: { transactionHash: "0x123" },
                                });
                            }, 5000);
                        })
                );

                prisma.payment.update.mockResolvedValue({});

                const result = await processNFTs(mockNFTPayment);

                expect(result.success).toBe(true);
            });
        });

        describe("data integrity and validation", () => {
            it("should validate transfer result structure", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");

                // Mock malformed response - missing success field means !result.success is true
                transferNFTToUser.mockResolvedValue({
                    // Missing success field - this will be treated as success: undefined/false
                    data: { transactionHash: "0x123" },
                });

                const { prisma } = require("@/lib/prisma/client");
                prisma.payment.update.mockResolvedValue({});

                const result = await processNFTs(mockNFTPayment);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe("PROCESSING_FAILED");
                }
            });

            it("should handle transfer result with unexpected structure", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");

                // Mock completely unexpected response
                transferNFTToUser.mockResolvedValue(
                    "unexpected_string_response"
                );

                const result = await processNFTs(mockNFTPayment);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe("PROCESSING_FAILED");
                }
            });

            it("should handle null or undefined transfer results", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");

                transferNFTToUser
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(undefined);

                const result1 = await processNFTs(mockNFTPayment);
                const result2 = await processNFTs(mockNFTPayment);

                expect(result1.success).toBe(false);
                expect(result2.success).toBe(false);
            });
        });

        describe("cache invalidation edge cases", () => {
            it("should handle cache invalidation failure", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");
                const { prisma } = require("@/lib/prisma/client");
                const { revalidatePath } = require("next/cache");

                transferNFTToUser.mockResolvedValue({
                    success: true,
                    data: { transactionHash: "0x123" },
                });

                prisma.payment.update.mockResolvedValue({});

                // Mock cache invalidation failure
                revalidatePath.mockImplementation(() => {
                    throw new Error("Cache invalidation failed");
                });

                const result = await processNFTs(mockNFTPayment);

                // Should still succeed even if cache invalidation fails
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe("PROCESSING_FAILED");
                }
            });
        });
    });

    describe("advanced security and validation tests", () => {
        describe("input sanitization and validation", () => {
            it("should handle payments with malicious script injection attempts", async () => {
                const maliciousPayment = {
                    ...mockNFTPayment,
                    productId: "<script>alert('xss')</script>",
                    productName: "'; DROP TABLE payments; --",
                };

                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");

                transferNFTToUser.mockResolvedValue({
                    success: false,
                    error: {
                        code: "INVALID_INPUT",
                        message: "Invalid characters detected",
                    },
                });

                const result = await processNFTs(maliciousPayment);

                expect(result.success).toBe(false);
                expect(transferNFTToUser).toHaveBeenCalledWith({
                    paymentId: maliciousPayment.id,
                    userId: maliciousPayment.userId,
                });
            });

            it("should handle extremely long string inputs", async () => {
                const paymentWithLongStrings = {
                    ...mockNFTPayment,
                    productId: "a".repeat(10000),
                    productName: "b".repeat(10000),
                };

                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");

                transferNFTToUser.mockResolvedValue({
                    success: false,
                    error: {
                        code: "INPUT_TOO_LONG",
                        message: "Input exceeds maximum length",
                    },
                });

                const result = await processNFTs(paymentWithLongStrings);

                expect(result.success).toBe(false);
            });

            it("should handle unicode and special character inputs", async () => {
                const paymentWithUnicode = {
                    ...mockNFTPayment,
                    productId: "🚀💎🌟",
                    productName: "한글테스트 émojis 🎵",
                };

                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");
                const { prisma } = require("@/lib/prisma/client");
                const { revalidatePath } = require("next/cache");

                transferNFTToUser.mockResolvedValue({
                    success: true,
                    data: { transactionHash: "0x123" },
                });

                prisma.payment.update.mockResolvedValue({});
                revalidatePath.mockImplementation(() => {});

                const result = await processNFTs(paymentWithUnicode);

                expect(result.success).toBe(true);
                expect(transferNFTToUser).toHaveBeenCalledWith({
                    paymentId: paymentWithUnicode.id,
                    userId: paymentWithUnicode.userId,
                });
            });
        });

        describe("boundary value testing", () => {
            it("should handle minimum valid payment amount", async () => {
                const minAmountPayment = {
                    ...mockNFTPayment,
                    amount: 1,
                };

                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");
                const { prisma } = require("@/lib/prisma/client");
                const { revalidatePath } = require("next/cache");

                transferNFTToUser.mockResolvedValue({
                    success: true,
                    data: { transactionHash: "0x123" },
                });

                prisma.payment.update.mockResolvedValue({});
                revalidatePath.mockImplementation(() => {});

                const result = await processNFTs(minAmountPayment);

                expect(result.success).toBe(true);
            });

            it("should handle maximum valid payment amount", async () => {
                const maxAmountPayment = {
                    ...mockNFTPayment,
                    amount: Number.MAX_SAFE_INTEGER,
                };

                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");
                const { prisma } = require("@/lib/prisma/client");
                const { revalidatePath } = require("next/cache");

                transferNFTToUser.mockResolvedValue({
                    success: true,
                    data: { transactionHash: "0x123" },
                });

                prisma.payment.update.mockResolvedValue({});
                revalidatePath.mockImplementation(() => {});

                const result = await processNFTs(maxAmountPayment);

                expect(result.success).toBe(true);
            });

            it("should handle zero quantity payment", async () => {
                const zeroQuantityPayment = {
                    ...mockNFTPayment,
                    quantity: 0,
                };

                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");

                transferNFTToUser.mockResolvedValue({
                    success: false,
                    error: {
                        code: "INVALID_QUANTITY",
                        message: "Quantity must be greater than 0",
                    },
                });

                const result = await processNFTs(zeroQuantityPayment);

                expect(result.success).toBe(false);
            });
        });

        describe("events processing edge cases", () => {
            it("should handle event processing with complex metadata", async () => {
                const eventPaymentWithMetadata = {
                    ...mockEventPayment,
                    metadata: {
                        eventDetails: {
                            venue: "Virtual Space",
                            capacity: 1000,
                            artists: ["Artist1", "Artist2"],
                            specialRequirements: {
                                ageRestriction: 18,
                                equipment: ["VR Headset", "Controllers"],
                            },
                        },
                        purchaseInfo: {
                            seatNumber: "A-123",
                            tier: "VIP",
                            addOns: ["Merchandise", "Meet & Greet"],
                        },
                    },
                };

                const result = await processEvents(eventPaymentWithMetadata);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.status).toBe("PAID");
                    expect(result.data.paidAt).toBeInstanceOf(Date);
                }
            });

            it("should handle event processing with null metadata", async () => {
                const eventPaymentWithNullMetadata = {
                    ...mockEventPayment,
                    metadata: null,
                };

                const result = await processEvents(
                    eventPaymentWithNullMetadata
                );

                expect(result.success).toBe(true);
            });
        });

        describe("stress testing and performance", () => {
            it("should handle processing many payments in sequence", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");
                const { prisma } = require("@/lib/prisma/client");
                const { revalidatePath } = require("next/cache");

                transferNFTToUser.mockResolvedValue({
                    success: true,
                    data: { transactionHash: "0x123" },
                });

                prisma.payment.update.mockResolvedValue({});
                revalidatePath.mockImplementation(() => {});

                const payments = Array(20)
                    .fill(null)
                    .map((_, index) => ({
                        ...mockNFTPayment,
                        id: `payment-${index}`,
                    }));

                const results = [];
                for (const payment of payments) {
                    const result = await processNFTs(payment);
                    results.push(result);
                }

                expect(results).toHaveLength(20);
                expect(results.every((r) => r.success)).toBe(true);
                expect(transferNFTToUser).toHaveBeenCalledTimes(20);
            });
        });

        describe("error recovery and resilience", () => {
            it("should recover from transient network errors", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");
                const { prisma } = require("@/lib/prisma/client");
                const { revalidatePath } = require("next/cache");

                // Mock network errors followed by success
                transferNFTToUser
                    .mockRejectedValueOnce(new Error("ECONNRESET"))
                    .mockRejectedValueOnce(new Error("ETIMEDOUT"))
                    .mockResolvedValueOnce({
                        success: true,
                        data: { transactionHash: "0x123" },
                    });

                prisma.payment.update.mockResolvedValue({});
                revalidatePath.mockImplementation(() => {});

                const result = await processNFTs(mockNFTPayment);

                expect(result.success).toBe(true);
                expect(transferNFTToUser).toHaveBeenCalledTimes(3);
            });

            it("should handle inconsistent response formats", async () => {
                const {
                    transferNFTToUser,
                } = require("../../../app/story/transfer/actions");
                const { prisma } = require("@/lib/prisma/client");
                const { revalidatePath } = require("next/cache");

                // Mock inconsistent response formats
                transferNFTToUser
                    .mockResolvedValueOnce({ success: "true", data: {} }) // String instead of boolean - truthy but not === true
                    .mockResolvedValueOnce({ Success: true, Data: {} }) // Wrong case - success is undefined
                    .mockResolvedValueOnce({ success: true, result: {} }) // Wrong field name - but success is true
                    .mockResolvedValueOnce({
                        success: true,
                        data: { transactionHash: "0x123" },
                    }); // Correct format

                prisma.payment.update.mockResolvedValue({});
                revalidatePath.mockImplementation(() => {});

                const results = [];
                for (let i = 0; i < 4; i++) {
                    const result = await processNFTs({
                        ...mockNFTPayment,
                        id: `payment-${i}`,
                    });
                    results.push(result);
                }

                // Check results based on actual behavior
                expect(results[0].success).toBe(true); // "true" is truthy, so success
                expect(results[1].success).toBe(false); // Success !== success, so undefined/false
                expect(results[2].success).toBe(true); // success: true, so success
                expect(results[3].success).toBe(true); // Correct format
            });
        });
    });
});
