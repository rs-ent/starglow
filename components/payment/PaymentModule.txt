/// components/payment/PaymentModule.tsx

"use client";

import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { usePayment } from "@/app/hooks/usePayment";
import { useToast } from "@/app/hooks/useToast";
import * as PortOne from "@portone/browser-sdk/v2";
import PaymentSelector from "./PaymentSelector";
import PaymentButton from "./PaymentButton";
import { getUserId } from "@/app/actions/auth";
import { useExchangeRate } from "@/app/hooks/useExchangeRate";
import { PaymentResponse } from "@portone/browser-sdk/v2";
import { VerifyPaymentProps } from "@/app/actions/payment";
import PayPalButton from "./PayPalButton";
import AuthButton from "@/components/atoms/AuthButton";
import { getPaymentLog } from "@/app/actions/payment";

export interface PaymentModuleProps {
    table: string;
    merchId: string;
    merchName: string;
    amount: number;
    defaultCurrency: PortOne.Entity.Currency;
    quantity: number;
    onSuccess?: () => void;
    paymentResult?: {
        code: string | null;
        message: string | null;
        paymentId: string | null;
        pgCode: string | null;
        pgMessage: string | null;
        transactionType: string | null;
        txId: string | null;
    };
}

export default function PaymentModule({
    table,
    merchId,
    merchName,
    amount,
    quantity,
    defaultCurrency = "CURRENCY_KRW",
    onSuccess,
    paymentResult,
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
    const [userId, setUserId] = useState<string | null>(null);
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    const toast = useToast();
    const { getExchangeRate, convertAmount } = useExchangeRate();
    const { createPayment, isCreating, createError } = usePayment();
    const { verifyPayment, isVerifying, verifyError } = usePayment();

    const { data: rateInfo } = getExchangeRate(defaultCurrency, currency);
    const { data: convertedAmountData } = convertAmount(
        amount,
        defaultCurrency,
        currency
    );

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const id = await getUserId();
                console.log("id", id);
                setUserId(id);
            } finally {
                setIsAuthChecking(false);
            }
        };
        checkAuth();
    }, []);

    useEffect(() => {
        if (convertedAmountData) {
            if (currency === "CURRENCY_USD") {
                setTotalAmount(
                    (convertedAmountData.converted * quantity) / 100
                );
            } else {
                setTotalAmount(convertedAmountData.converted * quantity);
            }
        }
    }, [currency, convertedAmountData, quantity]);

    useEffect(() => {
        const verifyRedirectedPayment = async () => {
            if (paymentResult?.paymentId && paymentResult?.txId) {
                try {
                    // DB에서 payment 정보 조회
                    const paymentLog = await getPaymentLog(
                        paymentResult.paymentId
                    );
                    if (!paymentLog) {
                        toast.error("Payment information not found");
                        return;
                    }

                    // 결제 검증 진행
                    const verifyResult = await verifyPayment.mutateAsync({
                        paymentLogId: paymentResult.paymentId,
                        sessionHash: paymentLog.sessionHash,
                        userId: paymentLog.userId,
                        merchId,
                        nonce: paymentLog.nonce,
                        txId: paymentResult.txId,
                    });

                    if (verifyResult.success) {
                        if (verifyResult.status === "VIRTUAL_ACCOUNT_ISSUED") {
                            toast.success("Virtual account has been issued");
                        } else if (verifyResult.status === "COMPLETED") {
                            toast.success("Payment successful");
                            console.log("Payment successful");
                            if (onSuccess) {
                                onSuccess();
                            }
                        }
                    } else {
                        toast.error(
                            verifyResult.error || "Payment verification failed"
                        );
                    }
                } catch (error) {
                    console.error("Payment verification error:", error);
                    toast.error("Payment verification failed");
                }
            } else if (paymentResult?.code === "FAILURE_TYPE_PG") {
                toast.error(paymentResult.pgMessage || "Payment failed");
            }
        };

        if (paymentResult?.paymentId && paymentResult?.txId) {
            console.log("paymentResult", paymentResult);
            verifyRedirectedPayment();
        }
    }, [paymentResult?.paymentId, paymentResult?.txId]);

    const sessionHash = nanoid();

    if (isAuthChecking) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="flex flex-col items-center gap-4 p-8">
                <p className="text-lg text-gray-600">
                    Please sign in to purchase
                </p>
                <AuthButton variant="default" className="w-full max-w-xs" />
            </div>
        );
    }

    const handlePaymentCreate = async () => {
        try {
            console.log("Payment creation params:", {
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

            console.log("Payment creation result:", result);

            if (!result.success || !result.data) {
                throw new Error(result.error || "Payment creation failed");
            }

            return result;
        } catch (error) {
            console.error("Payment creation error:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Payment creation failed"
            );
            return null;
        }
    };

    const handlePaymentVerify = async (
        paymentLog: VerifyPaymentProps,
        response: PaymentResponse
    ) => {
        if (response.txId) {
            const verifyResult = await verifyPayment.mutateAsync({
                paymentLogId: paymentLog.paymentLogId,
                sessionHash: paymentLog.sessionHash,
                userId: paymentLog.userId,
                merchId,
                nonce: paymentLog.nonce,
                txId: response.txId,
            });

            console.log("verifyResult", verifyResult);

            if (verifyResult.success) {
                if (verifyResult.status === "VIRTUAL_ACCOUNT_ISSUED") {
                    toast.success("Virtual account has been issued");
                } else if (verifyResult.status === "COMPLETED") {
                    toast.success("Payment successful");
                    console.log("Payment successful");
                    if (onSuccess) {
                        onSuccess();
                    }
                }
            } else {
                toast.error(
                    verifyResult.error || "Payment verification failed"
                );
            }
        } else {
            toast.error("Payment failed: No transaction ID received");
        }
    };

    const handlePayment = async () => {
        try {
            const result = await handlePaymentCreate();
            if (!result) return;

            if (!result.success || !result.data) {
                toast.error(result.error || "Payment creation failed");
                return null;
            }

            console.log("result", result);

            const paymentLog = result.data;
            console.log("paymentLog", paymentLog);
            if (
                !paymentLog.channelKey ||
                !paymentLog.storeId ||
                !paymentLog.convertedAmount ||
                !paymentLog.nonce
            ) {
                toast.error("Invalid Payment");
                return null;
            }

            const response = await PortOne.requestPayment({
                paymentId: paymentLog.paymentLogId,
                orderName: merchName,
                totalAmount: Math.round(paymentLog.convertedAmount!),
                currency,
                payMethod,
                storeId: paymentLog.storeId!,
                channelKey: paymentLog.channelKey!,
                redirectUrl:
                    typeof window !== "undefined" ? window.location.href : "",
            });

            console.log("requestPayment response", response);

            if (!response) {
                toast.error("Payment failed");
                return;
            }

            await handlePaymentVerify(
                {
                    paymentLogId: paymentLog.paymentLogId,
                    sessionHash: sessionHash,
                    userId: paymentLog.userId,
                    merchId,
                    nonce: paymentLog.nonce,
                } as VerifyPaymentProps,
                response
            );
        } catch (error) {
            toast.error(`Handle payment error: ${error}`);
        }
    };

    const handlePayMethodChange = (payMethod: PortOne.Entity.PayMethod) => {
        setPayMethod(payMethod);
        if (payMethod === "PAYPAL") {
            setCurrency("CURRENCY_USD");
        }
    };

    return (
        <div className="p-4 border rounded-lg">
            <PaymentSelector
                payMethod={payMethod}
                currency={currency}
                easyPayProvider={easyPayProvider}
                cardProvider={cardProvider}
                onPayMethodChange={handlePayMethodChange}
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

            {payMethod === "PAYPAL" ? (
                <PayPalButton
                    sessionHash={sessionHash}
                    merchId={merchId}
                    merchName={merchName}
                    onCreatePayment={handlePaymentCreate}
                    onVerifyPayment={handlePaymentVerify}
                    disabled={isCreating}
                />
            ) : (
                <PaymentButton
                    onClick={handlePayment}
                    isLoading={isCreating}
                    disabled={isCreating}
                    amount={totalAmount}
                    currency={currency}
                />
            )}

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
