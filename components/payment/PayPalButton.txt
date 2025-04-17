/// components/payment/PaypalButton.tsx

"use client";

import { useEffect, useRef } from "react";
import * as PortOne from "@portone/browser-sdk/v2";
import { useToast } from "@/app/hooks/useToast";
import { PaymentResponse } from "@portone/browser-sdk/v2";
import {
    PaymentResponse as LogResponse,
    VerifyPaymentProps,
} from "@/app/actions/payment";

interface PayPalButtonProps {
    sessionHash: string;
    merchId: string;
    merchName: string;
    onCreatePayment: () => Promise<LogResponse | null>;
    onVerifyPayment: (
        paymentLog: VerifyPaymentProps,
        response: PaymentResponse
    ) => Promise<void>;
    disabled?: boolean;
}

export default function PayPalButton({
    sessionHash,
    merchId,
    merchName,
    onCreatePayment,
    onVerifyPayment,
    disabled = false,
}: PayPalButtonProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    useEffect(() => {
        if (!containerRef.current) return;

        const initPayPal = async () => {
            try {
                // 1. 먼저 결제 생성
                const response = await onCreatePayment();
                if (!response) return;

                const paymentLog = response.data;
                if (!paymentLog) return;

                console.log("paymentLog", paymentLog);

                // 2. PayPal UI 로드
                await PortOne.loadPaymentUI(
                    {
                        paymentId: paymentLog.paymentLogId,
                        orderName: merchName,
                        totalAmount: Math.round(paymentLog.convertedAmount!),
                        currency: "CURRENCY_USD",
                        uiType: "PAYPAL_SPB",
                        storeId: paymentLog.storeId!,
                        channelKey: paymentLog.channelKey!,
                    },
                    {
                        onPaymentSuccess: async (response) => {
                            await onVerifyPayment(
                                {
                                    paymentLogId: paymentLog.paymentLogId,
                                    sessionHash,
                                    userId: paymentLog.userId!,
                                    merchId,
                                    nonce: paymentLog.nonce!,
                                    txId: response.txId,
                                },
                                response
                            );
                        },
                        onPaymentFail: (error) => {
                            toast.error("PayPal payment failed");
                        },
                    }
                );
            } catch (error) {
                toast.error("Failed to initialize PayPal");
            }
        };

        initPayPal();
    }, [merchId, merchName]);

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
