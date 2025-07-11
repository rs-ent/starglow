/// components/payment/PaymentModule.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { ShoppingBasket } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { getPayment } from "@/app/actions/payment";
import { useAuthUserId } from "@/app/auth/authUtils.Client";
import { useExchangeRate } from "@/app/hooks/useExchangeRate";
import { useLoading } from "@/app/hooks/useLoading";
import { usePayment } from "@/app/hooks/usePayment";
import { usePaymentPostProcessor } from "@/app/hooks/usePaymentPostProcessor";
import { useToast } from "@/app/hooks/useToast";

import PaymentSelector from "./PaymentSelector";
import Button from "../atoms/Button";
import WarningPopup from "../atoms/WarningPopup";

import type { PaymentPostProcessorDetails } from "@/app/hooks/usePaymentPostProcessor";
import type { ExchangeRateInfo } from "@/app/actions/exchangeRate";
import type {
    PayMethod,
    ProductTable,
    Currency,
    EasyPayProvider,
    CardProvider,
} from "@/lib/types/payment";
import type { Payment } from "@prisma/client";

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
    onPaymentError?: (error?: Error) => void;
    onPaymentCancel?: (payment: Payment) => void;
    onPaymentRefund?: (payment: Payment) => void;
    onPaymentComplete?: (result?: PaymentPostProcessorDetails) => void;
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
    onPaymentComplete,
}: PaymentModuleProps) {
    const toast = useToast();
    const { startLoading, endLoading } = useLoading();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [message, setMessage] = useState(
        "If you leave this page before the payment is completed, the process will be lost."
    );
    const [isHandlingResult, setIsHandlingResult] = useState(false);

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
    const { initiatePayment, isCreatingPayment, currentPaymentId } =
        usePayment();

    const [exchangeRateInfo, setExchangeRateInfo] =
        useState<ExchangeRateInfo | null>(null);
    const [isExchangeRateLoading, setIsExchangeRateLoading] = useState(false);

    const {
        processPayment: postProcess,
        isLoading: isPostProcessing,
        status: postProcessStatus,
        details: postProcessDetails,
    } = usePaymentPostProcessor(currentPaymentId ?? "", {
        onSuccess: () => {
            onPaymentComplete?.();
            toast.success("Payment processed successfully");
        },
        onError: (error) => {
            onPaymentError?.(error);
            toast.error("Payment processing failed");
            console.error("Payment processing failed", error);
        },
    });

    useEffect(() => {
        const fetchExchangeRate = async () => {
            setIsExchangeRateLoading(true);
            try {
                const rateInfo = await getExchangeRate(
                    productInitialCurrencyForDisplay,
                    productInitialCurrencyForDisplay === "CURRENCY_KRW"
                        ? "CURRENCY_USD"
                        : "CURRENCY_KRW"
                );
                setExchangeRateInfo(rateInfo);
            } catch (error) {
                console.error("Failed to fetch exchange rate:", error);
                setExchangeRateInfo(null);
            } finally {
                setIsExchangeRateLoading(false);
            }
        };

        void fetchExchangeRate();
    }, [getExchangeRate, productInitialCurrencyForDisplay]);

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
            !isExchangeRateLoading &&
            exchangeRateInfo
        ) {
            if (productInitialCurrencyForDisplay === currency) {
                onDisplayPriceChange(productInitialPriceForDisplay);
            } else {
                onDisplayPriceChange(
                    productInitialPriceForDisplay * exchangeRateInfo.rate
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

        initiatePayment(paymentInput);
    };

    useEffect(() => {
        if (!paymentResult.paymentId || isHandlingResult) return;

        const handlePaymentResult = async () => {
            setIsHandlingResult(true);
            startLoading();
            try {
                const payment = await getPayment({
                    paymentId: paymentResult.paymentId as string,
                });

                if (!payment) {
                    endLoading();
                    return;
                }

                switch (payment.productTable) {
                    case "nfts":
                        setMessage(
                            "NFTs are being transferred. Please keep this window open."
                        );
                        break;
                    default:
                        setMessage(
                            "Payment is being processed. Please keep this window open."
                        );
                        break;
                }

                switch (payment.status) {
                    case "PAID":
                        toast.success(
                            "Payment is processing. Please keep this window open."
                        );
                        setMessage(
                            "NFTs are being transferred. Please keep this window open."
                        );
                        postProcess(payment).catch((error) => {
                            console.error("Failed to post process:", error);
                        });
                        onPaymentSuccess?.(payment);
                        break;
                    case "FAILED":
                        toast.error("Payment failed");
                        onPaymentError?.(
                            new Error(payment.statusReason || "Payment failed")
                        );
                        break;
                    case "CANCELLED":
                        toast.error("Payment cancelled");
                        onPaymentCancel?.(payment);
                        break;
                    case "REFUNDED":
                        toast.success("Payment refunded");
                        onPaymentRefund?.(payment);
                        break;
                }
            } catch (error) {
                console.error("Failed to handle payment result:", error);
                onPaymentError?.(
                    error instanceof Error
                        ? error
                        : new Error("Payment verification failed")
                );
            }
        };

        void handlePaymentResult();
    }, [
        paymentResult.paymentId,
        startLoading,
        endLoading,
        postProcess,
        onPaymentSuccess,
        toast,
        onPaymentError,
        onPaymentCancel,
        onPaymentRefund,
        isHandlingResult,
    ]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isPostProcessing) {
                e.preventDefault();
                const message =
                    "If you leave this page before the payment is completed, the process will be lost.";
                return message;
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () =>
            window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isPostProcessing]);

    useEffect(() => {
        if (postProcessStatus?.status === "COMPLETED") {
            onPaymentComplete?.(postProcessDetails);
            if (postProcessDetails?.type === "NFT_TRANSFER") {
                toast.success("NFT transfer completed");
                onPaymentComplete?.(postProcessDetails);
            } else if (postProcessDetails?.type === "NFT_ESCROW_TRANSFER") {
                toast.success("NFT escrow transfer completed");
                onPaymentComplete?.(postProcessDetails);
            } else if (postProcessDetails?.type === "EVENT_PROCESS") {
                toast.success("Event processing completed");
                onPaymentComplete?.(postProcessDetails);
            }
        }
    }, [postProcessStatus, postProcessDetails, onPaymentComplete, toast]);

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
    }, [currentPaymentId, isCreatingPayment, router, endLoading]);

    return (
        <div>
            <WarningPopup
                open={isPostProcessing}
                title="Please keep this window open."
                message={message}
                loading={true}
                preventClose={true}
            />

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
