/// components/raffles/Raffles.List.tsx

"use client";

import { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Users, Clock, Target } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { useRaffles } from "@/app/actions/raffles/hooks";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import type { RaffleWithDetails } from "@/app/actions/raffles/actions";
import type { RaffleStatus } from "@/app/actions/raffles/utils";

// Utility function to calculate raffle status based on dates
const getRaffleStatus = (
    startDate: string | Date,
    endDate: string | Date,
    drawDate?: string | Date | null
): RaffleStatus => {
    const now = new Date().getTime();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    if (now < start) return "UPCOMING";
    if (now <= end) return "ACTIVE";
    if (drawDate && now < new Date(drawDate).getTime()) return "WAITING_DRAW";
    return "COMPLETED";
};

export default memo(function RafflesList() {
    const [selectedFilter, setSelectedFilter] = useState<
        "all" | "active" | "upcoming"
    >("all");

    const { rafflesData, isRafflesLoading, rafflesError } = useRaffles({
        getRafflesInput: {
            status: ["ACTIVE", "UPCOMING"],
        },
    });

    const filteredRaffles = useMemo(() => {
        if (!rafflesData?.success || !rafflesData.data) return [];

        // Filter raffles and calculate status based on dates
        let filtered = rafflesData.data
            .map((raffle: RaffleWithDetails) => ({
                ...raffle,
                calculatedStatus: getRaffleStatus(
                    raffle.startDate,
                    raffle.endDate,
                    raffle.drawDate
                ),
            }))
            .filter(
                (
                    raffle: RaffleWithDetails & {
                        calculatedStatus: RaffleStatus;
                    }
                ) =>
                    raffle.calculatedStatus === "ACTIVE" ||
                    raffle.calculatedStatus === "UPCOMING"
            );

        if (selectedFilter !== "all") {
            filtered = filtered.filter(
                (
                    raffle: RaffleWithDetails & {
                        calculatedStatus: RaffleStatus;
                    }
                ) => raffle.calculatedStatus === selectedFilter.toUpperCase()
            );
        }

        return filtered;
    }, [rafflesData, selectedFilter]);

    if (isRafflesLoading) {
        return <RafflesSkeleton />;
    }

    if (rafflesError) {
        return <RafflesError />;
    }

    return (
        <div className="relative flex flex-col w-full h-full overflow-hidden">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />

            <div
                className={cn(
                    "flex flex-col w-full max-w-[1400px] mx-auto",
                    getResponsiveClass(20).paddingClass
                )}
            >
                {/* Title */}
                <h2
                    className={cn(
                        "text-center text-4xl font-bold",
                        "mt-[70px] md:mt-[80px] lg:mt-[20px]",
                        getResponsiveClass(45).textClass
                    )}
                >
                    Raffles
                </h2>

                {/* Filter Tabs */}
                <div className="flex justify-center mt-[30px] mb-[30px] lg:mt-[40px] lg:mb-[40px]">
                    <div className="flex flex-row gap-2 overflow-x-auto whitespace-nowrap pb-2">
                        {[
                            {
                                key: "all",
                                label: "All",
                                count: filteredRaffles.length,
                            },
                            {
                                key: "active",
                                label: "Active",
                                count: filteredRaffles.filter(
                                    (r: any) => r.calculatedStatus === "ACTIVE"
                                ).length,
                            },
                            {
                                key: "upcoming",
                                label: "Upcoming",
                                count: filteredRaffles.filter(
                                    (r: any) =>
                                        r.calculatedStatus === "UPCOMING"
                                ).length,
                            },
                        ].map((filter) => (
                            <FilterButton
                                key={filter.key}
                                filter={filter}
                                isSelected={selectedFilter === filter.key}
                                onClick={() =>
                                    setSelectedFilter(filter.key as any)
                                }
                            />
                        ))}
                    </div>
                </div>

                {/* Raffles Grid */}
                <AnimatePresence mode="wait">
                    {filteredRaffles.length > 0 ? (
                        <motion.div
                            key="raffles"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                                "grid grid-cols-1",
                                "mb-[100px] lg:mb-[40px]",
                                getResponsiveClass(50).gapClass
                            )}
                        >
                            {filteredRaffles.map(
                                (raffle: any, index: number) => (
                                    <RaffleCard
                                        key={raffle.id}
                                        raffle={raffle}
                                        index={index}
                                    />
                                )
                            )}
                        </motion.div>
                    ) : (
                        <EmptyState />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});

// Filter Button Component
interface FilterButtonProps {
    filter: {
        key: string;
        label: string;
        count: number;
    };
    isSelected: boolean;
    onClick: () => void;
}

const FilterButton = memo(function FilterButton({
    filter,
    isSelected,
    onClick,
}: FilterButtonProps) {
    return (
        <div
            className={cn(
                "flex flex-row gap-2 items-center justify-center text-sm transition-all duration-500 morp-glass-1 rounded-full px-4 py-2",
                "cursor-pointer backdrop-blur-xs",
                getResponsiveClass(15).textClass,
                isSelected ? "opacity-100" : "opacity-50"
            )}
            onClick={onClick}
        >
            {filter.label}
            <span
                className={cn(
                    "bg-white/20 p-1 rounded-full text-xs text-center flex items-center justify-center",
                    getResponsiveClass(20).frameClass,
                    getResponsiveClass(5).textClass
                )}
            >
                {filter.count}
            </span>
        </div>
    );
});

// Raffle Card Component
interface RaffleCardProps {
    raffle: RaffleWithDetails & { calculatedStatus: RaffleStatus };
    index: number;
}

const RaffleCard = memo(function RaffleCard({
    raffle,
    index,
}: RaffleCardProps) {
    const timeUntilEnd = useMemo(() => {
        const endDate = new Date(raffle.endDate);
        const now = new Date();
        const diff = endDate.getTime() - now.getTime();

        if (diff <= 0) return "Ended";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );

        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h left`;
    }, [raffle.endDate]);

    const topPrize = useMemo(() => {
        if (!raffle.prizes || raffle.prizes.length === 0) return null;
        return raffle.prizes.sort(
            (a: any, b: any) => (b.order || 0) - (a.order || 0)
        )[0];
    }, [raffle.prizes]);

    const { isLive, isUpcoming } = useMemo(() => {
        const isLive = raffle.calculatedStatus === "ACTIVE";
        const isUpcoming = raffle.calculatedStatus === "UPCOMING";
        return { isLive, isUpcoming };
    }, [raffle.calculatedStatus]);

    const { image, imageSettings } = useMemo(() => {
        if (raffle.imgUrl)
            return { image: raffle.imgUrl, imageSettings: "object-cover" };
        if (topPrize?.spg?.imageUrl)
            return {
                image: topPrize.spg.imageUrl,
                imageSettings: "object-cover",
            };
        if (topPrize?.asset?.iconUrl)
            return {
                image: topPrize.asset.iconUrl,
                imageSettings: "object-contain",
            };
        return { image: null, imageSettings: "" };
    }, [raffle, topPrize]);

    return (
        <Link href={`/raffles/${raffle.id}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{
                    y: -8,
                    scale: 1.03,
                    transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                    },
                }}
                className={cn(
                    "relative group cursor-pointer",
                    "morp-glass-3 transition-all duration-700 ease-out",
                    "border border-white/10 hover:border-white/30",
                    "rounded-[12px] inner-shadow",
                    "py-[20px] px-[5px] sm:px-[10px] md:px-[15px]"
                )}
                style={{
                    background: isLive
                        ? "linear-gradient(to bottom right, rgba(169, 20, 117, 0.4), rgba(168,85,247,0.3))"
                        : isUpcoming
                        ? "linear-gradient(to bottom right, rgba(124,58,237,0.1), rgba(139,92,246,0.05))"
                        : "linear-gradient(to bottom right, rgba(0,0,0,0.2), rgba(0,0,0,0.05))",
                    boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.1)",
                }}
            >
                {/* Status Badge */}
                {(isLive || isUpcoming) && (
                    <div className="absolute -top-2 -right-1 z-10">
                        <div
                            className={cn(
                                "text-white px-3 py-1 rounded-full text-xs font-main",
                                getResponsiveClass(5).textClass,
                                isLive
                                    ? "bg-purple-500 animate-pulse"
                                    : "bg-violet-500"
                            )}
                        >
                            {isLive ? "LIVE" : "SOON"}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-2 md:flex-row p-2">
                    {/* Prize Image */}
                    {image && (
                        <div className="relative w-full h-[200px] md:w-[400px] md:h-[300px] overflow-hidden rounded-[12px]">
                            <Image
                                src={image}
                                alt={raffle.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className={cn(
                                    "transition-all duration-700 ease-out group-hover:scale-105",
                                    imageSettings
                                )}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
                            {topPrize && (
                                <h1
                                    className={cn(
                                        "absolute bottom-1 right-3 text-white/80 text-center text-2xl font-bold",
                                        getResponsiveClass(30).textClass
                                    )}
                                >
                                    {topPrize.title}
                                </h1>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div
                        className={cn(
                            "relative z-10",
                            getResponsiveClass(25).paddingClass
                        )}
                    >
                        {/* Title */}
                        <h3
                            className={cn(
                                "font-bold text-white mb-2 line-clamp-2",
                                getResponsiveClass(30).textClass
                            )}
                        >
                            {raffle.title}
                        </h3>

                        {/* Prize Info */}
                        {topPrize && (
                            <h3
                                className={cn(
                                    "text-purple-400 font-medium mb-4",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                {topPrize.title} • {topPrize.quantity}x
                                Available
                            </h3>
                        )}

                        {/* Stats */}
                        <div
                            className={cn(
                                "grid grid-cols-2 mb-4",
                                getResponsiveClass(10).gapClass
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Clock
                                    className={cn(
                                        "text-purple-400",
                                        getResponsiveClass(10).frameClass
                                    )}
                                />
                                <span
                                    className={cn(
                                        "text-white/80",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {timeUntilEnd}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users
                                    className={cn(
                                        "text-violet-400",
                                        getResponsiveClass(10).frameClass
                                    )}
                                />
                                <span
                                    className={cn(
                                        "text-white/80",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {raffle.totalParticipants || 0} joined
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Gift
                                    className={cn(
                                        "text-purple-400",
                                        getResponsiveClass(10).frameClass
                                    )}
                                />
                                <span
                                    className={cn(
                                        "text-white/80",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {raffle.prizes?.length || 0} prizes
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Target
                                    className={cn(
                                        "text-violet-400",
                                        getResponsiveClass(10).frameClass
                                    )}
                                />
                                <span
                                    className={cn(
                                        "text-white/80 flex items-center gap-1",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {(raffle.entryFeeAmount || 0) > 0
                                        ? `${raffle.entryFeeAmount} ${raffle.entryFeeAsset?.symbol}`
                                        : "Free"}
                                    {raffle.entryFeeAsset?.iconUrl && (
                                        <Image
                                            src={raffle.entryFeeAsset.iconUrl}
                                            alt={raffle.entryFeeAsset.symbol}
                                            width={16}
                                            height={16}
                                            className={cn(
                                                "object-contain",
                                                getResponsiveClass(10)
                                                    .frameClass
                                            )}
                                        />
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Action Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                                "w-full text-white font-bold rounded-lg font-main",
                                "transition-all duration-500 ease-out inner-shadow",
                                "flex items-center justify-center gap-2",
                                isLive
                                    ? "bg-gradient-to-r from-purple-500 to-violet-500"
                                    : isUpcoming
                                    ? "bg-gradient-to-r from-violet-500 to-purple-500"
                                    : "bg-gradient-to-r from-purple-500 to-pink-500",
                                getResponsiveClass(20).textClass,
                                getResponsiveClass(15).paddingClass
                            )}
                        >
                            {isLive
                                ? "🚀 Enter Now"
                                : isUpcoming
                                ? "⏳ Coming Soon"
                                : "� View Details"}
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
});

// Empty State Component
const EmptyState = memo(function EmptyState() {
    return (
        <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
                "col-span-full",
                "morp-glass-1 inner-shadow rounded-3xl text-center",
                getResponsiveClass(60).paddingClass
            )}
            style={{
                background:
                    "linear-gradient(to bottom right, rgba(0,0,0,0.2), rgba(0,0,0,0.05))",
            }}
        >
            <div className={cn("mb-4", getResponsiveClass(60).textClass)}>
                🎁
            </div>
            <h3
                className={cn(
                    "font-bold text-white mb-2",
                    getResponsiveClass(30).textClass
                )}
            >
                No Raffles Available
            </h3>
            <p
                className={cn(
                    "text-white/60",
                    getResponsiveClass(15).textClass
                )}
            >
                New raffles will appear here when they become available.
            </p>
        </motion.div>
    );
});

// Loading Skeleton
const RafflesSkeleton = memo(function RafflesSkeleton() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full"
            />
        </div>
    );
});

// Error State
const RafflesError = memo(function RafflesError() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                    Something went wrong
                </h3>
                <p className="text-white/60">
                    Please refresh the page and try again
                </p>
            </div>
        </div>
    );
});
