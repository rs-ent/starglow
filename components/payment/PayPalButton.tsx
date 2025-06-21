/// components/payment/PaypalButton.tsx

"use client";

import { useEffect, useRef } from "react";

import * as PortOne from "@portone/browser-sdk/v2";

import { useToast } from "@/app/hooks/useToast";

import type { PaymentResponse } from "@portone/browser-sdk/v2";
import type { Payment } from "@prisma/client";

interface PayPalButtonProps {
    payment: Payment;
    disabled: boolean;

    onPaymentProceed: (response: PaymentResponse | Error) => void;
}

export default function PayPalButton({
    payment,
    disabled = false,
    onPaymentProceed,
}: PayPalButtonProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    useEffect(() => {
        if (!containerRef.current) return;

        const initPayPal = async () => {
            try {
                await PortOne.loadPaymentUI(
                    {
                        paymentId: payment.id,
                        orderName: payment.productName,
                        totalAmount: Math.round(payment.amount),
                        currency: "CURRENCY_USD",
                        uiType: "PAYPAL_SPB",
                        storeId: payment.storeId,
                        channelKey: payment.channelKey,
                        redirectUrl: window.location.href,
                    },
                    {
                        onPaymentSuccess: async (response) => {
                            onPaymentProceed(response);
                        },
                        onPaymentFail: (error) => {
                            onPaymentProceed(error);
                        },
                    }
                );
            } catch (error) {
                console.error("Failed to initialize PayPal:", error);
                toast.error("Failed to initialize PayPal");
            }
        };

        initPayPal().catch((error) => {
            console.error("Failed to initialize PayPal:", error);
        });
    }, [payment, onPaymentProceed, toast]);

    return (
        <div className="relative my-3">
            <div
                ref={containerRef}
                className="portone-ui-container"
                data-portone-ui-type="paypal-spb"
                style={{
                    opacity: disabled ? 0.5 : 1,
                    pointerEvents: disabled ? "none" : "auto",
                }}
            />
            {disabled && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
                </div>
            )}
        </div>
    );
}
