import { formatCurrency } from "@/lib/utils/format";

describe("formatCurrency", () => {
    describe("Happy Path - Basic Currency Formatting", () => {
        it("should format KRW currency without decimal places", () => {
            // Arrange
            const amount = 10000;
            const currency = "CURRENCY_KRW";

            // Act
            const result = formatCurrency(amount, currency);

            // Assert
            expect(result).toBe("₩10,000");
        });

        it("should format USD currency with decimal places using default multiplier", () => {
            // Arrange
            const amount = 1000; // 1000 * 0.01 = 10.00 USD
            const currency = "CURRENCY_USD";

            // Act
            const result = formatCurrency(amount, currency);

            // Assert
            expect(result).toBe("$10.00");
        });

        it("should format EUR currency with decimal places using default multiplier", () => {
            // Arrange
            const amount = 1500; // 1500 * 0.01 = 15.00 EUR
            const currency = "CURRENCY_EUR";

            // Act
            const result = formatCurrency(amount, currency);

            // Assert
            expect(result).toBe("€15.00");
        });

        it("should format USD currency with custom multiplier", () => {
            // Arrange
            const amount = 100;
            const currency = "CURRENCY_USD";
            const customMultiplier = 0.1;

            // Act
            const result = formatCurrency(amount, currency, customMultiplier);

            // Assert
            expect(result).toBe("$10.00");
        });
    });

    describe("Edge Cases - Boundary Values", () => {
        it("should handle zero amount for KRW", () => {
            // Arrange
            const amount = 0;
            const currency = "CURRENCY_KRW";

            // Act
            const result = formatCurrency(amount, currency);

            // Assert
            expect(result).toBe("₩0");
        });

        it("should handle zero amount for USD", () => {
            // Arrange
            const amount = 0;
            const currency = "CURRENCY_USD";

            // Act
            const result = formatCurrency(amount, currency);

            // Assert
            expect(result).toBe("$0.00");
        });

        it("should handle negative amounts for KRW", () => {
            // Arrange
            const amount = -5000;
            const currency = "CURRENCY_KRW";

            // Act
            const result = formatCurrency(amount, currency);

            // Assert
            expect(result).toBe("-₩5,000");
        });

        it("should handle negative amounts for USD", () => {
            // Arrange
            const amount = -1000; // -1000 * 0.01 = -10.00 USD
            const currency = "CURRENCY_USD";

            // Act
            const result = formatCurrency(amount, currency);

            // Assert
            expect(result).toBe("-$10.00");
        });

        it("should handle large amounts for KRW", () => {
            // Arrange
            const amount = 1000000000; // 10억
            const currency = "CURRENCY_KRW";

            // Act
            const result = formatCurrency(amount, currency);

            // Assert
            expect(result).toBe("₩1,000,000,000");
        });

        it("should handle decimal amounts for non-KRW currencies", () => {
            // Arrange
            const amount = 1234.56;
            const currency = "CURRENCY_USD";

            // Act
            const result = formatCurrency(amount, currency);

            // Assert
            expect(result).toBe("$12.35");
        });

        it("should handle zero multiplier", () => {
            // Arrange
            const amount = 1000;
            const currency = "CURRENCY_USD";
            const multiplier = 0;

            // Act
            const result = formatCurrency(amount, currency, multiplier);

            // Assert
            expect(result).toBe("$0.00");
        });
    });

    describe("Error Cases - Invalid Inputs", () => {
        it("should handle currency without CURRENCY_ prefix", () => {
            // Arrange
            const amount = 1000;
            const currency = "USD"; // CURRENCY_ 접두사 없음

            // Act
            const result = formatCurrency(amount, currency);

            // Assert
            expect(result).toBe("$10.00"); // 여전히 정상 동작해야 함
        });

        it("should handle invalid currency code gracefully", () => {
            // Arrange
            const amount = 1000;
            const currency = "CURRENCY_INVALID";

            // Act & Assert
            // 잘못된 통화 코드는 오류를 발생시킬 수 있음
            expect(() => formatCurrency(amount, currency)).toThrow();
        });

        it("should handle very small multiplier values", () => {
            // Arrange
            const amount = 1000000;
            const currency = "CURRENCY_USD";
            const multiplier = 0.000001; // 매우 작은 값

            // Act
            const result = formatCurrency(amount, currency, multiplier);

            // Assert
            expect(result).toBe("$1.00");
        });

        it("should handle very large multiplier values", () => {
            // Arrange
            const amount = 1;
            const currency = "CURRENCY_USD";
            const multiplier = 1000000; // 매우 큰 값

            // Act
            const result = formatCurrency(amount, currency, multiplier);

            // Assert
            expect(result).toBe("$1,000,000.00");
        });
    });

    describe("Regression Tests - Common Use Cases", () => {
        it("should handle typical e-commerce prices in KRW", () => {
            // Arrange
            const testCases = [
                { amount: 9900, expected: "₩9,900" },
                { amount: 49000, expected: "₩49,000" },
                { amount: 129000, expected: "₩129,000" },
            ];

            testCases.forEach(({ amount, expected }) => {
                // Act
                const result = formatCurrency(amount, "CURRENCY_KRW");

                // Assert
                expect(result).toBe(expected);
            });
        });

        it("should handle typical subscription prices in USD", () => {
            // Arrange
            const testCases = [
                { amount: 999, expected: "$9.99" }, // $9.99
                { amount: 1999, expected: "$19.99" }, // $19.99
                { amount: 2999, expected: "$29.99" }, // $29.99
            ];

            testCases.forEach(({ amount, expected }) => {
                // Act
                const result = formatCurrency(amount, "CURRENCY_USD");

                // Assert
                expect(result).toBe(expected);
            });
        });
    });
});
