"use client";

import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Particles } from "@/components/magicui/particles";
import { RetroGrid } from "@/components/magicui/retro-grid";

interface RaffleOnchainHeroProps {
    raffleData?: {
        basicInfo?: {
            title?: string;
            description?: string;
            imageUrl?: string;
        };
    };
    contractAddress?: string;
    raffleId?: string;
}

const ShimmerBadge = ({ children }: { children: React.ReactNode }) => (
    <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/25 to-cyan-500/25 rounded-full blur-lg group-hover:blur-xl transition-all duration-500 gpu-animate" />
        <div
            className={cn(
                "relative inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border-2 border-emerald-400/40 rounded-full backdrop-blur-lg hover:border-emerald-400/60 transition-all duration-500 hover:scale-105",
                getResponsiveClass(15).paddingClass
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 rounded-full animate-pulse gpu-animate" />
            <div className="relative z-10 flex items-center gap-3">
                {children}
            </div>
        </div>
    </div>
);

export default memo(function RaffleOnchainHero({
    raffleData,
    contractAddress,
    raffleId,
}: RaffleOnchainHeroProps) {
    const handleCopyAddress = useCallback(() => {
        const fullAddress = `${contractAddress}`;
        window.open(`https://beratrail.io/address/${fullAddress}`, "_blank");
    }, [contractAddress]);

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            className="relative mb-12 overflow-hidden rounded-3xl border-2 border-emerald-400/30 shadow-2xl shadow-emerald-500/20 gpu-accelerate"
        >
            <Particles
                className="absolute inset-0"
                quantity={30}
                staticity={50}
                color="#14b8a6"
                size={1.2}
                refresh={false}
            />

            <BorderBeam
                size={200}
                duration={20}
                colorFrom="#14b8a6"
                colorTo="#8b5cf6"
                borderWidth={1.5}
                className="opacity-60"
            />

            <RetroGrid />

            <div className="relative z-10 min-h-[35vh] flex items-center p-4">
                <div className="flex flex-col items-start w-full space-y-1">
                    <motion.div className="flex items-center gap-1 flex-wrap">
                        <ShimmerBadge>
                            <div className="relative">
                                <Image
                                    src="/logo/partners/berachain2.png"
                                    alt="Berachain"
                                    width={64}
                                    height={64}
                                    className={cn(
                                        "object-contain",
                                        getResponsiveClass(30).frameClass
                                    )}
                                />
                                <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md gpu-animate" />
                            </div>
                            <div className="flex items-center gap-2">
                                <h4
                                    className={cn(
                                        "font-bold bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-200 bg-clip-text text-transparent",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    BERACHAIN
                                </h4>
                            </div>
                        </ShimmerBadge>
                    </motion.div>

                    <motion.div className="space-y-4">
                        <div className="relative flex items-center gap-1">
                            <motion.h1
                                className={cn(
                                    "font-light tracking-tighter text-left break-words",
                                    "bg-gradient-to-r from-emerald-300 via-cyan-200 to-purple-300 bg-clip-text text-transparent",
                                    "drop-shadow-[0_0_30px_rgba(20,184,166,0.5)]",
                                    getResponsiveClass(55).textClass
                                )}
                                style={{ lineHeight: "1.1" }}
                            >
                                {raffleData?.basicInfo?.title ||
                                    "Epic Blockchain Raffle"}
                            </motion.h1>

                            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-purple-500/10 rounded-2xl blur-2xl opacity-60 gpu-animate" />
                        </div>

                        {raffleData?.basicInfo?.description && (
                            <motion.div className="relative max-w-2xl">
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/40 to-slate-700/40 rounded-2xl backdrop-blur-sm border border-emerald-400/20" />
                                <p
                                    className={cn(
                                        "relative z-10 text-slate-200 leading-relaxed font-light text-left p-6",
                                        "drop-shadow-[0_0_15px_rgba(20,184,166,0.3)]",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    {raffleData.basicInfo.description}
                                </p>
                            </motion.div>
                        )}

                        {contractAddress && raffleId && (
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                                    </div>
                                    <span
                                        className={cn(
                                            "text-emerald-300/80 text-xs font-medium tracking-wider uppercase",
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        Contract Address
                                    </span>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02, y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleCopyAddress}
                                    className={cn(
                                        "group relative overflow-hidden",
                                        "bg-gradient-to-r from-slate-900/60 via-emerald-950/40 to-slate-900/60",
                                        "border border-emerald-400/30 rounded-lg backdrop-blur-lg",
                                        "hover:border-emerald-400/60 hover:shadow-emerald-400/20 hover:shadow-lg",
                                        "transition-all duration-300 cursor-pointer gpu-animate",
                                        getResponsiveClass(10).paddingClass,
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {/* Holographic scan line effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                                    {/* Content */}
                                    <div className="relative z-10 flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <span className="text-emerald-300 font-mono">
                                                {contractAddress.slice(0, 6)}...
                                                {contractAddress.slice(-4)}
                                            </span>
                                            <span className="text-emerald-400/60">
                                                /
                                            </span>
                                            <span className="text-cyan-300 font-mono font-bold">
                                                {raffleId}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Border glow effect */}
                                    <div className="absolute inset-0 rounded-lg border border-emerald-400/20 group-hover:border-emerald-400/40 transition-colors duration-300"></div>
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            <div className="absolute inset-0 -z-50 gpu-accelerate">
                {raffleData?.basicInfo?.imageUrl && (
                    <div className="relative w-full h-full">
                        <Image
                            src={raffleData.basicInfo.imageUrl}
                            alt={
                                raffleData.basicInfo.title ||
                                "Raffle background"
                            }
                            fill
                            className="object-cover"
                            priority={true}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/98 via-slate-950/85 to-slate-950/40 gpu-animate" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-emerald-950/30 gpu-animate" />
                    </div>
                )}

                <div
                    className={cn(
                        "absolute inset-0",
                        raffleData?.basicInfo?.imageUrl
                            ? "bg-transparent"
                            : "bg-gradient-to-br from-slate-950/95 via-emerald-950/40 to-purple-950/50"
                    )}
                />
            </div>
        </motion.div>
    );
});
