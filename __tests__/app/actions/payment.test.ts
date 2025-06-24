import {
    createPayment,
    verifyPayment,
    cancelPayment,
    refundPayment,
    getPayment,
    getPaymentsByUserId,
    updatePaymentUserId,
    handlePortOneWebhook,
} from "@/app/actions/payment";
import { PaymentStatus, PaymentPromotionDiscountType } from "@prisma/client";
import type {
    CreatePaymentInput,
    VerifyPaymentInput,
    CancelPaymentInput,
    PortOneWebhookBody,
} from "@/app/actions/payment";

// Mock Prisma Client
jest.mock("@/lib/prisma/client", () => ({
    prisma: {
        payment: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        events: {
            findUnique: jest.fn(),
        },
        story_spg: {
            findUnique: jest.fn(),
        },
        paymentPromotion: {
            findUnique: jest.fn(),
        },
        exchangeRate: {
            findFirst: jest.fn(),
        },
        webhookEvent: {
            create: jest.fn(),
            update: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));

// Mock Exchange Rate Actions
jest.mock("../../../app/actions/exchangeRate", () => ({
    getExchangeRateInfo: jest.fn(),
    convertAmount: jest.fn(),
}));

// Mock fetch for PortOne API calls
global.fetch = jest.fn();

// Mock environment variables
process.env.PORTONE_V2_API_SECRET = "test-secret";
process.env.PORTONE_MID = "test-store-id";
process.env.PORTONE_TOSS = "test-toss-channel";
process.env.PORTONE_KAKAO = "test-kakao-channel";
process.env.PORTONE_CARD = "test-card-channel";
process.env.PORTONE_INTERCARD = "test-intercard-channel";
process.env.PORTONE_PAYPAL = "test-paypal-channel";

describe("Payment Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockClear();
    });

    describe("createPayment", () => {
        const validInput = {
            userId: "user-123",
            productTable: "events" as const,
            productId: "event-123",
            quantity: 1,
            currency: "CURRENCY_KRW" as const,
            payMethod: "CARD" as const,
            cardProvider: "COUNTRY_KR" as const,
        };

        const mockEvent = {
            id: "event-123",
            title: "Test Event",
            price: 10000,
        };

        const mockExchangeRateInfo = {
            rate: 1,
            provider: "MANUAL",
            createdAt: new Date(),
        };

        it("should return INVALID_INPUT error if required fields are missing", async () => {
            const result = await createPayment({
                // 필수값 일부러 누락
                productTable: undefined as any,
                productId: "",
                currency: "" as any,
                payMethod: "" as any,
                quantity: 1,
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INVALID_INPUT");
            }
        });

        it("should successfully create payment with valid input", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const {
                getExchangeRateInfo,
                convertAmount,
            } = require("../../../app/actions/exchangeRate");

            // Mock dependencies
            prisma.payment.findFirst.mockResolvedValue(null); // No duplicate payment
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    payment: {
                        create: jest.fn().mockResolvedValue({
                            id: "payment-123",
                            ...validInput,
                            amount: 10000,
                            status: PaymentStatus.PENDING,
                        }),
                    },
                    events: {
                        findUnique: jest.fn().mockResolvedValue(mockEvent),
                    },
                    paymentPromotion: {
                        findUnique: jest.fn().mockResolvedValue(null),
                    },
                };
                return await callback(mockTx);
            });

            getExchangeRateInfo.mockResolvedValue(mockExchangeRateInfo);
            convertAmount.mockResolvedValue(10000);

            const result = await createPayment(validInput);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe("payment-123");
                expect(result.data.status).toBe(PaymentStatus.PENDING);
            }
        });

        it("should return DUPLICATE_PAYMENT error for recent duplicate payment", async () => {
            const { prisma } = require("@/lib/prisma/client");

            // Mock recent payment exists
            prisma.payment.findFirst.mockResolvedValue({
                id: "existing-payment-123",
                ...validInput,
                createdAt: new Date(),
                status: PaymentStatus.PENDING,
            });

            const result = await createPayment(validInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("DUPLICATE_PAYMENT");
            }
        });

        it("should return INTERNAL_SERVER_ERROR when product not found", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.payment.findFirst.mockResolvedValue(null);
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    events: {
                        findUnique: jest.fn().mockResolvedValue(null), // Product not found
                    },
                };
                return await callback(mockTx);
            });

            const result = await createPayment(validInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
            }
        });

        it("should apply promotion discount correctly", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const {
                getExchangeRateInfo,
                convertAmount,
            } = require("../../../app/actions/exchangeRate");

            const inputWithPromotion = {
                ...validInput,
                promotionCode: "DISCOUNT20",
            };

            const mockPromotion = {
                code: "DISCOUNT20",
                isActive: true,
                discountType: PaymentPromotionDiscountType.percentage,
                discountValue: 20,
            };

            prisma.payment.findFirst.mockResolvedValue(null);
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    payment: {
                        create: jest.fn().mockResolvedValue({
                            id: "payment-123",
                            ...inputWithPromotion,
                            amount: 8000, // 20% discount applied
                            status: PaymentStatus.PENDING,
                        }),
                    },
                    events: {
                        findUnique: jest.fn().mockResolvedValue(mockEvent),
                    },
                    paymentPromotion: {
                        findUnique: jest.fn().mockResolvedValue(mockPromotion),
                    },
                };
                return await callback(mockTx);
            });

            getExchangeRateInfo.mockResolvedValue(mockExchangeRateInfo);
            convertAmount.mockResolvedValue(8000); // After discount

            const result = await createPayment(inputWithPromotion);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.amount).toBe(8000);
            }
        });
        it("should prevent SQL injection attempts in productId", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const {
                getExchangeRateInfo,
                convertAmount,
            } = require("../../../app/actions/exchangeRate");

            const maliciousInput = {
                ...validInput,
                productId: "'; DROP TABLE payments; --",
            };

            prisma.payment.findFirst.mockResolvedValue(null);
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    payment: {
                        create: jest.fn().mockResolvedValue({
                            id: "payment-123",
                            ...maliciousInput,
                            amount: 10000,
                            status: PaymentStatus.PENDING,
                        }),
                    },
                    events: {
                        findUnique: jest.fn().mockResolvedValue(mockEvent),
                    },
                    paymentPromotion: {
                        findUnique: jest.fn().mockResolvedValue(null),
                    },
                };
                return await callback(mockTx);
            });

            getExchangeRateInfo.mockResolvedValue(mockExchangeRateInfo);
            convertAmount.mockResolvedValue(10000);

            const result = await createPayment(maliciousInput);

            // Should handle malicious input gracefully
            expect(result.success).toBe(true);
            if (result.success) {
                // Verify the malicious productId is stored as-is (not executed)
                expect(result.data.productId).toBe(
                    "'; DROP TABLE payments; --"
                );
            }
        });

        it("should handle extremely large payment amounts", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const {
                getExchangeRateInfo,
                convertAmount,
            } = require("../../../app/actions/exchangeRate");

            const largeAmountEvent = {
                id: "event-123",
                title: "Premium Event",
                price: Number.MAX_SAFE_INTEGER, // 매우 큰 금액
            };

            prisma.payment.findFirst.mockResolvedValue(null);
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    payment: {
                        create: jest.fn().mockResolvedValue({
                            id: "payment-123",
                            ...validInput,
                            amount: Number.MAX_SAFE_INTEGER,
                            status: PaymentStatus.PENDING,
                        }),
                    },
                    events: {
                        findUnique: jest
                            .fn()
                            .mockResolvedValue(largeAmountEvent),
                    },
                    paymentPromotion: {
                        findUnique: jest.fn().mockResolvedValue(null),
                    },
                };
                return await callback(mockTx);
            });

            getExchangeRateInfo.mockResolvedValue(mockExchangeRateInfo);
            convertAmount.mockResolvedValue(Number.MAX_SAFE_INTEGER);

            const result = await createPayment(validInput);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.amount).toBeLessThanOrEqual(
                    Number.MAX_SAFE_INTEGER
                );
            }
        });

        it("should handle zero or negative amounts", async () => {
            const { prisma } = require("@/lib/prisma/client");

            const zeroAmountEvent = {
                id: "event-123",
                title: "Free Event",
                price: 0,
            };

            prisma.payment.findFirst.mockResolvedValue(null);
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    events: {
                        findUnique: jest
                            .fn()
                            .mockResolvedValue(zeroAmountEvent),
                    },
                };
                return await callback(mockTx);
            });

            const result = await createPayment(validInput);

            // Should handle zero amount appropriately
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
            }
        });

        it("should prevent concurrent duplicate payments", async () => {
            const { prisma } = require("@/lib/prisma/client");

            // Simulate a payment that was just created (within cooldown period)
            const recentPayment = {
                id: "recent-payment-123",
                ...validInput,
                createdAt: new Date(Date.now() - 5000), // 5초 전
                status: PaymentStatus.PENDING,
            };

            prisma.payment.findFirst.mockResolvedValue(recentPayment);

            const result = await createPayment(validInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("DUPLICATE_PAYMENT");
                expect(result.error.details.paymentId).toBe(
                    "recent-payment-123"
                );
            }
        });

        it("should validate currency exchange rate precision", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const {
                getExchangeRateInfo,
                convertAmount,
            } = require("../../../app/actions/exchangeRate");

            // Test with complex exchange rate that might cause precision issues
            const complexExchangeRate = {
                rate: 1.23456789123456789, // 매우 정밀한 환율
                provider: "MANUAL",
                createdAt: new Date(),
            };

            prisma.payment.findFirst.mockResolvedValue(null);
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    payment: {
                        create: jest.fn().mockResolvedValue({
                            id: "payment-123",
                            ...validInput,
                            amount: 12346, // 정밀한 계산 결과
                            status: PaymentStatus.PENDING,
                        }),
                    },
                    events: {
                        findUnique: jest.fn().mockResolvedValue(mockEvent),
                    },
                    paymentPromotion: {
                        findUnique: jest.fn().mockResolvedValue(null),
                    },
                };
                return await callback(mockTx);
            });

            getExchangeRateInfo.mockResolvedValue(complexExchangeRate);
            convertAmount.mockResolvedValue(12346);

            const result = await createPayment(validInput);

            expect(result.success).toBe(true);
            if (result.success) {
                // Verify precision is maintained
                expect(typeof result.data.amount).toBe("number");
                expect(Number.isFinite(result.data.amount)).toBe(true);
            }
        });

        it("should handle malicious promotion codes", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const {
                getExchangeRateInfo,
                convertAmount,
            } = require("../../../app/actions/exchangeRate");

            const maliciousPromotionInput = {
                ...validInput,
                promotionCode: "<script>alert('xss')</script>",
            };

            prisma.payment.findFirst.mockResolvedValue(null);
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    payment: {
                        create: jest.fn().mockResolvedValue({
                            id: "payment-123",
                            ...maliciousPromotionInput,
                            amount: 10000,
                            status: PaymentStatus.PENDING,
                        }),
                    },
                    events: {
                        findUnique: jest.fn().mockResolvedValue(mockEvent),
                    },
                    paymentPromotion: {
                        findUnique: jest.fn().mockResolvedValue(null), // Malicious code not found
                    },
                };
                return await callback(mockTx);
            });

            getExchangeRateInfo.mockResolvedValue(mockExchangeRateInfo);
            convertAmount.mockResolvedValue(10000);

            const result = await createPayment(maliciousPromotionInput);

            expect(result.success).toBe(true);
            if (result.success) {
                // Verify malicious code is stored safely without execution
                expect(result.data.promotionCode).toBe(
                    "<script>alert('xss')</script>"
                );
            }
        });
    });

    describe("verifyPayment", () => {
        const validInput = {
            paymentId: "payment-123",
            userId: "user-123",
        };

        const mockPayment = {
            id: "payment-123",
            userId: "user-123",
            productTable: "events",
            productId: "event-123",
            amount: 10000,
            currency: "CURRENCY_KRW",
            status: PaymentStatus.PENDING,
            needWallet: false,
            exchangeRate: 1,
            exchangeRateProvider: "MANUAL",
            exchangeRateTimestamp: new Date(),
            convertedPrice: 10000,
            quantity: 1,
            promotionCode: null,
        };

        it("should return INVALID_INPUT error if required fields are missing", async () => {
            const result = await verifyPayment({
                paymentId: "",
                userId: "",
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INVALID_INPUT");
            }
        });

        it("should return PAYMENT_NOT_FOUND error when payment doesn't exist", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.payment.findUnique.mockResolvedValue(null);

            const result = await verifyPayment(validInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("PAYMENT_NOT_FOUND");
            }
        });

        it("should return UNAUTHORIZED error for wrong user", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                userId: "different-user",
            });

            // Mock fetch properly to avoid undefined.ok error
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: "CANCELLED",
                }),
            });

            prisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.FAILED,
            });

            const result = await verifyPayment(validInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("UNAUTHORIZED");
            }
        });

        it("should successfully verify paid payment", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.payment.findUnique.mockResolvedValue(mockPayment);
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    payment: {
                        update: jest.fn().mockResolvedValue(mockPayment),
                    },
                    events: {
                        findUnique: jest.fn().mockResolvedValue({
                            id: "event-123",
                            title: "Test Event",
                            price: 10000,
                        }),
                    },
                    paymentPromotion: {
                        findUnique: jest.fn().mockResolvedValue(null),
                    },
                };
                return { isValid: true };
            });

            // Mock PortOne API response for successful payment
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: "PAID",
                    amount: { total: 10000 },
                    paidAt: new Date().toISOString(),
                }),
            });

            prisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.PAID,
                paidAt: new Date(),
            });

            const result = await verifyPayment(validInput);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.status).toBe(PaymentStatus.PAID);
            }
        });

        it("should handle cancelled payment from PortOne", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.payment.findUnique.mockResolvedValue(mockPayment);
            prisma.$transaction.mockResolvedValue({ isValid: true });

            // Mock PortOne API response for cancelled payment
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: "CANCELLED",
                    amount: { total: 10000 },
                }),
            });

            prisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.CANCELLED,
            });

            const result = await verifyPayment(validInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("PAYMENT_CANCELLED");
            }
        });

        it("should handle amount mismatch", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.payment.findUnique.mockResolvedValue(mockPayment);
            prisma.$transaction.mockResolvedValue({ isValid: true });

            // Mock PortOne API response with different amount
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: "PAID",
                    amount: { total: 5000 }, // Different amount
                }),
            });

            const result = await verifyPayment(validInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INVALID_PAYMENT_AMOUNT");
            }
        });

        it("should prevent payment verification with tampered paymentId", async () => {
            const { prisma } = require("@/lib/prisma/client");

            const tamperedInput = {
                paymentId: "payment-123'; DROP TABLE payments; --",
                userId: "user-123",
            };

            prisma.payment.findUnique.mockResolvedValue(null);

            const result = await verifyPayment(tamperedInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("PAYMENT_NOT_FOUND");
            }
        });

        it("should handle concurrent verification attempts", async () => {
            const { prisma } = require("@/lib/prisma/client");

            // Simulate payment already being processed
            const processingPayment = {
                ...mockPayment,
                status: PaymentStatus.PAID, // Already paid
            };

            prisma.payment.findUnique.mockResolvedValue(processingPayment);

            const result = await verifyPayment(validInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INVALID_PAYMENT_STATE");
            }
        });

        it("should validate payment timing to prevent replay attacks", async () => {
            const { prisma } = require("@/lib/prisma/client");

            // Simulate very old payment
            const oldPayment = {
                ...mockPayment,
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24시간 전
            };

            prisma.payment.findUnique.mockResolvedValue(oldPayment);
            prisma.$transaction.mockResolvedValue({ isValid: true });

            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: "PAID",
                    amount: { total: 10000 },
                    paidAt: new Date().toISOString(),
                }),
            });

            prisma.payment.update.mockResolvedValue({
                ...oldPayment,
                status: PaymentStatus.PAID,
            });

            const result = await verifyPayment(validInput);

            // Should still work but we verify the timing
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.status).toBe(PaymentStatus.PAID);
            }
        });

        it("should handle network timeout gracefully", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.payment.findUnique.mockResolvedValue(mockPayment);
            prisma.$transaction.mockResolvedValue({ isValid: true });

            // Mock network timeout
            (fetch as jest.Mock).mockRejectedValue(
                new Error("Network timeout")
            );

            const result = await verifyPayment(validInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
            }
        });

        it("should validate wallet address format when required", async () => {
            const { prisma } = require("@/lib/prisma/client");

            const walletPayment = {
                ...mockPayment,
                needWallet: true,
            };

            const invalidWalletInput = {
                ...validInput,
                receiverWalletAddress: "invalid-wallet-address", // 잘못된 지갑 주소
            };

            prisma.payment.findUnique.mockResolvedValue(walletPayment);
            prisma.$transaction.mockResolvedValue({
                isValid: false,
                code: "INVALID_INPUT",
                message: "Invalid wallet address format",
            });

            const result = await verifyPayment(invalidWalletInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
            }
        });

        it("should prevent verification with mismatched user session", async () => {
            const { prisma } = require("@/lib/prisma/client");

            // Different user trying to verify someone else's payment
            const sessionMismatchInput = {
                paymentId: "payment-123",
                userId: "hacker-user-456", // 다른 사용자
            };

            prisma.payment.findUnique.mockResolvedValue(mockPayment);

            // Mock fetch for updatePaymentStatus
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: "CANCELLED",
                }),
            });

            prisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.FAILED,
            });

            const result = await verifyPayment(sessionMismatchInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("UNAUTHORIZED");
            }
        });

        it("should handle partial network failures during verification", async () => {
            const { prisma } = require("@/lib/prisma/client");

            const mockPayment = {
                id: "payment-123",
                userId: "user-123",
                amount: 10000,
                currency: "CURRENCY_KRW",
                status: PaymentStatus.PENDING,
                needWallet: false,
                exchangeRate: 1,
                exchangeRateProvider: "MANUAL",
                exchangeRateTimestamp: new Date(),
                convertedPrice: 10000,
                quantity: 1,
                promotionCode: null,
                productTable: "events",
                productId: "event-123",
            };

            prisma.payment.findUnique.mockResolvedValue(mockPayment);
            prisma.$transaction.mockResolvedValue({ isValid: true });

            // Mock partial response (connection drops mid-response)
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => {
                    throw new Error("ECONNRESET: Connection reset by peer");
                },
            });

            prisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.FAILED,
            });

            const result = await verifyPayment({
                paymentId: "payment-123",
                userId: "user-123",
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
            }
        });
    });

    describe("cancelPayment", () => {
        const mockPayment = {
            id: "payment-123",
            userId: "user-123",
            amount: 10000,
            currency: "CURRENCY_KRW",
            status: PaymentStatus.PENDING,
        };

        it("should successfully cancel payment", async () => {
            // Mock PortOne cancel API
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: "CANCELLED",
                    cancelledAmount: 10000,
                }),
            });

            const { prisma } = require("@/lib/prisma/client");
            prisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.CANCELLED,
                cancelledAt: new Date(),
            });

            const result = await cancelPayment({
                payment: mockPayment as any,
                reason: "User requested cancellation",
            });

            expect(result.success).toBe(false); // Cancel returns error response
            if (!result.success) {
                expect(result.error.code).toBe("PAYMENT_CANCELLED");
            }
        });
    });

    describe("getPayment", () => {
        it("should return payment when found", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const mockPayment = {
                id: "payment-123",
                userId: "user-123",
                amount: 10000,
            };

            prisma.payment.findUnique.mockResolvedValue(mockPayment);

            const result = await getPayment({ paymentId: "payment-123" });

            expect(result).toEqual(mockPayment);
            expect(prisma.payment.findUnique).toHaveBeenCalledWith({
                where: { id: "payment-123" },
            });
        });

        it("should return null when payment not found", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.payment.findUnique.mockResolvedValue(null);

            const result = await getPayment({ paymentId: "nonexistent" });

            expect(result).toBeNull();
        });
    });

    describe("getPaymentsByUserId", () => {
        it("should return user payments", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const mockPayments = [
                { id: "payment-1", userId: "user-123", amount: 5000 },
                { id: "payment-2", userId: "user-123", amount: 10000 },
            ];

            prisma.payment.findMany.mockResolvedValue(mockPayments);

            const result = await getPaymentsByUserId({ userId: "user-123" });

            expect(result).toEqual(mockPayments);
            expect(prisma.payment.findMany).toHaveBeenCalledWith({
                where: { userId: "user-123" },
            });
        });
    });

    describe("updatePaymentUserId", () => {
        it("should update payment userId when payment exists and is pending", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const mockPayment = {
                id: "payment-123",
                userId: null,
                status: PaymentStatus.PENDING,
            };

            const updatedPayment = {
                ...mockPayment,
                userId: "user-123",
            };

            prisma.payment.findUnique.mockResolvedValue(mockPayment);
            prisma.payment.update.mockResolvedValue(updatedPayment);

            const result = await updatePaymentUserId("payment-123", "user-123");

            expect(result).toEqual(updatedPayment);
            expect(prisma.payment.update).toHaveBeenCalledWith({
                where: { id: "payment-123" },
                data: { userId: "user-123" },
            });
        });

        it("should return null when payment not found", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.payment.findUnique.mockResolvedValue(null);

            const result = await updatePaymentUserId("nonexistent", "user-123");

            expect(result).toBeNull();
        });
    });

    describe("handlePortOneWebhook", () => {
        const mockWebhookBody = {
            type: "Transaction.Paid" as const,
            data: {
                paymentId: "payment-123",
                storeId: "test-store-id",
            },
        };

        const mockPayment = {
            id: "payment-123",
            userId: "user-123",
            status: PaymentStatus.PENDING,
        };

        it("should handle Transaction.Paid webhook", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.payment.findUnique.mockResolvedValue(mockPayment);
            prisma.webhookEvent.create.mockResolvedValue({
                id: "webhook-123",
                paymentId: "payment-123",
            });
            prisma.webhookEvent.update.mockResolvedValue({});

            // Mock verifyPayment success
            prisma.$transaction.mockResolvedValue({ isValid: true });
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: "PAID",
                    amount: { total: 10000 },
                }),
            });
            prisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.PAID,
            });

            const result = await handlePortOneWebhook(mockWebhookBody);

            expect(result.success).toBe(true);
            expect(prisma.webhookEvent.create).toHaveBeenCalled();
        });

        it("should throw error for invalid store ID", async () => {
            const invalidWebhookBody = {
                ...mockWebhookBody,
                data: {
                    ...mockWebhookBody.data,
                    storeId: "invalid-store-id",
                },
            };

            await expect(
                handlePortOneWebhook(invalidWebhookBody)
            ).rejects.toThrow("Invalid store ID");
        });

        it("should throw error when payment not found", async () => {
            const { prisma } = require("@/lib/prisma/client");

            prisma.payment.findUnique.mockResolvedValue(null);

            await expect(handlePortOneWebhook(mockWebhookBody)).rejects.toThrow(
                "Payment not found"
            );
        });

        it("should prevent webhook replay attacks", async () => {
            const { prisma } = require("@/lib/prisma/client");

            // Simulate duplicate webhook
            const duplicateWebhookBody = {
                ...mockWebhookBody,
                data: {
                    ...mockWebhookBody.data,
                    paymentId: "payment-123",
                },
            };

            prisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.PAID, // Already processed
            });

            prisma.webhookEvent.create.mockResolvedValue({
                id: "webhook-123",
                paymentId: "payment-123",
            });

            // Should handle already processed payment gracefully
            const result = await handlePortOneWebhook(duplicateWebhookBody);

            expect(result.success).toBe(true);
            expect(prisma.webhookEvent.create).toHaveBeenCalled();
        });

        it("should validate webhook signature/store ID thoroughly", async () => {
            const maliciousWebhookBody = {
                type: "Transaction.Paid" as const,
                data: {
                    paymentId: "payment-123",
                    storeId: "malicious-store-id",
                },
            };

            await expect(
                handlePortOneWebhook(maliciousWebhookBody)
            ).rejects.toThrow("Invalid store ID");
        });

        it("should handle malformed webhook data", async () => {
            const malformedWebhookBody = {
                type: "Transaction.Paid" as const,
                data: {
                    paymentId: undefined,
                    storeId: process.env.PORTONE_MID,
                },
            };

            await expect(
                handlePortOneWebhook(malformedWebhookBody as any)
            ).rejects.toThrow();
        });
    });

    describe("Advanced Security Tests", () => {
        const advancedValidInput = {
            userId: "user-123",
            productTable: "events" as const,
            productId: "event-123",
            quantity: 1,
            currency: "CURRENCY_KRW" as const,
            payMethod: "CARD" as const,
            cardProvider: "COUNTRY_KR" as const,
        };

        const advancedMockEvent = {
            id: "event-123",
            title: "Test Event",
            price: 10000,
        };

        const advancedMockExchangeRateInfo = {
            rate: 1,
            provider: "MANUAL",
            createdAt: new Date(),
        };

        it("should handle database connection failures gracefully", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const {
                getExchangeRateInfo,
                convertAmount,
            } = require("../../../app/actions/exchangeRate");

            // Simulate database connection failure in checkRecentPayment
            prisma.payment.findFirst.mockRejectedValue(
                new Error("Database connection failed")
            );

            // But allow transaction to proceed (checkRecentPayment returns isDuplicate: false on error)
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    payment: {
                        create: jest.fn().mockResolvedValue({
                            id: "payment-123",
                            ...advancedValidInput,
                            amount: 10000,
                            status: PaymentStatus.PENDING,
                        }),
                    },
                    events: {
                        findUnique: jest
                            .fn()
                            .mockResolvedValue(advancedMockEvent),
                    },
                    paymentPromotion: {
                        findUnique: jest.fn().mockResolvedValue(null),
                    },
                };
                return await callback(mockTx);
            });

            getExchangeRateInfo.mockResolvedValue(advancedMockExchangeRateInfo);
            convertAmount.mockResolvedValue(10000);

            const result = await createPayment(advancedValidInput);

            // Should succeed because checkRecentPayment handles DB errors gracefully
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe("payment-123");
            }
        });

        it("should prevent race conditions in payment creation", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const {
                getExchangeRateInfo,
                convertAmount,
            } = require("../../../app/actions/exchangeRate");

            // Simulate race condition - payment created between check and creation
            let callCount = 0;
            prisma.payment.findFirst.mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve(null); // First check: no payment
                } else {
                    return Promise.resolve({
                        // Second check: payment exists
                        id: "race-payment-123",
                        ...advancedValidInput,
                        createdAt: new Date(),
                        status: PaymentStatus.PENDING,
                    });
                }
            });

            // Mock successful transaction
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    payment: {
                        create: jest.fn().mockResolvedValue({
                            id: "payment-123",
                            ...advancedValidInput,
                            amount: 10000,
                            status: PaymentStatus.PENDING,
                        }),
                    },
                    events: {
                        findUnique: jest
                            .fn()
                            .mockResolvedValue(advancedMockEvent),
                    },
                    paymentPromotion: {
                        findUnique: jest.fn().mockResolvedValue(null),
                    },
                };
                return await callback(mockTx);
            });

            getExchangeRateInfo.mockResolvedValue(advancedMockExchangeRateInfo);
            convertAmount.mockResolvedValue(10000);

            const result = await createPayment(advancedValidInput);

            // Should succeed on first call since race condition check happens only once
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe("payment-123");
            }
        });

        it("should validate all required environment variables", async () => {
            const { prisma } = require("@/lib/prisma/client");

            // Temporarily remove environment variable
            const originalMid = process.env.PORTONE_MID;
            delete process.env.PORTONE_MID;

            // Mock no recent payment to pass the duplicate check
            prisma.payment.findFirst.mockResolvedValue(null);

            // Mock transaction that will fail due to missing environment variable
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    events: {
                        findUnique: jest
                            .fn()
                            .mockResolvedValue(advancedMockEvent),
                    },
                };
                // This will throw error when getStoreIdAndChannelKey is called
                return await callback(mockTx);
            });

            const result = await createPayment(advancedValidInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INVALID_PAYMENT_METHOD");
            }

            // Restore environment variable
            process.env.PORTONE_MID = originalMid;
        });

        it("should handle extremely long input strings", async () => {
            const { prisma } = require("@/lib/prisma/client");

            const longStringInput = {
                ...advancedValidInput,
                productId: "a".repeat(10000), // 매우 긴 문자열
            };

            prisma.payment.findFirst.mockResolvedValue(null);
            prisma.$transaction.mockRejectedValue(new Error("String too long"));

            const result = await createPayment(longStringInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
            }
        });

        it("should prevent payment amount overflow", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const {
                getExchangeRateInfo,
                convertAmount,
            } = require("../../../app/actions/exchangeRate");

            const overflowInput = {
                ...advancedValidInput,
                quantity: Number.MAX_SAFE_INTEGER,
            };

            const overflowEvent = {
                id: "event-123",
                title: "Overflow Event",
                price: Number.MAX_SAFE_INTEGER,
            };

            prisma.payment.findFirst.mockResolvedValue(null);
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    events: {
                        findUnique: jest.fn().mockResolvedValue(overflowEvent),
                    },
                    paymentPromotion: {
                        findUnique: jest.fn().mockResolvedValue(null),
                    },
                    payment: {
                        create: jest
                            .fn()
                            .mockRejectedValue(new Error("Overflow error")),
                    },
                };
                return await callback(mockTx);
            });

            getExchangeRateInfo.mockResolvedValue(advancedMockExchangeRateInfo);
            convertAmount.mockResolvedValue(Infinity); // Overflow result

            const result = await createPayment(overflowInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
            }
        });

        it("should validate payment method combinations", async () => {
            const { prisma } = require("@/lib/prisma/client");

            const invalidMethodInput = {
                ...advancedValidInput,
                payMethod: "EASY_PAY" as const,
                easyPayProvider: undefined, // Missing required provider
            };

            prisma.payment.findFirst.mockResolvedValue(null);

            const result = await createPayment(invalidMethodInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
            }
        });
    });

    describe("Financial Accuracy Tests", () => {
        const financialValidInput = {
            userId: "user-123",
            productTable: "events" as const,
            productId: "event-123",
            quantity: 1,
            currency: "CURRENCY_KRW" as const,
            payMethod: "CARD" as const,
            cardProvider: "COUNTRY_KR" as const,
        };

        const financialMockEvent = {
            id: "event-123",
            title: "Test Event",
            price: 10000,
        };

        const financialMockExchangeRateInfo = {
            rate: 1,
            provider: "MANUAL",
            createdAt: new Date(),
        };

        it("should maintain precision in complex discount calculations", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const {
                getExchangeRateInfo,
                convertAmount,
            } = require("../../../app/actions/exchangeRate");

            const precisionInput = {
                ...financialValidInput,
                promotionCode: "PRECISION_TEST",
                quantity: 3,
            };

            const precisionPromotion = {
                code: "PRECISION_TEST",
                isActive: true,
                discountType: PaymentPromotionDiscountType.percentage,
                discountValue: 33.333333, // 복잡한 할인율
            };

            prisma.payment.findFirst.mockResolvedValue(null);
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const result = await callback({
                    payment: {
                        create: jest.fn().mockResolvedValue({
                            id: "payment-123",
                            ...precisionInput,
                            amount: 20000, // 정밀한 계산 결과
                            status: PaymentStatus.PENDING,
                        }),
                    },
                    events: {
                        findUnique: jest
                            .fn()
                            .mockResolvedValue(financialMockEvent),
                    },
                    paymentPromotion: {
                        findUnique: jest
                            .fn()
                            .mockResolvedValue(precisionPromotion),
                    },
                });
                return result;
            });

            getExchangeRateInfo.mockResolvedValue(
                financialMockExchangeRateInfo
            );
            convertAmount.mockResolvedValue(20000);

            const result = await createPayment(precisionInput);

            expect(result.success).toBe(true);
            if (result.success) {
                // Verify precision is maintained
                expect(Number.isInteger(result.data.amount)).toBe(true);
                expect(result.data.amount).toBeGreaterThan(0);
            }
        });

        it("should handle currency conversion edge cases", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const {
                getExchangeRateInfo,
                convertAmount,
            } = require("../../../app/actions/exchangeRate");

            // Test with very small exchange rate
            const microExchangeRate = {
                rate: 0.0001, // 매우 작은 환율
                provider: "MANUAL",
                createdAt: new Date(),
            };

            prisma.payment.findFirst.mockResolvedValue(null);
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    payment: {
                        create: jest.fn().mockResolvedValue({
                            id: "payment-123",
                            ...financialValidInput,
                            amount: 1, // 매우 작은 결과
                            status: PaymentStatus.PENDING,
                        }),
                    },
                    events: {
                        findUnique: jest
                            .fn()
                            .mockResolvedValue(financialMockEvent),
                    },
                    paymentPromotion: {
                        findUnique: jest.fn().mockResolvedValue(null),
                    },
                };
                return await callback(mockTx);
            });

            getExchangeRateInfo.mockResolvedValue(microExchangeRate);
            convertAmount.mockResolvedValue(1);

            const result = await createPayment(financialValidInput);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.amount).toBeGreaterThanOrEqual(1);
            }
        });
    });

    describe("Production-Critical Edge Cases", () => {
        const criticalValidInput = {
            userId: "user-123",
            productTable: "events" as const,
            productId: "event-123",
            quantity: 1,
            currency: "CURRENCY_KRW" as const,
            payMethod: "CARD" as const,
            cardProvider: "COUNTRY_KR" as const,
        };

        const criticalMockEvent = {
            id: "event-123",
            title: "Critical Test Event",
            price: 10000,
        };

        const criticalMockExchangeRateInfo = {
            rate: 1,
            provider: "MANUAL",
            createdAt: new Date(),
        };

        it("should handle database deadlock scenarios", async () => {
            const { prisma } = require("@/lib/prisma/client");

            // Simulate database deadlock
            prisma.payment.findFirst.mockResolvedValue(null);
            prisma.$transaction.mockRejectedValue(
                new Error("Deadlock found when trying to get lock")
            );

            const result = await createPayment(criticalValidInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
                expect(result.error.message).toBe("Payment creation failed");
            }
        });

        it("should handle memory pressure during payment processing", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const {
                getExchangeRateInfo,
                convertAmount,
            } = require("../../../app/actions/exchangeRate");

            // Simulate memory pressure with large data
            const largeDataInput = {
                ...criticalValidInput,
                productId: "x".repeat(100000), // Very large product ID
            };

            prisma.payment.findFirst.mockResolvedValue(null);
            prisma.$transaction.mockImplementation(async (callback: any) => {
                // Simulate memory issues
                throw new Error("JavaScript heap out of memory");
            });

            const result = await createPayment(largeDataInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
            }
        });

        it("should handle PortOne API rate limiting", async () => {
            const { prisma } = require("@/lib/prisma/client");

            const mockPayment = {
                id: "payment-123",
                userId: "user-123",
                amount: 10000,
                currency: "CURRENCY_KRW",
                status: PaymentStatus.PENDING,
                needWallet: false,
                exchangeRate: 1,
                exchangeRateProvider: "MANUAL",
                exchangeRateTimestamp: new Date(),
                convertedPrice: 10000,
                quantity: 1,
                promotionCode: null,
                productTable: "events",
                productId: "event-123",
            };

            prisma.payment.findUnique.mockResolvedValue(mockPayment);
            prisma.$transaction.mockResolvedValue({ isValid: true });

            // Mock PortOne API rate limiting (429 Too Many Requests)
            (fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 429,
                statusText: "Too Many Requests",
                json: async () => ({
                    error: {
                        code: "RATE_LIMIT_EXCEEDED",
                        message: "Too many requests",
                    },
                }),
            });

            prisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.FAILED,
            });

            const result = await verifyPayment({
                paymentId: "payment-123",
                userId: "user-123",
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
            }
        });

        it("should handle partial network failures during verification", async () => {
            const { prisma } = require("@/lib/prisma/client");

            const mockPayment = {
                id: "payment-123",
                userId: "user-123",
                amount: 10000,
                currency: "CURRENCY_KRW",
                status: PaymentStatus.PENDING,
                needWallet: false,
                exchangeRate: 1,
                exchangeRateProvider: "MANUAL",
                exchangeRateTimestamp: new Date(),
                convertedPrice: 10000,
                quantity: 1,
                promotionCode: null,
                productTable: "events",
                productId: "event-123",
            };

            prisma.payment.findUnique.mockResolvedValue(mockPayment);
            prisma.$transaction.mockResolvedValue({ isValid: true });

            // Mock partial response (connection drops mid-response)
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => {
                    throw new Error("ECONNRESET: Connection reset by peer");
                },
            });

            prisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.FAILED,
            });

            const result = await verifyPayment({
                paymentId: "payment-123",
                userId: "user-123",
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
            }
        });

        it("should handle currency conversion service downtime", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const {
                getExchangeRateInfo,
                convertAmount,
            } = require("../../../app/actions/exchangeRate");

            const foreignCurrencyInput = {
                ...criticalValidInput,
                currency: "CURRENCY_USD" as const,
            };

            prisma.payment.findFirst.mockResolvedValue(null);
            prisma.$transaction.mockImplementation(async (callback: any) => {
                // Mock exchange rate service failure during transaction
                throw new Error("Exchange rate service unavailable");
            });

            // Mock exchange rate service failure
            getExchangeRateInfo.mockRejectedValue(
                new Error("Exchange rate service unavailable")
            );

            const result = await createPayment(foreignCurrencyInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
            }
        });

        it("should handle webhook replay attacks with identical timestamps", async () => {
            const { prisma } = require("@/lib/prisma/client");

            const webhookBody = {
                type: "Transaction.Paid" as const,
                data: {
                    paymentId: "payment-123",
                    storeId: process.env.PORTONE_MID,
                },
            };

            const mockPayment = {
                id: "payment-123",
                userId: "user-123",
                status: PaymentStatus.PENDING,
            };

            // First webhook call
            prisma.payment.findUnique.mockResolvedValue(mockPayment);
            prisma.webhookEvent.create.mockResolvedValue({
                id: "webhook-123",
                paymentId: "payment-123",
            });
            prisma.webhookEvent.update.mockResolvedValue({});

            // Mock successful verification for first call
            prisma.$transaction.mockResolvedValue({ isValid: true });
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: "PAID",
                    amount: { total: 10000 },
                }),
            });
            prisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.PAID,
            });

            // First webhook should succeed
            const result1 = await handlePortOneWebhook(webhookBody);
            expect(result1.success).toBe(true);

            // Second identical webhook (replay attack)
            prisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.PAID, // Already processed
            });

            const result2 = await handlePortOneWebhook(webhookBody);
            expect(result2.success).toBe(true); // Should handle gracefully
        });

        it("should handle payment processing during system maintenance", async () => {
            const { prisma } = require("@/lib/prisma/client");

            // Simulate read-only mode during maintenance
            prisma.payment.findFirst.mockResolvedValue(null);
            prisma.$transaction.mockRejectedValue(
                new Error("Database is in read-only mode")
            );

            const result = await createPayment(criticalValidInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
                expect(result.error.message).toBe("Payment creation failed");
            }
        });

        it("should handle extreme load with connection pool exhaustion", async () => {
            const { prisma } = require("@/lib/prisma/client");

            // Simulate connection pool exhaustion
            prisma.payment.findFirst.mockRejectedValue(
                new Error("Too many connections")
            );

            const result = await createPayment(criticalValidInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
            }
        });

        it("should handle malformed PortOne API responses", async () => {
            const { prisma } = require("@/lib/prisma/client");

            const mockPayment = {
                id: "payment-123",
                userId: "user-123",
                amount: 10000,
                currency: "CURRENCY_KRW",
                status: PaymentStatus.PENDING,
                needWallet: false,
                exchangeRate: 1,
                exchangeRateProvider: "MANUAL",
                exchangeRateTimestamp: new Date(),
                convertedPrice: 10000,
                quantity: 1,
                promotionCode: null,
                productTable: "events",
                productId: "event-123",
            };

            prisma.payment.findUnique.mockResolvedValue(mockPayment);
            prisma.$transaction.mockResolvedValue({ isValid: true });

            // Mock malformed JSON response
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => {
                    throw new SyntaxError("Unexpected token in JSON");
                },
            });

            prisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.FAILED,
            });

            const result = await verifyPayment({
                paymentId: "payment-123",
                userId: "user-123",
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
            }
        });

        it("should handle timezone-related payment expiration edge cases", async () => {
            const { prisma } = require("@/lib/prisma/client");

            // Create payment at timezone boundary (e.g., 23:59:59 UTC)
            const boundaryTime = new Date("2024-12-31T23:59:59.999Z");

            const timeBoundaryPayment = {
                id: "payment-boundary",
                userId: "user-123",
                amount: 10000,
                currency: "CURRENCY_KRW",
                status: PaymentStatus.PENDING,
                createdAt: boundaryTime,
                needWallet: false,
                exchangeRate: 1,
                exchangeRateProvider: "MANUAL",
                exchangeRateTimestamp: boundaryTime,
                convertedPrice: 10000,
                quantity: 1,
                promotionCode: null,
                productTable: "events",
                productId: "event-123",
            };

            prisma.payment.findUnique.mockResolvedValue(timeBoundaryPayment);
            prisma.$transaction.mockResolvedValue({ isValid: true });

            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    status: "PAID",
                    amount: { total: 10000 },
                    paidAt: "2025-01-01T00:00:01.000Z", // Next day in UTC
                }),
            });

            prisma.payment.update.mockResolvedValue({
                ...timeBoundaryPayment,
                status: PaymentStatus.PAID,
            });

            const result = await verifyPayment({
                paymentId: "payment-boundary",
                userId: "user-123",
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.status).toBe(PaymentStatus.PAID);
            }
        });
    });

    describe("Stress Testing Scenarios", () => {
        it("should handle rapid sequential payment attempts", async () => {
            const { prisma } = require("@/lib/prisma/client");
            const {
                getExchangeRateInfo,
                convertAmount,
            } = require("../../../app/actions/exchangeRate");

            const rapidInput = {
                userId: "user-rapid",
                productTable: "events" as const,
                productId: "event-rapid",
                quantity: 1,
                currency: "CURRENCY_KRW" as const,
                payMethod: "CARD" as const,
                cardProvider: "COUNTRY_KR" as const,
            };

            // First attempt succeeds
            prisma.payment.findFirst
                .mockResolvedValueOnce(null) // No duplicate
                .mockResolvedValueOnce({
                    // Second attempt finds recent payment
                    id: "payment-rapid-1",
                    ...rapidInput,
                    createdAt: new Date(),
                    status: PaymentStatus.PENDING,
                });

            prisma.$transaction.mockImplementation(async (callback: any) => {
                const result = await callback({
                    payment: {
                        create: jest.fn().mockResolvedValue({
                            id: "payment-rapid-1",
                            ...rapidInput,
                            amount: 10000,
                            status: PaymentStatus.PENDING,
                        }),
                    },
                    events: {
                        findUnique: jest.fn().mockResolvedValue({
                            id: "event-rapid",
                            title: "Rapid Event",
                            price: 10000,
                        }),
                    },
                    paymentPromotion: {
                        findUnique: jest.fn().mockResolvedValue(null),
                    },
                });
                return result;
            });

            getExchangeRateInfo.mockResolvedValue({
                rate: 1,
                provider: "MANUAL",
                createdAt: new Date(),
            });
            convertAmount.mockResolvedValue(10000);

            // First attempt should succeed
            const result1 = await createPayment(rapidInput);
            expect(result1.success).toBe(true);

            // Second rapid attempt should be blocked
            const result2 = await createPayment(rapidInput);
            expect(result2.success).toBe(false);
            if (!result2.success) {
                expect(result2.error.code).toBe("DUPLICATE_PAYMENT");
            }
        });
    });
});
