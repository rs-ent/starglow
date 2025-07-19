/// components/raffles/web3/Raffle.Onchain.Prizes.Tier.Item.tsx

"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Package, Sparkles } from "lucide-react";
import Image from "next/image";

import { tierMap } from "../raffle-tier";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { ShimmerEffect } from "@/components/magicui/shimmer-effect";

interface RaffleOnchainPrizesTierItemProps {
    data?: {
        title?: string;
        description?: string;
        imageUrl?: string;
        iconUrl?: string;
        prizeType?: number;
        prizeQuantity?: bigint | number;
        rarity?: bigint | number;
        order?: bigint | number;
        registeredTicketQuantity?: bigint | number;
        pickedTicketQuantity?: bigint | number;
        startTicketNumber?: bigint | number;
    };
    index?: number;
    totalPrizes?: number;
}

const PrizeItemEmpty = memo(({ index }: { index: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
            delay: index * 0.05,
            type: "spring",
            damping: 25,
            stiffness: 400,
        }}
        className={cn(
            "relative bg-gradient-to-br from-slate-900/90 via-slate-800/70 to-slate-950/50",
            "backdrop-blur-lg border border-slate-400/30 rounded-2xl p-4 overflow-hidden",
            "shadow-lg shadow-slate-500/20"
        )}
    >
        <div className="flex items-center justify-center">
            <Package className="w-6 h-6 text-slate-400 mr-2" />
            <span className="text-slate-300 text-sm">Prize unavailable</span>
        </div>
    </motion.div>
));
PrizeItemEmpty.displayName = "PrizeItemEmpty";

export default memo(function RaffleOnchainPrizesTierItem({
    data,
    index = 0,
    totalPrizes = 1,
}: RaffleOnchainPrizesTierItemProps) {
    const prizeInfo = useMemo(() => {
        if (!data) return null;

        const order = data.order ? Number(data.order) : 0;
        const rarity = data.rarity ? Number(data.rarity) : 0;
        const prizeQuantity = data.prizeQuantity
            ? Number(data.prizeQuantity)
            : 0;
        const registeredTickets = data.registeredTicketQuantity
            ? Number(data.registeredTicketQuantity)
            : 0;
        const pickedTickets = data.pickedTicketQuantity
            ? Number(data.pickedTicketQuantity)
            : 0;

        const tier = Math.min(rarity, Object.keys(tierMap).length - 1);
        const tierInfo = tierMap[tier as keyof typeof tierMap] || tierMap[0];

        const winProbability =
            registeredTickets > 0
                ? (prizeQuantity / registeredTickets) * 100
                : 0;
        const percentage =
            totalPrizes > 0 ? (prizeQuantity / totalPrizes) * 100 : 0;

        return {
            order,
            rarity,
            tier,
            tierInfo,
            prizeQuantity,
            registeredTickets,
            pickedTickets,
            winProbability,
            percentage,
            isNFT: data.prizeType === 1,
            isAsset: data.prizeType === 0,
            startTicketNumber: data.startTicketNumber
                ? Number(data.startTicketNumber)
                : 0,
        };
    }, [data, totalPrizes]);

    const itemVariants = useMemo(
        () => ({
            hidden: { opacity: 0, y: 20, scale: 0.95 },
            visible: { opacity: 1, y: 0, scale: 1 },
        }),
        []
    );

    const hoverVariants = useMemo(
        () => ({
            y: -6,
            scale: 1.03,
        }),
        []
    );

    const imageVariants = useMemo(
        () => ({
            initial: { scale: 1, rotate: 0 },
        }),
        []
    );

    const imageHoverVariants = useMemo(
        () => ({
            scale: 1.1,
            rotate: 2,
        }),
        []
    );

    if (!data || !prizeInfo) {
        return <PrizeItemEmpty index={index} />;
    }

    return (
        <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            whileHover={hoverVariants}
            transition={{
                delay: index * 0.05,
                type: "spring",
                damping: 25,
                stiffness: 400,
            }}
            className={cn(
                "relative overflow-hidden rounded-2xl group cursor-pointer",
                "backdrop-blur-lg border-2 transition-all duration-300 ease-out",
                "bg-gradient-to-br shadow-xl",
                prizeInfo.tierInfo.bg,
                `border-${prizeInfo.tierInfo.border}`,
                `shadow-${prizeInfo.tierInfo.glow}`,
                "p-4"
            )}
        >
            <div className="relative z-10 text-center">
                <div
                    className={cn(
                        "relative mb-4 mx-auto",
                        getResponsiveClass(60).frameClass
                    )}
                >
                    <motion.div
                        variants={imageVariants}
                        whileHover={imageHoverVariants}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={cn(
                            "relative w-full h-full rounded-xl border-2 flex items-center justify-center overflow-hidden",
                            "bg-gradient-to-br from-slate-800/60 via-slate-700/40 to-slate-900/60",
                            "border-white/20 shadow-lg backdrop-blur-sm"
                        )}
                    >
                        {data.imageUrl ? (
                            <Image
                                src={data.imageUrl}
                                alt={data.title || "Prize"}
                                fill
                                className={cn(
                                    "object-contain transition-all duration-500",
                                    prizeInfo.isNFT
                                        ? "object-cover"
                                        : "object-contain"
                                )}
                            />
                        ) : (
                            <motion.div
                                animate={{
                                    rotate: [0, 10, -10, 0],
                                    scale: [1, 1.1, 1],
                                }}
                                transition={{
                                    duration: 6,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                <Sparkles
                                    className={cn(
                                        getResponsiveClass(40).frameClass,
                                        "text-white/60"
                                    )}
                                />
                            </motion.div>
                        )}

                        {data.prizeType !== 0 && (
                            <div className="absolute inset-0">
                                <ShimmerEffect />
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.div>

                    <motion.div
                        className="absolute -top-2 -right-2 w-6 h-6"
                        animate={{
                            rotate: [0, 15, -15, 0],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        {data?.prizeType !== 0 && (
                            <div className="relative">
                                <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-sm animate-pulse" />
                            </div>
                        )}
                    </motion.div>
                </div>

                <div className="space-y-3">
                    <motion.h4
                        className={cn(
                            "font-bold line-clamp-2 text-white drop-shadow-md",
                            getResponsiveClass(15).textClass
                        )}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                    >
                        {data.title || "Cosmic Prize"}
                    </motion.h4>
                </div>
            </div>
        </motion.div>
    );
});
