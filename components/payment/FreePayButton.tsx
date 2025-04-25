/// components/payment/FreePayButton.tsx

"use client";

import { useState } from "react";
import { PaymentResponse } from "@portone/browser-sdk/v2";
import { Currency, PayMethod } from "@/lib/types/payment";
import { Payment } from "@prisma/client";

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
        <button
            onClick={onClick}
            disabled={disabled}
            className="w-full mt-4 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
            {isLoading ? <span>Processing...</span> : <span>Get Free!</span>}
        </button>
    );
}
