/// components/raffles/web3/Raffle.Onchain.Prizes.tsx

"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Gift } from "lucide-react";

import RaffleOnchainPrizesTierItem from "./Raffle.Onchain.Prizes.Tier.Item";
import {
    groupPrizesByTier,
    getGridCols,
    TierHeader,
    TierContainer,
    getTierInfo,
    type PrizeData,
} from "./Raffle.Onchain.Prizes.Tier";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Particles } from "@/components/magicui/particles";

interface RaffleOnchainPrizesProps {
    data?: PrizeData[];
}

const SparkleIcon = memo(({ className }: { className?: string }) => (
    <div className={cn("relative", className)}>
        <motion.div
            animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.05, 1],
            }}
            transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
            }}
            className="p-2 rounded-[10px] bg-emerald-400/15 border-2 border-emerald-400/40 backdrop-blur-sm"
        >
            <Trophy
                className={cn(
                    getResponsiveClass(30).frameClass,
                    "text-emerald-400"
                )}
            />
        </motion.div>
        <div className="absolute inset-0 bg-emerald-400/20 rounded-2xl blur-lg opacity-50" />
    </div>
));
SparkleIcon.displayName = "SparkleIcon";

const PrizesLoadingState = memo(() => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
            "relative bg-gradient-to-br from-slate-900/95 via-emerald-950/70 to-purple-950/50",
            "backdrop-blur-xl border border-emerald-400/30 rounded-3xl shadow-2xl shadow-emerald-500/20",
            "p-3 overflow-hidden"
        )}
    >
        <Particles
            className="absolute inset-0"
            quantity={25}
            staticity={40}
            color="#10b981"
            size={0.6}
        />
        <BorderBeam
            size={80}
            duration={6}
            colorFrom="#10b981"
            colorTo="#8b5cf6"
            borderWidth={1.5}
        />
        <div className="flex items-center justify-center relative z-10">
            <motion.div
                className="relative"
                animate={{ rotate: 360 }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                }}
            >
                <div className="h-8 w-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
                <div
                    className="absolute inset-0 h-8 w-8 border-2 border-purple-400/50 border-b-transparent rounded-full animate-spin"
                    style={{
                        animationDirection: "reverse",
                        animationDuration: "1.5s",
                    }}
                />
            </motion.div>
            <span className="ml-3 text-emerald-100 font-medium">
                Loading cosmic prizes...
            </span>
        </div>
    </motion.div>
));
PrizesLoadingState.displayName = "PrizesLoadingState";

const PrizesEmptyState = memo(() => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
            "relative bg-gradient-to-br from-slate-900/95 via-slate-800/70 to-slate-950/50",
            "backdrop-blur-xl border border-slate-400/30 rounded-3xl shadow-2xl shadow-slate-500/20",
            "p-3 overflow-hidden"
        )}
    >
        <Particles
            className="absolute inset-0"
            quantity={15}
            staticity={60}
            color="#64748b"
            size={0.4}
        />
        <div className="relative z-10 flex items-center justify-center">
            <Gift className="w-8 h-8 text-slate-400 mr-3" />
            <span className="text-slate-300">No prizes in this galaxy</span>
        </div>
    </motion.div>
));
PrizesEmptyState.displayName = "PrizesEmptyState";

export default memo(function RaffleOnchainPrizes({
    data,
}: RaffleOnchainPrizesProps) {
    const prizeAnalysis = useMemo(() => {
        if (!data || data.length === 0) return null;
        return groupPrizesByTier(data);
    }, [data]);

    const containerVariants = useMemo(
        () => ({
            hidden: { opacity: 0, y: 30, scale: 0.95 },
            visible: {
                opacity: 1,
                y: 0,
                scale: 1,
            },
        }),
        []
    );

    const itemVariants = useMemo(
        () => ({
            hidden: { opacity: 0, x: -20 },
            visible: {
                opacity: 1,
                x: 0,
            },
        }),
        []
    );

    if (!data) {
        return <PrizesLoadingState />;
    }

    if (!prizeAnalysis || prizeAnalysis.totalPrizes === 0) {
        return <PrizesEmptyState />;
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            transition={{
                duration: 0.8,
                ease: "easeOut",
                staggerChildren: 0.1,
            }}
            className={cn(
                "relative bg-gradient-to-br from-slate-900/95 via-emerald-950/70 to-purple-950/50 mt-4",
                "backdrop-blur-xl border border-emerald-400/30 rounded-3xl overflow-hidden",
                "shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30",
                "p-3 transition-all duration-500"
            )}
        >
            <Particles
                className="absolute inset-0"
                quantity={35}
                staticity={20}
                color="#10b981"
                size={0.8}
                refresh={false}
            />

            <BorderBeam
                size={100}
                duration={12}
                colorFrom="#10b981"
                colorTo="#8b5cf6"
                borderWidth={1.5}
                className="opacity-60"
            />

            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute inset-0"
                    animate={{
                        background: [
                            "radial-gradient(circle at 25% 75%, rgba(16, 185, 129, 0.12) 0%, transparent 60%)",
                            "radial-gradient(circle at 75% 25%, rgba(139, 92, 246, 0.12) 0%, transparent 60%)",
                            "radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.12) 0%, transparent 60%)",
                        ],
                    }}
                    transition={{
                        duration: 18,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: `${1 + Math.random() * 1.5}px`,
                            height: `${1 + Math.random() * 1.5}px`,
                            background: `rgba(16, 185, 129, ${
                                0.3 + Math.random() * 0.5
                            })`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -30 - Math.random() * 20, 0],
                            opacity: [0.3, 1, 0.3],
                            scale: [0.2, 1.8, 0.2],
                        }}
                        transition={{
                            duration: 5 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 4,
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10">
                <motion.div
                    variants={itemVariants}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={cn(
                        "flex items-center justify-between mb-8",
                        getResponsiveClass(15).gapClass
                    )}
                >
                    <div
                        className={cn(
                            "flex items-center",
                            getResponsiveClass(15).gapClass
                        )}
                    >
                        <SparkleIcon />
                        <div>
                            <h3
                                className={cn(
                                    "font-bold bg-gradient-to-r from-emerald-300 via-cyan-200 to-emerald-100 bg-clip-text text-transparent",
                                    getResponsiveClass(25).textClass
                                )}
                            >
                                Prize Pool
                            </h3>
                            <p
                                className={cn(
                                    "text-emerald-300/80 font-medium",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                {prizeAnalysis.totalPrizes} Total Prizes
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="space-y-6">
                    {Object.keys(prizeAnalysis.prizesByTier)
                        .map(Number)
                        .sort((a, b) => b - a)
                        .map((tier, sectionIndex) => {
                            const tierPrizes = prizeAnalysis.prizesByTier[tier];
                            const tierInfo = getTierInfo(tier);

                            return (
                                <TierContainer
                                    key={tier}
                                    tier={tier}
                                    tierInfo={tierInfo}
                                    sectionIndex={sectionIndex}
                                >
                                    <TierHeader
                                        tierInfo={tierInfo}
                                        prizeCount={tierPrizes.length}
                                        sectionIndex={sectionIndex}
                                    />

                                    <div
                                        className={cn(
                                            "grid gap-3",
                                            getGridCols(tierPrizes.length)
                                        )}
                                    >
                                        {tierPrizes.map((prize, prizeIndex) => {
                                            const globalIndex =
                                                prizeAnalysis.sortedPrizes.findIndex(
                                                    (p) => p === prize
                                                );

                                            return (
                                                <RaffleOnchainPrizesTierItem
                                                    key={`${tier}-${prizeIndex}`}
                                                    data={prize}
                                                    index={globalIndex}
                                                    totalPrizes={
                                                        prizeAnalysis.totalPrizes
                                                    }
                                                />
                                            );
                                        })}
                                    </div>
                                </TierContainer>
                            );
                        })}
                </div>
            </div>
        </motion.div>
    );
});
