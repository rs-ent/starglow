/// components/raffles/Raffle.Detail.tsx

"use client";

import { memo, useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Trophy,
    Gift,
    Star,
    Sparkles,
    Ticket,
    Target,
    Zap,
    Shield,
    ExternalLink,
    Timer,
    Award,
    Gem,
    CheckCircle2,
    Play,
    Share2,
    Copy,
    RefreshCcw,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { useRaffles } from "@/app/actions/raffles/hooks";
import { useToast } from "@/app/hooks/useToast";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import RaffleScratchCard from "./Raffle.Reveal.Scratch";
import EnhancedPortal from "@/components/atoms/Portal.Enhanced";

import type { RaffleStatus } from "@/app/actions/raffles/utils";
import { useAssetsGet } from "@/app/actions/assets/hooks";
import Image from "next/image";
import RaffleRecord from "./Raffle.Record";
import { tierMap } from "./raffle-tier";
import { usePlayerAssetsGet } from "@/app/actions/playerAssets/hooks";

// Utility function to calculate raffle status based on dates
const getRaffleStatus = (
    startDate: string | Date,
    endDate: string | Date,
    drawDate?: string | Date | null
): RaffleStatus => {
    const now = new Date().getTime();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    if (now < start) return "UPCOMING";
    if (now <= end) return "ACTIVE";
    if (drawDate && now < new Date(drawDate).getTime()) return "WAITING_DRAW";
    return "COMPLETED";
};

interface RaffleDetailProps {
    raffleId: string;
}

export default memo(function RaffleDetail({ raffleId }: RaffleDetailProps) {
    const [scracthRevealed, setScratchRevealed] = useState(false);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [showScratchModal, setShowScratchModal] = useState(false);
    const [scratchResult, setScratchResult] = useState<any>(null);
    const [toastShown, setToastShown] = useState(false);
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    // 반응형 스크래치 카드 크기 상태
    const [scratchCardSize, setScratchCardSize] = useState(() => {
        if (typeof window === "undefined") {
            return { width: 350, height: 250 }; // SSR 기본값
        }

        const screenWidth = window.innerWidth;

        if (screenWidth >= 1280) {
            // xl 이상
            return { width: 450, height: 320 };
        } else if (screenWidth >= 1024) {
            // lg
            return { width: 400, height: 280 };
        } else if (screenWidth >= 768) {
            // md
            return { width: 350, height: 250 };
        } else {
            // 모바일
            return { width: 300, height: 200 };
        }
    });

    // 화면 크기 변경 시 스크래치 카드 크기 업데이트
    useEffect(() => {
        const updateCardSize = () => {
            const screenWidth = window.innerWidth;

            if (screenWidth >= 1280) {
                // xl 이상
                setScratchCardSize({ width: 450, height: 320 });
            } else if (screenWidth >= 1024) {
                // lg
                setScratchCardSize({ width: 400, height: 280 });
            } else if (screenWidth >= 768) {
                // md
                setScratchCardSize({ width: 350, height: 250 });
            } else {
                // 모바일
                setScratchCardSize({ width: 300, height: 200 });
            }
        };

        window.addEventListener("resize", updateCardSize);
        return () => window.removeEventListener("resize", updateCardSize);
    }, []);

    // 스크래치 모달이 열릴 때마다 toast 상태 리셋
    useEffect(() => {
        if (showScratchModal) {
            setToastShown(false);
        }
    }, [showScratchModal]);

    const toast = useToast();

    const { raffleData, isRaffleLoading, raffleError } = useRaffles({
        getRaffleId: raffleId,
    });

    const raffle = useMemo(
        () => (raffleData?.success ? raffleData.data : null),
        [raffleData]
    );

    // Countdown Timer
    useEffect(() => {
        if (!raffle?.endDate) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const endTime = new Date(raffle.endDate).getTime();
            const difference = endTime - now;

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
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [raffle?.endDate]);

    // 티어 시스템 정의
    const getTierInfo = (order: number) => {
        const tier = Math.floor(order / 10);
        return tierMap[tier as keyof typeof tierMap] || tierMap[0];
    };

    const sortedPrizes = useMemo(() => {
        if (!raffle?.prizes) return [];
        // 높은 order가 더 좋은 상품이므로 내림차순 정렬
        return raffle.prizes.sort((a: any, b: any) => b.order - a.order);
    }, [raffle?.prizes]);

    // 티어별로 상품 그룹화
    const prizesByTier = useMemo(() => {
        const grouped: { [key: number]: any[] } = {};
        sortedPrizes.forEach((prize) => {
            const tier = Math.floor(prize.order / 10);
            if (!grouped[tier]) grouped[tier] = [];
            grouped[tier].push(prize);
        });

        // 티어 내에서도 order 높은 순으로 정렬
        Object.keys(grouped).forEach((tier) => {
            grouped[parseInt(tier)].sort((a: any, b: any) => b.order - a.order);
        });

        return grouped;
    }, [sortedPrizes]);

    // Calculate status based on dates instead of raffle.status
    const raffleStatus = useMemo(() => {
        if (!raffle?.startDate || !raffle?.endDate) return "UPCOMING";
        return getRaffleStatus(
            raffle.startDate,
            raffle.endDate,
            raffle.drawDate
        );
    }, [raffle?.startDate, raffle?.endDate, raffle?.drawDate]);

    const totalQuantity = useMemo(() => {
        return (
            raffle?.prizes?.reduce((acc, prize) => acc + prize.quantity, 0) || 0
        );
    }, [raffle?.prizes]);

    const isLive = raffleStatus === "ACTIVE";
    const isUpcoming = raffleStatus === "UPCOMING";

    // onReveal 콜백을 컴포넌트 최상위에서 정의 (Hook 순서 유지)
    const handleScratchReveal = useCallback(() => {
        setScratchRevealed(true);

        if (toastShown) return;
        setToastShown(true);

        const prizeTitle = scratchResult?.prize?.title;
        const prizeType = scratchResult?.prize?.prizeType;
        setTimeout(() => {
            if (prizeTitle && prizeType !== "EMPTY") {
                toast.success(`🎊 Congratulations! You won ${prizeTitle}!`);
            } else {
                toast.info("Owww...😢 Better luck next time! Keep trying! 🍀");
            }
        }, 500);
    }, [
        toastShown,
        scratchResult?.prize?.title,
        scratchResult?.prize?.prizeType,
        toast,
    ]);

    if (isRaffleLoading) {
        return <RaffleDetailSkeleton />;
    }

    if (raffleError || !raffle) {
        return <RaffleDetailError />;
    }

    return (
        <>
            {/* 참여 기록 모달 */}
            <RaffleRecord
                isOpen={showRecordModal}
                onClose={() => setShowRecordModal(false)}
                raffle={raffle}
            />

            {/* 스크래치 카드 모달 - Portal로 렌더링하여 깜빡임 방지 */}
            <EnhancedPortal layer="modal">
                <AnimatePresence>
                    {showScratchModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                                "fixed inset-0 backdrop-blur-md flex items-center justify-center p-4",
                                "transition-all duration-1000 z-[1000]",
                                scracthRevealed ? "bg-black/40" : "bg-black/95"
                            )}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            style={{
                                // 모바일에서 더 안정적인 렌더링을 위한 추가 스타일
                                WebkitBackfaceVisibility: "hidden",
                                backfaceVisibility: "hidden",
                                transform: "translateZ(0)",
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="relative"
                                style={{
                                    // Canvas 렌더링 최적화
                                    WebkitBackfaceVisibility: "hidden",
                                    backfaceVisibility: "hidden",
                                    willChange: "transform",
                                }}
                            >
                                <RaffleScratchCard
                                    prize={scratchResult?.prize || null}
                                    onReveal={handleScratchReveal}
                                    cardSize={scratchCardSize}
                                    className="mx-auto"
                                />

                                {/* 닫기 버튼 - 터치 친화적으로 개선 */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        setShowScratchModal(false);
                                        setScratchRevealed(false);
                                        setToastShown(false);
                                    }}
                                    className={cn(
                                        "absolute -top-12 right-0 text-white/60 hover:text-white",
                                        "w-10 h-10 flex items-center justify-center rounded-full",
                                        "bg-black/20 backdrop-blur-sm transition-all",
                                        "text-xl font-light",
                                        "touch-manipulation select-none"
                                    )}
                                >
                                    ✕
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </EnhancedPortal>

            <div className={cn("relative w-full min-h-screen overflow-hidden")}>
                {/* Background Effects - Elegant Space Theme */}
                <div className="fixed inset-0 -z-10">
                    <div className="absolute inset-0 bg-[rgba(35,10,55,0.95)]" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[rgba(120,100,160,0.15)] via-[rgba(100,80,120,0.15)] to-[rgba(150,120,185,0.3)]" />
                </div>

                <div
                    className={cn(
                        "relative z-10",
                        "mt-[50px] mb-[100px] md:mb-[20px] md:mt-[0px]"
                    )}
                >
                    {/* Header Navigation */}
                    <div
                        className={cn(
                            "container mx-auto",
                            getResponsiveClass(20).paddingClass
                        )}
                    >
                        {/* Hero Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative text-center mt-6 mb-12"
                        >
                            <h2
                                className={cn(
                                    "font-light text-[rgba(255,255,255,0.95)] mb-6 tracking-wide",
                                    getResponsiveClass(40).textClass
                                )}
                            >
                                {raffle.title}
                            </h2>
                            {raffle.description && (
                                <p
                                    className={cn(
                                        "text-[rgba(255,255,255,0.55)] max-w-2xl mx-auto leading-relaxed font-light",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    {raffle.description}
                                </p>
                            )}
                        </motion.div>

                        {/* Main Content Grid */}
                        <div
                            className={cn(
                                "grid grid-cols-1 lg:grid-cols-5",
                                getResponsiveClass(30).gapClass
                            )}
                        >
                            {/* Left Column - Prize Showcase */}
                            <div className="lg:col-span-3 space-y-6">
                                {/* Grand Prize Highlight */}
                                {sortedPrizes[0] && (
                                    <GrandPrizeCard
                                        prize={sortedPrizes[0]}
                                        getTierInfo={getTierInfo}
                                    />
                                )}

                                {/* Prizes by Tier */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className={cn(
                                        "bg-gradient-to-br from-[rgba(15,15,25,0.6)] to-[rgba(25,25,35,0.4)]",
                                        "backdrop-blur-lg border border-[rgba(255,255,255,0.06)] rounded-3xl",
                                        getResponsiveClass(25).paddingClass
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex items-center mb-6",
                                            getResponsiveClass(15).gapClass
                                        )}
                                    >
                                        <Trophy
                                            className={cn(
                                                getResponsiveClass(30)
                                                    .frameClass
                                            )}
                                            style={{
                                                color: "rgba(200,160,100,0.6)",
                                            }}
                                        />
                                        <h2
                                            className={cn(
                                                "font-medium text-[rgba(255,255,255,0.9)]",
                                                getResponsiveClass(25).textClass
                                            )}
                                        >
                                            Prize Tiers ({sortedPrizes.length}{" "}
                                            Total)
                                        </h2>
                                    </div>

                                    <div className="space-y-6">
                                        {/* 티어별로 상품 표시 (높은 티어부터) */}
                                        {Object.keys(prizesByTier)
                                            .map(Number)
                                            .sort((a, b) => b - a) // 높은 티어부터
                                            .map((tier) => (
                                                <TierSection
                                                    key={tier}
                                                    tier={tier}
                                                    prizes={prizesByTier[tier]}
                                                    totalQuantity={
                                                        totalQuantity
                                                    }
                                                    getTierInfo={getTierInfo}
                                                />
                                            ))}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Right Column - Participation & Info */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Countdown Timer */}
                                {(isLive || isUpcoming) && (
                                    <CountdownCard
                                        timeLeft={timeLeft}
                                        isLive={isLive}
                                    />
                                )}

                                {/* Participation Card */}
                                <ParticipationCard
                                    raffle={raffle}
                                    raffleStatus={raffleStatus}
                                    setShowRecordModal={setShowRecordModal}
                                    setShowScratchModal={setShowScratchModal}
                                    setScratchResult={setScratchResult}
                                />

                                {/* Quick Stats */}
                                <StatsCard raffle={raffle} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
});

// Tier Section Component
const TierSection = memo(function TierSection({
    tier,
    prizes,
    totalQuantity,
    getTierInfo,
}: {
    tier: number;
    prizes: any[];
    totalQuantity: number;
    getTierInfo: (order: number) => any;
}) {
    const { tierInfo, bestTier } = useMemo(() => {
        const tierInfo = getTierInfo(tier * 10);
        const bestTier = Object.keys(tierMap).length - 1;
        return { tierInfo, bestTier };
    }, [tier, getTierInfo]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-gradient-to-br",
                tierInfo.bg,
                "backdrop-blur-lg border rounded-2xl p-4",
                `border-${tierInfo.border}`,
                `shadow-lg shadow-${tierInfo.glow}`
            )}
        >
            <div className="flex items-center gap-3 mb-4">
                <div
                    className={cn(
                        "px-3 py-1 rounded-full bg-gradient-to-r text-[rgba(255,255,255,0.95)] font-bold text-sm",
                        tierInfo.gradient
                    )}
                >
                    {tierInfo.name} TIER {bestTier - tier}
                </div>
                <span className="text-[rgba(255,255,255,0.5)] text-sm">
                    {prizes.length} {prizes.length === 1 ? "prize" : "prizes"}
                </span>
            </div>

            <div
                className={cn(
                    "grid grid-cols-3",
                    `grid-cols-${Math.min(prizes.length, 3)}`,
                    getResponsiveClass(15).gapClass
                )}
            >
                {prizes.map((prize: any, index: number) => (
                    <PrizeCard
                        key={prize.id}
                        prize={prize}
                        totalQuantity={totalQuantity}
                        index={index}
                        isSmall
                        getTierInfo={getTierInfo}
                    />
                ))}
            </div>
        </motion.div>
    );
});

// Grand Prize Card Component
const GrandPrizeCard = memo(function GrandPrizeCard({
    prize,
    getTierInfo,
}: {
    prize: any;
    getTierInfo: (order: number) => any;
}) {
    const { tierInfo, tier } = useMemo(() => {
        const tierInfo = getTierInfo(prize.order);
        const bestTier = Object.keys(tierMap).length - 1;
        const tierRaw = Math.floor(prize.order / 10);
        const tier = bestTier - tierRaw;

        return { tierInfo, tier };
    }, [prize.order, getTierInfo]);

    return (
        <div
            className={cn(
                "relative overflow-visible rounded-3xl opacity-0 animate-[fadeIn_0.6s_ease-out_0.1s_forwards]",
                `bg-gradient-to-br ${tierInfo.bg}`,
                "backdrop-blur-lg border-2",
                `border-${tierInfo.border}`,
                "shadow-2xl",
                `shadow-${tierInfo.glow}`,
                getResponsiveClass(30).paddingClass
            )}
        >
            <div
                className="absolute inset-0 rounded-xl "
                style={{
                    opacity: 0.15,
                    background:
                        "conic-gradient(from 0deg, #a855f7, #06b6d4, #10b981, #eab308, #a855f7)",
                }}
            />
            <div className="text-center">
                <div className="mb-6 animate-[floatGentle_4s_ease-in-out_infinite]">
                    <div
                        className={cn(
                            "mx-auto mb-4 relative",
                            getResponsiveClass(90).frameClass
                        )}
                    >
                        <div className="relative w-full h-full rounded-[10px] overflow-hidden">
                            {/* Compact holographic border for smaller cards */}
                            <div
                                className="absolute inset-0 rounded-xl animate-spin scale-150"
                                style={{
                                    animationDuration: "2s",
                                    background:
                                        "conic-gradient(from 0deg, #a855f7, #06b6d4, #10b981, #eab308, #a855f7)",
                                }}
                            />
                            {prize.prizeType === "NFT" ? (
                                <div
                                    className={cn(
                                        "relative w-full h-full rounded-[10px] flex items-center justify-center p-[3px] z-10"
                                    )}
                                    style={{
                                        background:
                                            "linear-gradient(to bottom right, rgba(150, 100, 190, 0.08), rgba(140, 90, 180, 0.08))",
                                    }}
                                >
                                    {prize.spg.imageUrl ||
                                    prize.spg.metadata.image ? (
                                        <div className="relative w-full h-full rounded-[10px] overflow-hidden">
                                            <Image
                                                src={
                                                    prize.spg.imageUrl ||
                                                    prize.spg.metadata.image
                                                }
                                                alt={prize.title}
                                                fill
                                                className="object-cover"
                                            />

                                            {/* Compact shimmer effect */}
                                            <div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
                                                style={{
                                                    animation:
                                                        "shimmer 2s infinite",
                                                    background:
                                                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                                                    transform:
                                                        "translateX(-100%) skewX(-12deg)",
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="relative z-10">
                                            <Gem
                                                className={cn(
                                                    "animate-pulse",
                                                    getResponsiveClass(45)
                                                        .frameClass
                                                )}
                                                style={{
                                                    color: "rgba(160,140,200,0.5)",
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div
                                    className={cn(
                                        "relative w-full h-full rounded-[10px] border-2 flex items-center justify-center z-10"
                                    )}
                                    style={{
                                        background:
                                            "linear-gradient(to bottom right, rgba(150, 100, 190, 0.08), rgba(140, 90, 180, 0.08))",
                                        borderColor:
                                            "rgba(160, 120, 200, 0.15)",
                                    }}
                                >
                                    {prize.asset.iconUrl ? (
                                        <div
                                            className={cn(
                                                "relative w-full h-full",
                                                "rounded-[10px] border border-white/15",
                                                "bg-gradient-to-br from-slate-800 via-slate-600 to-slate-900"
                                            )}
                                        >
                                            <Image
                                                src={prize.asset.iconUrl}
                                                alt={prize.title}
                                                fill
                                                className="object-contain"
                                            />

                                            {/* Compact shimmer effect */}
                                            <div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
                                                style={{
                                                    animation:
                                                        "shimmer 2s infinite",
                                                    background:
                                                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                                                    transform:
                                                        "translateX(-100%) skewX(-12deg)",
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <Star
                                            className={cn(
                                                getResponsiveClass(45)
                                                    .frameClass
                                            )}
                                            style={{
                                                color: "rgba(160, 120, 200, 0.6)",
                                            }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <h3
                    className={cn(
                        "font-light text-[rgba(255,255,255,0.8)] mb-2 tracking-wide rainbow-text",
                        getResponsiveClass(20).textClass
                    )}
                >
                    GRAND PRIZE - {tierInfo.name} TIER {tier}
                </h3>
                <h4
                    className={cn(
                        "font-bold text-[rgba(255,255,255,0.95)] mb-2 rainbow-text",
                        getResponsiveClass(35).textClass
                    )}
                >
                    {prize.title}
                </h4>
            </div>
        </div>
    );
});

// Prize Card Component
const PrizeCard = memo(function PrizeCard({
    prize,
    totalQuantity,
    index,
    isSmall = false,
    getTierInfo,
}: {
    prize: any;
    totalQuantity: number;
    index: number;
    isSmall?: boolean;
    getTierInfo?: (order: number) => any;
}) {
    const { tierInfo, tier } = useMemo(() => {
        const tierInfo = getTierInfo ? getTierInfo(prize.order) : null;
        const bestTier = Object.keys(tierMap).length - 1;
        const tierRaw = Math.floor(prize.order / 10);
        const tier = bestTier - tierRaw;

        return { tierInfo, tier };
    }, [prize.order, getTierInfo]);

    const percentage = useMemo(() => {
        return ((prize.quantity / totalQuantity) * 100).toFixed(2);
    }, [prize.quantity, totalQuantity]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{
                y: -8,
                scale: 1.03,
            }}
            className={cn(
                "relative overflow-hidden rounded-2xl group cursor-pointer",
                "z-30",
                "backdrop-blur-xl border transition-all duration-500 ease-out",
                tierInfo
                    ? `bg-gradient-to-br ${tierInfo.bg} border-${tierInfo.border} shadow-lg shadow-${tierInfo.glow}`
                    : "bg-gradient-to-br from-white/15 via-white/10 to-white/5 border-white/15 hover:border-white/25",
                "py-[10px] px-[10px] sm:py-[15px] md:py-[20px]",
                "morp-glass-1"
            )}
        >
            {/* Tier Badge */}
            {tierInfo && !isSmall && (
                <div className="absolute top-3 right-3 z-10">
                    <div
                        className={cn(
                            "px-2 py-1 rounded-full bg-gradient-to-r text-white font-bold text-xs",
                            tierInfo.gradient
                        )}
                    >
                        T{tier}
                    </div>
                </div>
            )}

            <div className="text-center">
                <div
                    className={cn(
                        "relative mb-3 mx-auto",
                        isSmall
                            ? getResponsiveClass(55).frameClass
                            : getResponsiveClass(70).frameClass
                    )}
                >
                    {prize.prizeType === "NFT" ? (
                        <div className="relative aspect-[4/3] w-full h-full rounded-[8px] overflow-hidden">
                            {/* Compact holographic border for smaller cards */}
                            <div
                                className="absolute inset-0 rounded-xl animate-spin scale-150"
                                style={{
                                    animationDuration: "2s",
                                    background:
                                        "conic-gradient(from 0deg, #a855f7, #06b6d4, #10b981, #eab308, #a855f7)",
                                }}
                            />
                            <div
                                className={cn(
                                    "w-full h-full rounded-xl flex items-center justify-center p-[1px]",
                                    "bg-gradient-to-br from-violet-300/10 to-purple-300/10"
                                )}
                            >
                                {prize.spg?.imageUrl ||
                                prize.spg?.metadata?.image ? (
                                    <div className="relative w-full h-full rounded-[8px] overflow-hidden">
                                        <Image
                                            src={
                                                prize.spg.imageUrl ||
                                                prize.spg.metadata.image
                                            }
                                            alt={prize.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover"
                                            priority={false}
                                            unoptimized={false}
                                        />

                                        {/* Compact shimmer effect */}
                                        <div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
                                            style={{
                                                animation:
                                                    "shimmer 2s infinite",
                                                background:
                                                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                                                transform:
                                                    "translateX(-100%) skewX(-12deg)",
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Gem
                                            className={cn(
                                                "text-violet-300 animate-pulse",
                                                isSmall
                                                    ? getResponsiveClass(45)
                                                          .frameClass
                                                    : getResponsiveClass(60)
                                                          .frameClass
                                            )}
                                        />
                                        {/* Compact floating particles */}
                                        {[...Array(4)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute w-0.5 h-0.5 bg-cyan-400 rounded-full animate-bounce"
                                                style={{
                                                    top: `${25 + i * 15}%`,
                                                    left: `${20 + i * 15}%`,
                                                    animationDelay: `${
                                                        i * 0.3
                                                    }s`,
                                                    animationDuration: "1.2s",
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : prize.prizeType === "EMPTY" ? (
                        <div
                            className={cn(
                                "w-full h-full rounded-[8px] border flex items-center justify-center p-2",
                                "bg-gradient-to-br from-gray-400/10 to-gray-500/10",
                                "border-gray-400/20"
                            )}
                        >
                            <div className="text-center">
                                <div
                                    className={cn(
                                        "text-red-400 mb-1",
                                        isSmall
                                            ? getResponsiveClass(45).textClass
                                            : getResponsiveClass(60).textClass
                                    )}
                                >
                                    💔
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={cn(
                                "w-full h-full rounded-[8px] border flex items-center justify-center p-2",
                                "bg-gradient-to-br from-violet-300/10 to-purple-300/10",
                                "border-violet-300/20"
                            )}
                        >
                            {prize.asset?.iconUrl ? (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={prize.asset.iconUrl || ""}
                                        alt={prize.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-contain"
                                        priority={false}
                                        unoptimized={false}
                                    />
                                </div>
                            ) : (
                                <Star
                                    className={cn(
                                        "text-violet-300",
                                        isSmall
                                            ? getResponsiveClass(45).frameClass
                                            : getResponsiveClass(60).frameClass
                                    )}
                                />
                            )}
                        </div>
                    )}
                </div>

                <h4
                    className={cn(
                        "font-bold text-[rgba(255,255,255,0.9)] mb-1 line-clamp-2",
                        getResponsiveClass(isSmall ? 15 : 15).textClass
                    )}
                >
                    {prize.title}
                </h4>
                <p
                    className={cn(
                        "text-[rgba(255,255,255,0.4)]",
                        getResponsiveClass(5).textClass
                    )}
                >
                    {percentage}%
                </p>
            </div>
        </motion.div>
    );
});

// Countdown Card Component
const CountdownCard = memo(function CountdownCard({
    timeLeft,
    isLive,
}: {
    timeLeft: any;
    isLive: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
                "bg-gradient-to-br from-[rgba(20,20,30,0.6)] to-[rgba(30,25,40,0.4)]",
                "backdrop-blur-lg border border-[rgba(160,140,200,0.15)] rounded-[12px] p-4"
            )}
        >
            <div className="text-center">
                <div
                    className={cn(
                        "flex items-center justify-center mb-4",
                        getResponsiveClass(15).gapClass
                    )}
                >
                    <Timer
                        className={cn(getResponsiveClass(25).frameClass)}
                        style={{
                            color: "rgba(160,140,200,0.7)",
                        }}
                    />
                    <h3
                        className={cn(
                            "font-medium text-[rgba(255,255,255,0.9)]",
                            getResponsiveClass(20).textClass
                        )}
                    >
                        {isLive ? "Time Remaining" : "Starts In"}
                    </h3>
                </div>

                <div
                    className={cn(
                        "grid grid-cols-4",
                        getResponsiveClass(10).gapClass
                    )}
                >
                    <TimeUnit value={timeLeft.days} label="Days" />
                    <TimeUnit value={timeLeft.hours} label="Hours" />
                    <TimeUnit value={timeLeft.minutes} label="Min" />
                    <TimeUnit value={timeLeft.seconds} label="Sec" />
                </div>
            </div>
        </motion.div>
    );
});

// Participation Card Component
const ParticipationCard = memo(function ParticipationCard({
    raffle,
    raffleStatus,
    setShowRecordModal,
    setShowScratchModal,
    setScratchResult,
}: {
    raffle: any;
    raffleStatus: RaffleStatus;
    setShowRecordModal: (show: boolean) => void;
    setShowScratchModal: (show: boolean) => void;
    setScratchResult: (result: any) => void;
}) {
    const { data: session } = useSession();
    const toast = useToast();
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const {
        participateInRaffleAsync,
        isParticipateInRafflePending,
        participateInRaffleError,
        userParticipationData,
    } = useRaffles({
        checkUserParticipationRaffleId: raffle?.id,
        checkUserParticipationPlayerId: session?.player?.id || "",
    });

    const isLive = raffleStatus === "ACTIVE";
    const isUpcoming = raffleStatus === "UPCOMING";

    const { asset } = useAssetsGet({
        getAssetInput: {
            id: raffle?.entryFeeAssetId || undefined,
        },
    });

    const { playerAsset } = usePlayerAssetsGet({
        getPlayerAssetInput: {
            playerId: session?.player?.id || "",
            assetId: raffle?.entryFeeAssetId || "",
        },
    });

    const entryFeeAsset = useMemo(() => (asset ? asset : null), [asset]);

    // 사용자 참여 여부 및 횟수 확인
    const userParticipations = useMemo(() => {
        if (!userParticipationData?.success || !userParticipationData.data)
            return [];
        return userParticipationData.data.participants || [];
    }, [userParticipationData]);

    // 사용자의 총 참여 횟수 계산
    const userParticipationCount = useMemo(() => {
        return userParticipations.length;
    }, [userParticipations]);

    const hasParticipated = userParticipations.length > 0;
    const hasReachedMaxEntries = raffle?.maxEntriesPerPlayer
        ? userParticipationCount >= raffle.maxEntriesPerPlayer
        : false;

    const canParticipate = useMemo(() => {
        return (
            isLive &&
            (!hasParticipated ||
                (raffle?.allowMultipleEntry && !hasReachedMaxEntries)) &&
            raffle.entryFeeAmount <= (playerAsset?.data?.balance || 0)
        );
    }, [
        isLive,
        hasParticipated,
        raffle?.allowMultipleEntry,
        hasReachedMaxEntries,
        playerAsset?.data?.balance,
        raffle.entryFeeAmount,
    ]);

    // 참여 핸들러
    const handleParticipate = async () => {
        if (!session?.player?.id) {
            toast.error("Please login to participate in the raffle.");
            return;
        }

        const playerId = session.player.id;

        try {
            const result = await participateInRaffleAsync({
                raffleId: raffle.id,
                playerId: playerId,
                ipAddress: undefined,
                userAgent: navigator.userAgent,
            });

            if (result.success) {
                setScratchResult(result.data);
                setShowScratchModal(true);
            } else {
                toast.error(result.error || "Failed to participate.");
            }
        } catch (error) {
            console.error("Participation error:", error);
            toast.error("An error occurred while participating.");
        }
    };

    const handleShare = useCallback(
        async (type: "copy" | "twitter" | "telegram") => {
            const url = `${window.location.origin}/raffles/${raffle.id}`;
            const text = `Check out this amazing prize drop: ${raffle.title}! Join now for a chance to win exclusive NFTs and tokens! @StarglowP`;

            switch (type) {
                case "copy":
                    try {
                        await navigator.clipboard.writeText(`${text}\n${url}`);
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                    } catch (err) {
                        console.error("Failed to copy:", err);
                    }
                    break;
                case "twitter":
                    window.open(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                            text
                        )}&url=${encodeURIComponent(url)}`,
                        "_blank"
                    );
                    break;
                case "telegram":
                    window.open(
                        `https://t.me/share/url?url=${encodeURIComponent(
                            url
                        )}&text=${encodeURIComponent(text)}`,
                        "_blank"
                    );
                    break;
            }
            setShowShareMenu(false);
        },
        [raffle.id, raffle.title]
    );

    const handleViewResult = () => {
        setShowRecordModal(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
                "bg-gradient-to-br from-[rgba(20,25,20,0.6)] to-[rgba(25,30,25,0.4)]",
                "backdrop-blur-lg border border-[rgba(140,180,160,0.15)] rounded-3xl",
                getResponsiveClass(25).paddingClass
            )}
        >
            <div className="text-center py-[30px]">
                {/* Header with actions */}
                <div className="flex items-center justify-between mb-6">
                    <div
                        className={cn(
                            "flex items-center",
                            getResponsiveClass(10).gapClass
                        )}
                    >
                        <Ticket
                            className={cn(getResponsiveClass(25).frameClass)}
                            style={{
                                color: "rgba(140,180,160,0.7)",
                            }}
                        />
                        <h3
                            className={cn(
                                "font-medium text-[rgba(255,255,255,0.9)]",
                                getResponsiveClass(20).textClass
                            )}
                        >
                            Participation
                        </h3>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowShareMenu(!showShareMenu)}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <Share2
                                    className={cn(
                                        "text-white/60",
                                        getResponsiveClass(15).frameClass
                                    )}
                                />
                            </motion.button>

                            <AnimatePresence>
                                {showShareMenu && (
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            y: 10,
                                            scale: 0.8,
                                        }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                        className="absolute top-full right-0 mt-2 bg-gray-900/90 backdrop-blur-lg border border-white/20 rounded-xl p-2 z-50"
                                    >
                                        <div className="flex flex-col gap-1 min-w-[120px]">
                                            <button
                                                onClick={() =>
                                                    handleShare("copy")
                                                }
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <Copy
                                                    className={cn(
                                                        getResponsiveClass(15)
                                                            .frameClass
                                                    )}
                                                />
                                                {copySuccess
                                                    ? "Copied!"
                                                    : "Copy Link"}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleShare("twitter")
                                                }
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Twitter
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleShare("telegram")
                                                }
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Telegram
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Entry Requirements */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-400" />
                            <span className="text-white/80 text-sm">
                                Entry Fee
                            </span>
                        </div>
                        <span className="text-white font-medium text-sm">
                            {raffle.entryFeeAmount > 0 ? (
                                <div className="flex items-center gap-2">
                                    {entryFeeAsset?.iconUrl && (
                                        <Image
                                            src={entryFeeAsset?.iconUrl || ""}
                                            alt={
                                                entryFeeAsset?.symbol || "token"
                                            }
                                            width={20}
                                            height={20}
                                            className={cn(
                                                getResponsiveClass(15)
                                                    .frameClass,
                                                "object-contain"
                                            )}
                                        />
                                    )}
                                    {`${raffle.entryFeeAmount} ${
                                        entryFeeAsset?.symbol || "tokens"
                                    }`}
                                </div>
                            ) : (
                                "FREE"
                            )}
                        </span>
                    </div>

                    <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-400" />
                            <span className="text-white/80 text-sm">
                                Max Entries
                            </span>
                        </div>
                        <span className="text-white font-medium text-sm">
                            {!raffle.allowMultipleEntry
                                ? userParticipationCount > 0
                                    ? "1/1 (Completed)"
                                    : "1 Entry Only"
                                : raffle.maxEntriesPerPlayer
                                ? `${userParticipationCount}/${raffle.maxEntriesPerPlayer}`
                                : userParticipationCount > 0
                                ? `${userParticipationCount}/∞ Unlimited`
                                : "∞ Unlimited"}
                        </span>
                    </div>

                    {raffle.minimumPoints && (
                        <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span className="text-white/80 text-sm">
                                    Min Points
                                </span>
                            </div>
                            <span className="text-white font-medium text-sm">
                                {raffle.minimumPoints}
                            </span>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <motion.button
                        whileHover={{
                            scale:
                                canParticipate && !isParticipateInRafflePending
                                    ? 1.02
                                    : 1,
                        }}
                        whileTap={{
                            scale:
                                canParticipate && !isParticipateInRafflePending
                                    ? 0.98
                                    : 1,
                        }}
                        disabled={
                            !canParticipate || isParticipateInRafflePending
                        }
                        onClick={handleParticipate}
                        className={cn(
                            "w-full font-bold rounded-2xl transition-all duration-300",
                            "flex items-center justify-center gap-2",
                            "shadow-lg font-main",
                            "transition-all duration-300",
                            canParticipate && !isParticipateInRafflePending
                                ? "bg-gradient-to-r from-[rgba(71,234,120,0.7)] via-[rgba(190,77,52,0.7)] to-[rgba(110,28,172,0.7)] hover:from-[rgba(71,234,120,0.9)] hover:via-[rgba(190,77,52,0.9)] hover:to-[rgba(110,28,172,0.9)] text-[rgba(255,255,255,0.95)] hover:shadow-xl"
                                : isUpcoming
                                ? "bg-gradient-to-r from-[rgba(60,60,70,0.8)] to-[rgba(70,70,80,0.8)] text-[rgba(255,255,255,0.5)] cursor-not-allowed"
                                : "bg-[rgba(60,60,70,0.8)] text-[rgba(255,255,255,0.4)] cursor-not-allowed",
                            getResponsiveClass(50).paddingClass,
                            "px-[10px]",
                            getResponsiveClass(35).textClass
                        )}
                    >
                        {isParticipateInRafflePending ? (
                            <>
                                <Loader2
                                    className={cn(
                                        getResponsiveClass(30).frameClass
                                    )}
                                />
                                Participating...
                            </>
                        ) : canParticipate ? (
                            <>
                                <Play
                                    className={cn(
                                        getResponsiveClass(30).frameClass
                                    )}
                                />
                                Enter Raffle
                            </>
                        ) : isUpcoming ? (
                            <>
                                <Zap
                                    className={cn(
                                        getResponsiveClass(30).frameClass
                                    )}
                                />
                                Coming Soon
                            </>
                        ) : (
                            <>
                                <Award
                                    className={cn(
                                        getResponsiveClass(30).frameClass
                                    )}
                                />
                                Unavailable
                            </>
                        )}
                    </motion.button>

                    {/* View All Records 버튼 (별도) */}
                    {hasParticipated && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleViewResult}
                            className={cn(
                                "w-full font-bold rounded-2xl transition-all duration-300",
                                "flex items-center justify-center gap-2",
                                "bg-gradient-to-r from-[rgba(140,170,200,0.8)] to-[rgba(120,150,180,0.9)] hover:from-[rgba(140,170,200,0.9)] hover:to-[rgba(120,150,180,1)]",
                                "text-[rgba(255,255,255,0.95)] shadow-lg hover:shadow-xl",
                                getResponsiveClass(20).paddingClass,
                                getResponsiveClass(15).textClass
                            )}
                        >
                            <Trophy
                                className={cn(
                                    getResponsiveClass(20).frameClass
                                )}
                            />
                            My Records
                        </motion.button>
                    )}

                    {/* Already Participated 표시 (즉시 공개가 아닌 경우) */}
                    {hasParticipated &&
                        isLive &&
                        !raffle?.instantReveal &&
                        (!raffle?.allowMultipleEntry ||
                            hasReachedMaxEntries) && (
                            <div
                                className={cn(
                                    "w-full font-bold rounded-2xl",
                                    "flex items-center justify-center gap-2",
                                    "bg-gradient-to-r from-gray-500 to-gray-600 text-white",
                                    getResponsiveClass(20).paddingClass,
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Already Participated
                            </div>
                        )}

                    {/* 오류 표시 */}
                    {participateInRaffleError && (
                        <p className="text-red-400 text-sm text-center">
                            {participateInRaffleError.message}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

// Stats Card Component
const StatsCard = memo(function StatsCard({ raffle }: { raffle: any }) {
    const { tier } = useMemo(() => {
        const bestTier = Object.keys(tierMap).length - 1;
        const bestPrize = raffle.prizes?.reduce(
            (max: any, p: any) => (p.order > max.order ? p : max),
            raffle.prizes[0]
        );
        const tier = bestTier - Math.floor(bestPrize.order / 10);

        return { tier };
    }, [raffle]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className={cn(
                "bg-gradient-to-br from-[rgba(15,15,25,0.6)] to-[rgba(25,25,35,0.4)]",
                "backdrop-blur-lg border border-[rgba(255,255,255,0.06)] rounded-[12px] p-4"
            )}
        >
            <h4
                className={cn(
                    "font-medium text-[rgba(255,255,255,0.9)] mb-1 text-center",
                    getResponsiveClass(20).textClass
                )}
            >
                Statistics
            </h4>
            <div className="grid grid-cols-3 gap-1">
                <div className="text-center bg-[rgba(255,255,255,0.03)] rounded-[12px] p-2">
                    <Users
                        className="w-5 h-5 mx-auto mb-1"
                        style={{ color: "rgba(140,170,200,0.7)" }}
                    />
                    <p
                        className={cn(
                            "text-[rgba(255,255,255,0.9)] font-bold",
                            getResponsiveClass(20).textClass
                        )}
                    >
                        {raffle.totalParticipants.toLocaleString()}
                    </p>
                    <p
                        className={cn(
                            "text-[rgba(255,255,255,0.5)]",
                            getResponsiveClass(10).textClass
                        )}
                    >
                        Participants
                    </p>
                </div>
                <div className="text-center bg-[rgba(255,255,255,0.03)] rounded-[12px] p-2">
                    <Trophy
                        className="w-5 h-5 mx-auto mb-1"
                        style={{ color: "rgba(200,160,100,0.7)" }}
                    />
                    <p
                        className={cn(
                            "text-[rgba(255,255,255,0.9)] font-bold",
                            getResponsiveClass(20).textClass
                        )}
                    >
                        {raffle.prizes?.length || 0}
                    </p>
                    <p
                        className={cn(
                            "text-[rgba(255,255,255,0.5)]",
                            getResponsiveClass(10).textClass
                        )}
                    >
                        Prizes
                    </p>
                </div>
                <div className="text-center bg-[rgba(255,255,255,0.03)] rounded-[12px] p-2">
                    <Sparkles
                        className="w-5 h-5 mx-auto mb-1"
                        style={{ color: "rgba(160,140,200,0.7)" }}
                    />
                    <p
                        className={cn(
                            "text-[rgba(255,255,255,0.9)] font-bold",
                            getResponsiveClass(20).textClass
                        )}
                    >
                        {tier}
                    </p>
                    <p
                        className={cn(
                            "text-[rgba(255,255,255,0.5)]",
                            getResponsiveClass(10).textClass
                        )}
                    >
                        Max Tier
                    </p>
                </div>
            </div>
        </motion.div>
    );
});

// Helper Components
const TimeUnit = memo(function TimeUnit({
    value,
    label,
}: {
    value: number;
    label: string;
}) {
    return (
        <div className="bg-[rgba(255,255,255,0.06)] rounded-[12px] p-2 text-center">
            <p
                className={cn(
                    "text-[rgba(255,255,255,0.95)] font-bold",
                    getResponsiveClass(25).textClass
                )}
            >
                {value.toString().padStart(2, "0")}
            </p>
            <p
                className={cn(
                    "text-[rgba(255,255,255,0.6)] font-medium",
                    getResponsiveClass(10).textClass
                )}
            >
                {label}
            </p>
        </div>
    );
});

// Loading & Error States
const RaffleDetailSkeleton = memo(function RaffleDetailSkeleton() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className={cn(
                    "border-4 border-purple-400 border-t-transparent rounded-full",
                    getResponsiveClass(45).frameClass
                )}
            />
        </div>
    );
});

const RaffleDetailError = memo(function RaffleDetailError() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-md mx-auto px-6"
            >
                <motion.div
                    animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className={cn("mb-6", getResponsiveClass(65).textClass)}
                >
                    🎁💔
                </motion.div>
                <h3
                    className={cn(
                        "font-bold text-[rgba(255,255,255,0.95)] mb-4",
                        getResponsiveClass(35).textClass
                    )}
                >
                    Prize Drop Not Found
                </h3>
                <p className="text-[rgba(255,255,255,0.6)] mb-8 leading-relaxed">
                    The prize drop you&rsquo;re looking for might have ended,
                    been removed, or the link might be incorrect.
                    <br />
                    <span className="text-[rgba(255,255,255,0.4)] text-sm mt-2 block">
                        Don&rsquo;t worry - there are more amazing drops waiting
                        for you!
                    </span>
                </p>

                <div className="space-y-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.location.reload()}
                        className={cn(
                            "w-full bg-gradient-to-r from-[rgba(140,170,200,0.8)] to-[rgba(120,150,180,0.9)]",
                            "hover:from-[rgba(140,170,200,0.9)] hover:to-[rgba(120,150,180,1)]",
                            "text-[rgba(255,255,255,0.95)] font-bold rounded-xl transition-all duration-300",
                            "flex items-center justify-center gap-2",
                            "border border-[rgba(140,170,200,0.2)]",
                            getResponsiveClass(20).paddingClass,
                            getResponsiveClass(15).textClass
                        )}
                    >
                        <RefreshCcw
                            className={cn(getResponsiveClass(20).frameClass)}
                        />
                        Try Again
                    </motion.button>

                    <Link href="/raffles">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                "w-full bg-gradient-to-r from-[rgba(160,140,200,0.8)] to-[rgba(200,140,160,0.8)]",
                                "hover:from-[rgba(160,140,200,0.9)] hover:to-[rgba(200,140,160,0.9)]",
                                "text-[rgba(255,255,255,0.95)] font-bold rounded-xl transition-all duration-300",
                                "flex items-center justify-center gap-2",
                                getResponsiveClass(20).paddingClass,
                                getResponsiveClass(15).textClass
                            )}
                        >
                            <Gift
                                className={cn(
                                    getResponsiveClass(20).frameClass
                                )}
                            />
                            Browse All Prize Drops
                        </motion.button>
                    </Link>

                    <Link
                        href="/"
                        className={cn(
                            "text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.6)] transition-colors block mt-4",
                            getResponsiveClass(15).textClass
                        )}
                    >
                        ← Back to Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
});
