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
import PaymentModule from "../payment/PaymentModule";
import * as PortOne from "@portone/browser-sdk/v2";
import { useSearchParams } from "next/navigation";

const DEFAULT_CURRENCY = "CURRENCY_KRW" as PortOne.Entity.Currency;

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
    onPurchase?: (quantity: number) => void;
};

export default function EventPayment({
    event,
    initialCurrency = "CURRENCY_KRW",
    onPurchase,
}: EventPaymentProps) {
    const [quantity, setQuantity] = useState(1);
    const searchParams = useSearchParams();

    // Get payment result from URL parameters
    const paymentResult = {
        code: searchParams.get("code"),
        message: searchParams.get("message"),
        paymentId: searchParams.get("paymentId"),
        pgCode: searchParams.get("pgCode"),
        pgMessage: searchParams.get("pgMessage"),
        transactionType: searchParams.get("transactionType"),
        txId: searchParams.get("txId"),
    };

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
        // Call the onPurchase prop if it exists
        if (onPurchase) {
            onPurchase(quantity);
        }
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
                            <>{event.price.toLocaleString()}</>
                        ) : (
                            "Free"
                        )}
                    </span>
                </div>

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
                    <PaymentModule
                        table="events"
                        merchId={event.id}
                        merchName={event.title}
                        amount={event.price || 0}
                        quantity={quantity}
                        defaultCurrency={DEFAULT_CURRENCY}
                        paymentResult={paymentResult}
                        onSuccess={() => handlePaymentSuccess({})}
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
