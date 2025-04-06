"use client";

import { Events } from "@prisma/client";
import { useState } from "react";
import { H3 } from "../atoms/Typography";
import {
    Ticket,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import PaymentProcessor from "./PaymentProcessor";
import {
    useExchangeRateInfo,
    useCurrencyConverter,
} from "@/app/hooks/usePaymentValidation";

type EventPaymentProps = {
    event: Pick<
        Events,
        | "id"
        | "title"
        | "price"
        | "capacity"
        | "startDate"
        | "endDate"
        | "status"
        | "saleStartDate"
        | "saleEndDate"
    >;
    initialCurrency?: "CURRENCY_USD" | "CURRENCY_KRW";
};

export default function EventPayment({
    event,
    initialCurrency = "CURRENCY_KRW",
}: EventPaymentProps) {
    const [quantity, setQuantity] = useState(1);
    const [currentCurrency, setCurrentCurrency] = useState(initialCurrency);

    // Get exchange rate info and converted amount
    const { rateInfo } = useExchangeRateInfo(
        currentCurrency === "CURRENCY_USD" ? "KRW" : "USD",
        currentCurrency === "CURRENCY_USD" ? "USD" : "KRW"
    );

    const { convertedAmount } = useCurrencyConverter(
        event.price || 0,
        "KRW",
        currentCurrency === "CURRENCY_USD" ? "USD" : "KRW"
    );

    // Get the appropriate price based on currency
    const currentPrice =
        currentCurrency === "CURRENCY_USD"
            ? convertedAmount?.converted.amount || 0
            : event.price || 0;

    // Calculate total price
    const totalPrice = currentPrice * quantity;

    // Check if tickets are available for sale
    const now = new Date();
    const saleStarted =
        !event.saleStartDate || new Date(event.saleStartDate) <= now;
    const saleEnded = event.saleEndDate && new Date(event.saleEndDate) < now;
    const isSoldOut = event.capacity !== null && event.capacity <= 0;
    const isCancelled = event.status === "cancelled";

    // Check if tickets can be purchased
    const canPurchase =
        saleStarted &&
        !saleEnded &&
        !isSoldOut &&
        !isCancelled &&
        event.status !== "completed";

    // Format date for display
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Handle successful payment
    const handlePaymentSuccess = (response: any) => {
        console.log("Payment successful", response);
        // TODO: Implement success handling (e.g., show confirmation, redirect, etc.)
    };

    // Handle payment error
    const handlePaymentError = (error: any) => {
        console.error("Payment failed", error);
        // TODO: Implement error handling
    };

    return (
        <div className="w-full bg-card/40 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 p-4 sm:p-6 md:p-8">
            <div className="flex items-center mb-5 md:mb-6">
                <Ticket className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-primary" />
                <H3 className="text-lg md:text-xl">Tickets</H3>
            </div>

            {/* Price info */}
            <div className="mb-5 md:mb-6 text-sm md:text-base">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-foreground/70">Price per ticket</span>
                    <span className="font-main text-base md:text-lg">
                        {event.price ? (
                            <>
                                <span>
                                    {currentPrice.toLocaleString()}{" "}
                                    {currentCurrency === "CURRENCY_USD"
                                        ? "USD"
                                        : "KRW"}
                                </span>
                                {currentCurrency === "CURRENCY_USD" && (
                                    <span className="text-xs text-foreground/50 ml-2">
                                        (≈ {event.price.toLocaleString()} KRW)
                                    </span>
                                )}
                            </>
                        ) : (
                            "Free"
                        )}
                    </span>
                </div>

                {rateInfo && currentCurrency === "CURRENCY_USD" && (
                    <div className="text-xs text-foreground/50 text-right mb-2">
                        {rateInfo.formattedRate}
                        <br />
                        <span className="text-[10px]">
                            Last updated: {rateInfo.lastUpdated}
                        </span>
                    </div>
                )}

                {event.capacity !== null && (
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-foreground/70">
                            Available tickets
                        </span>
                        <span className="font-main">
                            {event.capacity > 0 ? event.capacity : "Sold out"}
                        </span>
                    </div>
                )}

                {event.saleStartDate && (
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-foreground/70">Sale starts</span>
                        <span className="font-main">
                            {formatDate(event.saleStartDate)}
                        </span>
                    </div>
                )}

                {event.saleEndDate && (
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-foreground/70">Sale ends</span>
                        <span className="font-main">
                            {formatDate(event.saleEndDate)}
                        </span>
                    </div>
                )}
            </div>

            {/* Purchase section */}
            {canPurchase ? (
                <>
                    {/* Quantity selector */}
                    <div className="mb-5 md:mb-6">
                        <label className="block text-xs md:text-sm font-accent uppercase tracking-wider text-foreground/80 mb-2">
                            Quantity
                        </label>
                        <div className="flex items-center">
                            <button
                                onClick={() =>
                                    setQuantity(Math.max(1, quantity - 1))
                                }
                                disabled={quantity <= 1}
                                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-border/50 rounded-l-lg disabled:opacity-50"
                                aria-label="Decrease quantity"
                            >
                                -
                            </button>
                            <div className="w-12 h-8 sm:w-14 sm:h-10 flex items-center justify-center border-t border-b border-border/50 bg-secondary/20 text-sm md:text-base">
                                {quantity}
                            </div>
                            <button
                                onClick={() =>
                                    setQuantity(
                                        Math.min(
                                            event.capacity || 10,
                                            quantity + 1
                                        )
                                    )
                                }
                                disabled={
                                    event.capacity !== null &&
                                    quantity >= event.capacity
                                }
                                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-border/50 rounded-r-lg disabled:opacity-50"
                                aria-label="Increase quantity"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Payment processor */}
                    <PaymentProcessor
                        amount={totalPrice}
                        initialCurrency={currentCurrency}
                        table="events"
                        target={event.id}
                        quantity={quantity}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                    />
                </>
            ) : (
                <div className="bg-secondary/30 p-3 sm:p-4 rounded-lg text-sm md:text-base mb-2">
                    {isCancelled ? (
                        <div className="flex items-center text-destructive">
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                            <span>This event has been cancelled</span>
                        </div>
                    ) : isSoldOut ? (
                        <div className="flex items-center text-destructive">
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                            <span>Sold out</span>
                        </div>
                    ) : !saleStarted ? (
                        <div className="flex items-center text-chart-2">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                            <span>
                                Sales start on{" "}
                                {formatDate(event.saleStartDate!)}
                            </span>
                        </div>
                    ) : saleEnded ? (
                        <div className="flex items-center text-chart-5">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                            <span>
                                Sales ended on {formatDate(event.saleEndDate!)}
                            </span>
                        </div>
                    ) : event.status === "completed" ? (
                        <div className="flex items-center text-foreground/60">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                            <span>This event has already taken place</span>
                        </div>
                    ) : (
                        <div className="flex items-center text-foreground/60">
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                            <span>Tickets are not available for purchase</span>
                        </div>
                    )}
                </div>
            )}

            {/* Event terms */}
            <div className="mt-4 md:mt-6 text-xs text-foreground/50">
                <p>
                    By purchasing tickets, you agree to our Terms and
                    Conditions. No refunds or exchanges.
                </p>
            </div>
        </div>
    );
}
