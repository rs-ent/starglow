/// components/payment/FreePayButton.tsx

"use client";

import { useState } from "react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import { ShinyButton } from "../magicui/shiny-button";

import type { PaymentResponse } from "@portone/browser-sdk/v2";
import type { Payment } from "@prisma/client";

interface FreePayButtonProps {
    payment: Payment;
    disabled: boolean;

    onPaymentProceed: (response: PaymentResponse | Error) => void;
}

export default function FreePayButton({
    payment,
    disabled,
    onPaymentProceed,
}: FreePayButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const onClick = async () => {
        setIsLoading(true);
        const response = {
            transactionType: "PAYMENT",
            paymentId: payment.id,
            txId: new Date().getTime().toString(),
            code: "SUCCESS",
            message: "FREE PAYMENT",
            pgCode: "FREE",
            pgMessage: "FREE PAYMENT",
        } as PaymentResponse;
        setIsLoading(false);
        if (response) {
            onPaymentProceed(response);
        }
    };

    return (
        <ShinyButton
            className={cn(
                "my-4",
                "bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300",
                "w-full"
            )}
            onClick={onClick}
            disabled={disabled}
        >
            <h2
                className={cn(
                    "text-center text-white",
                    getResponsiveClass(20).textClass
                )}
            >
                {isLoading ? "Processing..." : "Get Free!"}
            </h2>
        </ShinyButton>
    );
}
