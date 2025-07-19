"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Particles } from "@/components/magicui/particles";

interface RaffleOnchainHeroProps {
    raffleData?: {
        basicInfo?: {
            title?: string;
            description?: string;
            imageUrl?: string;
        };
    };
}

const ShimmerBadge = ({ children }: { children: React.ReactNode }) => (
    <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/25 to-cyan-500/25 rounded-full blur-lg group-hover:blur-xl transition-all duration-500" />
        <div className="relative inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border-2 border-emerald-400/40 rounded-full backdrop-blur-lg hover:border-emerald-400/60 transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 rounded-full animate-pulse" />
            <div className="relative z-10 flex items-center gap-3">
                {children}
            </div>
        </div>
    </div>
);

export default memo(function RaffleOnchainHero({
    raffleData,
}: RaffleOnchainHeroProps) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            className="relative mb-12 overflow-hidden rounded-3xl border-2 border-emerald-400/30 shadow-2xl shadow-emerald-500/20"
        >
            <Particles
                className="absolute inset-0"
                quantity={60}
                staticity={30}
                color="#14b8a6"
                size={1.2}
                refresh={false}
            />

            <BorderBeam
                size={350}
                duration={15}
                colorFrom="#14b8a6"
                colorTo="#8b5cf6"
                borderWidth={2}
                className="opacity-80"
            />

            <div className="relative z-10 min-h-[35vh] flex items-center p-4">
                <div className="flex flex-col items-start w-full space-y-6">
                    <motion.div className="flex items-center gap-4 flex-wrap">
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
                                <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md" />
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

                            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-purple-500/10 rounded-2xl blur-2xl opacity-60" />
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
                    </motion.div>
                </div>
            </div>

            <div className="absolute inset-0 -z-50">
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
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/98 via-slate-950/85 to-slate-950/40" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-emerald-950/30" />
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
