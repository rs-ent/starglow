/// components/raffles/onchain/Raffle.Onchain.Timing.tsx

"use client";

import { memo, useMemo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Calendar,
    Zap,
    PlayCircle,
    StopCircle,
    Trophy,
    Timer,
} from "lucide-react";

import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Particles } from "@/components/magicui/particles";

interface RaffleOnchainTimingProps {
    data?: {
        instantDraw?: boolean;
        startDate?: bigint | number;
        endDate?: bigint | number;
        drawDate?: bigint | number;
    };
}

const CONTAINER_VARIANTS = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
    },
};

const ITEM_VARIANTS = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
    },
};

const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default memo(function RaffleOnchainTiming({
    data,
}: RaffleOnchainTimingProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    const timingInfo = useMemo(() => {
        if (!data) return null;

        const now = BigInt(Math.floor(Date.now() / 1000));
        const startDate = data.startDate ? BigInt(data.startDate) : null;
        const endDate = data.endDate ? BigInt(data.endDate) : null;
        const drawDate = data.drawDate ? BigInt(data.drawDate) : null;

        let status: "upcoming" | "active" | "ended" | "drawn" = "upcoming";

        if (startDate && endDate) {
            if (now < startDate) {
                status = "upcoming";
            } else if (now <= endDate) {
                status = "active";
            } else if (drawDate && now < drawDate) {
                status = "ended";
            } else {
                status = "drawn";
            }
        }

        return {
            status,
            startDate: startDate ? new Date(Number(startDate) * 1000) : null,
            endDate: endDate ? new Date(Number(endDate) * 1000) : null,
            drawDate: drawDate ? new Date(Number(drawDate) * 1000) : null,
            instantDraw: data.instantDraw,
        };
    }, [data]);

    const updateTimer = useCallback(() => {
        if (!timingInfo?.endDate || !timingInfo?.startDate) return;

        const now = new Date().getTime();
        let targetTime: number;

        if (timingInfo.status === "upcoming" && timingInfo.startDate) {
            targetTime = timingInfo.startDate.getTime();
        } else if (
            (timingInfo.status === "active" ||
                timingInfo.status === "upcoming") &&
            timingInfo.endDate
        ) {
            targetTime = timingInfo.endDate.getTime();
        } else {
            return;
        }

        const difference = targetTime - now;

        if (difference > 0) {
            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor(
                    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                ),
                minutes: Math.floor(
                    (difference % (1000 * 60 * 60)) / (1000 * 60)
                ),
                seconds: Math.floor((difference % (1000 * 60)) / 1000),
            });
        } else {
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
    }, [timingInfo?.endDate, timingInfo?.startDate, timingInfo?.status]);

    useEffect(() => {
        const endTime = timingInfo?.endDate?.getTime();
        const startTime = timingInfo?.startDate?.getTime();

        if (!endTime || !startTime) return;

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [updateTimer, timingInfo?.endDate, timingInfo?.startDate]);

    if (!data || !timingInfo) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "relative bg-gradient-to-br from-slate-900/90 via-blue-950/60 to-purple-950/40",
                    "backdrop-blur-xl border border-cyan-400/30 rounded-3xl shadow-2xl shadow-cyan-500/20",
                    "p-6 overflow-hidden gpu-accelerate"
                )}
            >
                <Particles
                    className="absolute inset-0"
                    quantity={10}
                    staticity={50}
                    color="#06b6d4"
                    size={0.6}
                />
                <BorderBeam
                    size={60}
                    duration={10}
                    colorFrom="#06b6d4"
                    colorTo="#8b5cf6"
                    borderWidth={1}
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
                        <div className="h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
                        <div
                            className="absolute inset-0 h-8 w-8 border-2 border-purple-400/50 border-b-transparent rounded-full animate-spin"
                            style={{
                                animationDirection: "reverse",
                                animationDuration: "1.5s",
                            }}
                        />
                    </motion.div>
                    <span className="ml-3 text-cyan-100 font-medium">
                        Loading schedule...
                    </span>
                </div>
            </motion.div>
        );
    }

    const shouldShowCountdown =
        (timingInfo.status === "upcoming" || timingInfo.status === "active") &&
        (timeLeft.days > 0 ||
            timeLeft.hours > 0 ||
            timeLeft.minutes > 0 ||
            timeLeft.seconds > 0);

    return (
        <motion.div
            variants={CONTAINER_VARIANTS}
            initial="hidden"
            animate="visible"
            transition={{
                duration: 0.8,
                ease: "easeOut",
                staggerChildren: 0.1,
            }}
            className={cn(
                "relative bg-gradient-to-br from-slate-900/95 via-blue-950/70 to-indigo-950/50",
                "backdrop-blur-xl border border-cyan-400/30 rounded-3xl overflow-hidden",
                "shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/30",
                "p-3 transition-all duration-500 gpu-accelerate"
            )}
        >
            <Particles
                className="absolute inset-0"
                quantity={15}
                staticity={30}
                color="#06b6d4"
                size={0.8}
                refresh={false}
            />

            {timingInfo.status === "active" && (
                <BorderBeam
                    size={70}
                    duration={18}
                    colorFrom="#10b981"
                    colorTo="#06b6d4"
                    borderWidth={1}
                    className="opacity-40"
                />
            )}

            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute inset-0"
                    animate={{
                        background: [
                            "radial-gradient(circle at 25% 75%, rgba(6, 182, 212, 0.12) 0%, transparent 60%)",
                            "radial-gradient(circle at 75% 25%, rgba(139, 92, 246, 0.12) 0%, transparent 60%)",
                            "radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.12) 0%, transparent 60%)",
                        ],
                    }}
                    transition={{
                        duration: 30,
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
                            background: `rgba(6, 182, 212, ${
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
                    variants={ITEM_VARIANTS}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={cn(
                        "flex items-center justify-between mb-4",
                        getResponsiveClass(15).gapClass
                    )}
                >
                    <div
                        className={cn(
                            "flex items-center",
                            getResponsiveClass(15).gapClass
                        )}
                    >
                        <div className="relative">
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
                                className="p-2 rounded-[10px] bg-cyan-400/15 border-2 border-cyan-400/40 backdrop-blur-sm"
                            >
                                <Calendar
                                    className={cn(
                                        getResponsiveClass(30).frameClass,
                                        "text-cyan-400"
                                    )}
                                />
                            </motion.div>
                            <div className="absolute inset-0 bg-cyan-400/20 rounded-2xl blur-lg opacity-50" />
                        </div>
                        <div>
                            <h3
                                className={cn(
                                    "font-bold bg-gradient-to-r from-cyan-300 via-blue-200 to-cyan-100 bg-clip-text text-transparent",
                                    getResponsiveClass(25).textClass
                                )}
                            >
                                Schedule
                            </h3>
                        </div>
                    </div>
                </motion.div>

                {shouldShowCountdown && (
                    <motion.div
                        variants={ITEM_VARIANTS}
                        transition={{
                            duration: 0.6,
                            ease: "easeOut",
                            delay: 0.2,
                        }}
                        className={cn(
                            "relative mb-4 p-4 rounded-3xl overflow-hidden",
                            "bg-gradient-to-br from-cyan-500/15 via-blue-500/15 to-indigo-500/15",
                            "border-2 border-cyan-400/40 shadow-2xl shadow-cyan-500/25 backdrop-blur-lg"
                        )}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-blue-400/5 to-indigo-400/5" />
                        <div className="relative z-10 text-center">
                            <div
                                className={cn(
                                    "flex items-center justify-center mb-3 gap-2",
                                    getResponsiveClass(15).gapClass
                                )}
                            >
                                <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{
                                        duration: 8,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                >
                                    <Timer className="w-5 h-5 text-cyan-400" />
                                </motion.div>
                                <h4
                                    className={cn(
                                        "font-bold bg-gradient-to-r from-cyan-300 to-blue-200 bg-clip-text text-transparent",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    {timingInfo.status === "upcoming"
                                        ? "Starts In"
                                        : "Time Remaining"}
                                </h4>
                            </div>

                            <div
                                className={cn(
                                    "grid grid-cols-4",
                                    getResponsiveClass(10).gapClass
                                )}
                            >
                                <TimeUnit value={timeLeft.days} label="Days" />
                                <TimeUnit
                                    value={timeLeft.hours}
                                    label="Hours"
                                />
                                <TimeUnit
                                    value={timeLeft.minutes}
                                    label="Min"
                                />
                                <TimeUnit
                                    value={timeLeft.seconds}
                                    label="Sec"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="space-y-4">
                    <motion.div
                        variants={ITEM_VARIANTS}
                        transition={{
                            duration: 0.6,
                            ease: "easeOut",
                            delay: 0.3,
                        }}
                        whileHover={{ x: 4, scale: 1.02 }}
                        className={cn(
                            "relative flex items-center justify-between p-2 rounded-2xl overflow-hidden",
                            "bg-slate-800/40 border-2 border-emerald-400/30",
                            "shadow-2xl shadow-emerald-500/20 backdrop-blur-lg"
                        )}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/8 to-teal-500/8" />
                        <div className="relative z-10 flex items-center gap-2">
                            <div className="relative">
                                <div className="p-1 rounded-2xl bg-emerald-400/25 border-2 border-emerald-400/50">
                                    <PlayCircle className="w-6 h-6 text-emerald-300" />
                                </div>
                                <div className="absolute inset-0 bg-emerald-400/20 rounded-2xl blur-md" />
                            </div>
                            <div>
                                <h4
                                    className={cn(
                                        "font-bold text-emerald-200 drop-shadow-md",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    START
                                </h4>
                            </div>
                        </div>
                        <div className="relative z-10 text-right">
                            <div
                                className={cn(
                                    "font-bold text-emerald-300 drop-shadow-md",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                {timingInfo.startDate
                                    ? formatDateTime(timingInfo.startDate)
                                    : "Not set"}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={ITEM_VARIANTS}
                        transition={{
                            duration: 0.6,
                            ease: "easeOut",
                            delay: 0.4,
                        }}
                        whileHover={{ x: 4, scale: 1.02 }}
                        className={cn(
                            "relative flex items-center justify-between p-2 rounded-2xl overflow-hidden",
                            "bg-slate-800/40 border-2 border-red-400/30",
                            "shadow-2xl shadow-red-500/20 backdrop-blur-lg"
                        )}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/8 to-orange-500/8" />
                        <div className="relative z-10 flex items-center gap-2">
                            <div className="relative">
                                <div className="p-1 rounded-2xl bg-red-400/25 border-2 border-red-400/50">
                                    <StopCircle className="w-6 h-6 text-red-300" />
                                </div>
                                <div className="absolute inset-0 bg-red-400/20 rounded-2xl blur-md" />
                            </div>
                            <div>
                                <h4
                                    className={cn(
                                        "font-bold text-red-200 drop-shadow-md",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    END
                                </h4>
                            </div>
                        </div>
                        <div className="relative z-10 text-right">
                            <div
                                className={cn(
                                    "font-bold text-red-300 drop-shadow-md",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                {timingInfo.endDate
                                    ? formatDateTime(timingInfo.endDate)
                                    : "Not set"}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={ITEM_VARIANTS}
                        transition={{
                            duration: 0.6,
                            ease: "easeOut",
                            delay: 0.5,
                        }}
                        whileHover={{ x: 4, scale: 1.02 }}
                        className={cn(
                            "relative flex items-center justify-between p-2 rounded-2xl overflow-hidden",
                            "border-2 backdrop-blur-lg shadow-2xl",
                            timingInfo.instantDraw
                                ? "bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-400/40 shadow-purple-500/25"
                                : "bg-slate-800/40 border-amber-400/30 shadow-amber-500/20"
                        )}
                    >
                        <div
                            className={cn(
                                "absolute inset-0",
                                timingInfo.instantDraw
                                    ? "bg-gradient-to-r from-purple-500/8 to-pink-500/8"
                                    : "bg-gradient-to-r from-amber-500/8 to-yellow-500/8"
                            )}
                        />
                        <div className="relative z-10 flex items-center gap-2">
                            <div className="relative">
                                <div
                                    className={cn(
                                        "p-1 rounded-2xl border-2",
                                        timingInfo.instantDraw
                                            ? "bg-purple-400/25 border-purple-400/50"
                                            : "bg-amber-400/25 border-amber-400/50"
                                    )}
                                >
                                    {timingInfo.instantDraw ? (
                                        <Zap className="w-6 h-6 text-purple-300" />
                                    ) : (
                                        <Trophy className="w-6 h-6 text-amber-300" />
                                    )}
                                </div>
                                <div
                                    className={cn(
                                        "absolute inset-0 rounded-2xl blur-md",
                                        timingInfo.instantDraw
                                            ? "bg-purple-400/20"
                                            : "bg-amber-400/20"
                                    )}
                                />
                            </div>
                            <div>
                                <h4
                                    className={cn(
                                        "font-bold drop-shadow-md",
                                        timingInfo.instantDraw
                                            ? "text-purple-200"
                                            : "text-amber-200",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    DRAW
                                </h4>
                            </div>
                        </div>
                        <div className="relative z-10 text-right">
                            <div
                                className={cn(
                                    "font-bold drop-shadow-md",
                                    timingInfo.instantDraw
                                        ? "text-purple-300"
                                        : "text-amber-300",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                {timingInfo.instantDraw
                                    ? "INSTANT"
                                    : timingInfo.drawDate
                                    ? formatDateTime(timingInfo.drawDate)
                                    : "After end time"}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
});

const TimeUnit = memo(function TimeUnit({
    value,
    label,
}: {
    value: number;
    label: string;
}) {
    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
        >
            <div className="absolute inset-0 bg-cyan-400/15 rounded-2xl blur-sm group-hover:blur transition-all duration-300" />

            <div className="relative bg-slate-800/60 border-2 border-cyan-400/30 rounded-2xl p-2 text-center backdrop-blur-lg">
                <motion.div
                    key={value}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex items-center justify-center"
                >
                    <h4
                        className={cn(
                            "text-cyan-300 font-bold drop-shadow-lg",
                            getResponsiveClass(20).textClass
                        )}
                    >
                        {value}
                    </h4>
                </motion.div>
                <p
                    className={cn(
                        "text-slate-300 font-medium mt-1",
                        getResponsiveClass(10).textClass
                    )}
                >
                    {label}
                </p>
            </div>
        </motion.div>
    );
});
