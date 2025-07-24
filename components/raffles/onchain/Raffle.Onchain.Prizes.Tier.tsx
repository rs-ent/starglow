"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { tierMap } from "../raffle-tier";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import type { PrizeData } from "@/app/actions/raffles/onchain/actions-write-v2";

const ITEM_VARIANTS = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
};

export interface TierInfo {
    name: string;
    color: string;
    colors: string[];
    colorsCover: string[];
    gradient: string;
    bg: string;
    border: string;
    glow: string;
    mainColorR: number;
    mainColorG: number;
    mainColorB: number;
}

export const getTierInfo = (rarity: number): TierInfo => {
    const tier = Math.min(rarity, Object.keys(tierMap).length - 1);
    return tierMap[tier as keyof typeof tierMap] || tierMap[0];
};

export const groupPrizesByTier = (prizes: PrizeData[]) => {
    const sortedPrizes = [...prizes].sort((a, b) => {
        const rarityA = a.rarity ? Number(a.rarity) : 0;
        const rarityB = b.rarity ? Number(b.rarity) : 0;
        return rarityB - rarityA;
    });

    const prizesByTier: { [key: number]: PrizeData[] } = {};
    sortedPrizes.forEach((prize) => {
        const rarity = prize.rarity ? Number(prize.rarity) : 0;
        const tier = Math.min(rarity, Object.keys(tierMap).length - 1);
        if (!prizesByTier[tier]) prizesByTier[tier] = [];
        prizesByTier[tier].push(prize);
    });

    return {
        sortedPrizes,
        prizesByTier,
        totalPrizes: sortedPrizes.length,
        highestTier: Math.max(...Object.keys(prizesByTier).map(Number)),
        grandPrize: sortedPrizes[0],
    };
};

export const getGridCols = (itemCount: number): string => {
    if (itemCount === 1) return "grid-cols-1";
    if (itemCount === 2) return "grid-cols-2";
    return "grid-cols-3";
};

interface TierHeaderProps {
    tierInfo: TierInfo;
    prizeCount: number;
    sectionIndex: number;
}

export const TierHeader = memo(function TierHeader({
    tierInfo,
    prizeCount,
    sectionIndex,
}: TierHeaderProps) {
    return (
        <motion.div
            variants={ITEM_VARIANTS}
            transition={{
                duration: 0.6,
                ease: "easeOut",
                delay: 0.2 + sectionIndex * 0.1,
            }}
            className="flex items-center justify-between mb-4"
        >
            <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className={cn(
                    "px-4 py-2 rounded-full bg-gradient-to-r text-white font-bold shadow-lg",
                    "font-main backdrop-blur-sm border border-white/20",
                    tierInfo.gradient,
                    getResponsiveClass(15).textClass
                )}
            >
                {tierInfo.name}
            </motion.div>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + sectionIndex * 0.1 }}
                className={cn(
                    "px-3 py-1 rounded-full bg-slate-800/60 border border-white/20",
                    "text-slate-300 font-medium backdrop-blur-sm",
                    getResponsiveClass(10).textClass
                )}
            >
                {prizeCount} Prize{prizeCount !== 1 ? "s" : ""}
            </motion.div>
        </motion.div>
    );
});

interface TierContainerProps {
    tier: number;
    tierInfo: TierInfo;
    sectionIndex: number;
    children: React.ReactNode;
}

export const TierContainer = memo(function TierContainer({
    tier,
    tierInfo,
    sectionIndex,
    children,
}: TierContainerProps) {
    return (
        <motion.div
            key={tier}
            variants={ITEM_VARIANTS}
            transition={{
                duration: 0.6,
                ease: "easeOut",
                delay: 0.2 + sectionIndex * 0.1,
            }}
            whileHover={{ x: 4, scale: 1.01 }}
            className={cn(
                "relative rounded-2xl border overflow-hidden backdrop-blur-lg",
                "bg-gradient-to-br shadow-2xl transition-all duration-300",
                "p-4",
                tierInfo.bg,
                `border-${tierInfo.border}`,
                `shadow-${tierInfo.glow}`
            )}
        >
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute inset-0"
                    animate={{
                        background: [
                            `radial-gradient(circle at 30% 70%, ${tierInfo.glow.replace(
                                /[\[\]]/g,
                                ""
                            )}/8 0%, transparent 50%)`,
                            `radial-gradient(circle at 70% 30%, ${tierInfo.glow.replace(
                                /[\[\]]/g,
                                ""
                            )}/12 0%, transparent 50%)`,
                            `radial-gradient(circle at 50% 50%, ${tierInfo.glow.replace(
                                /[\[\]]/g,
                                ""
                            )}/6 0%, transparent 50%)`,
                        ],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {[...Array(4)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full opacity-20"
                        style={{
                            width: `${0.8 + Math.random() * 1.2}px`,
                            height: `${0.8 + Math.random() * 1.2}px`,
                            background: `rgba(${tierInfo.mainColorR}, ${
                                tierInfo.mainColorG
                            }, ${tierInfo.mainColorB}, ${
                                0.4 + Math.random() * 0.6
                            })`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -25 - Math.random() * 15, 0],
                            opacity: [0.2, 0.8, 0.2],
                            scale: [0.3, 2, 0.3],
                        }}
                        transition={{
                            duration: 6 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 4,
                        }}
                    />
                ))}
            </div>

            <div className={cn("absolute inset-0 opacity-8", tierInfo.bg)} />

            <div className="relative z-10">{children}</div>
        </motion.div>
    );
});

export const formatRarity = (rarity: number): string => {
    const tierInfo = getTierInfo(rarity);
    return `${tierInfo.name} (${rarity})`;
};

export const getTierColor = (rarity: number): string => {
    const tierInfo = getTierInfo(rarity);
    return tierInfo.color;
};

export const getTierGradient = (rarity: number): string => {
    const tierInfo = getTierInfo(rarity);
    return tierInfo.gradient;
};
