/// components/raffles/web3/Raffle.Onchain.Settings.tsx

"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
    Settings,
    Users,
    User,
    Infinity as InfinityIcon,
    Zap,
    Eye,
} from "lucide-react";
import { maxUint256 } from "viem";

import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Particles } from "@/components/magicui/particles";

interface RaffleOnchainSettingsProps {
    data?: {
        dynamicWeight?: boolean;
        participationLimit?: bigint | number;
        participationLimitPerPlayer?: bigint | number;
    };
}

const INFINITE = maxUint256;

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
            <Settings
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

const SettingsLoadingState = memo(() => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
            "relative bg-gradient-to-br from-slate-900/95 via-emerald-950/70 to-purple-950/50",
            "backdrop-blur-xl border border-emerald-400/30 rounded-3xl shadow-2xl shadow-emerald-500/20",
            "p-6 overflow-hidden"
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
                Loading cosmic settings...
            </span>
        </div>
    </motion.div>
));
SettingsLoadingState.displayName = "SettingsLoadingState";

const SettingItem = memo(
    ({
        icon,
        description,
        value,
        label,
        colorScheme,
        delay = 0,
        isUnlimited = false,
    }: {
        icon: React.ReactNode;
        description: string;
        value: string;
        label: string;
        colorScheme: "purple" | "emerald" | "orange" | "yellow";
        delay?: number;
        isUnlimited?: boolean;
    }) => {
        const colorMap = {
            purple: {
                bg: "from-purple-900/40 to-pink-900/40",
                border: "border-purple-400/30",
                shadow: "shadow-purple-500/25",
                iconBg: "bg-purple-400/20 border-purple-400/40",
                iconColor: "text-purple-400",
                textColor: "text-purple-300",
                gradientBg: "from-purple-500/8 to-pink-500/8",
                glowColor: "rgba(167, 139, 250, 0.3)",
            },
            emerald: {
                bg: "from-emerald-900/40 to-teal-900/40",
                border: "border-emerald-400/30",
                shadow: "shadow-emerald-500/25",
                iconBg: "bg-emerald-400/20 border-emerald-400/40",
                iconColor: "text-emerald-400",
                textColor: "text-emerald-300",
                gradientBg: "from-emerald-500/8 to-teal-500/8",
                glowColor: "rgba(52, 211, 153, 0.3)",
            },
            orange: {
                bg: "from-orange-900/40 to-red-900/40",
                border: "border-orange-400/30",
                shadow: "shadow-orange-500/25",
                iconBg: "bg-orange-400/20 border-orange-400/40",
                iconColor: "text-orange-400",
                textColor: "text-orange-300",
                gradientBg: "from-orange-500/8 to-red-500/8",
                glowColor: "rgba(251, 146, 60, 0.3)",
            },
            yellow: {
                bg: "from-yellow-900/40 to-amber-900/40",
                border: "border-yellow-400/30",
                shadow: "shadow-yellow-500/25",
                iconBg: "bg-yellow-400/20 border-yellow-400/40",
                iconColor: "text-yellow-400",
                textColor: "text-yellow-300",
                gradientBg: "from-yellow-500/8 to-amber-500/8",
                glowColor: "rgba(251, 191, 36, 0.3)",
            },
        };

        const colors = colorMap[colorScheme];

        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay, duration: 0.6, ease: "easeOut" }}
                whileHover={{ x: 4, scale: 1.02 }}
                className={cn(
                    "relative rounded-2xl border overflow-hidden backdrop-blur-lg shadow-2xl",
                    "bg-gradient-to-br transition-all duration-300",
                    "p-4 sm:p-5",
                    colors.bg,
                    colors.border,
                    colors.shadow
                )}
            >
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        className="absolute inset-0"
                        animate={{
                            background: [
                                `radial-gradient(circle at 30% 70%, ${colors.glowColor} 0%, transparent 50%)`,
                                `radial-gradient(circle at 70% 30%, ${colors.glowColor} 0%, transparent 50%)`,
                                `radial-gradient(circle at 50% 50%, ${colors.glowColor} 0%, transparent 50%)`,
                            ],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />

                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full opacity-30"
                            style={{
                                width: `${0.5 + Math.random() * 1}px`,
                                height: `${0.5 + Math.random() * 1}px`,
                                background: colors.glowColor,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [0, -20 - Math.random() * 10, 0],
                                opacity: [0.1, 0.6, 0.1],
                                scale: [0.2, 1.5, 0.2],
                            }}
                            transition={{
                                duration: 4 + Math.random() * 3,
                                repeat: Infinity,
                                delay: Math.random() * 3,
                            }}
                        />
                    ))}
                </div>

                <div
                    className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-10",
                        colors.gradientBg
                    )}
                />

                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={{
                                    scale: isUnlimited ? [1, 1.1, 1] : [1],
                                    rotate: isUnlimited ? [0, 5, -5, 0] : [0],
                                }}
                                transition={{
                                    duration: isUnlimited ? 3 : 0,
                                    repeat: isUnlimited ? Infinity : 0,
                                    ease: "easeInOut",
                                }}
                                className={cn(
                                    "p-2 sm:p-3 rounded-xl border-2 backdrop-blur-sm",
                                    colors.iconBg
                                )}
                            >
                                <div
                                    className={cn(
                                        colors.iconColor,
                                        "flex-shrink-0"
                                    )}
                                >
                                    {icon}
                                </div>
                            </motion.div>
                            <div className="min-w-0 flex-1">
                                <h4
                                    className={cn(
                                        "font-bold text-white truncate",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    {label}
                                </h4>
                                <p
                                    className={cn(
                                        "text-slate-400 leading-tight line-clamp-2",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {description}
                                </p>
                            </div>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                            <motion.div
                                animate={
                                    isUnlimited
                                        ? {
                                              scale: [1, 1.05, 1],
                                              textShadow: [
                                                  `0 0 10px ${colors.glowColor}`,
                                                  `0 0 20px ${colors.glowColor}`,
                                                  `0 0 10px ${colors.glowColor}`,
                                              ],
                                          }
                                        : {}
                                }
                                transition={{
                                    duration: 2,
                                    repeat: isUnlimited ? Infinity : 0,
                                    ease: "easeInOut",
                                }}
                                className={cn(
                                    "font-bold drop-shadow-lg",
                                    colors.textColor,
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                {value}
                            </motion.div>
                            <div
                                className={cn(
                                    "text-slate-400 font-medium",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                {label}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }
);
SettingItem.displayName = "SettingItem";

export default memo(function RaffleOnchainSettings({
    data,
}: RaffleOnchainSettingsProps) {
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
        return <SettingsLoadingState />;
    }

    const participationLimit = data.participationLimit
        ? Number(data.participationLimit)
        : 0;
    const participationLimitPerPlayer = data.participationLimitPerPlayer
        ? Number(data.participationLimitPerPlayer)
        : 0;

    const isUnlimitedTotal =
        participationLimit >= Number(INFINITE) || participationLimit === 0;
    const isUnlimitedPerPlayer =
        participationLimitPerPlayer >= Number(INFINITE) ||
        participationLimitPerPlayer === 0;

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
                "relative bg-gradient-to-br from-slate-900/95 via-emerald-950/70 to-purple-950/50",
                "backdrop-blur-xl border border-emerald-400/30 rounded-3xl overflow-hidden",
                "shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30",
                "p-4 sm:p-6 transition-all duration-500"
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
                        "flex items-center mb-6 sm:mb-8",
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
                            Raffle Settings
                        </h3>
                        <p
                            className={cn(
                                "text-emerald-300/80 font-medium",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            Cosmic Configuration
                        </p>
                    </div>
                </motion.div>

                <div className="space-y-4 sm:space-y-6">
                    <SettingItem
                        icon={
                            data.dynamicWeight ? (
                                <Zap
                                    className={
                                        getResponsiveClass(20).frameClass
                                    }
                                />
                            ) : (
                                <Eye
                                    className={
                                        getResponsiveClass(20).frameClass
                                    }
                                />
                            )
                        }
                        description={
                            data.dynamicWeight
                                ? "Dynamic allocation based on total participants"
                                : "Static number of prizes regardless of participation"
                        }
                        value={data.dynamicWeight ? "DYNAMIC" : "STATIC"}
                        label=""
                        colorScheme={data.dynamicWeight ? "purple" : "emerald"}
                        delay={0.3}
                    />

                    <SettingItem
                        icon={
                            isUnlimitedTotal ? (
                                <InfinityIcon
                                    className={
                                        getResponsiveClass(20).frameClass
                                    }
                                />
                            ) : (
                                <Users
                                    className={
                                        getResponsiveClass(20).frameClass
                                    }
                                />
                            )
                        }
                        description={
                            isUnlimitedTotal
                                ? "No limit on total participants"
                                : "Maximum number of total participations"
                        }
                        value={
                            isUnlimitedTotal
                                ? "∞"
                                : participationLimit.toLocaleString()
                        }
                        label={
                            isUnlimitedTotal ? "Unlimited" : "participations"
                        }
                        colorScheme={isUnlimitedTotal ? "emerald" : "orange"}
                        delay={0.4}
                        isUnlimited={isUnlimitedTotal}
                    />

                    <SettingItem
                        icon={
                            isUnlimitedPerPlayer ? (
                                <InfinityIcon
                                    className={
                                        getResponsiveClass(20).frameClass
                                    }
                                />
                            ) : (
                                <User
                                    className={
                                        getResponsiveClass(20).frameClass
                                    }
                                />
                            )
                        }
                        description={
                            isUnlimitedPerPlayer
                                ? "Each player can participate unlimited times"
                                : "Maximum participations per player"
                        }
                        value={
                            isUnlimitedPerPlayer
                                ? "∞"
                                : participationLimitPerPlayer.toLocaleString()
                        }
                        label={
                            isUnlimitedPerPlayer ? "Unlimited" : "per player"
                        }
                        colorScheme={
                            isUnlimitedPerPlayer ? "emerald" : "yellow"
                        }
                        delay={0.5}
                        isUnlimited={isUnlimitedPerPlayer}
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    className="relative mt-6 sm:mt-8 p-3 sm:p-4 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-400/30 shadow-2xl shadow-slate-500/20 backdrop-blur-lg"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-500/8 to-slate-400/8" />
                    <div className="relative z-10 flex items-center gap-3">
                        <motion.div
                            animate={{ rotate: [0, 3, -3, 0] }}
                            transition={{
                                duration: 6,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
                        </motion.div>
                        <span
                            className={cn(
                                "text-slate-300",
                                getResponsiveClass(10).textClass
                            )}
                        >
                            These cosmic settings are configured by the raffle
                            creator
                        </span>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
});
