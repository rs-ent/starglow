/// components/payment/PaymentButton.tsx

"use client";

import { useState } from "react";
import * as PortOne from "@portone/browser-sdk/v2";
import { Payment } from "@prisma/client";
import { PaymentResponse } from "@portone/browser-sdk/v2";
import { Currency, PayMethod } from "@/lib/types/payment";

interface PaymentButtonProps {
    payment: Payment;
    disabled: boolean;

    onPaymentProceed: (response: PaymentResponse | Error) => void;
}

export default function PaymentButton({
    payment,
    disabled,
    onPaymentProceed,
}: PaymentButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const onClick = async () => {
        setIsLoading(true);
        const response = await PortOne.requestPayment({
            paymentId: payment.id,
            orderName: payment.productName,
            totalAmount: Math.round(payment.amount),
            currency: payment.currency as Currency,
            payMethod: payment.payMethod as PayMethod,
            storeId: payment.storeId,
            channelKey: payment.channelKey,
            redirectUrl: payment.redirectUrl || window.location.href,
        });
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
            {isLoading ? (
                <span>Processing...</span>
            ) : (
                <span>Pay with {payment.payMethod}</span>
            )}
        </button>
    );
}
