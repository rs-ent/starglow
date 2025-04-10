/// components/payment/PaymentSelector.tsx

"use client";

import { CreditCardIcon, Smartphone, Wallet } from "lucide-react";
import * as PortOne from "@portone/browser-sdk/v2";
import Button from "../atoms/Button";

interface PaymentSelectorProps {
    payMethod: PortOne.Entity.PayMethod;
    currency: PortOne.Entity.Currency;
    easyPayProvider: PortOne.Entity.EasyPayProvider;
    cardProvider: PortOne.Entity.Country;
    exchangeRateDisplay: string;
    lastUpdated: string;
    onPayMethodChange: (payMethod: PortOne.Entity.PayMethod) => void;
    onCurrencyChange: (currency: PortOne.Entity.Currency) => void;
    onEasyPayProviderChange: (
        easyPayProvider: PortOne.Entity.EasyPayProvider
    ) => void;
    onCardProviderChange: (cardProvider: PortOne.Entity.Country) => void;
}

export default function PaymentSelector({
    payMethod,
    currency,
    easyPayProvider,
    cardProvider,
    exchangeRateDisplay,
    lastUpdated,
    onPayMethodChange,
    onCurrencyChange,
    onEasyPayProviderChange,
    onCardProviderChange,
}: PaymentSelectorProps) {
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
                        disabled={payMethod === "EASY_PAY"}
                        className={`flex items-center justify-center p-2 sm:p-3 rounded-lg border text-sm md:text-base 
                            ${
                                currency === "CURRENCY_USD" &&
                                payMethod !== "EASY_PAY"
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border/50"
                            } 
                            ${
                                payMethod === "EASY_PAY"
                                    ? "opacity-50 cursor-not-allowed text-foreground/40"
                                    : "text-foreground/70"
                            }`}
                        title={
                            payMethod === "EASY_PAY"
                                ? "Only supports KRW"
                                : undefined
                        }
                    >
                        <span>＄ USD</span>
                    </button>
                    <button
                        onClick={() => onCurrencyChange("CURRENCY_KRW")}
                        disabled={payMethod === "PAYPAL"}
                        className={`flex items-center justify-center p-2 sm:p-3 rounded-lg border text-sm md:text-base 
                            ${
                                currency === "CURRENCY_KRW" &&
                                payMethod !== "PAYPAL"
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border/50"
                            } 
                            ${
                                payMethod === "PAYPAL"
                                    ? "opacity-50 cursor-not-allowed text-foreground/40"
                                    : "text-foreground/70"
                            }`}
                        title={
                            payMethod === "PAYPAL"
                                ? "PayPal only supports USD"
                                : undefined
                        }
                    >
                        <span>￦ KRW</span>
                    </button>
                </div>
                <div className="mt-2 text-xs text-center">
                    {payMethod === "PAYPAL" && (
                        <div className="mt-1 text-yellow-500">
                            Note: PayPal only supports USD currency
                        </div>
                    )}
                    {payMethod === "EASY_PAY" && (
                        <div className="mt-1 text-yellow-500">
                            Note: Easy Pay only supports KRW currency
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
                        onClick={() => onPayMethodChange("CARD")}
                        className={`flex items-center justify-center p-2 sm:p-3 rounded-lg border text-sm md:text-base ${
                            payMethod === "CARD"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/50 text-foreground/70"
                        }`}
                    >
                        <CreditCardIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                        <span>Card</span>
                    </button>
                    <button
                        onClick={() => onPayMethodChange("PAYPAL")}
                        className={`flex items-center justify-center p-2 sm:p-3 rounded-lg border text-sm md:text-base ${
                            payMethod === "PAYPAL"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/50 text-foreground/70"
                        }`}
                    >
                        <Wallet className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                        <span>PayPal</span>
                    </button>
                    <button
                        onClick={() => onPayMethodChange("EASY_PAY")}
                        className={`flex items-center justify-center p-2 sm:p-3 rounded-lg border text-sm md:text-base ${
                            payMethod === "EASY_PAY"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/50 text-foreground/70"
                        }`}
                    >
                        <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                        <span>Easy Pay</span>
                    </button>
                </div>
            </div>

            {/* Card Provider selector */}
            {payMethod === "CARD" && (
                <div>
                    <label className="block text-xs md:text-sm font-accent uppercase tracking-wider text-foreground/80 mb-2">
                        Card Type
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <Button
                            onClick={() => onCardProviderChange("COUNTRY_KR")}
                            variant={
                                cardProvider === "COUNTRY_KR"
                                    ? "default"
                                    : "outline"
                            }
                            img="/icons/flags/korea.svg"
                            frameSize={25}
                            textSize={5}
                            gapSize={10}
                            paddingSize={5}
                            className="w-full h-12 font-accent"
                        >
                            Korean
                        </Button>
                        <Button
                            onClick={() => onCardProviderChange("COUNTRY_US")}
                            variant={
                                cardProvider === "COUNTRY_US"
                                    ? "default"
                                    : "outline"
                            }
                            img="/icons/flags/world.svg"
                            frameSize={25}
                            textSize={5}
                            gapSize={10}
                            paddingSize={5}
                            className="w-full h-12 font-accent"
                        >
                            Global
                        </Button>
                    </div>
                    <div className="mt-2 text-xs text-center">
                        {cardProvider === "COUNTRY_KR" &&
                            currency === "CURRENCY_USD" && (
                                <div className="mt-1 text-yellow-500">
                                    Note: Korean cards only support KRW currency
                                </div>
                            )}
                    </div>
                </div>
            )}

            {/* Easy Pay Provider selector */}
            {payMethod === "EASY_PAY" && (
                <div>
                    <label className="block text-xs md:text-sm font-accent uppercase tracking-wider text-foreground/80 mb-2">
                        Easy Pay Provider
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <Button
                            onClick={() =>
                                onEasyPayProviderChange(
                                    "EASY_PAY_PROVIDER_TOSSPAY"
                                )
                            }
                            variant={
                                easyPayProvider === "EASY_PAY_PROVIDER_TOSSPAY"
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
