/// components/payment/PaymentButton.tsx

"use client";

import * as PortOne from "@portone/browser-sdk/v2";

interface PaymentButtonProps {
    onClick: () => void;
    isLoading: boolean;
    disabled: boolean;
    amount: number;
    currency: PortOne.Entity.Currency;
}

export default function PaymentButton({
    onClick,
    isLoading,
    disabled,
    amount,
    currency,
}: PaymentButtonProps) {
    const formatAmount = (
        amount: number,
        currency: PortOne.Entity.Currency
    ) => {
        return new Intl.NumberFormat(
            currency === "CURRENCY_KRW" ? "ko-KR" : "en-US",
            {
                style: "currency",
                currency: currency === "CURRENCY_KRW" ? "KRW" : "USD",
                minimumFractionDigits: 0,
            }
        ).format(amount);
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
                <span>Pay {formatAmount(amount, currency)}</span>
            )}
        </button>
    );
}
