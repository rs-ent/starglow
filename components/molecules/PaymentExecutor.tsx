"use client";

import { useState, useEffect } from "react";
import Button from "../atoms/Button";
import { CurrencyType, PaymentMethodType } from "@/lib/types/payment";
import { getSession } from "next-auth/react";
import { useToast } from "@/app/hooks/useToast";
import { useRouter } from "next/navigation";
import PayPalButton from "../atoms/PayPalButton";
import { useCurrencyConverter } from "@/app/hooks/usePaymentValidation";

// Map component types to payment validation types
export type Currency = "CURRENCY_USD" | "CURRENCY_KRW";
export type PayMethod = "PAYPAL" | "CARD" | "EASY_PAY";

// Map for converting component types to PaymentMethodType
const METHOD_MAP: Record<PayMethod, PaymentMethodType> = {
    PAYPAL: PaymentMethodType.PAYPAL,
    CARD: PaymentMethodType.CARD,
    EASY_PAY: PaymentMethodType.TOSS_PAY, // Default to TOSS_PAY, will be updated based on provider selection
};

// Map for converting component types to CurrencyType
const CURRENCY_MAP: Record<Currency, CurrencyType> = {
    CURRENCY_USD: CurrencyType.USD,
    CURRENCY_KRW: CurrencyType.KRW,
};

export interface PaymentExecutorProps {
    userId?: string;
    table: string;
    target: string;
    quantity: number;
    amount: number;
    currency: Currency;
    method: PayMethod;
    buttonText?: string;
    onSuccess?: (response: any) => void;
    onError?: (error: any) => void;
    // PayPal specific options
    paypalOptions?: {
        style?: {
            layout?: "vertical" | "horizontal";
            color?: "gold" | "blue" | "silver" | "white" | "black";
            shape?: "rect" | "pill";
            label?: "paypal" | "checkout" | "buynow" | "pay";
        };
        enableFunding?: string[];
        disableFunding?: string[];
    };
}

interface ExchangeRate {
    USD_KRW: number;
    KRW_USD: number;
    timestamp: number;
}

export default function PaymentExecutor({
    userId,
    table,
    target,
    quantity,
    amount,
    currency,
    method,
    buttonText = "Pay Now",
    onSuccess,
    onError,
    paypalOptions,
}: PaymentExecutorProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [sessionLoaded, setSessionLoaded] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>(userId || "");
    const toast = useToast();
    const router = useRouter();

    // Get converted amount for PayPal
    const { convertedAmount: paypalAmount } = useCurrencyConverter(
        amount,
        currency === "CURRENCY_USD" ? "USD" : "KRW",
        "USD"
    );

    // Get the appropriate amount based on payment method and currency
    const getPaymentAmount = () => {
        if (method === "PAYPAL") {
            return paypalAmount?.converted.amount || 0;
        }
        return amount;
    };

    // Get formatted amount with currency symbol
    const getFormattedAmount = () => {
        const paymentAmount = getPaymentAmount();
        if (currency === "CURRENCY_USD" || method === "PAYPAL") {
            return `$${paymentAmount.toLocaleString()}`;
        }
        return `₩${amount.toLocaleString()}`;
    };

    // Validate currency for PayPal
    useEffect(() => {
        if (method === "PAYPAL" && currency !== "CURRENCY_USD") {
            console.error("PayPal only supports USD currency");
            if (onError)
                onError(new Error("PayPal only supports USD currency"));
        }
    }, [method, currency, onError]);

    // Load session and check user ID
    useEffect(() => {
        const loadSession = async () => {
            try {
                if (userId) {
                    setCurrentUserId(userId);
                    setSessionLoaded(true);
                    return;
                }

                const session = await getSession();
                if (session?.user?.id) {
                    setCurrentUserId(session.user.id);
                }
                setSessionLoaded(true);
            } catch (error) {
                console.error("Failed to load session:", error);
                setSessionLoaded(true);
            }
        };

        loadSession();
    }, [userId]);

    // Check user authentication and proceed with payment
    const checkUserAndProceed = async (callback: () => Promise<void>) => {
        if (currentUserId) {
            await callback();
            return;
        }

        try {
            const session = await getSession();
            if (session?.user?.id) {
                setCurrentUserId(session.user.id);
                await callback();
            } else {
                toast.error("Please login to continue");
                const callbackUrl = encodeURIComponent(window.location.href);
                router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
            }
        } catch (error) {
            console.error("Failed to get session:", error);
            toast.error("Authentication error. Please try again.");
        }
    };

    // Handle payment execution
    const handlePaymentExecution = async () => {
        if (isLoading) return;

        setIsLoading(true);
        await checkUserAndProceed(async () => {
            try {
                // Payment logic to be implemented
                alert(`${method} payment is not implemented yet.`);
            } catch (error) {
                console.error("Payment initialization failed:", error);
                if (onError) onError(error);
            } finally {
                setIsLoading(false);
            }
        });
    };

    // Use PayPal specific component for PayPal payments
    if (method === "PAYPAL") {
        // Prevent PayPal rendering if currency is not USD
        if (currency !== "CURRENCY_USD") {
            return (
                <div className="text-destructive text-sm text-center">
                    PayPal payments are only available in USD currency.
                </div>
            );
        }

        return (
            <PayPalButton
                userId={userId}
                table={table}
                target={target}
                quantity={quantity}
                amount={getPaymentAmount()}
                currency={currency}
                onSuccess={onSuccess}
                onError={onError}
                paypalOptions={paypalOptions}
            />
        );
    }

    // Use standard button for other payment methods
    return (
        <Button
            onClick={handlePaymentExecution}
            disabled={isLoading || !sessionLoaded}
            className="w-full"
        >
            {!sessionLoaded
                ? "Loading..."
                : isLoading
                ? "Processing..."
                : buttonText || `Pay ${getFormattedAmount()}`}
        </Button>
    );
}
