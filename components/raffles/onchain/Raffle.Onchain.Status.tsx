/// components/raffles/web3/Raffle.Onchain.Status.tsx

"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Activity, CheckCircle, XCircle, Trophy, Users } from "lucide-react";

import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";

interface RaffleOnchainStatusProps {
    data?: {
        active?: boolean;
        isDrawn?: boolean;
        drawnParticipantCount?: bigint | number;
        totalQuantity?: bigint | number;
    };
    isLoading?: boolean;
}

const StatusLoadingState = memo(() => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
            "relative bg-gradient-to-br from-slate-900/95 via-violet-950/70 to-purple-950/50",
            "backdrop-blur-xl border border-violet-400/30 rounded-3xl shadow-2xl shadow-violet-500/20",
            "p-6 overflow-hidden"
        )}
    >
        <div className="flex items-center justify-center relative z-10">
            <motion.div
                className="h-8 w-8 border-2 border-violet-400 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
            <span className="ml-3 text-violet-100 font-medium">
                Loading status...
            </span>
        </div>
    </motion.div>
));
StatusLoadingState.displayName = "StatusLoadingState";

const StatusErrorState = memo(() => (
    <div
        className={cn(
            "relative bg-gradient-to-br from-slate-900/95 via-red-950/70 to-slate-950/50",
            "backdrop-blur-xl border border-red-400/30 rounded-3xl shadow-2xl shadow-red-500/20",
            "p-6 overflow-hidden"
        )}
    >
        <div className="relative z-10 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-400 mr-3" />
            <span className="text-red-100">Status information unavailable</span>
        </div>
    </div>
));
StatusErrorState.displayName = "StatusErrorState";

const StatusCard = memo(
    ({
        icon,
        value,
        label,
        colorScheme,
    }: {
        icon: React.ReactNode;
        value: string | number;
        label: string;
        colorScheme: "success" | "error" | "info" | "warning";
    }) => {
        const colorMap = {
            success: {
                bg: "from-emerald-900/60 to-teal-900/40",
                border: "border-emerald-400/40",
                shadow: "shadow-emerald-500/25",
                iconBg: "bg-emerald-400/20 border-emerald-400/40",
                iconColor: "text-emerald-400",
                textColor: "text-emerald-300",
            },
            error: {
                bg: "from-red-900/60 to-pink-900/40",
                border: "border-red-400/40",
                shadow: "shadow-red-500/25",
                iconBg: "bg-red-400/20 border-red-400/40",
                iconColor: "text-red-400",
                textColor: "text-red-300",
            },
            info: {
                bg: "from-blue-900/60 to-cyan-900/40",
                border: "border-blue-400/40",
                shadow: "shadow-blue-500/25",
                iconBg: "bg-blue-400/20 border-blue-400/40",
                iconColor: "text-blue-400",
                textColor: "text-blue-300",
            },
            warning: {
                bg: "from-orange-900/60 to-yellow-900/40",
                border: "border-orange-400/40",
                shadow: "shadow-orange-500/25",
                iconBg: "bg-orange-400/20 border-orange-400/40",
                iconColor: "text-orange-400",
                textColor: "text-orange-300",
            },
        };

        const colors = colorMap[colorScheme];

        return (
            <div
                className={cn(
                    "relative rounded-2xl border overflow-hidden backdrop-blur-lg shadow-2xl",
                    "bg-gradient-to-br transition-all duration-300",
                    "p-3 sm:p-4",
                    colors.bg,
                    colors.border,
                    colors.shadow
                )}
            >
                <div className="relative z-10 text-center">
                    <div
                        className={cn(
                            "mx-auto mb-3 p-2 sm:p-3 rounded-xl border-2 backdrop-blur-sm",
                            "w-fit",
                            colors.iconBg
                        )}
                    >
                        <div className={cn(colors.iconColor, "flex-shrink-0")}>
                            {icon}
                        </div>
                    </div>

                    <h4
                        className={cn(
                            "font-bold mb-1 break-words",
                            colors.textColor,
                            getResponsiveClass(15).textClass
                        )}
                    >
                        {typeof value === "number"
                            ? value.toLocaleString()
                            : value}
                    </h4>

                    <p
                        className={cn(
                            "text-slate-400 font-medium leading-tight",
                            getResponsiveClass(10).textClass
                        )}
                    >
                        {label}
                    </p>
                </div>
            </div>
        );
    }
);
StatusCard.displayName = "StatusCard";

export default memo(function RaffleOnchainStatus({
    data,
    isLoading,
}: RaffleOnchainStatusProps) {
    if (isLoading) {
        return <StatusLoadingState />;
    }

    if (!data) {
        return <StatusErrorState />;
    }

    const totalParticipants = data.drawnParticipantCount
        ? Number(data.drawnParticipantCount)
        : 0;

    const statusInfo = data.isDrawn
        ? { value: "COMPLETED", colorScheme: "info" as const }
        : data.active
        ? { value: "ACTIVE", colorScheme: "success" as const }
        : { value: "INACTIVE", colorScheme: "error" as const };

    return (
        <div
            className={cn(
                "relative bg-gradient-to-br from-slate-900/95 via-violet-950/70 to-purple-950/50",
                "backdrop-blur-xl border border-violet-400/30 rounded-3xl overflow-hidden",
                "shadow-2xl shadow-violet-500/20 gpu-accelerate",
                "p-4 sm:p-6"
            )}
        >
            <div className="relative z-10">
                <div
                    className={cn(
                        "flex items-center mb-6 sm:mb-8",
                        getResponsiveClass(15).gapClass
                    )}
                >
                    <div className="relative">
                        <div className="p-2 rounded-[10px] bg-violet-400/15 border-2 border-violet-400/40 backdrop-blur-sm">
                            <Activity
                                className={cn(
                                    getResponsiveClass(30).frameClass,
                                    "text-violet-400"
                                )}
                            />
                        </div>
                    </div>
                    <div>
                        <h3
                            className={cn(
                                "font-bold bg-gradient-to-r from-violet-300 via-purple-200 to-violet-100 bg-clip-text text-transparent",
                                getResponsiveClass(25).textClass
                            )}
                        >
                            Current Status
                        </h3>
                        <p
                            className={cn(
                                "text-violet-300/80 font-medium",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            Live Metrics
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <StatusCard
                        icon={
                            statusInfo.value === "ACTIVE" ? (
                                <CheckCircle
                                    className={
                                        getResponsiveClass(25).frameClass
                                    }
                                />
                            ) : statusInfo.value === "COMPLETED" ? (
                                <Trophy
                                    className={
                                        getResponsiveClass(25).frameClass
                                    }
                                />
                            ) : (
                                <XCircle
                                    className={
                                        getResponsiveClass(25).frameClass
                                    }
                                />
                            )
                        }
                        value={statusInfo.value}
                        label="Raffle State"
                        colorScheme={statusInfo.colorScheme}
                    />

                    <StatusCard
                        icon={
                            <Users
                                className={getResponsiveClass(25).frameClass}
                            />
                        }
                        value={totalParticipants}
                        label="Participants"
                        colorScheme="info"
                    />
                </div>

                <div className="relative mt-6 sm:mt-8 p-3 sm:p-4 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-400/30 shadow-2xl shadow-slate-500/20 backdrop-blur-lg">
                    <div className="relative z-10 flex items-center gap-3">
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
                        <span
                            className={cn(
                                "text-slate-300",
                                getResponsiveClass(10).textClass
                            )}
                        >
                            Real-time status updates from the berachain
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});
