/// components/polls/Poll.Betting.Participation.Modal.tsx

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { FlameIcon, Minus, Plus, Target, Calculator } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { usePlayerAssetsGet } from "@/app/actions/playerAssets/hooks";
import type { PollDetail, PollOption } from "@/app/actions/polls";
import type { Player } from "@prisma/client";
import Image from "next/image";
import { useToast } from "@/app/hooks/useToast";

interface PollBettingParticipationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (betAmount: number) => Promise<void>;
    poll: PollDetail;
    player: Player;
    selectedOption: PollOption;
    isLoading?: boolean;
}

export default function PollBettingParticipationModal({
    isOpen,
    onClose,
    onConfirm,
    poll,
    player,
    selectedOption,
    isLoading = false,
}: PollBettingParticipationModalProps) {
    const toast = useToast();
    const [betAmount, setBetAmount] = useState<number>(poll.minimumBet || 1);
    const [betAmountInput, setBetAmountInput] = useState<string>(
        (poll.minimumBet || 1).toString()
    );
    const [isConfirming, setIsConfirming] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const { playerAsset } = usePlayerAssetsGet({
        getPlayerAssetInput: {
            assetId: poll.bettingAssetId || "",
            playerId: player.id,
        },
    });

    // 사용자 잔액
    const userBalance = useMemo(() => {
        return playerAsset?.data?.balance || 0;
    }, [playerAsset]);

    // 베팅 한도 계산
    const bettingLimits = useMemo(() => {
        const min = poll.minimumBet || 1;
        const max = Math.min(poll.maximumBet || userBalance, userBalance);
        return { min, max };
    }, [poll.minimumBet, poll.maximumBet, userBalance]);

    // 입력값 검증
    const isValidAmount = useMemo(() => {
        return (
            betAmount >= bettingLimits.min &&
            betAmount <= bettingLimits.max &&
            betAmount <= userBalance
        );
    }, [betAmount, bettingLimits.min, bettingLimits.max, userBalance]);

    // 베팅 금액 변경 핸들러
    const handleAmountChange = useCallback(
        (value: string) => {
            if (/^\d*\.?\d*$/.test(value)) {
                setBetAmountInput(value);
                const num = parseFloat(value);
                if (!isNaN(num) && num > 0) {
                    setBetAmount(Math.min(bettingLimits.max, num));
                }
            }
        },
        [bettingLimits.max]
    );

    // 증가/감소 버튼
    const incrementAmount = useCallback(() => {
        const newAmount = Math.min(bettingLimits.max, betAmount + 1);
        setBetAmount(newAmount);
        setBetAmountInput(newAmount.toString());
    }, [betAmount, bettingLimits.max]);

    const decrementAmount = useCallback(() => {
        const newAmount = Math.max(bettingLimits.min, betAmount - 1);
        setBetAmount(newAmount);
        setBetAmountInput(newAmount.toString());
    }, [betAmount, bettingLimits.min]);

    // 프리셋 금액 버튼들
    const presetAmounts = useMemo(() => {
        const presets = [];
        const quarter = Math.floor(userBalance * 0.25);
        const half = Math.floor(userBalance * 0.5);
        const threeQuarter = Math.floor(userBalance * 0.75);

        if (quarter >= bettingLimits.min) presets.push(quarter);
        if (half >= bettingLimits.min && half !== quarter) presets.push(half);
        if (threeQuarter >= bettingLimits.min && threeQuarter !== half)
            presets.push(threeQuarter);
        if (userBalance >= bettingLimits.min && userBalance !== threeQuarter)
            presets.push(userBalance);

        return presets.slice(0, 4);
    }, [userBalance, bettingLimits.min]);

    // 확인 핸들러
    const handleConfirm = useCallback(async () => {
        if (!isValidAmount || isConfirming) return;

        setIsConfirming(true);
        try {
            await onConfirm(betAmount);
            setShowSuccess(true);
            // 자동 닫기 제거 - 사용자가 수동으로 닫도록 변경
        } catch (error) {
            toast.error((error as Error).message || "Betting failed");
            console.error("Betting failed:", error);
            setIsConfirming(false);
        }
    }, [betAmount, isValidAmount, isConfirming, onConfirm, toast]);

    // 모달이 열릴 때 초기값 설정
    useEffect(() => {
        if (isOpen) {
            const initialAmount = poll.minimumBet || 1;
            setBetAmount(initialAmount);
            setBetAmountInput(initialAmount.toString());
            setIsConfirming(false);
            setShowSuccess(false);
        }
    }, [isOpen, poll.minimumBet]);

    if (
        !playerAsset?.data ||
        playerAsset.success === false ||
        playerAsset.error
    ) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogTitle> </DialogTitle>
            <DialogContent
                className={cn(
                    "bg-gray-900 border-gray-800 p-0 [&>button]:z-20",
                    "sm:max-w-[800px] max-h-[90vh] overflow-y-auto"
                )}
            >
                <div className="absolute inset-0 pointer-events-none z-0 opacity-10">
                    <img
                        src="/elements/fire-background.gif"
                        alt="Fire background"
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                        style={{
                            mixBlendMode: "overlay",
                            filter: "hue-rotate(10deg) saturate(1.3) brightness(1.1)",
                        }}
                    />
                </div>
                <div className="relative overflow-hidden">
                    <div
                        className={cn(
                            "relative z-10 p-3 sm:p-4 md:p-5 lg:p-6 space-y-4"
                        )}
                    >
                        {showSuccess ? (
                            // 베팅 성공 화면
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-6"
                            >
                                {/* 성공 헤더 */}
                                <div className="space-y-4">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 10,
                                            delay: 0.2,
                                        }}
                                        className={cn(
                                            getResponsiveClass(60).textClass
                                        )}
                                    >
                                        🎉
                                    </motion.div>

                                    <motion.h2
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className={cn(
                                            "font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent",
                                            getResponsiveClass(30).textClass
                                        )}
                                    >
                                        BET PLACED SUCCESSFULLY!
                                    </motion.h2>

                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className={cn(
                                            "text-green-300",
                                            getResponsiveClass(15).textClass
                                        )}
                                    >
                                        Your bet is locked in! 🔒
                                    </motion.p>
                                </div>

                                {/* 투표 정보 */}
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                    className="bg-gradient-to-r from-indigo-900/30 to-blue-900/30 rounded-[8px] border border-indigo-400/50 p-4"
                                >
                                    <div className="flex items-center justify-center gap-2 mb-3">
                                        <motion.div
                                            animate={{
                                                rotate: [0, -10, 10, 0],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                        >
                                            🗳️
                                        </motion.div>
                                        <h3
                                            className={cn(
                                                "text-indigo-300 font-bold",
                                                getResponsiveClass(18).textClass
                                            )}
                                        >
                                            Poll Information
                                        </h3>
                                    </div>

                                    <div className="text-center space-y-2">
                                        <p
                                            className={cn(
                                                "text-white font-semibold",
                                                getResponsiveClass(20).textClass
                                            )}
                                        >
                                            {poll.title}
                                        </p>
                                        {poll.description && (
                                            <p
                                                className={cn(
                                                    "text-gray-300",
                                                    getResponsiveClass(14)
                                                        .textClass
                                                )}
                                            >
                                                {poll.description}
                                            </p>
                                        )}
                                        {poll.artist && (
                                            <div className="flex items-center justify-center gap-2 mt-3">
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
                                                    ⭐
                                                </motion.div>
                                                <p
                                                    className={cn(
                                                        "text-indigo-200 font-medium",
                                                        getResponsiveClass(12)
                                                            .textClass
                                                    )}
                                                >
                                                    by {poll.artist.name}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* 베팅 정보 요약 */}
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-[8px] border border-blue-400/50 p-4 space-y-4"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.1, 1],
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                        >
                                            📋
                                        </motion.div>
                                        <h3
                                            className={cn(
                                                "text-blue-300 font-bold",
                                                getResponsiveClass(20).textClass
                                            )}
                                        >
                                            Your Bet Summary
                                        </h3>
                                    </div>

                                    {/* 선택한 옵션 - 더 강조된 스타일 */}
                                    <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-[8px] border border-yellow-400/50 p-4">
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <motion.div
                                                animate={{
                                                    rotate: [0, 10, -10, 0],
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                }}
                                            >
                                                🎯
                                            </motion.div>
                                            <p
                                                className={cn(
                                                    "text-yellow-300 font-bold",
                                                    getResponsiveClass(15)
                                                        .textClass
                                                )}
                                            >
                                                Your Choice
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-center gap-4">
                                            {selectedOption.imgUrl && (
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.05, 1],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    }}
                                                >
                                                    <Image
                                                        src={
                                                            selectedOption.imgUrl
                                                        }
                                                        alt={
                                                            selectedOption.name
                                                        }
                                                        width={64}
                                                        height={64}
                                                        className="rounded-lg object-cover border-2 border-yellow-400/50"
                                                    />
                                                </motion.div>
                                            )}
                                            <div className="text-left">
                                                <p
                                                    className={cn(
                                                        "text-white font-bold",
                                                        getResponsiveClass(22)
                                                            .textClass
                                                    )}
                                                >
                                                    {selectedOption.name}
                                                </p>
                                                {selectedOption.description && (
                                                    <p
                                                        className={cn(
                                                            "text-gray-300",
                                                            getResponsiveClass(
                                                                12
                                                            ).textClass
                                                        )}
                                                    >
                                                        {
                                                            selectedOption.description
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 베팅 금액 */}
                                    <div className="bg-black/30 rounded-[8px] p-3">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                }}
                                                transition={{
                                                    duration: 1.5,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                }}
                                            >
                                                💰
                                            </motion.div>
                                            <p
                                                className={cn(
                                                    "text-gray-400 font-medium",
                                                    getResponsiveClass(12)
                                                        .textClass
                                                )}
                                            >
                                                Bet Amount
                                            </p>
                                        </div>
                                        <p
                                            className={cn(
                                                "text-green-300 font-bold text-center",
                                                getResponsiveClass(28).textClass
                                            )}
                                        >
                                            {betAmount.toLocaleString()}{" "}
                                            {playerAsset.data?.asset?.symbol}
                                        </p>
                                    </div>
                                </motion.div>

                                {/* 결과 발표일 */}
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.0 }}
                                    className="bg-gradient-to-r from-orange-900/40 to-yellow-900/40 rounded-[8px] border border-orange-400/50 p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <motion.div
                                            animate={{
                                                rotate: [0, 360],
                                                scale: [1, 1.1, 1],
                                            }}
                                            transition={{
                                                rotate: {
                                                    duration: 8,
                                                    repeat: Infinity,
                                                    ease: "linear",
                                                },
                                                scale: {
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                },
                                            }}
                                        >
                                            ⏰
                                        </motion.div>
                                        <h3
                                            className={cn(
                                                "text-orange-300 font-bold",
                                                getResponsiveClass(20).textClass
                                            )}
                                        >
                                            Results Announcement
                                        </h3>
                                    </div>

                                    <div className="bg-black/30 rounded-[8px] p-4 space-y-3">
                                        {/* 카운트다운 또는 시간 정보 */}
                                        <div className="text-center">
                                            <p
                                                className={cn(
                                                    "text-gray-400 mb-2",
                                                    getResponsiveClass(12)
                                                        .textClass
                                                )}
                                            >
                                                Results will be revealed on
                                            </p>
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.02, 1],
                                                }}
                                                transition={{
                                                    duration: 2.5,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                }}
                                                className="bg-gradient-to-r from-orange-600/20 to-yellow-600/20 rounded-[8px] border border-orange-400/30 p-3 mb-3"
                                            >
                                                <p
                                                    className={cn(
                                                        "text-orange-200 font-bold",
                                                        getResponsiveClass(18)
                                                            .textClass
                                                    )}
                                                >
                                                    {new Date(
                                                        poll.endDate
                                                    ).toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            weekday: "long",
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric",
                                                        }
                                                    )}
                                                </p>
                                                <p
                                                    className={cn(
                                                        "text-yellow-300 font-semibold",
                                                        getResponsiveClass(16)
                                                            .textClass
                                                    )}
                                                >
                                                    {new Date(
                                                        poll.endDate
                                                    ).toLocaleTimeString(
                                                        "en-US",
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            timeZoneName:
                                                                "short",
                                                        }
                                                    )}
                                                </p>
                                            </motion.div>

                                            {/* 시간 남음 표시 */}
                                            <div className="flex items-center justify-center gap-2">
                                                <motion.div
                                                    animate={{
                                                        y: [0, -2, 0],
                                                    }}
                                                    transition={{
                                                        duration: 1.5,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    }}
                                                >
                                                    ⏳
                                                </motion.div>
                                                <p
                                                    className={cn(
                                                        "text-yellow-300 font-medium",
                                                        getResponsiveClass(14)
                                                            .textClass
                                                    )}
                                                >
                                                    {(() => {
                                                        const now = new Date();
                                                        const endDate =
                                                            new Date(
                                                                poll.endDate
                                                            );
                                                        const diffMs =
                                                            endDate.getTime() -
                                                            now.getTime();
                                                        const diffDays =
                                                            Math.ceil(
                                                                diffMs /
                                                                    (1000 *
                                                                        60 *
                                                                        60 *
                                                                        24)
                                                            );

                                                        if (diffDays > 1) {
                                                            return `${diffDays} days to go!`;
                                                        } else if (
                                                            diffDays === 1
                                                        ) {
                                                            return "Results tomorrow!";
                                                        } else {
                                                            const diffHours =
                                                                Math.ceil(
                                                                    diffMs /
                                                                        (1000 *
                                                                            60 *
                                                                            60)
                                                                );
                                                            if (diffHours > 0) {
                                                                return `${diffHours} hours left!`;
                                                            } else {
                                                                return "Results coming soon!";
                                                            }
                                                        }
                                                    })()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* 당첨자 발표 메시지 */}
                                        <div className="flex items-center justify-center gap-2 pt-2">
                                            <motion.div
                                                animate={{
                                                    rotate: [0, 15, -15, 0],
                                                    scale: [1, 1.1, 1],
                                                }}
                                                transition={{
                                                    duration: 2.5,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                }}
                                            >
                                                🏆
                                            </motion.div>
                                            <p
                                                className={cn(
                                                    "text-yellow-300 font-semibold",
                                                    getResponsiveClass(13)
                                                        .textClass
                                                )}
                                            >
                                                Winners will be announced!
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* 마무리 메시지 */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.2 }}
                                    className="space-y-2"
                                >
                                    <p
                                        className={cn(
                                            "text-gray-300",
                                            getResponsiveClass(15).textClass
                                        )}
                                    >
                                        🍀 <strong>Good luck!</strong> May the
                                        odds be in your favor!
                                    </p>
                                </motion.div>

                                {/* 닫기 버튼 - 더 눈에 띄게 개선 */}
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        boxShadow: [
                                            "0 0 0 rgba(34, 197, 94, 0)",
                                            "0 0 20px rgba(34, 197, 94, 0.4)",
                                            "0 0 0 rgba(34, 197, 94, 0)",
                                        ],
                                    }}
                                    transition={{
                                        delay: 1.4,
                                        boxShadow: {
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        },
                                    }}
                                    onClick={onClose}
                                    whileHover={{
                                        scale: 1.05,
                                        boxShadow:
                                            "0 0 25px rgba(34, 197, 94, 0.6)",
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    className={cn(
                                        "bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[8px] font-bold relative overflow-hidden",
                                        "border border-green-400/50",
                                        "transition-all duration-200",
                                        getResponsiveClass(25).paddingClass,
                                        getResponsiveClass(18).textClass
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
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                    />
                                    <span className="relative z-10 flex items-center gap-2">
                                        ✅ Got it!
                                    </span>
                                </motion.button>
                            </motion.div>
                        ) : (
                            // 기존 베팅 폼
                            <>
                                {/* Header */}
                                <div className={cn("text-center")}>
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 15,
                                        }}
                                        className={cn(
                                            "inline-block",
                                            getResponsiveClass(15).marginYClass
                                        )}
                                    >
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.1, 1],
                                                rotate: [0, 5, -5, 0],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                repeatType: "loop",
                                            }}
                                            className={cn(
                                                "mx-auto",
                                                getResponsiveClass(50).textClass
                                            )}
                                        >
                                            🎰
                                        </motion.div>
                                    </motion.div>
                                    <motion.h2
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className={cn(
                                            "font-bold bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400 bg-clip-text text-transparent",
                                            getResponsiveClass(30).textClass,
                                            getResponsiveClass(10).marginYClass
                                        )}
                                    >
                                        🔥 PLACE YOUR BET 🔥
                                    </motion.h2>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className={cn(
                                            "text-orange-300 font-semibold",
                                            getResponsiveClass(15).textClass
                                        )}
                                    >
                                        💎 High Stakes, Higher Rewards! 💎
                                    </motion.p>
                                </div>

                                {/* Selected Option Display */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.9 }}
                                    className={cn(
                                        "rounded-[8px] border border-blue-400/50 relative overflow-hidden",
                                        "bg-gradient-to-r from-[rgba(0,0,0,0.5)] to-[rgba(0,0,0,0.2)]",
                                        getResponsiveClass(20).paddingClass,
                                        getResponsiveClass(30).marginYClass
                                    )}
                                >
                                    {/* Glowing border effect */}
                                    <motion.div
                                        className="absolute inset-0 rounded-[8px] bg-gradient-to-r from-blue-400/20 to-purple-400/20"
                                        animate={{
                                            opacity: [0.5, 1, 0.5],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    />

                                    {selectedOption.imgUrl && (
                                        <div className="absolute inset-0">
                                            <Image
                                                src={selectedOption.imgUrl}
                                                alt={selectedOption.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="object-cover bg-blend-overlay opacity-20"
                                            />
                                        </div>
                                    )}

                                    <div className="relative z-10">
                                        <div
                                            className={cn(
                                                "flex items-center",
                                                getResponsiveClass(15).gapClass,
                                                getResponsiveClass(10)
                                                    .marginYClass
                                            )}
                                        >
                                            <motion.div
                                                animate={{
                                                    rotate: [0, 360],
                                                    scale: [1, 1.1, 1],
                                                }}
                                                transition={{
                                                    rotate: {
                                                        duration: 4,
                                                        repeat: Infinity,
                                                        ease: "linear",
                                                    },
                                                    scale: {
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    },
                                                }}
                                            >
                                                <Target
                                                    className={cn(
                                                        "text-blue-400",
                                                        getResponsiveClass(20)
                                                            .frameClass
                                                    )}
                                                />
                                            </motion.div>
                                            <h3
                                                className={cn(
                                                    "text-blue-300 font-bold",
                                                    getResponsiveClass(20)
                                                        .textClass
                                                )}
                                            >
                                                YOUR CHOICE
                                            </h3>
                                        </div>
                                        <div
                                            className={cn(
                                                "flex items-center",
                                                getResponsiveClass(15).gapClass
                                            )}
                                        >
                                            <div>
                                                <h2
                                                    className={cn(
                                                        "text-white font-semibold",
                                                        getResponsiveClass(20)
                                                            .textClass
                                                    )}
                                                >
                                                    {selectedOption.name}
                                                </h2>
                                                {selectedOption.description && (
                                                    <p
                                                        className={cn(
                                                            "text-gray-400",
                                                            getResponsiveClass(
                                                                10
                                                            ).textClass
                                                        )}
                                                    >
                                                        {
                                                            selectedOption.description
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Betting Asset Info */}
                                <motion.div
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.2 }}
                                    className={cn(
                                        "bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-[8px] border border-green-400/50 text-center",
                                        getResponsiveClass(25).paddingClass,
                                        getResponsiveClass(30).marginYClass
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex flex-col items-center",
                                            getResponsiveClass(15).gapClass
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "flex items-center",
                                                getResponsiveClass(15).gapClass
                                            )}
                                        >
                                            {playerAsset.data?.asset
                                                ?.iconUrl && (
                                                <motion.div
                                                    animate={{
                                                        y: [0, -3, 0],
                                                        rotate: [0, 5, -5, 0],
                                                    }}
                                                    transition={{
                                                        duration: 2.5,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    }}
                                                >
                                                    <Image
                                                        src={
                                                            playerAsset.data
                                                                ?.asset?.iconUrl
                                                        }
                                                        alt={
                                                            playerAsset.data
                                                                ?.asset?.name
                                                        }
                                                        width={48}
                                                        height={48}
                                                        className={cn(
                                                            "object-contain",
                                                            getResponsiveClass(
                                                                40
                                                            ).frameClass
                                                        )}
                                                    />
                                                </motion.div>
                                            )}
                                            <div className="text-left">
                                                <h3
                                                    className={cn(
                                                        "text-white font-bold",
                                                        getResponsiveClass(20)
                                                            .textClass
                                                    )}
                                                >
                                                    {
                                                        playerAsset.data?.asset
                                                            ?.name
                                                    }
                                                </h3>
                                                <p
                                                    className={cn(
                                                        "text-green-300 font-medium",
                                                        getResponsiveClass(15)
                                                            .textClass
                                                    )}
                                                >
                                                    {
                                                        playerAsset.data?.asset
                                                            ?.symbol
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            className={cn(
                                                "w-full bg-black/20 rounded-[8px]",
                                                getResponsiveClass(20)
                                                    .paddingClass
                                            )}
                                        >
                                            <p
                                                className={cn(
                                                    "text-gray-400 font-medium",
                                                    getResponsiveClass(10)
                                                        .textClass
                                                )}
                                            >
                                                Available Balance
                                            </p>
                                            <p
                                                className={cn(
                                                    "text-green-300 font-bold",
                                                    getResponsiveClass(15)
                                                        .textClass
                                                )}
                                            >
                                                {userBalance.toLocaleString()}{" "}
                                                {
                                                    playerAsset.data?.asset
                                                        ?.symbol
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Betting Amount Input */}
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.5 }}
                                    className={cn(
                                        "bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-[8px] border border-purple-400/50 relative overflow-hidden",
                                        getResponsiveClass(20).paddingClass,
                                        getResponsiveClass(30).marginYClass
                                    )}
                                >
                                    {/* Pulsing glow effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-400/10"
                                        animate={{
                                            scale: [1, 1.02, 1],
                                            opacity: [0.5, 0.8, 0.5],
                                        }}
                                        transition={{
                                            duration: 2.5,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    />

                                    <div className="relative z-10">
                                        <div
                                            className={cn(
                                                "flex items-center",
                                                getResponsiveClass(10).gapClass,
                                                getResponsiveClass(15)
                                                    .marginYClass
                                            )}
                                        >
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    rotateY: [0, 180, 360],
                                                }}
                                                transition={{
                                                    duration: 3,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                }}
                                            >
                                                <Calculator
                                                    className={cn(
                                                        "text-purple-400",
                                                        getResponsiveClass(20)
                                                            .frameClass
                                                    )}
                                                />
                                            </motion.div>
                                            <h3
                                                className={cn(
                                                    "text-purple-300 font-bold",
                                                    getResponsiveClass(15)
                                                        .textClass
                                                )}
                                            >
                                                LOCK & LOAD
                                            </h3>
                                        </div>

                                        {/* Amount Input with Controls */}
                                        <div
                                            className={cn(
                                                "flex items-center",
                                                getResponsiveClass(15).gapClass,
                                                getResponsiveClass(20)
                                                    .marginYClass
                                            )}
                                        >
                                            <button
                                                onClick={decrementAmount}
                                                disabled={
                                                    betAmount <=
                                                    bettingLimits.min
                                                }
                                                className={cn(
                                                    "rounded-full disabled:text-gray-600 disabled:opacity-50 flex items-center justify-center text-white transition-colors",
                                                    getResponsiveClass(40)
                                                        .frameClass
                                                )}
                                            >
                                                <Minus
                                                    className={cn(
                                                        getResponsiveClass(20)
                                                            .frameClass
                                                    )}
                                                />
                                            </button>

                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    value={betAmountInput}
                                                    onChange={(e) =>
                                                        handleAmountChange(
                                                            e.target.value
                                                        )
                                                    }
                                                    className={cn(
                                                        "font-main w-full bg-gray-800 border border-gray-600 rounded-[8px] text-white text-center font-bold focus:outline-none focus:ring-2 focus:ring-purple-500",
                                                        getResponsiveClass(20)
                                                            .paddingClass,
                                                        getResponsiveClass(25)
                                                            .textClass
                                                    )}
                                                    placeholder="Enter amount"
                                                />
                                                <div
                                                    className={cn(
                                                        "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400",
                                                        getResponsiveClass(10)
                                                            .textClass
                                                    )}
                                                >
                                                    {
                                                        playerAsset.data?.asset
                                                            ?.symbol
                                                    }
                                                </div>
                                            </div>

                                            <button
                                                onClick={incrementAmount}
                                                disabled={
                                                    betAmount >=
                                                    bettingLimits.max
                                                }
                                                className={cn(
                                                    "rounded-full disabled:text-gray-600 disabled:opacity-50 flex items-center justify-center text-white transition-colors",
                                                    getResponsiveClass(40)
                                                        .frameClass
                                                )}
                                            >
                                                <Plus
                                                    className={cn(
                                                        getResponsiveClass(20)
                                                            .frameClass
                                                    )}
                                                />
                                            </button>
                                        </div>

                                        {/* Preset Amount Buttons */}
                                        {presetAmounts.length > 0 && (
                                            <div
                                                className={cn(
                                                    "grid grid-cols-2 sm:grid-cols-4",
                                                    getResponsiveClass(10)
                                                        .gapClass,
                                                    getResponsiveClass(20)
                                                        .marginYClass
                                                )}
                                            >
                                                {presetAmounts.map((amount) => (
                                                    <button
                                                        key={amount}
                                                        onClick={() => {
                                                            setBetAmount(
                                                                amount
                                                            );
                                                            setBetAmountInput(
                                                                amount.toString()
                                                            );
                                                        }}
                                                        className={cn(
                                                            "bg-gray-700 hover:bg-gray-600 rounded-[8px] text-white font-medium transition-colors",
                                                            getResponsiveClass(
                                                                15
                                                            ).paddingClass,
                                                            getResponsiveClass(
                                                                10
                                                            ).textClass
                                                        )}
                                                    >
                                                        {amount.toLocaleString()}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Betting Limits */}
                                        <div
                                            className={cn(
                                                "flex justify-between",
                                                getResponsiveClass(10).textClass
                                            )}
                                        >
                                            <span className="text-gray-400">
                                                Min:{" "}
                                                {bettingLimits.min.toLocaleString()}{" "}
                                                {
                                                    playerAsset.data?.asset
                                                        ?.symbol
                                                }
                                            </span>
                                            <span className="text-gray-400">
                                                Max:{" "}
                                                {bettingLimits.max.toLocaleString()}{" "}
                                                {
                                                    playerAsset.data?.asset
                                                        ?.symbol
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Validation Messages */}
                                {!isValidAmount && (
                                    <div
                                        className={cn(
                                            "bg-red-900/20 border border-red-500/30 rounded-[8px] mb-[10px]",
                                            getResponsiveClass(15).paddingClass,
                                            getResponsiveClass(15).marginYClass
                                        )}
                                    >
                                        <p
                                            className={cn(
                                                "text-red-300 text-center",
                                                getResponsiveClass(10).textClass
                                            )}
                                        >
                                            {betAmount < bettingLimits.min
                                                ? `Minimum bet is ${bettingLimits.min} ${playerAsset.data?.asset?.symbol}`
                                                : betAmount > bettingLimits.max
                                                ? `Maximum bet is ${bettingLimits.max} ${playerAsset.data?.asset?.symbol}`
                                                : betAmount > userBalance
                                                ? "Insufficient balance"
                                                : "Invalid bet amount"}
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div
                                    className={cn(
                                        "flex mb-[15px]",
                                        getResponsiveClass(15).gapClass
                                    )}
                                >
                                    <button
                                        onClick={onClose}
                                        disabled={isConfirming}
                                        className={cn(
                                            "flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-[8px] font-medium transition-colors",
                                            getResponsiveClass(20).paddingClass
                                        )}
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        onClick={handleConfirm}
                                        disabled={
                                            !isValidAmount ||
                                            isConfirming ||
                                            isLoading
                                        }
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={cn(
                                            "flex-2 rounded-[8px] font-bold text-white transition-all flex items-center justify-center relative overflow-hidden",
                                            getResponsiveClass(20).paddingClass,
                                            getResponsiveClass(10).gapClass,
                                            isValidAmount &&
                                                !isConfirming &&
                                                !isLoading
                                                ? "bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 hover:shadow-lg hover:shadow-orange-500/25"
                                                : "bg-gray-600 cursor-not-allowed"
                                        )}
                                    >
                                        {isConfirming || isLoading ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{
                                                        duration: 1,
                                                        repeat: Infinity,
                                                        ease: "linear",
                                                    }}
                                                    className={cn(
                                                        "border-2 border-white border-t-transparent rounded-full",
                                                        getResponsiveClass(20)
                                                            .frameClass
                                                    )}
                                                />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.2, 1],
                                                        rotate: [0, 10, -10, 0],
                                                    }}
                                                    transition={{
                                                        duration: 0.6,
                                                        repeat: Infinity,
                                                        repeatDelay: 2,
                                                    }}
                                                >
                                                    <FlameIcon
                                                        className={cn(
                                                            getResponsiveClass(
                                                                20
                                                            ).frameClass
                                                        )}
                                                    />
                                                </motion.div>
                                                BET
                                                <span
                                                    className={cn(
                                                        "opacity-80",
                                                        getResponsiveClass(10)
                                                            .textClass
                                                    )}
                                                >
                                                    (
                                                    {betAmount.toLocaleString()}{" "}
                                                    {
                                                        playerAsset.data?.asset
                                                            ?.symbol
                                                    }
                                                    )
                                                </span>
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
