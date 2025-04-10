/// components/payment/PaymentModule.tsx

"use client";

import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { usePayment } from "@/app/hooks/usePayment";
import { useToast } from "@/app/hooks/useToast";
import * as PortOne from "@portone/browser-sdk/v2";
import PaymentSelector from "./PaymentSelector";
import PaymentButton from "./PaymentButton";
import { getAuthUserId } from "@/app/auth/authUtils";
import { useRouter } from "next/navigation";
import { useExchangeRate } from "@/app/hooks/useExchangeRate";

interface PaymentModuleProps {
    table: string;
    merchId: string;
    merchName: string;
    amount: number;
    defaultCurrency: PortOne.Entity.Currency;
    quantity: number;
}

export default function PaymentModule({
    table,
    merchId,
    merchName,
    amount,
    quantity,
    defaultCurrency = "CURRENCY_KRW",
}: PaymentModuleProps) {
    const [payMethod, setPayMethod] =
        useState<PortOne.Entity.PayMethod>("CARD");

    const [currency, setCurrency] =
        useState<PortOne.Entity.Currency>(defaultCurrency);

    const [easyPayProvider, setEasyPayProvider] =
        useState<PortOne.Entity.EasyPayProvider>("EASY_PAY_PROVIDER_TOSSPAY");

    const [cardProvider, setCardProvider] =
        useState<PortOne.Entity.Country>("COUNTRY_KR");

    const [totalAmount, setTotalAmount] = useState(amount * quantity);

    const toast = useToast();
    const router = useRouter();
    const { getExchangeRate, convertAmount } = useExchangeRate();

    // Get exchange rate info and converted amount
    const { data: rateInfo } = getExchangeRate(defaultCurrency, currency);
    const { data: convertedAmountData } = convertAmount(
        amount,
        defaultCurrency,
        currency
    );

    useEffect(() => {
        console.log("currency changed to:", currency);
        if (convertedAmountData) {
            console.log("convertedAmountData", convertedAmountData);
            setTotalAmount(convertedAmountData.converted * quantity);
        }
    }, [currency, convertedAmountData, quantity]);

    const sessionHash = nanoid();

    const { createPayment, isCreating, createError } = usePayment();
    const { verifyPayment, isVerifying, verifyError } = usePayment();

    const handlePayment = async () => {
        try {
            const userId = await getAuthUserId();
            if (!userId) {
                // 현재 페이지 주소를 가져오기
                const callbackUrl = window.location.href;
                router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
                return;
            }

            const result = await createPayment.mutateAsync({
                sessionHash,
                userId,
                table,
                merchId,
                merchName,
                payMethod,
                easyPayProvider,
                cardProvider,
                currency,
                quantity,
            });

            if (result.success) {
                const paymentLog = result.data;
                if (
                    !paymentLog ||
                    !paymentLog.channelKey ||
                    !paymentLog.storeId ||
                    !paymentLog.convertedAmount ||
                    !paymentLog.nonce
                ) {
                    toast.error("Invalid Payment");
                    return;
                }
                const response = await PortOne.requestPayment({
                    paymentId: paymentLog.paymentLogId,
                    orderName: merchName,
                    totalAmount: paymentLog.convertedAmount,
                    currency,
                    payMethod,
                    storeId: paymentLog.storeId,
                    channelKey: paymentLog.channelKey,
                });

                if (!response) {
                    toast.error("Payment failed");
                    return;
                }

                if (response.code === "PAYMENT_SUCCESS") {
                    const verifyResult = await verifyPayment.mutateAsync({
                        paymentLogId: paymentLog.paymentLogId,
                        sessionHash,
                        userId,
                        merchId,
                        nonce: paymentLog.nonce,
                    });

                    if (verifyResult.success) {
                        if (
                            verifyResult.data?.status ===
                            "VIRTUAL_ACCOUNT_ISSUED"
                        ) {
                            toast.success("Virtual account has been issued");
                            return;
                        } else if (verifyResult.data?.status === "COMPLETED") {
                            toast.success("Payment successful");
                            return;
                        }
                    } else {
                        toast.error(
                            verifyResult.error || "Payment verification failed"
                        );
                        return;
                    }
                } else {
                    toast.error("Payment failed");
                    return;
                }
            } else {
                toast.error(result.error || "Payment creation failed");
                return;
            }
        } catch (error) {
            toast.error("Payment processing error");
            return;
        }
    };

    return (
        <div className="p-4 border rounded-lg">
            <PaymentSelector
                payMethod={payMethod}
                currency={currency}
                easyPayProvider={easyPayProvider}
                cardProvider={cardProvider}
                onPayMethodChange={setPayMethod}
                onCurrencyChange={setCurrency}
                onEasyPayProviderChange={setEasyPayProvider}
                onCardProviderChange={setCardProvider}
                exchangeRateDisplay={
                    rateInfo
                        ? `1 USD = ${(1 / rateInfo.rate).toFixed(2)} KRW`
                        : ""
                }
                lastUpdated={
                    rateInfo
                        ? new Date(rateInfo.createdAt).toLocaleString()
                        : ""
                }
            />

            <PaymentButton
                onClick={handlePayment}
                isLoading={isCreating}
                disabled={isCreating}
                amount={totalAmount}
                currency={currency}
            />

            {createError && (
                <div className="text-red-500 mt-2">
                    {createError instanceof Error
                        ? createError.message
                        : "Payment failed"}
                </div>
            )}
        </div>
    );
}
