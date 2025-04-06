"use client";

import { CreditCardIcon, Smartphone, Wallet, DollarSign } from "lucide-react";
import { Entity } from "@portone/browser-sdk/v2";
import { PayMethod } from "./PaymentExecutor";
import Button from "../atoms/Button";

interface PaymentMethodSelectorProps {
    paymentMethod: PayMethod;
    easyPayProvider: Entity.EasyPayProvider;
    amount: number;
    currency: "CURRENCY_USD" | "CURRENCY_KRW";
    onPaymentMethodChange: (method: PayMethod) => void;
    onEasyPayProviderChange: (provider: Entity.EasyPayProvider) => void;
    onCurrencyChange: (currency: "CURRENCY_USD" | "CURRENCY_KRW") => void;
    exchangeRateDisplay: string;
    lastUpdated: string;
}

export default function PaymentMethodSelector({
    paymentMethod,
    easyPayProvider,
    amount,
    currency,
    onPaymentMethodChange,
    onEasyPayProviderChange,
    onCurrencyChange,
    exchangeRateDisplay,
    lastUpdated,
}: PaymentMethodSelectorProps) {
    return (
        <div className="space-y-5 md:space-y-6">
            {/* Currency selector */}
            <div>
                <label className="block text-xs md:text-sm font-accent uppercase tracking-wider text-foreground/80 mb-2">
                    Currency
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                        onClick={() => onCurrencyChange("CURRENCY_USD")}
                        className={`flex items-center justify-center p-2 sm:p-3 rounded-lg border text-sm md:text-base ${
                            currency === "CURRENCY_USD"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/50 text-foreground/70"
                        }`}
                    >
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                        <span>USD</span>
                    </button>
                    <button
                        onClick={() => onCurrencyChange("CURRENCY_KRW")}
                        disabled={paymentMethod === "PAYPAL"}
                        className={`flex items-center justify-center p-2 sm:p-3 rounded-lg border text-sm md:text-base 
                            ${
                                currency === "CURRENCY_KRW" &&
                                paymentMethod !== "PAYPAL"
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border/50"
                            } 
                            ${
                                paymentMethod === "PAYPAL"
                                    ? "opacity-50 cursor-not-allowed text-foreground/40"
                                    : "text-foreground/70"
                            }`}
                        title={
                            paymentMethod === "PAYPAL"
                                ? "PayPal only supports USD"
                                : undefined
                        }
                    >
                        <span>KRW</span>
                    </button>
                </div>
                <div className="mt-2 text-xs text-center">
                    {exchangeRateDisplay && (
                        <div className="text-foreground/50">
                            {exchangeRateDisplay}
                            <br />
                            <span className="text-[10px]">
                                Last updated: {lastUpdated}
                            </span>
                        </div>
                    )}
                    {paymentMethod === "PAYPAL" && (
                        <div className="mt-1 text-yellow-500">
                            Note: PayPal only supports USD currency
                        </div>
                    )}
                </div>
            </div>

            {/* Payment method selector */}
            <div>
                <label className="block text-xs md:text-sm font-accent uppercase tracking-wider text-foreground/80 mb-2">
                    Payment method
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <button
                        onClick={() => onPaymentMethodChange("CARD")}
                        className={`flex items-center justify-center p-2 sm:p-3 rounded-lg border text-sm md:text-base ${
                            paymentMethod === "CARD"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/50 text-foreground/70"
                        }`}
                    >
                        <CreditCardIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                        <span>Card</span>
                    </button>
                    <button
                        onClick={() => onPaymentMethodChange("PAYPAL")}
                        className={`flex items-center justify-center p-2 sm:p-3 rounded-lg border text-sm md:text-base ${
                            paymentMethod === "PAYPAL"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/50 text-foreground/70"
                        }`}
                    >
                        <Wallet className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                        <span>PayPal</span>
                    </button>
                    <button
                        onClick={() => onPaymentMethodChange("EASY_PAY")}
                        className={`flex items-center justify-center p-2 sm:p-3 rounded-lg border text-sm md:text-base ${
                            paymentMethod === "EASY_PAY"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/50 text-foreground/70"
                        }`}
                    >
                        <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                        <span>Easy Pay</span>
                    </button>
                </div>
            </div>

            {/* Easy Pay Provider selector */}
            {paymentMethod === "EASY_PAY" && (
                <div>
                    <label className="block text-xs md:text-sm font-accent uppercase tracking-wider text-foreground/80 mb-2">
                        Easy Pay Provider
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <Button
                            onClick={() =>
                                onEasyPayProviderChange(
                                    "EASY_PAY_PROVIDER_TOSS_BRANDPAY"
                                )
                            }
                            variant={
                                easyPayProvider ===
                                "EASY_PAY_PROVIDER_TOSS_BRANDPAY"
                                    ? "default"
                                    : "outline"
                            }
                            img="/icons/payment/toss.svg"
                            frameSize={70}
                            textSize={16}
                            paddingSize={16}
                            className="w-full h-12"
                        >
                            {""}
                        </Button>
                        <Button
                            onClick={() =>
                                onEasyPayProviderChange(
                                    "EASY_PAY_PROVIDER_KAKAOPAY"
                                )
                            }
                            variant={
                                easyPayProvider === "EASY_PAY_PROVIDER_KAKAOPAY"
                                    ? "default"
                                    : "outline"
                            }
                            img="/icons/payment/kakao.svg"
                            frameSize={65}
                            textSize={16}
                            paddingSize={16}
                            className="w-full h-12"
                        >
                            {""}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
