/// components/payment/PaymentModule.tsx

"use client";

import {
    PayMethod,
    ProductTable,
    Currency,
    EasyPayProvider,
    CardProvider,
} from "@/lib/types/payment";
import { Payment } from "@prisma/client";
import { useRouter } from "next/navigation";
import PaymentSelector from "./PaymentSelector";
import { useEffect, useState } from "react";
import Button from "../atoms/Button";
import { ShoppingBasket } from "lucide-react";
import { useExchangeRate } from "@/app/hooks/useExchangeRate";
import { usePayment } from "@/app/hooks/usePayment";
import { useAuthUserId } from "@/app/auth/authUtils.Client";
import { useToast } from "@/app/hooks/useToast";
import { useLoading } from "@/app/hooks/useLoading";

interface PaymentModuleProps {
    productTable: ProductTable;
    productId: string;
    quantity: number;

    productInitialCurrencyForDisplay?: Currency;
    productInitialPriceForDisplay?: number;

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

    buttonText = "Get Now",

    onCurrencyChange,
    onDisplayPriceChange,

    onPaymentSuccess,
    onPaymentError,
    onPaymentCancel,
    onPaymentRefund,
}: PaymentModuleProps) {
    const toast = useToast();
    const { startLoading, endLoading, isLoading } = useLoading();
    const router = useRouter();

    const { getExchangeRate } = useExchangeRate();
    const {
        initiatePayment,
        resetAndInitiatePayment,
        isCreatingPayment,
        currentPaymentId,
        currentPayment,
        setCurrentPaymentId,
    } = usePayment();

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
        console.log("Payment process starting with payment method:", payMethod);

        const redirectUrl = window.location.href.split("?")[0];

        console.log("Product Table", productTable);
        console.log("Product ID", productId);
        console.log("Quantity", quantity);
        console.log("Currency", currency);
        console.log("Pay Method", payMethod);
        console.log("Easy Pay Provider", easyPayProvider);
        console.log("Card Provider", cardProvider);
        console.log("Redirect URL", redirectUrl);

        const paymentInput = {
            productTable,
            userId: authUserId ?? undefined,
            productId,
            quantity,
            currency,
            payMethod,
            easyPayProvider: easyPayProvider ?? undefined,
            cardProvider: cardProvider ?? undefined,
            redirectUrl,
        };

        console.log("Submitting payment with input:", paymentInput);
        resetAndInitiatePayment(paymentInput);
    };

    useEffect(() => {
        console.log("Current Payment ID changed to:", currentPaymentId);
        console.log(
            "Payment creation state:",
            isCreatingPayment ? "Creating" : "Completed"
        );

        // Only handle payment window opening when we have a payment ID and payment creation is complete
        if (currentPaymentId && !isCreatingPayment) {
            console.log("Opening payment window for ID:", currentPaymentId);
            const timer = setTimeout(() => {
                router.push(`/payment/${currentPaymentId}`);
                endLoading();
            }, 1000);
            return () => clearTimeout(timer);
        } else if (!currentPaymentId && !isCreatingPayment) {
            console.log("Payment creation completed but no payment ID was set");
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
