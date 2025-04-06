"use client";

import { useState, useEffect, useRef } from "react";
import * as PortOne from "@portone/browser-sdk/v2";
import { Entity } from "@portone/browser-sdk/v2";
import {
    initPaymentValidation,
    verifyPayment,
    recordPaymentFailure,
} from "@/app/actions/paymentValidation";
import { CurrencyType, PaymentMethodType } from "@/lib/types/payment";
import crypto from "crypto";
import { getSession } from "next-auth/react";
import { useToast } from "@/app/hooks/useToast";
import { useRouter } from "next/navigation";
import { Currency } from "../molecules/PaymentExecutor";

export interface PayPalButtonProps {
    userId?: string;
    table: string;
    target: string;
    quantity: number;
    amount: number;
    currency: Currency;
    onSuccess?: (response: any) => void;
    onError?: (error: any) => void;
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

const generateContainerId = (userId?: string) => {
    const userPart = userId ? userId.substring(0, 8) : "guest";
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `portone-paypal-${userPart}-${randomPart}`;
};

export default function PayPalButton({
    userId,
    table,
    target,
    quantity,
    amount,
    currency,
    onSuccess,
    onError,
    paypalOptions,
}: PayPalButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [sessionLoaded, setSessionLoaded] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>(userId || "");
    const [shouldShowPayPal, setShouldShowPayPal] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const paymentResponseRef = useRef<any>(null);
    const toast = useToast();
    const router = useRouter();

    const containerId = useRef(generateContainerId(userId)).current;

    const entityCurrencyMap = {
        CURRENCY_USD: Entity.Currency.USD,
        CURRENCY_KRW: Entity.Currency.KRW,
    };

    const CURRENCY_MAP = {
        CURRENCY_USD: CurrencyType.USD,
        CURRENCY_KRW: CurrencyType.KRW,
    };

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
                console.error("Session loading failed:", error);
                setSessionLoaded(true);
            }
        };

        loadSession();
    }, [userId]);

    useEffect(() => {
        let cleanup: (() => void) | undefined;

        if (sessionLoaded && currentUserId) {
            (async () => {
                const cleanupFn = await initializePayPal();
                if (typeof cleanupFn === "function") {
                    cleanup = cleanupFn;
                }
            })();
        }

        return () => {
            setShouldShowPayPal(false);

            setTimeout(() => {
                if (cleanup) {
                    try {
                        cleanup();
                    } catch (e) {
                        console.error("Cleanup failed:", e);
                    }
                }
                setIsLoading(false);
                setIsInitialized(false);
            }, 0);
        };
    }, [sessionLoaded, currentUserId]);

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

    const initializePayPal = async () => {
        if (isLoading || isInitialized) {
            return;
        }

        setIsLoading(true);
        let paymentUIInstance: any = null;

        try {
            await checkUserAndProceed(async () => {
                if (!currentUserId || !table || !target) {
                    toast.error("Missing required information for payment");
                    console.error("Missing required fields:", {
                        currentUserId,
                        table,
                        target,
                    });
                    setIsLoading(false);
                    return;
                }

                const sessionHash = crypto
                    .createHash("sha256")
                    .update(`${currentUserId}-${Date.now()}-${Math.random()}`)
                    .digest("hex");

                const paymentResponse = await initPaymentValidation({
                    sessionHash,
                    userId: currentUserId,
                    table,
                    target,
                    quantity,
                    currency: CURRENCY_MAP[currency],
                    method: PaymentMethodType.PAYPAL,
                });

                if (!paymentResponse) {
                    throw new Error("Payment initialization failed.");
                }

                paymentResponseRef.current = paymentResponse;
                setIsInitialized(true);

                // Calculate total amount in USD for PayPal
                const totalAmount = amount * quantity;

                const requestData = {
                    uiType: "PAYPAL_SPB" as const,
                    storeId: paymentResponse.paymentConfig.storeId,
                    channelKey: paymentResponse.paymentConfig.channelKey,
                    paymentId: paymentResponse.paymentId,
                    orderName: paymentResponse.orderName,
                    totalAmount: totalAmount * 100,
                    currency: entityCurrencyMap[currency],
                };

                console.log("PayPal request data:", {
                    ...requestData,
                    originalAmount: amount,
                    quantity,
                });

                setShouldShowPayPal(true);

                paymentUIInstance = await PortOne.loadPaymentUI(requestData, {
                    onPaymentSuccess: async (response: any) => {
                        setShouldShowPayPal(false);
                        try {
                            const verifyResult = await verifyPayment({
                                paymentId: paymentResponse.paymentId,
                                sessionHash: paymentResponse.sessionHash,
                                paymentKey: paymentResponse.paymentKey,
                                userId: paymentResponse.userId,
                                amount: paymentResponse.amount,
                                quantity: paymentResponse.quantity,
                                currency: paymentResponse.currency,
                                table: table,
                                target: target,
                            });

                            if (!verifyResult || !verifyResult.success) {
                                throw new Error("Payment verification failed");
                            }

                            if (onSuccess) {
                                onSuccess({
                                    ...response,
                                    paymentId: paymentResponse.paymentId,
                                    verifyResult,
                                });
                            }
                        } catch (error) {
                            console.error(
                                "Payment verification failed:",
                                error
                            );
                            setShouldShowPayPal(true);
                            if (onError) {
                                onError(error);
                            }
                        } finally {
                            setIsLoading(false);
                        }
                    },
                    onPaymentFail: async (error: any) => {
                        setIsLoading(false);
                        if (onError) {
                            onError(error);
                        }
                    },
                });
            });

            return () => {
                if (paymentUIInstance?.destroy) {
                    try {
                        setShouldShowPayPal(false);
                        paymentUIInstance.destroy();
                    } catch (e) {
                        console.error("Failed to destroy payment UI:", e);
                    }
                }
            };
        } catch (error) {
            console.error("PayPal initialization failed:", error);
            setIsInitialized(false);
            setIsLoading(false);
            if (onError) {
                onError(error);
            }
        }
    };

    return (
        <div className="w-full">
            {!sessionLoaded ? (
                <div className="w-full p-3 text-center rounded-lg bg-secondary/20">
                    Loading...
                </div>
            ) : shouldShowPayPal ? (
                <div
                    ref={containerRef}
                    id={containerId}
                    className="portone-ui-container w-full min-h-[50px] bg-secondary/20 rounded-lg overflow-hidden"
                >
                    {isLoading && (
                        <div className="w-full h-full flex items-center justify-center p-4">
                            <span>Loading PayPal...</span>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
