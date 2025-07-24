/// components/raffles/Raffles.List.tsx

"use client";

import { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Users, Clock, Target, Zap, Database } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { useRaffles } from "@/app/actions/raffles/hooks";
import { useOnchainRafflesV2 } from "@/app/actions/raffles/onchain/hooks-v2";
import RafflesOnchainListCard from "./onchain/Raffles.Onchain.List.Card";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import type { RaffleWithDetails } from "@/app/actions/raffles/actions";
import type { RaffleStatus } from "@/app/actions/raffles/utils";
import { InteractiveGridPattern } from "../magicui/interactive-grid-pattern";

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
    const [selectedTab, setSelectedTab] = useState<"offchain" | "onchain">(
        "offchain"
    );

    const { rafflesData, isRafflesLoading, rafflesError } = useRaffles({
        getRafflesInput: {
            status: ["ACTIVE", "UPCOMING"],
        },
    });

    const { allRaffles, isAllRafflesLoading, isAllRafflesError } =
        useOnchainRafflesV2({
            getAllRafflesInput: {
                isActive: "ACTIVE",
            },
        });

    const filteredRaffles = useMemo(() => {
        if (!rafflesData?.success || !rafflesData.data) return [];

        // Filter raffles and calculate status based on dates
        return rafflesData.data
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
    }, [rafflesData]);

    if (isRafflesLoading) {
        return <RafflesSkeleton />;
    }

    if (rafflesError) {
        return <RafflesError />;
    }

    return (
        <div className="relative flex flex-col w-full min-h-screen h-full overflow-hidden">
            {/* Dynamic Background based on selected tab */}
            <AnimatePresence mode="wait">
                {selectedTab === "onchain" ? (
                    <motion.div
                        key="onchain-bg"
                        className="fixed inset-0 -z-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{
                            background:
                                "linear-gradient(135deg,rgb(14, 2, 25),rgb(34, 19, 60),rgb(12, 3, 22),rgb(80, 60, 88))",
                        }}
                    />
                ) : (
                    <motion.div
                        key="offchain-bg"
                        className="fixed inset-0 -z-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{
                            background:
                                "linear-gradient(to bottom, #09021B, #311473)",
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {selectedTab === "onchain" && (
                    <InteractiveGridPattern
                        className={cn(
                            "[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]"
                        )}
                        width={60}
                        height={60}
                        squares={[40, 40]}
                        squaresClassName="hover:fill-blue-800 opacity-20"
                    />
                )}
            </AnimatePresence>

            {/* Dynamic radial gradients */}
            <AnimatePresence mode="wait">
                {selectedTab === "onchain" ? (
                    <motion.div
                        key="onchain-radial"
                        className="absolute inset-0 blur-xl -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{
                            background: `
                                radial-gradient(circle at 20% 30%, rgb(25, 16, 32) 0%, transparent 50%),
                                radial-gradient(circle at 80% 70%, rgba(20, 6, 33, 0.8) 0%, transparent 40%),
                                radial-gradient(circle at 60% 20%, rgba(39, 9, 46, 1.2) 0%, transparent 35%),
                                radial-gradient(circle at 40% 80%, rgba(23, 15, 36, 0.9) 0%, transparent 40%)
                            `,
                        }}
                    />
                ) : (
                    <motion.div
                        key="offchain-radial"
                        className="absolute inset-0 blur-xl animate-pulse-slow -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{
                            background: `
                                radial-gradient(circle at 20% 30%, rgba(33, 109, 172, 0.57) 0%, transparent 60%),
                                radial-gradient(circle at 80% 70%, rgba(177, 112, 171, 0.4) 0%, transparent 50%),
                                radial-gradient(circle at 60% 20%, rgba(102, 72, 236, 0.62) 0%, transparent 40%),
                                radial-gradient(circle at 40% 80%, rgba(88, 45, 74, 0.56) 0%, transparent 45%)
                            `,
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Animated floating orbs with dynamic colors */}
            <motion.div
                className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float-slow -z-10"
                animate={{
                    backgroundColor:
                        selectedTab === "onchain"
                            ? "rgba(56, 26, 84, 0.3)"
                            : "rgba(168, 85, 247, 0.2)",
                }}
                transition={{ duration: 0.8 }}
            />
            <motion.div
                className="absolute top-3/4 right-1/4 w-80 h-80 rounded-full blur-2xl animate-float-slow-reverse -z-10"
                animate={{
                    backgroundColor:
                        selectedTab === "onchain"
                            ? "rgba(28, 20, 35, 0.25)"
                            : "rgba(244, 114, 182, 0.15)",
                }}
                transition={{ duration: 0.8 }}
            />
            <motion.div
                className="absolute top-1/2 left-3/4 w-72 h-72 rounded-full blur-3xl animate-float-medium -z-10"
                animate={{
                    backgroundColor:
                        selectedTab === "onchain"
                            ? "rgba(139, 92, 246, 0.3)"
                            : "rgba(99, 102, 241, 0.2)",
                }}
                transition={{ duration: 0.8 }}
            />

            {/* Overlay blur effect */}
            <motion.div
                className="absolute inset-0 backdrop-blur-sm -z-10"
                animate={{
                    backgroundColor:
                        selectedTab === "onchain"
                            ? "rgba(0, 0, 0, 0.15)"
                            : "rgba(0, 0, 0, 0.1)",
                }}
                transition={{ duration: 0.8 }}
            />

            <div
                className={cn(
                    "flex flex-col w-full max-w-[1400px] mx-auto",
                    getResponsiveClass(20).paddingClass
                )}
            >
                {/* Title */}
                <motion.h2
                    className={cn(
                        "text-center text-4xl font-bold",
                        "mt-[70px] md:mt-[80px] lg:mt-[20px]",
                        getResponsiveClass(45).textClass
                    )}
                    animate={{
                        color:
                            selectedTab === "onchain" ? "#ffffff" : "#ffffff",
                    }}
                    transition={{ duration: 0.5 }}
                >
                    Raffles
                </motion.h2>

                {/* Tab Selector */}
                <div className="flex justify-center mt-[30px] mb-[30px] lg:mt-[40px] lg:mb-[40px]">
                    <div className="relative flex bg-black/20 backdrop-blur-md rounded-2xl p-1 border border-white/10">
                        <motion.div
                            className="absolute inset-y-1 bg-gradient-to-r from-purple-500/80 to-violet-500/80 rounded-xl"
                            initial={false}
                            animate={{
                                x: selectedTab === "offchain" ? 0 : "95%",
                                width:
                                    selectedTab === "offchain" ? "50%" : "50%",
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                            }}
                        />

                        {[
                            {
                                key: "offchain",
                                label: "Offchain",
                                icon: Database,
                                count: filteredRaffles.length,
                            },
                            {
                                key: "onchain",
                                label: "Onchain",
                                icon: Zap,
                                count: allRaffles?.data?.length || 0,
                            },
                        ].map((tab) => (
                            <TabButton
                                key={tab.key}
                                tab={tab}
                                isSelected={selectedTab === tab.key}
                                onClick={() => setSelectedTab(tab.key as any)}
                            />
                        ))}
                    </div>
                </div>

                {/* Raffles Grid */}
                <AnimatePresence mode="wait">
                    {selectedTab === "offchain" ? (
                        filteredRaffles.length > 0 ? (
                            <motion.div
                                key="offchain-raffles"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
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
                            <EmptyState tabType="offchain" />
                        )
                    ) : isAllRafflesLoading ? (
                        <OnchainLoadingState />
                    ) : isAllRafflesError ? (
                        <OnchainErrorState />
                    ) : (allRaffles?.data?.length || 0) > 0 ? (
                        <motion.div
                            key="onchain-raffles"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                                "grid grid-cols-1",
                                "mb-[100px] lg:mb-[40px]",
                                getResponsiveClass(50).gapClass
                            )}
                        >
                            {allRaffles?.data?.map(
                                (raffle: any, index: number) => (
                                    <motion.div
                                        key={`${raffle.contractAddress}-${raffle.raffleId}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <RafflesOnchainListCard
                                            contractAddress={
                                                raffle.contractAddress
                                            }
                                            raffleId={raffle.raffleId}
                                        />
                                    </motion.div>
                                )
                            )}
                        </motion.div>
                    ) : (
                        <EmptyState tabType="onchain" />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});

// Tab Button Component
interface TabButtonProps {
    tab: {
        key: string;
        label: string;
        icon: any;
        count: number;
    };
    isSelected: boolean;
    onClick: () => void;
}

const TabButton = memo(function TabButton({
    tab,
    isSelected,
    onClick,
}: TabButtonProps) {
    const Icon = tab.icon;

    return (
        <motion.button
            className={cn(
                "relative z-10 flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300",
                "font-medium text-sm whitespace-nowrap",
                isSelected
                    ? "text-white shadow-lg"
                    : "text-white/60 hover:text-white/80"
            )}
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={{
                backgroundColor: isSelected
                    ? tab.key === "onchain"
                        ? "rgba(147, 51, 234, 0.3)"
                        : "rgba(99, 102, 241, 0.3)"
                    : "transparent",
            }}
            transition={{ duration: 0.3 }}
        >
            <motion.div
                animate={{
                    scale: isSelected ? 1.1 : 1,
                    rotate:
                        isSelected && tab.key === "onchain" ? [0, 5, -5, 0] : 0,
                }}
                transition={{
                    scale: { duration: 0.3 },
                    rotate: {
                        duration: 1.5,
                        repeat: isSelected ? Infinity : 0,
                        repeatDelay: 3,
                    },
                }}
            >
                <Icon className="w-4 h-4" />
            </motion.div>
            <span>{tab.label}</span>
            <motion.span
                className={cn(
                    "flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold",
                    isSelected
                        ? "bg-white/30 text-white border border-white/20"
                        : "bg-white/10 text-white/60"
                )}
                initial={false}
                animate={{
                    scale: isSelected ? 1.1 : 0.9,
                    boxShadow: isSelected
                        ? "0 0 10px rgba(255,255,255,0.3)"
                        : "none",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                {tab.count}
            </motion.span>
        </motion.button>
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

                <div className="flex flex-col gap-2 md:flex-row p-2 w-full">
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
                            "w-full",
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
interface EmptyStateProps {
    tabType: "offchain" | "onchain";
}

const EmptyState = memo(function EmptyState({ tabType }: EmptyStateProps) {
    const isOnchain = tabType === "onchain";

    return (
        <motion.div
            key={`empty-${tabType}`}
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
                {isOnchain ? "⚡" : "🎁"}
            </div>
            <h3
                className={cn(
                    "font-bold text-white mb-2",
                    getResponsiveClass(30).textClass
                )}
            >
                No {isOnchain ? "Onchain" : "Offchain"} Raffles Available
            </h3>
            <p
                className={cn(
                    "text-white/60",
                    getResponsiveClass(15).textClass
                )}
            >
                New {isOnchain ? "blockchain-based" : "traditional"} raffles
                will appear here when they become available.
            </p>
        </motion.div>
    );
});

// Onchain Loading State
const OnchainLoadingState = memo(function OnchainLoadingState() {
    return (
        <motion.div
            key="onchain-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-20"
        >
            <div className="text-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"
                />
                <p className="text-white/80 text-lg">
                    Loading onchain raffles...
                </p>
            </div>
        </motion.div>
    );
});

// Onchain Error State
const OnchainErrorState = memo(function OnchainErrorState() {
    return (
        <motion.div
            key="onchain-error"
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
                    "linear-gradient(to bottom right, rgba(139,69,19,0.2), rgba(139,69,19,0.05))",
            }}
        >
            <div className={cn("mb-4", getResponsiveClass(60).textClass)}>
                ⚠️
            </div>
            <h3
                className={cn(
                    "font-bold text-white mb-2",
                    getResponsiveClass(30).textClass
                )}
            >
                Failed to load onchain raffles
            </h3>
            <p
                className={cn(
                    "text-white/60",
                    getResponsiveClass(15).textClass
                )}
            >
                Please check your connection and try again.
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
