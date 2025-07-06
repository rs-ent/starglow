/// components/notifications/Notify.Polls.Betting.Result.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy,
    TrendingDown,
    RefreshCw,
    Target,
    Coins,
    Gift,
    ArrowRight,
    Heart,
    ThumbsUp,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import type { NotificationWithEntity } from "@/app/actions/notification/actions";
import { useMarkNotificationAsReadMutation } from "@/app/actions/notification/mutations";

interface NotifyPollsBettingResultProps {
    isOpen: boolean;
    onClose: () => void;
    notification: NotificationWithEntity;
}

export default function NotifyPollsBettingResult({
    isOpen,
    onClose,
    notification,
}: NotifyPollsBettingResultProps) {
    const [showCelebration, setShowCelebration] = useState(false);

    // 🔔 알림 읽음 처리 뮤테이션
    const markAsReadMutation = useMarkNotificationAsReadMutation();

    // 🎯 모달 닫기 핸들러 (읽음 처리 포함)
    const handleClose = () => {
        // 아직 읽지 않은 알림인 경우에만 읽음 처리
        if (!notification.isRead) {
            markAsReadMutation.mutate({
                notificationId: notification.id,
                playerId: notification.playerId, // notification에서 playerId 추출
            });
        }

        onClose();
    };

    // 알림 타입에 따른 결과 분류
    const resultType = useMemo(() => {
        switch (notification.type) {
            case "POLL_BETTING_WIN":
                return "win";
            case "BETTING_FAILED":
                return "lose";
            case "POLL_BETTING_REFUND":
                return "refund";
            default:
                return "unknown";
        }
    }, [notification.type]);

    // 결과에 따른 설정
    const resultConfig = useMemo(() => {
        const configs = {
            win: {
                emoji: "🎉",
                title: "🏆 CONGRATULATIONS! 🏆",
                subtitle: "You Won Big!",
                mainColor: "from-yellow-400 via-gold-400 to-yellow-400",
                bgGradient: "from-yellow-900/30 to-orange-900/30",
                borderColor: "border-yellow-400/50",
                accentColor: "text-yellow-300",
                celebration: true,
                icon: <Trophy className="text-yellow-400" />,
            },
            lose: {
                emoji: "😔",
                title: "Better Luck Next Time",
                subtitle: "Not this time, but keep going!",
                mainColor: "from-gray-400 via-slate-400 to-gray-400",
                bgGradient: "from-gray-900/30 to-slate-900/30",
                borderColor: "border-gray-400/50",
                accentColor: "text-gray-300",
                celebration: false,
                icon: <TrendingDown className="text-gray-400" />,
            },
            refund: {
                emoji: "💰",
                title: "💰 FULL REFUND 💰",
                subtitle: "Your bet has been returned",
                mainColor: "from-blue-400 via-cyan-400 to-blue-400",
                bgGradient: "from-blue-900/30 to-cyan-900/30",
                borderColor: "border-blue-400/50",
                accentColor: "text-blue-300",
                celebration: false,
                icon: <RefreshCw className="text-blue-400" />,
            },
            unknown: {
                emoji: "📢",
                title: "Betting Update",
                subtitle: "Result notification",
                mainColor: "from-purple-400 via-violet-400 to-purple-400",
                bgGradient: "from-purple-900/30 to-violet-900/30",
                borderColor: "border-purple-400/50",
                accentColor: "text-purple-300",
                celebration: false,
                icon: <Target className="text-purple-400" />,
            },
        };
        return configs[resultType];
    }, [resultType]);

    // 베팅 관련 데이터 추출
    const bettingData = useMemo(() => {
        const betAmount = notification.betAmount || 0;
        const winAmount = notification.winAmount || 0;
        const rewardAmount = notification.rewardAmount || 0;
        const profit = winAmount - betAmount;

        return {
            betAmount,
            winAmount,
            rewardAmount,
            profit,
            multiplier: betAmount > 0 ? winAmount / betAmount : 0,
        };
    }, [notification]);

    // 축하 효과 트리거
    useEffect(() => {
        if (isOpen && resultConfig.celebration) {
            const timer = setTimeout(() => setShowCelebration(true), 500);
            return () => clearTimeout(timer);
        }
        setShowCelebration(false);
    }, [isOpen, resultConfig.celebration]);

    // 폴 관련 데이터
    const pollData = useMemo(() => {
        const entityData = notification.entityData as any;
        return {
            pollTitle: entityData?.pollTitle || "Poll",
            optionName:
                entityData?.optionName ||
                entityData?.profit ||
                "Unknown Option",
            pollId: notification.entityId,
        };
    }, [notification]);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogTitle> </DialogTitle>
            <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800 p-0 overflow-hidden [&>button]:z-20">
                <div className="relative">
                    {/* 배경 효과 */}
                    <div className="absolute inset-0 pointer-events-none z-0 opacity-10">
                        <img
                            src="/elements/fire-background.gif"
                            alt="Background"
                            className="absolute inset-0 w-full h-full object-cover opacity-50"
                            style={{
                                mixBlendMode: "overlay",
                                filter:
                                    resultType === "win"
                                        ? "hue-rotate(45deg) saturate(1.5) brightness(1.2)"
                                        : "hue-rotate(200deg) saturate(0.8) brightness(0.8)",
                            }}
                        />
                    </div>

                    {/* 축하 효과 (당첨 시만) */}
                    <AnimatePresence>
                        {showCelebration && resultType === "win" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 pointer-events-none z-30"
                            >
                                {[...Array(20)].map((_, i) => (
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
                                            duration: 2,
                                            delay: Math.random() * 0.5,
                                            ease: "easeOut",
                                        }}
                                        className={cn(
                                            "absolute text-yellow-400",
                                            getResponsiveClass(20).textClass
                                        )}
                                    >
                                        {
                                            ["🎉", "✨", "💰", "🏆", "⭐"][
                                                Math.floor(Math.random() * 5)
                                            ]
                                        }
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 메인 콘텐츠 */}
                    <div className="relative z-10 p-4 sm:p-6 space-y-6">
                        {/* 헤더 */}
                        <motion.div
                            initial={{ opacity: 0, y: -30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-center space-y-4"
                        >
                            {/* 아이콘 */}
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
                                    animate={
                                        resultType === "win"
                                            ? {
                                                  scale: [1, 1.2, 1],
                                                  rotate: [0, 10, -10, 0],
                                              }
                                            : resultType === "refund"
                                            ? {
                                                  rotate: [0, 360],
                                              }
                                            : {}
                                    }
                                    transition={{
                                        duration: resultType === "win" ? 2 : 3,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    className={cn(
                                        getResponsiveClass(60).textClass
                                    )}
                                >
                                    {resultConfig.emoji}
                                </motion.div>
                            </motion.div>

                            {/* 제목 */}
                            <motion.h2
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className={cn(
                                    "font-bold bg-gradient-to-r bg-clip-text text-transparent",
                                    resultConfig.mainColor,
                                    getResponsiveClass(30).textClass
                                )}
                            >
                                {resultConfig.title}
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className={cn(
                                    "font-semibold",
                                    resultConfig.accentColor,
                                    getResponsiveClass(16).textClass
                                )}
                            >
                                {resultConfig.subtitle}
                            </motion.p>
                        </motion.div>

                        {/* 폴 정보 */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className={cn(
                                "rounded-lg border p-4 relative overflow-hidden",
                                `bg-gradient-to-r ${resultConfig.bgGradient}`,
                                resultConfig.borderColor
                            )}
                        >
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <motion.div
                                        animate={{
                                            rotate: [0, 360],
                                        }}
                                        transition={{
                                            duration: 4,
                                            repeat: Infinity,
                                            ease: "linear",
                                        }}
                                    >
                                        <Target
                                            className={cn(
                                                resultConfig.accentColor.replace(
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
                                            resultConfig.accentColor,
                                            getResponsiveClass(18).textClass
                                        )}
                                    >
                                        Poll Information
                                    </h3>
                                </div>

                                <div className="space-y-2">
                                    <p
                                        className={cn(
                                            "text-white font-semibold",
                                            getResponsiveClass(20).textClass
                                        )}
                                    >
                                        {pollData.pollTitle}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                "text-gray-400",
                                                getResponsiveClass(14).textClass
                                            )}
                                        >
                                            Your choice:
                                        </span>
                                        <span
                                            className={cn(
                                                "text-white font-medium",
                                                getResponsiveClass(14).textClass
                                            )}
                                        >
                                            {pollData.optionName}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* 베팅 결과 요약 */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.0 }}
                            className="space-y-4"
                        >
                            {/* 베팅 금액 */}
                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Coins
                                        className={cn(
                                            "text-gray-400",
                                            getResponsiveClass(16).frameClass
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            "text-gray-400 font-medium",
                                            getResponsiveClass(14).textClass
                                        )}
                                    >
                                        Your Bet
                                    </span>
                                </div>
                                <p
                                    className={cn(
                                        "text-white font-bold",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    {bettingData.betAmount.toLocaleString()}{" "}
                                    Tokens
                                </p>
                            </div>

                            {/* 결과별 상세 정보 */}
                            {resultType === "win" && (
                                <motion.div
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 1.2 }}
                                    className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 rounded-lg p-4 border border-yellow-400/50"
                                >
                                    <div className="space-y-3">
                                        {/* 획득 금액 */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.2, 1],
                                                        rotate: [0, 20, -20, 0],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                    }}
                                                >
                                                    <Gift
                                                        className={cn(
                                                            "text-yellow-400",
                                                            getResponsiveClass(
                                                                20
                                                            ).frameClass
                                                        )}
                                                    />
                                                </motion.div>
                                                <span
                                                    className={cn(
                                                        "text-yellow-300 font-bold",
                                                        getResponsiveClass(16)
                                                            .textClass
                                                    )}
                                                >
                                                    Total Winnings
                                                </span>
                                            </div>
                                            <p
                                                className={cn(
                                                    "text-yellow-200 font-bold",
                                                    getResponsiveClass(28)
                                                        .textClass
                                                )}
                                            >
                                                {bettingData.winAmount.toLocaleString()}{" "}
                                                Tokens
                                            </p>
                                        </div>

                                        {/* 수익 */}
                                        <div className="bg-black/20 rounded-lg p-3">
                                            <div className="flex justify-between items-center">
                                                <span
                                                    className={cn(
                                                        "text-green-300 font-medium",
                                                        getResponsiveClass(14)
                                                            .textClass
                                                    )}
                                                >
                                                    Pure Profit:
                                                </span>
                                                <span
                                                    className={cn(
                                                        "text-green-200 font-bold",
                                                        getResponsiveClass(16)
                                                            .textClass
                                                    )}
                                                >
                                                    +
                                                    {bettingData.profit.toLocaleString()}{" "}
                                                    Tokens
                                                </span>
                                            </div>
                                            {bettingData.multiplier > 0 && (
                                                <div className="flex justify-between items-center mt-1">
                                                    <span
                                                        className={cn(
                                                            "text-yellow-300 font-medium",
                                                            getResponsiveClass(
                                                                12
                                                            ).textClass
                                                        )}
                                                    >
                                                        Multiplier:
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "text-yellow-200 font-bold",
                                                            getResponsiveClass(
                                                                14
                                                            ).textClass
                                                        )}
                                                    >
                                                        {bettingData.multiplier.toFixed(
                                                            2
                                                        )}
                                                        x
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {resultType === "refund" && (
                                <motion.div
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 1.2 }}
                                    className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 rounded-lg p-4 border border-blue-400/50"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <RefreshCw
                                            className={cn(
                                                "text-blue-400",
                                                getResponsiveClass(20)
                                                    .frameClass
                                            )}
                                        />
                                        <span
                                            className={cn(
                                                "text-blue-300 font-bold",
                                                getResponsiveClass(16).textClass
                                            )}
                                        >
                                            Refund Amount
                                        </span>
                                    </div>
                                    <p
                                        className={cn(
                                            "text-blue-200 font-bold",
                                            getResponsiveClass(24).textClass
                                        )}
                                    >
                                        {(
                                            bettingData.rewardAmount ||
                                            bettingData.betAmount
                                        ).toLocaleString()}{" "}
                                        Tokens
                                    </p>
                                    <p
                                        className={cn(
                                            "text-gray-400 mt-2",
                                            getResponsiveClass(12).textClass
                                        )}
                                    >
                                        {notification.message}
                                    </p>
                                </motion.div>
                            )}

                            {resultType === "lose" && (
                                <motion.div
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 1.2 }}
                                    className="bg-gradient-to-r from-gray-900/40 to-slate-900/40 rounded-lg p-4 border border-gray-500/50"
                                >
                                    <div className="text-center space-y-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <Heart
                                                className={cn(
                                                    "text-pink-400",
                                                    getResponsiveClass(18)
                                                        .frameClass
                                                )}
                                            />
                                            <span
                                                className={cn(
                                                    "text-pink-300 font-bold",
                                                    getResponsiveClass(16)
                                                        .textClass
                                                )}
                                            >
                                                Keep Your Spirits Up!
                                            </span>
                                        </div>
                                        <p
                                            className={cn(
                                                "text-gray-300",
                                                getResponsiveClass(14).textClass
                                            )}
                                        >
                                            Every great bettor faces setbacks.
                                            This is just the beginning of your
                                            winning streak! 🌟
                                        </p>
                                        <div className="flex items-center justify-center gap-2 mt-3">
                                            <motion.div
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                }}
                                            >
                                                <ThumbsUp
                                                    className={cn(
                                                        "text-blue-400",
                                                        getResponsiveClass(16)
                                                            .frameClass
                                                    )}
                                                />
                                            </motion.div>
                                            <span
                                                className={cn(
                                                    "text-blue-300 font-medium",
                                                    getResponsiveClass(12)
                                                        .textClass
                                                )}
                                            >
                                                Try again on the next poll!
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* 액션 버튼 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.4 }}
                            className="space-y-3"
                        >
                            {/* 메인 액션 버튼 */}
                            <motion.button
                                onClick={handleClose}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "w-full font-bold text-white rounded-lg relative overflow-hidden",
                                    "border transition-all duration-200",
                                    `bg-gradient-to-r ${resultConfig.bgGradient.replace(
                                        "/30",
                                        "/60"
                                    )}`,
                                    resultConfig.borderColor,
                                    getResponsiveClass(20).paddingClass,
                                    getResponsiveClass(16).textClass
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
                                    {resultType === "win"
                                        ? "🎉 Awesome!"
                                        : resultType === "refund"
                                        ? "💙 Got it"
                                        : "💪 Next time!"}
                                </span>
                            </motion.button>

                            {/* 부가 액션 (당첨 시에만) */}
                            {resultType === "win" && (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.6 }}
                                    onClick={() => {
                                        // 폴 상세로 이동하는 로직 추가 가능
                                        window.location.href = `/polls/${pollData.pollId}`;
                                    }}
                                    className={cn(
                                        "w-full bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                                        getResponsiveClass(15).paddingClass,
                                        getResponsiveClass(14).textClass
                                    )}
                                >
                                    <span>View Poll Details</span>
                                    <ArrowRight
                                        className={cn(
                                            getResponsiveClass(14).frameClass
                                        )}
                                    />
                                </motion.button>
                            )}
                        </motion.div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
