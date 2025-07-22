"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Gift,
    Trophy,
    Star,
    Coins,
    Heart,
    CheckCircle,
    Users,
    Calendar,
    Info,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import type { NotificationWithEntity } from "@/app/actions/notification/actions";
import { useMarkNotificationAsReadMutation } from "@/app/actions/notification/mutations";

interface NotifyAssetRewardedProps {
    isOpen: boolean;
    onClose: () => void;
    notification: NotificationWithEntity;
}

export default function NotifyAssetRewarded({
    isOpen,
    onClose,
    notification,
}: NotifyAssetRewardedProps) {
    const [showCelebration, setShowCelebration] = useState(false);

    const markAsReadMutation = useMarkNotificationAsReadMutation();

    const handleClose = () => {
        if (!notification.isRead) {
            markAsReadMutation.mutate({
                notificationId: notification.id,
                playerId: notification.playerId,
            });
        }
        onClose();
    };

    const rewardData = useMemo(() => {
        const entityData = notification.entityData as any;
        return {
            assetName: entityData?.assetName || "Asset",
            assetSymbol: entityData?.assetSymbol || "TOKEN",
            amount: notification.rewardAmount || entityData?.amount || 0,
            reason:
                entityData?.reason || notification.description || "보상 지급",
            adminName: entityData?.adminName || "관리자",
            timestamp: notification.createdAt,
        };
    }, [notification]);

    const rewardConfig = useMemo(() => {
        const configs = {
            ASSET_RECEIVED: {
                emoji: "🎁",
                title: "🎉 REWARD RECEIVED! 🎉",
                subtitle: "You've got something special!",
                mainColor: "from-emerald-400 via-green-400 to-emerald-400",
                bgGradient: "from-emerald-900/30 to-green-900/30",
                borderColor: "border-emerald-400/50",
                accentColor: "text-emerald-300",
                celebration: true,
                icon: <Gift className="text-emerald-400" />,
            },
            EVENT_REWARD: {
                emoji: "🏆",
                title: "🏆 EVENT REWARD! 🏆",
                subtitle: "Congratulations on your achievement!",
                mainColor: "from-yellow-400 via-amber-400 to-yellow-400",
                bgGradient: "from-yellow-900/30 to-orange-900/30",
                borderColor: "border-yellow-400/50",
                accentColor: "text-yellow-300",
                celebration: true,
                icon: <Trophy className="text-yellow-400" />,
            },
            QUEST_REWARD_RECEIVED: {
                emoji: "⭐",
                title: "⭐ QUEST COMPLETED! ⭐",
                subtitle: "Your efforts have been rewarded!",
                mainColor: "from-purple-400 via-violet-400 to-purple-400",
                bgGradient: "from-purple-900/30 to-violet-900/30",
                borderColor: "border-purple-400/50",
                accentColor: "text-purple-300",
                celebration: true,
                icon: <Star className="text-purple-400" />,
            },
            REFERRAL_REWARD: {
                emoji: "👥",
                title: "👥 REFERRAL BONUS! 👥",
                subtitle: "Thanks for bringing friends!",
                mainColor: "from-pink-400 via-rose-400 to-pink-400",
                bgGradient: "from-pink-900/30 to-rose-900/30",
                borderColor: "border-pink-400/50",
                accentColor: "text-pink-300",
                celebration: true,
                icon: <Users className="text-pink-400" />,
            },
            default: {
                emoji: "💰",
                title: "💰 REWARD RECEIVED! 💰",
                subtitle: "You've been rewarded!",
                mainColor: "from-blue-400 via-cyan-400 to-blue-400",
                bgGradient: "from-blue-900/30 to-cyan-900/30",
                borderColor: "border-blue-400/50",
                accentColor: "text-blue-300",
                celebration: true,
                icon: <Coins className="text-blue-400" />,
            },
        };
        return (
            configs[notification.type as keyof typeof configs] ||
            configs.default
        );
    }, [notification.type]);

    useEffect(() => {
        if (isOpen && rewardConfig.celebration) {
            const timer = setTimeout(() => setShowCelebration(true), 500);
            return () => clearTimeout(timer);
        }
        setShowCelebration(false);
    }, [isOpen, rewardConfig.celebration]);

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(date));
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogTitle> </DialogTitle>
            <DialogContent className="sm:max-w-[800px] bg-gradient-to-br from-gray-900 via-purple-900/60 to-indigo-900/80 border-purple-300/30 p-0 overflow-hidden [&>button]:z-20 backdrop-blur-sm max-h-[80vh] overflow-y-auto">
                <div className="relative">
                    <AnimatePresence>
                        {showCelebration && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 pointer-events-none z-30"
                            >
                                {[...Array(15)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{
                                            x: "50%",
                                            y: "50%",
                                            scale: 0,
                                            rotate: 0,
                                        }}
                                        animate={{
                                            x: `${Math.random() * 100}%`,
                                            y: `${Math.random() * 100}%`,
                                            scale: [0, 1, 0],
                                            rotate: 360,
                                        }}
                                        transition={{
                                            duration: 2.5,
                                            delay: Math.random() * 0.8,
                                            ease: "easeOut",
                                        }}
                                        className={cn(
                                            "absolute",
                                            getResponsiveClass(15).textClass
                                        )}
                                        style={{
                                            color: `hsl(${
                                                Math.random() * 60 + 120
                                            }, 70%, 60%)`,
                                        }}
                                    >
                                        {
                                            [
                                                "🎉",
                                                "✨",
                                                "💰",
                                                "🎁",
                                                "⭐",
                                                "💎",
                                                "🏆",
                                                "🌟",
                                            ][Math.floor(Math.random() * 8)]
                                        }
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative z-10 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: -30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-center space-y-3 sm:space-y-4"
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 15,
                                    delay: 0.3,
                                }}
                                className="inline-block"
                            >
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 15, -15, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    className={cn(
                                        getResponsiveClass(50).textClass
                                    )}
                                >
                                    {rewardConfig.emoji}
                                </motion.div>
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className={cn(
                                    "font-bold bg-gradient-to-r bg-clip-text text-transparent",
                                    rewardConfig.mainColor,
                                    getResponsiveClass(25).textClass
                                )}
                            >
                                {rewardConfig.title}
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className={cn(
                                    "font-semibold",
                                    rewardConfig.accentColor,
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                {rewardConfig.subtitle}
                            </motion.p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className={cn(
                                "rounded-lg border p-3 sm:p-4 md:p-5 relative overflow-hidden",
                                `bg-gradient-to-r ${rewardConfig.bgGradient}`,
                                rewardConfig.borderColor
                            )}
                        >
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.1, 1],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    >
                                        <Gift
                                            className={cn(
                                                rewardConfig.accentColor.replace(
                                                    "text-",
                                                    "text-"
                                                ),
                                                getResponsiveClass(20)
                                                    .frameClass
                                            )}
                                        />
                                    </motion.div>
                                    <h3
                                        className={cn(
                                            "font-bold",
                                            rewardConfig.accentColor,
                                            getResponsiveClass(18).textClass
                                        )}
                                    >
                                        Reward Details
                                    </h3>
                                </div>

                                <div className="space-y-3 sm:space-y-4">
                                    <div className="bg-black/30 rounded-lg p-3 sm:p-4">
                                        <div className="text-center space-y-2">
                                            <p
                                                className={cn(
                                                    "text-white font-bold",
                                                    getResponsiveClass(28)
                                                        .textClass
                                                )}
                                            >
                                                +
                                                {rewardData.amount.toLocaleString()}
                                            </p>
                                            <div className="flex items-center justify-center gap-2">
                                                <span
                                                    className={cn(
                                                        "text-white font-semibold",
                                                        getResponsiveClass(18)
                                                            .textClass
                                                    )}
                                                >
                                                    {rewardData.assetName}
                                                </span>
                                                <span
                                                    className={cn(
                                                        rewardConfig.accentColor,
                                                        "font-medium",
                                                        getResponsiveClass(14)
                                                            .textClass
                                                    )}
                                                >
                                                    ({rewardData.assetSymbol})
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                        <div className="bg-black/20 rounded-lg p-2 sm:p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Info
                                                    className={cn(
                                                        "text-gray-400",
                                                        getResponsiveClass(12)
                                                            .frameClass
                                                    )}
                                                />
                                                <span
                                                    className={cn(
                                                        "text-gray-400 font-medium",
                                                        getResponsiveClass(10)
                                                            .textClass
                                                    )}
                                                >
                                                    Reason
                                                </span>
                                            </div>
                                            <p
                                                className={cn(
                                                    "text-white font-medium",
                                                    getResponsiveClass(12)
                                                        .textClass
                                                )}
                                            >
                                                {rewardData.reason}
                                            </p>
                                        </div>

                                        <div className="bg-black/20 rounded-lg p-2 sm:p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar
                                                    className={cn(
                                                        "text-gray-400",
                                                        getResponsiveClass(12)
                                                            .frameClass
                                                    )}
                                                />
                                                <span
                                                    className={cn(
                                                        "text-gray-400 font-medium",
                                                        getResponsiveClass(10)
                                                            .textClass
                                                    )}
                                                >
                                                    Received
                                                </span>
                                            </div>
                                            <p
                                                className={cn(
                                                    "text-white font-medium",
                                                    getResponsiveClass(12)
                                                        .textClass
                                                )}
                                            >
                                                {formatDate(
                                                    rewardData.timestamp
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {notification.title && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.0 }}
                                className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-600/50"
                            >
                                <h4
                                    className={cn(
                                        "font-bold text-white mb-2",
                                        getResponsiveClass(16).textClass
                                    )}
                                >
                                    {notification.title}
                                </h4>
                                <p
                                    className={cn(
                                        "text-gray-300",
                                        getResponsiveClass(12).textClass
                                    )}
                                >
                                    {notification.message}
                                </p>
                                {notification.description && (
                                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-600/30">
                                        <p
                                            className={cn(
                                                "text-gray-400",
                                                getResponsiveClass(10).textClass
                                            )}
                                        >
                                            {notification.description}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                            className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-lg p-3 sm:p-4 border border-green-400/50"
                        >
                            <div className="text-center space-y-2 sm:space-y-3">
                                <div className="flex items-center justify-center gap-2">
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            rotate: [0, 10, -10, 0],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                        }}
                                    >
                                        <Heart
                                            className={cn(
                                                "text-green-400",
                                                getResponsiveClass(18)
                                                    .frameClass
                                            )}
                                        />
                                    </motion.div>
                                    <span
                                        className={cn(
                                            "text-green-300 font-bold",
                                            getResponsiveClass(14).textClass
                                        )}
                                    >
                                        Keep Up the Great Work!
                                    </span>
                                </div>
                                <p
                                    className={cn(
                                        "text-gray-300",
                                        getResponsiveClass(12).textClass
                                    )}
                                >
                                    Continue exploring Starglow for more
                                    exciting rewards! 🌟
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.4 }}
                            className="space-y-3"
                        >
                            <motion.button
                                onClick={handleClose}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "w-full font-bold text-white rounded-lg relative overflow-hidden",
                                    "border transition-all duration-200",
                                    `bg-gradient-to-r ${rewardConfig.bgGradient.replace(
                                        "/30",
                                        "/60"
                                    )}`,
                                    rewardConfig.borderColor,
                                    getResponsiveClass(15).paddingClass,
                                    getResponsiveClass(14).textClass
                                )}
                            >
                                <motion.div
                                    animate={{
                                        x: ["-100%", "100%"],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                />
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    <CheckCircle
                                        className={cn(
                                            getResponsiveClass(16).frameClass
                                        )}
                                    />
                                    Awesome, Thanks!
                                </span>
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
