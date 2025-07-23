/// components/raffles/web3/Raffles.Onchain.List.Card.tsx

"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Users, Gift, Target } from "lucide-react";
import { useOnchainRaffles } from "@/app/actions/raffles/onchain/hooks";
import Image from "next/image";
import Link from "next/link";
import { useAssetsGet } from "@/app/actions/assets/hooks";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";

interface RafflesOnchainListCardProps {
    contractAddress: string;
    raffleId: string;
    index: number;
}

const DEFAULT_TITLE = "Untitled Raffle";

const getTimeUntilEnd = (endDate: string | number | bigint): string => {
    if (!endDate) return "N/A";

    const endTimestamp =
        typeof endDate === "bigint" ? Number(endDate) : Number(endDate);
    const endDateObj = new Date(endTimestamp * 1000);
    const now = new Date();
    const diff = endDateObj.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h left`;
};

function RafflesOnchainListCard({
    contractAddress,
    raffleId,
    index,
}: RafflesOnchainListCardProps) {
    const {
        raffleCoreInfoForListCard,
        isRaffleCoreInfoForListCardLoading,
        isRaffleCoreInfoForListCardError,
    } = useOnchainRaffles({
        getRaffleCoreInfoForListCardInput: {
            contractAddress,
            raffleId,
        },
    });

    const coreData = useMemo(() => {
        return raffleCoreInfoForListCard?.data;
    }, [raffleCoreInfoForListCard]);

    const { asset } = useAssetsGet({
        getAssetInput: {
            id: coreData?.participationFeeAssetId || "",
        },
    });

    const raffleStates = useMemo(() => {
        if (!coreData)
            return { isActive: false, isDrawn: false, isInstant: false };
        return {
            isActive: Boolean(coreData.isActive),
            isDrawn: Boolean(coreData.isDrawn),
            isInstant: Boolean(coreData.instantDraw),
        };
    }, [coreData]);

    const timeUntilEnd = useMemo(() => {
        if (!coreData?.endDate) return "N/A";
        return getTimeUntilEnd(coreData.endDate);
    }, [coreData?.endDate]);

    const { isLive, isUpcoming } = useMemo(() => {
        const isLive = raffleStates.isActive && !raffleStates.isDrawn;
        const isUpcoming = !raffleStates.isActive && !raffleStates.isDrawn;
        return { isLive, isUpcoming };
    }, [raffleStates]);

    const { image, imageSettings } = useMemo(() => {
        if (coreData?.imageUrl) {
            return { image: coreData.imageUrl, imageSettings: "object-cover" };
        }
        return { image: null, imageSettings: "" };
    }, [coreData?.imageUrl]);

    if (isRaffleCoreInfoForListCardLoading) {
        return <OnchainRaffleCardSkeleton />;
    }

    if (isRaffleCoreInfoForListCardError || !coreData) {
        return null;
    }

    const raffleTitle = coreData.title || DEFAULT_TITLE;
    const participationCount = coreData.participationCount?.toString() || "0";
    const totalQuantity = coreData.totalQuantity?.toString() || "0";
    const feeAmount = coreData.participationFeeAmount?.toString() || "0";

    return (
        <Link href={`/raffles/test/${contractAddress}/${raffleId}`}>
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
                    {image && (
                        <div className="relative w-full h-[200px] md:w-[400px] md:h-[300px] overflow-hidden rounded-[12px]">
                            <Image
                                src={image}
                                alt={raffleTitle}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className={cn(
                                    "transition-all duration-700 ease-out group-hover:scale-105",
                                    imageSettings
                                )}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
                        </div>
                    )}

                    <div
                        className={cn(
                            "relative z-10",
                            "w-full",
                            getResponsiveClass(25).paddingClass
                        )}
                    >
                        <h3
                            className={cn(
                                "font-bold text-white mb-2 line-clamp-2",
                                getResponsiveClass(30).textClass
                            )}
                        >
                            {raffleTitle}
                        </h3>

                        <h3
                            className={cn(
                                "text-purple-400 font-medium mb-4",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            On-chain Raffle • {totalQuantity} Available
                        </h3>

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
                                    {participationCount} joined
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
                                    {totalQuantity} prizes
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
                                    {Number(feeAmount) > 0
                                        ? `${feeAmount} ${
                                              asset?.name || "TOKEN"
                                          }`
                                        : "Free"}
                                    {asset?.iconUrl && (
                                        <Image
                                            src={asset.iconUrl}
                                            alt={asset.name || ""}
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
                                : "📋 View Details"}
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

const OnchainRaffleCardSkeleton = memo(function OnchainRaffleCardSkeleton() {
    return (
        <motion.div
            className={cn(
                "morp-glass-1 inner-shadow rounded-[12px]",
                getResponsiveClass(30).paddingClass
            )}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
        >
            <div className="flex flex-col gap-2 md:flex-row p-2 w-full">
                <div className="w-full h-[200px] md:w-[400px] md:h-[300px] bg-white/10 rounded-[12px]" />
                <div className="flex-1 space-y-4">
                    <div className="h-6 bg-white/20 rounded w-3/4" />
                    <div className="h-4 bg-white/15 rounded w-1/2" />
                    <div className="grid grid-cols-2 gap-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-4 bg-white/10 rounded" />
                        ))}
                    </div>
                    <div className="h-12 bg-white/20 rounded" />
                </div>
            </div>
        </motion.div>
    );
});

export default memo(RafflesOnchainListCard);
