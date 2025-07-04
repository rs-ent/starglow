/// components/organisms/EventsDetail.tsx
"use client";

import { useCallback, useState } from "react";

import { Loader2 } from "lucide-react";

import { useEvent } from "@/app/hooks/useEvents";

import EventDescription from "./EventDescription";
import EventPayment from "./EventPayment";
import Link from "next/link";

interface EventsDetailProps {
    eventId: string;
    onPurchase?: (quantity: number) => void;
}

export default function EventsDetail({
    eventId,
    onPurchase,
}: EventsDetailProps) {
    const { event, isLoading, error } = useEvent(eventId);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);

    const handlePurchase = useCallback(
        (quantity: number) => {
            setTimeout(() => {
                setPurchaseSuccess(true);
                if (onPurchase) {
                    onPurchase(quantity);
                }
            }, 1500);
        },
        [onPurchase]
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-4">
                <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-primary mb-4" />
                <p className="text-foreground/70 font-main text-sm md:text-base">
                    Loading event details...
                </p>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-4">
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 sm:px-6 py-4 rounded-lg backdrop-blur-sm max-w-md mx-auto text-center text-sm md:text-base">
                    <p>Failed to load event details. Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full py-6 sm:py-8 md:py-10">
            <div className="w-full max-w-7xl px-4">
                {purchaseSuccess && (
                    <div className="bg-chart-1/20 border border-chart-1/30 text-chart-1 p-3 sm:p-4 rounded-lg mb-6 sm:mb-8 max-w-3xl mx-auto">
                        <p className="font-main text-center text-sm md:text-base">
                            Your purchase was successful! Check your email for
                            ticket details.
                        </p>
                    </div>
                )}

                {/* Stack the sections on mobile, side-by-side on larger screens */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                    {/* Event Description Section - 2/3 width on desktop */}
                    <div className="lg:col-span-2 order-2 lg:order-1">
                        <EventDescription event={event} />
                    </div>

                    {/* Payment Section - 1/3 width on desktop, but first on mobile */}
                    <div className="lg:col-span-1 order-1 lg:order-2">
                        <div className="lg:sticky lg:top-8">
                            <EventPayment
                                event={event}
                                onPurchase={handlePurchase}
                            />
                        </div>
                    </div>
                </div>

                {/* Back button - only visible on mobile */}
                <div className="mt-8 flex justify-center lg:hidden">
                    <Link
                        href="/events"
                        className="px-4 py-2 bg-secondary/50 hover:bg-secondary/70 text-foreground rounded-lg border border-border/30 text-sm transition-colors"
                    >
                        Back to Events
                    </Link>
                </div>
            </div>
        </div>
    );
}
