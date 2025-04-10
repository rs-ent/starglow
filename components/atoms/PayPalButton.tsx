/// components\atoms\PayPalButton.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import * as PortOne from "@portone/browser-sdk/v2";
import { Entity } from "@portone/browser-sdk/v2";
import { useToast } from "@/app/hooks/useToast";
import { useRouter } from "next/navigation";
import { usePayments } from "@/app/hooks/usePaymentValidation";
import { CurrencyType, PaymentMethodType } from "@/lib/types/payments";
import Icon from "@/components/atoms/Icon";
import { Loader2 } from "lucide-react";

export interface PayPalButtonProps {
    userId?: string;
    table: string;
    target: string;
    quantity: number;
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

export default function PayPalButton({
    userId,
    table,
    target,
    quantity,
    onSuccess,
    onError,
}: PayPalButtonProps) {
    const paymentResponseRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const containerId = "paypal-button-container";
    const router = useRouter();

    // usePayments 훅 사용하여 결제 관련 함수 가져오기
    const { initializePayment, completePayment, failedPayment } = usePayments();

    useEffect(() => {
        initializePayPal();
    }, [userId]);

    const initializePayPal = async () => {
        let paymentUIInstance: any = null;

        if (!userId) {
            const callbackUrl = encodeURIComponent(window.location.href);
            router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
            return;
        }

        // 세션 해시 생성
        const sessionHash = `session-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 15)}`;

        // initializePayment 훅 사용하여 결제 초기화
        const paymentResponse = await initializePayment({
            sessionHash,
            userId,
            table,
            target,
            quantity,
            currency: CurrencyType.USD,
            method: PaymentMethodType.PAYPAL,
        });

        if (!paymentResponse) {
            throw new Error("Payment initialization failed.");
        }

        paymentResponseRef.current = paymentResponse;

        const requestData = {
            uiType: "PAYPAL_SPB" as const,
            storeId: paymentResponse.paymentConfig.storeId,
            channelKey: paymentResponse.paymentConfig.channelKey,
            paymentId: paymentResponse.paymentId,
            orderName: paymentResponse.orderName,
            totalAmount: Math.round(paymentResponse.totalAmount),
            currency: Entity.Currency.USD,
        };

        paymentUIInstance = await PortOne.loadPaymentUI(requestData, {
            onPaymentSuccess: async (response: any) => {
                try {
                    const result = await completePayment(paymentResponse);
                    console.log("Payment successful");

                    if (onSuccess) {
                        onSuccess({ ...response, ...result });
                    }
                } catch (error) {
                    console.error("Payment completion failed:", error);
                    if (onError) onError(error);
                }
            },
            onPaymentFail: async (error: any) => {
                try {
                    const result = await failedPayment(
                        paymentResponse.paymentId,
                        error?.message || "Unknown error"
                    );
                    console.log(
                        "Payment failed",
                        error?.message || "Unknown error"
                    );

                    if (onError) {
                        onError({ ...error, ...result });
                    }
                } catch (err) {
                    console.error("Payment failure recording failed:", err);
                    if (onError) onError(err);
                }
            },
        });
    };

    return (
        <div className="w-full">
            <div
                ref={containerRef}
                id={containerId}
                className="portone-ui-container w-full min-h-[50px] rounded-lg overflow-hidden relative"
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon icon={Loader2} className="w-4 h-4 animate-spin" />
                </div>
            </div>
        </div>
    );
}
