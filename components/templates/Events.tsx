"use client";

import {
    EventCategory,
    EventStatus,
    Events as EventModel,
} from "@prisma/client";
import Image from "next/image";
import { useEvents } from "@/app/hooks/useEvents";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { H2 } from "../atoms/Typography";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import Icon from "../atoms/Icon";
import Link from "next/link";

// Use Pick utility type to select only the fields we need from the Prisma model
type Event = Pick<
    EventModel,
    "id" | "category" | "status" | "title" | "location" | "bannerImg"
>;

export default function Events() {
    const [page, setPage] = useState(1);
    const [category, setCategory] = useState<EventCategory | undefined>(
        undefined
    );
    const [status, setStatus] = useState<EventStatus | undefined>(undefined);

    const { events, isLoading, error, total, totalPages } = useEvents({
        category,
        status,
        page,
        limit: 9,
    });

    // Reset page when filters change
    const handleFilterChange = (
        newCategory?: EventCategory,
        newStatus?: EventStatus
    ) => {
        if (newCategory !== category) {
            setCategory(newCategory);
            setPage(1);
        }
        if (newStatus !== status) {
            setStatus(newStatus);
            setPage(1);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[50vh]">
                <Icon svg="/elements/el03.svg" size={45} className="mb-4" />
                <H2
                    className={cn(
                        "text-center mb-6",
                        getResponsiveClass(40).textClass
                    )}
                >
                    Events
                </H2>
                <div className="flex justify-center items-center h-48 w-full">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[50vh]">
                <Icon svg="/elements/el03.svg" size={45} className="mb-4" />
                <H2
                    className={cn(
                        "text-center mb-6",
                        getResponsiveClass(40).textClass
                    )}
                >
                    Events
                </H2>
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-6 py-4 rounded-lg backdrop-blur-sm">
                    Failed to load events. Please try again later.
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center w-full h-full">
            <div className="flex flex-col items-center justify-center w-full max-w-7xl px-4 py-12">
                <Icon svg="/elements/el03.svg" size={45} className="mb-4" />
                <H2
                    className={cn(
                        "text-center mb-6",
                        getResponsiveClass(40).textClass
                    )}
                >
                    Events
                </H2>

                {/* Filters */}
                <div className="w-full max-w-3xl mb-10 bg-card/60 backdrop-blur-sm p-6 rounded-xl gradient-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label
                                htmlFor="category"
                                className="block text-sm font-accent uppercase tracking-wider text-foreground/80 mb-2"
                            >
                                Category
                            </label>
                            <select
                                id="category"
                                value={category || ""}
                                onChange={(e) =>
                                    handleFilterChange(
                                        e.target.value
                                            ? (e.target.value as EventCategory)
                                            : undefined,
                                        status
                                    )
                                }
                                className="block w-full px-4 py-2.5 bg-secondary/50 border border-border/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-sm font-main"
                            >
                                <option value="">All Categories</option>
                                {Object.values(EventCategory).map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat.charAt(0).toUpperCase() +
                                            cat.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="status"
                                className="block text-sm font-accent uppercase tracking-wider text-foreground/80 mb-2"
                            >
                                Status
                            </label>
                            <select
                                id="status"
                                value={status || ""}
                                onChange={(e) =>
                                    handleFilterChange(
                                        category,
                                        e.target.value
                                            ? (e.target.value as EventStatus)
                                            : undefined
                                    )
                                }
                                className="block w-full px-4 py-2.5 bg-secondary/50 border border-border/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-sm font-main"
                            >
                                <option value="">All Statuses</option>
                                {Object.values(EventStatus).map((stat) => (
                                    <option key={stat} value={stat}>
                                        {stat.charAt(0).toUpperCase() +
                                            stat.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {(category || status) && (
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() =>
                                    handleFilterChange(undefined, undefined)
                                }
                                className="inline-flex items-center px-4 py-2 border border-primary/30 text-sm font-main rounded-lg text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Results count */}
                <p className="w-full max-w-3xl text-right text-sm text-foreground/60 mb-4 font-main">
                    Showing {events.length} of {total} events
                </p>

                {events.length === 0 ? (
                    <div className="w-full max-w-3xl bg-card/40 rounded-xl p-8 text-center backdrop-blur-sm gradient-border">
                        <p className="text-lg text-foreground/80 font-main">
                            No events found with the selected filters.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                        {events.map((event) => (
                            <Link
                                href={`/events/${event.id}`}
                                key={event.id}
                                className="group bg-card/60 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 hover:shadow-[0_0_15px_rgba(var(--primary)/0.3)] transition-all duration-300"
                            >
                                <div className="relative h-52 overflow-hidden">
                                    <Image
                                        src={event.bannerImg || ""}
                                        alt={event.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-70"></div>
                                </div>
                                <div className="p-5">
                                    <h3 className="text-xl font-main mb-2 group-hover:text-primary transition-colors">
                                        {event.title}
                                    </h3>
                                    <p className="text-sm text-foreground/70 mb-3 font-body">
                                        {event.location || "Location TBA"}
                                    </p>
                                    <div className="flex justify-between">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-main bg-chart-3/20 text-chart-3 border border-chart-3/30">
                                            {event.category}
                                        </span>
                                        <StatusBadge status={event.status} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex justify-center mt-12">
                        <nav className="flex items-center gap-4 bg-card/40 backdrop-blur-sm px-6 py-3 rounded-lg gradient-border">
                            <button
                                onClick={() =>
                                    setPage((p) => Math.max(p - 1, 1))
                                }
                                disabled={page === 1}
                                className="px-4 py-2 rounded-lg border border-border/30 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/50 hover:border-primary/30 transition-all font-main text-sm"
                            >
                                Previous
                            </button>

                            <span className="mx-2 font-accent">
                                {page} / {totalPages}
                            </span>

                            <button
                                onClick={() =>
                                    setPage((p) => Math.min(p + 1, totalPages))
                                }
                                disabled={page === totalPages}
                                className="px-4 py-2 rounded-lg border border-border/30 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/50 hover:border-primary/30 transition-all font-main text-sm"
                            >
                                Next
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: EventStatus }) {
    let bgColor = "bg-chart-5/20";
    let textColor = "text-chart-5";
    let borderColor = "border-chart-5/30";

    switch (status) {
        case "upcoming":
            bgColor = "bg-chart-2/20";
            textColor = "text-chart-2";
            borderColor = "border-chart-2/30";
            break;
        case "ongoing":
            bgColor = "bg-chart-1/20";
            textColor = "text-chart-1";
            borderColor = "border-chart-1/30";
            break;
        case "completed":
            bgColor = "bg-muted/30";
            textColor = "text-muted-foreground";
            borderColor = "border-muted/30";
            break;
        case "cancelled":
            bgColor = "bg-destructive/20";
            textColor = "text-destructive";
            borderColor = "border-destructive/30";
            break;
    }

    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-main border ${bgColor} ${textColor} ${borderColor}`}
        >
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}
