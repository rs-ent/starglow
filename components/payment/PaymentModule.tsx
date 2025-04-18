/// components/payment/PaymentModule.tsx

"use client";

import {
    PayMethod,
    ProductTable,
    Currency,
    EasyPayProvider,
    CardProvider,
} from "@/lib/types/payment";
import { Payment, Wallet } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import PaymentSelector from "./PaymentSelector";
import { useEffect, useState, useMemo } from "react";
import Button from "../atoms/Button";
import { ShoppingBasket } from "lucide-react";
import { useExchangeRate } from "@/app/hooks/useExchangeRate";
import { usePayment } from "@/app/hooks/usePayment";
import { useAuthUserId } from "@/app/auth/authUtils.Client";
import { useToast } from "@/app/hooks/useToast";
import { useLoading } from "@/app/hooks/useLoading";
import { getPayment } from "@/app/actions/payment";
import { usePaymentPostProcessor } from "@/app/hooks/usePaymentPostProcessor";

interface PaymentModuleProps {
    productTable: ProductTable;
    productId: string;
    quantity: number;

    productInitialCurrencyForDisplay?: Currency;
    productInitialPriceForDisplay?: number;

    needWallet?: boolean;

    buttonText?: string;

    onCurrencyChange?: (currency: Currency) => void;
    onDisplayPriceChange?: (price: number) => void;

    onPaymentSuccess?: (payment: Payment) => void;
    onPaymentError?: (error: Error) => void;
    onPaymentCancel?: (payment: Payment) => void;
    onPaymentRefund?: (payment: Payment) => void;
}

export default function PaymentModule({
    productTable,
    productId,
    quantity,
    productInitialCurrencyForDisplay = "CURRENCY_KRW",
    productInitialPriceForDisplay = 0,

    needWallet = false,

    buttonText = "Get Now",

    onCurrencyChange,
    onDisplayPriceChange,

    onPaymentSuccess,
    onPaymentError,
    onPaymentCancel,
    onPaymentRefund,
}: PaymentModuleProps) {
    const toast = useToast();
    const { startLoading, endLoading } = useLoading();
    const router = useRouter();
    const searchParams = useSearchParams();

    const paymentResult = useMemo(
        () => ({
            code: searchParams.get("code"),
            message: searchParams.get("message"),
            paymentId: searchParams.get("paymentId"),
            pgCode: searchParams.get("pgCode"),
            pgMessage: searchParams.get("pgMessage"),
            transactionType: searchParams.get("transactionType"),
            txId: searchParams.get("txId"),
        }),
        [searchParams]
    );

    const { getExchangeRate } = useExchangeRate();
    const {
        initiatePayment,
        resetAndInitiatePayment,
        isCreatingPayment,
        currentPaymentId,
        currentPayment,
        setCurrentPaymentId,
    } = usePayment();

    const {
        processPayment: postProcess,
        isLoading: isPostProcessing,
        error: postProcessError,
        status: postProcessStatus,
        details: postProcessDetails,
    } = usePaymentPostProcessor(currentPaymentId ?? "", {
        onSuccess: () => {
            toast.success("Payment processed successfully");
        },
        onError: (error) => {
            toast.error("Payment processing failed");
        },
    });

    const exchangeRate = getExchangeRate(
        productInitialCurrencyForDisplay,
        productInitialCurrencyForDisplay === "CURRENCY_KRW"
            ? "CURRENCY_USD"
            : "CURRENCY_KRW"
    );

    const authUserId = useAuthUserId();
    const [payMethod, setPayMethod] = useState<PayMethod>("CARD");
    const [currency, setCurrency] = useState<Currency>(
        productInitialCurrencyForDisplay ?? "CURRENCY_KRW"
    );
    const [easyPayProvider, setEasyPayProvider] =
        useState<EasyPayProvider | null>(null);
    const [cardProvider, setCardProvider] = useState<CardProvider | null>(null);

    const handleCurrencyChange = (currency: Currency) => {
        setCurrency(currency);
        onCurrencyChange?.(currency);

        if (
            onDisplayPriceChange &&
            productInitialPriceForDisplay &&
            productInitialCurrencyForDisplay &&
            !exchangeRate.isLoading &&
            exchangeRate.data
        ) {
            if (productInitialCurrencyForDisplay === currency) {
                onDisplayPriceChange(productInitialPriceForDisplay);
            } else {
                onDisplayPriceChange(
                    productInitialPriceForDisplay * exchangeRate.data.rate
                );
            }
        }
    };

    const handlePay = () => {
        startLoading();

        const redirectUrl = window.location.href.split("?")[0];

        const paymentInput = {
            productTable,
            userId: authUserId ?? undefined,
            productId,
            quantity,
            needWallet,
            currency,
            payMethod,
            easyPayProvider: easyPayProvider ?? undefined,
            cardProvider: cardProvider ?? undefined,
            redirectUrl,
        };

        resetAndInitiatePayment(paymentInput);
    };

    useEffect(() => {
        if (!paymentResult.paymentId) return;

        const handlePaymentResult = async () => {
            startLoading();
            try {
                const payment = await getPayment({
                    paymentId: paymentResult.paymentId as string,
                });

                if (!payment) {
                    endLoading();
                    return;
                }

                switch (payment.status) {
                    case "PAID":
                        console.log("Payment Success", payment);
                        toast.success("Payment successful");
                        postProcess(payment);
                        onPaymentSuccess?.(payment);
                        break;
                    case "FAILED":
                        console.log("Payment Failed", payment);
                        toast.error("Payment failed");
                        onPaymentError?.(
                            new Error(payment.statusReason || "Payment failed")
                        );
                        break;
                    case "CANCELLED":
                        console.log("Payment Cancelled", payment);
                        toast.error("Payment cancelled");
                        onPaymentCancel?.(payment);
                        break;
                    case "REFUNDED":
                        console.log("Payment Refunded", payment);
                        toast.success("Payment refunded");
                        onPaymentRefund?.(payment);
                        break;
                }
            } catch (error) {
                onPaymentError?.(
                    error instanceof Error
                        ? error
                        : new Error("Payment verification failed")
                );
            }
        };

        handlePaymentResult();
    }, [paymentResult.paymentId]);

    useEffect(() => {
        if (postProcessStatus?.status === "COMPLETED") {
            if (postProcessDetails?.type === "NFT_TRANSFER") {
                toast.success("NFT transfer completed");
            } else if (postProcessDetails?.type === "NFT_ESCROW_TRANSFER") {
                toast.success("NFT escrow transfer completed");
            } else if (postProcessDetails?.type === "EVENT_PROCESS") {
                toast.success("Event processing completed");
            }
        }
    }, [postProcessStatus, postProcessDetails]);

    useEffect(() => {
        if (currentPaymentId && !isCreatingPayment) {
            const timer = setTimeout(() => {
                router.push(`/payment/${currentPaymentId}`);
                endLoading();
            }, 500);
            return () => clearTimeout(timer);
        } else if (!currentPaymentId && !isCreatingPayment) {
            endLoading();
        }
    }, [currentPaymentId, isCreatingPayment]);

    return (
        <div>
            <PaymentSelector
                payMethod={payMethod}
                currency={currency}
                easyPayProvider={easyPayProvider}
                cardProvider={cardProvider}
                onPayMethodChange={setPayMethod}
                onCurrencyChange={handleCurrencyChange}
                onEasyPayProviderChange={setEasyPayProvider}
                onCardProviderChange={setCardProvider}
            />

            <Button
                onClick={handlePay}
                variant="default"
                className="w-full mt-4"
                icon={ShoppingBasket}
            >
                {buttonText}
            </Button>
        </div>
    );
}
