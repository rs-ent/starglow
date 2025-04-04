"use client";

import PortOneButton from "../atoms/PortOneButton";
import { Events } from "@prisma/client";
import { useState } from "react";
import { H3 } from "../atoms/Typography";
import {
    Ticket,
    CreditCard,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    Wallet,
} from "lucide-react";

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
};

export default function EventPayment({ event }: EventPaymentProps) {
    const [quantity, setQuantity] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState<"card" | "wallet">(
        "card"
    );

    // Calculate total price
    const totalPrice = (event.price || 0) * quantity;

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
                        {event.price
                            ? `${event.price.toLocaleString()} SGP`
                            : "Free"}
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

                    {/* Payment method */}
                    <div className="mb-5 md:mb-6">
                        <label className="block text-xs md:text-sm font-accent uppercase tracking-wider text-foreground/80 mb-2">
                            Payment method
                        </label>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <button
                                onClick={() => {
                                    setPaymentMethod("card");
                                }}
                                className={`flex items-center justify-center p-2 sm:p-3 rounded-lg border text-sm md:text-base ${
                                    paymentMethod === "card"
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border/50 text-foreground/70"
                                }`}
                            >
                                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                                <span>Card</span>
                            </button>
                        </div>
                    </div>

                    {/* Total and purchase button */}
                    <PortOneButton />
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
