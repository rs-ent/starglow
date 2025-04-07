"use client";

import { useState } from "react";
import { Entity } from "@portone/browser-sdk/v2";
import PaymentMethodSelector from "./PaymentMethodSelector";
import PaymentExecutor from "./PaymentExecutor";
import { PayMethod } from "./PaymentExecutor";
import {
    useExchangeRateInfo,
    useCurrencyConverter,
} from "@/app/hooks/usePaymentValidation";
import { CardProvider } from "@/lib/types/payment";

export interface PaymentProcessorProps {
    // Payment configuration
    amount: number;
    initialCurrency?: "CURRENCY_USD" | "CURRENCY_KRW";
    userId?: string;

    // Database reference for the purchase
    table: string;
    target: string;
    quantity: number;

    // Optional customization
    buttonText?: string;

    // Callbacks
    onSuccess?: (response: any) => void;
    onError?: (error: any) => void;
}

export default function PaymentProcessor({
    amount: initialAmount,
    initialCurrency = "CURRENCY_KRW",
    userId,
    table,
    target,
    quantity,
    buttonText,
    onSuccess,
    onError,
}: PaymentProcessorProps) {
    // Payment method state
    const [paymentMethod, setPaymentMethod] = useState<PayMethod>("CARD");
    const [easyPayProvider, setEasyPayProvider] =
        useState<Entity.EasyPayProvider>("EASY_PAY_PROVIDER_TOSSPAY");
    const [cardProvider, setCardProvider] = useState<CardProvider>(
        CardProvider.DOMESTIC
    );
    const [currency, setCurrency] = useState(initialCurrency);

    // Exchange rate information
    const { rateInfo } = useExchangeRateInfo(
        currency === "CURRENCY_USD" ? "KRW" : "USD",
        currency === "CURRENCY_USD" ? "USD" : "KRW"
    );

    // Currency conversion hooks
    const { convertedAmount: krwToUsd } = useCurrencyConverter(
        initialAmount,
        "KRW",
        "USD"
    );
    const { convertedAmount: usdToKrw } = useCurrencyConverter(
        initialAmount,
        "USD",
        "KRW"
    );

    // Get the current amount based on currency and payment method
    const getCurrentAmount = () => {
        // If using KRW and not PayPal, use the initial amount
        if (currency === "CURRENCY_KRW" && paymentMethod !== "PAYPAL") {
            return initialAmount;
        }

        // For USD or PayPal, use the converted amount
        return krwToUsd?.converted.amount || initialAmount;
    };

    // Handle payment method change
    const handlePaymentMethodChange = (method: PayMethod) => {
        setPaymentMethod(method);

        // If PayPal is selected, force USD currency
        if (method === "PAYPAL" && currency === "CURRENCY_KRW") {
            setCurrency("CURRENCY_USD");
        }

        // If Easy Pay is selected, force KRW currency
        if (method === "EASY_PAY" && currency === "CURRENCY_USD") {
            setCurrency("CURRENCY_KRW");
        }
    };

    // Handle currency change
    const handleCurrencyChange = (
        newCurrency: "CURRENCY_USD" | "CURRENCY_KRW"
    ) => {
        // Prevent KRW selection for PayPal
        if (paymentMethod === "PAYPAL" && newCurrency === "CURRENCY_KRW") {
            return;
        }

        // Prevent USD selection for Easy Pay
        if (paymentMethod === "EASY_PAY" && newCurrency === "CURRENCY_USD") {
            return;
        }

        setCurrency(newCurrency);
    };

    // Handle card provider change
    const handleCardProviderChange = (provider: CardProvider) => {
        setCardProvider(provider);
        // If international card is selected, allow USD
        // If domestic card is selected, force KRW
        if (
            provider === "CARD_PROVIDER_DOMESTIC" &&
            currency === "CURRENCY_USD"
        ) {
            setCurrency("CURRENCY_KRW");
        }
    };

    // Get the current payment method
    const getCurrentPaymentMethod = (): PayMethod => {
        if (paymentMethod === "CARD" || paymentMethod === "PAYPAL") {
            return paymentMethod;
        }
        return "EASY_PAY";
    };

    // Calculate current amount and exchange rate info
    const currentAmount = getCurrentAmount();
    const exchangeRateDisplay = rateInfo?.formattedRate || "";
    const lastUpdated = rateInfo?.lastUpdated || "";

    return (
        <div className="space-y-5 md:space-y-6">
            {/* Payment method selection */}
            <PaymentMethodSelector
                paymentMethod={paymentMethod}
                easyPayProvider={easyPayProvider}
                cardProvider={cardProvider}
                amount={currentAmount}
                currency={currency}
                onPaymentMethodChange={handlePaymentMethodChange}
                onEasyPayProviderChange={setEasyPayProvider}
                onCardProviderChange={handleCardProviderChange}
                onCurrencyChange={handleCurrencyChange}
                exchangeRateDisplay={exchangeRateDisplay}
                lastUpdated={lastUpdated}
            />

            {/* Payment execution button */}
            <PaymentExecutor
                userId={userId}
                table={table}
                target={target}
                quantity={quantity}
                amount={currentAmount}
                currency={currency}
                method={getCurrentPaymentMethod()}
                easyPayProvider={easyPayProvider}
                cardProvider={cardProvider}
                buttonText={buttonText}
                onSuccess={onSuccess}
                onError={onError}
            />
        </div>
    );
}
