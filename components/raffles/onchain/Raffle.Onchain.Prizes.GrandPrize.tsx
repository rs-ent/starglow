"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Gem } from "lucide-react";
import Image from "next/image";

import { tierMap } from "../raffle-tier";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { BorderBeam } from "@/components/magicui/border-beam";
import { AuroraText } from "@/components/magicui/aurora-text";
import { ShimmerEffect } from "@/components/magicui/shimmer-effect";
import { Particles } from "@/components/magicui/particles";

interface RaffleOnchainPrizesGrandPrizeProps {
    data?: Array<{
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
    }>;
}

export default memo(function RaffleOnchainPrizesGrandPrize({
    data,
}: RaffleOnchainPrizesGrandPrizeProps) {
    const result = useMemo(() => {
        if (!data || data.length === 0) return null;

        const grandPrize = data.sort((a, b) => {
            const rarityA = a.rarity ? Number(a.rarity) : 0;
            const rarityB = b.rarity ? Number(b.rarity) : 0;
            const orderA = a.order ? Number(a.order) : 0;
            const orderB = b.order ? Number(b.order) : 0;
            return rarityB - rarityA || orderA - orderB;
        })[0];

        const rarity = grandPrize.rarity ? Number(grandPrize.rarity) : 0;
        const tier = Math.min(rarity, Object.keys(tierMap).length - 1);
        const tierInfo = tierMap[tier as keyof typeof tierMap] || tierMap[0];
        const bestTier = Object.keys(tierMap).length - 1;
        const displayTier = bestTier - tier;

        const prizeInfo = {
            rarity,
            tier,
            tierInfo,
            displayTier,
            isNFT: grandPrize.prizeType === 2,
            isAsset: grandPrize.prizeType === 1,
        };

        return {
            grandPrize,
            prizeInfo,
        };
    }, [data]);

    if (!data || !result) {
        return null;
    }

    const { grandPrize, prizeInfo } = result;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", damping: 25 }}
            whileHover={{
                scale: 1.02,
                y: -8,
                transition: { duration: 0.2, type: "spring", damping: 20 },
            }}
            className={cn(
                "group relative overflow-hidden rounded-3xl cursor-pointer",
                "bg-gradient-to-br from-slate-900 via-slate-800 to-black",
                "border border-purple-500/30 shadow-2xl",
                "hover:shadow-purple-500/50 hover:border-purple-400/50",
                "transition-all duration-300 gpu-accelerate",
                getResponsiveClass(30).paddingClass
            )}
        >
            {/* Magic UI Border Beam */}
            <BorderBeam
                size={100}
                duration={18}
                borderWidth={1.5}
                colorFrom="#a855f7"
                colorTo="#06b6d4"
                className="opacity-40"
            />

            <Particles
                className="absolute inset-0"
                quantity={12}
                staticity={60}
                color="#06b6d4"
                size={0.8}
            />

            {/* Space Gradient Background */}
            <div className="absolute inset-0 rounded-3xl opacity-30 gpu-animate">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-emerald-600/20" />
                <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    style={{
                        background:
                            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(168, 85, 247, 0.1), transparent)",
                    }}
                />
            </div>

            <div className="text-center relative z-10">
                {/* Prize Image */}
                <motion.div
                    className="mb-6 gpu-animate"
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <div
                        className={cn(
                            "mx-auto mb-4 relative group-hover:scale-105 transition-transform duration-300",
                            getResponsiveClass(130).frameClass
                        )}
                    >
                        <div className="relative w-full h-full rounded-xl overflow-hidden">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 p-[2px]">
                                <div
                                    className={cn(
                                        "w-full h-full rounded-xl",
                                        "bg-gradient-to-br from-slate-800 via-slate-600 to-slate-900",
                                        "group-hover:from-slate-700 group-hover:via-slate-500 group-hover:to-slate-800",
                                        "transition-colors duration-300"
                                    )}
                                >
                                    <ShimmerEffect />

                                    {grandPrize.imageUrl ? (
                                        <Image
                                            src={grandPrize.imageUrl || ""}
                                            alt={grandPrize.title || ""}
                                            fill
                                            className={cn(
                                                "rounded-xl transition-transform duration-300",
                                                prizeInfo.isNFT
                                                    ? "object-cover"
                                                    : "object-contain"
                                            )}
                                        />
                                    ) : (
                                        <motion.div
                                            className="flex items-center justify-center w-full h-full gpu-animate"
                                            animate={{
                                                scale: [1, 1.05, 1],
                                                rotate: [0, 5, -5, 0],
                                            }}
                                            transition={{
                                                duration: 12,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                        >
                                            <Gem
                                                className={cn(
                                                    getResponsiveClass(45)
                                                        .frameClass,
                                                    "text-purple-400 group-hover:text-purple-300",
                                                    "transition-colors duration-300"
                                                )}
                                            />
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    <motion.h3
                        className={cn(
                            "font-light text-white/90 mb-2 tracking-[0.2em] uppercase gpu-animate",
                            getResponsiveClass(15).textClass
                        )}
                        style={{
                            textShadow: "0 0 15px rgba(168, 85, 247, 0.6)",
                        }}
                    >
                        ⭐ GRAND PRIZE ⭐
                    </motion.h3>

                    {/* Magic UI Aurora Text for Title */}
                    <AuroraText
                        className={cn(
                            "font-black mb-3 block font-main",
                            getResponsiveClass(45).textClass
                        )}
                        colors={["#a855f7", "#06b6d4", "#10b981", "#eab308"]}
                    >
                        {grandPrize.title || "Cosmic Prize"}
                    </AuroraText>
                </motion.div>
            </div>

            {/* Hover glow effect */}
            <motion.div
                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 gpu-animate"
                style={{
                    background:
                        "radial-gradient(circle at center, rgba(168, 85, 247, 0.6), transparent 70%)",
                }}
            />
        </motion.div>
    );
});
