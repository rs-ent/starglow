"use client";

import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Particles } from "@/components/magicui/particles";
import { RetroGrid } from "@/components/magicui/retro-grid";
import { safeBigIntToNumber, getTimeUntilEnd } from "@/lib/utils/format";
import { ShimmerEffect } from "@/components/magicui/shimmer-effect";

interface RaffleOnchainHeroProps {
    raffleData?: {
        basicInfo?: {
            title?: string;
            description?: string;
            imageUrl?: string;
        };
    };
    showAsListCard?: boolean;
    listCardInfo?: {
        drawDate?: string;
        startDate?: string;
        endDate?: string;
        instantDraw?: string;
        participationLimit?: string;
        participationCount?: string;
        participationFeeAsset?: {
            symbol?: string;
            iconUrl?: string;
        };
        participationFeeAmount?: string;
        uniqueParticipants?: string;
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
                getResponsiveClass(10).paddingClass
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 rounded-full animate-pulse gpu-animate" />
            <div className="relative z-10 flex items-center gap-1 justify-center">
                {children}
            </div>
        </div>
    </div>
);

export default memo(function RaffleOnchainHero({
    raffleData,
    showAsListCard = false,
    listCardInfo,
}: RaffleOnchainHeroProps) {
    const [isHovered, setIsHovered] = useState(false);

    const { dateLabel, dateValue, drawDateValue } = useMemo(() => {
        if (!listCardInfo)
            return { dateLabel: "", dateValue: "", drawDateValue: "" };

        const now = new Date();
        const startDate =
            safeBigIntToNumber(listCardInfo.startDate || 0) * 1000;
        const endDate = safeBigIntToNumber(listCardInfo.endDate || 0) * 1000;
        const drawDate =
            listCardInfo.instantDraw === "true"
                ? "Instant"
                : getTimeUntilEnd(
                      new Date(
                          safeBigIntToNumber(listCardInfo.drawDate || 0) * 1000
                      )
                  );

        if (now < new Date(startDate)) {
            return {
                dateLabel: "Starts in",
                dateValue: getTimeUntilEnd(new Date(startDate)),
                drawDateValue: drawDate,
            };
        }

        if (now > new Date(endDate)) {
            return {
                dateLabel: "Ended",
                dateValue: getTimeUntilEnd(new Date(endDate)),
                drawDateValue: drawDate,
            };
        }

        return {
            dateLabel: "Ends in",
            dateValue: getTimeUntilEnd(new Date(endDate)),
            drawDateValue: drawDate,
        };
    }, [listCardInfo]);

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            className="relative mb-12 overflow-hidden rounded-3xl border-2 border-emerald-400/30 shadow-2xl shadow-emerald-500/20 gpu-accelerate"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
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

            <RetroGrid opacity={0.3} />

            {isHovered && <ShimmerEffect />}

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
                            <div className="flex items-center">
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
                                    "rainbow-text",
                                    "drop-shadow-[0_0_30px_rgba(20,184,166,0.5)]",
                                    getResponsiveClass(50).textClass
                                )}
                                style={{ lineHeight: "1.1" }}
                            >
                                {raffleData?.basicInfo?.title || "Epic Raffle"}
                            </motion.h1>

                            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-purple-500/10 rounded-2xl blur-2xl opacity-60 gpu-animate" />
                        </div>

                        {raffleData?.basicInfo?.description && (
                            <motion.div className="relative max-w-2xl">
                                <p
                                    className={cn(
                                        "relative z-10 text-slate-200 leading-relaxed font-light text-left p-2",
                                        "drop-shadow-[0_0_15px_rgba(20,184,166,0.3)]",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {raffleData.basicInfo.description}
                                </p>
                            </motion.div>
                        )}

                        {showAsListCard && (
                            <div className="grid grid-cols-2 items-center gap-3 mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                                    <span
                                        className={cn(
                                            "text-emerald-300/60 text-xs font-extralight tracking-wider uppercase",
                                            getResponsiveClass(5).textClass
                                        )}
                                    >
                                        Draw
                                    </span>
                                    <span
                                        className={cn(
                                            "text-emerald-300/90 text-xs font-medium tracking-wider uppercase",
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        {drawDateValue}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                                    <span
                                        className={cn(
                                            "text-emerald-300/60 text-xs font-extralight tracking-wider uppercase",
                                            getResponsiveClass(5).textClass
                                        )}
                                    >
                                        {dateLabel}
                                    </span>
                                    <span
                                        className={cn(
                                            "text-emerald-300/90 text-xs font-medium tracking-wider uppercase",
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        {dateValue}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                                    <span
                                        className={cn(
                                            "text-emerald-300/60 text-xs font-extralight tracking-wider uppercase",
                                            getResponsiveClass(5).textClass
                                        )}
                                    >
                                        Remaining Seats
                                    </span>
                                    <span
                                        className={cn(
                                            "text-emerald-300/90 text-xs font-medium tracking-wider uppercase",
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        {safeBigIntToNumber(
                                            listCardInfo?.participationLimit ||
                                                0
                                        ) -
                                            safeBigIntToNumber(
                                                listCardInfo?.uniqueParticipants ||
                                                    0
                                            )}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                                    <span
                                        className={cn(
                                            "text-emerald-300/60 text-xs font-extralight tracking-wider uppercase",
                                            getResponsiveClass(5).textClass
                                        )}
                                    >
                                        Ticket Price
                                    </span>
                                    {listCardInfo?.participationFeeAsset
                                        ?.iconUrl && (
                                        <Image
                                            src={
                                                listCardInfo
                                                    ?.participationFeeAsset
                                                    ?.iconUrl || ""
                                            }
                                            alt="Ticket Price"
                                            width={24}
                                            height={24}
                                            className={cn(
                                                "object-contain",
                                                getResponsiveClass(15)
                                                    .frameClass
                                            )}
                                        />
                                    )}
                                    <span
                                        className={cn(
                                            "text-emerald-300/90 text-xs font-medium tracking-wider uppercase",
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        {listCardInfo?.participationFeeAmount}{" "}
                                        {
                                            listCardInfo?.participationFeeAsset
                                                ?.symbol
                                        }
                                    </span>
                                </div>
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
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/98 via-slate-950/85 to-slate-950/40 gpu-animate opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-emerald-950/30 gpu-animate opacity-90" />
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
