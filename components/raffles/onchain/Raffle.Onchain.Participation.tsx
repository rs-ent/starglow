/// components/raffles/web3/Raffle.Onchain.Participation.tsx

"use client";

import { memo, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Ticket,
    Play,
    Loader2,
    CheckCircle2,
    Zap,
    Share2,
    Copy,
    ExternalLink,
    Timer,
    Coins,
    Gift,
    Crown,
    Trophy,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";

import { useOnchainRaffles } from "@/app/actions/raffles/onchain/hooks";
import { useToast } from "@/app/hooks/useToast";
import { useAssetsGet } from "@/app/actions/assets/hooks";
import { usePlayerAssetsGet } from "@/app/actions/playerAssets/hooks";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Particles } from "@/components/magicui/particles";
import RaffleOnchainParticipationLog from "./Raffle.Onchain.Participation.Log";

interface TicketData {
    raffleTitle: string;
    participantId: number;
    ticketNumber?: string;
    txHash: string;
    participatedAt: number;
    entryFeePaid: number;
    entryFeeAsset?: {
        symbol: string;
        iconUrl?: string;
    };
    prizeWon?: {
        title: string;
        description: string;
        imageUrl: string;
        prizeType: number;
        userValue: number;
        order: number;
        rarity: number;
    };
    isInstantDraw?: boolean;
    explorerUrl: string;
    walletAddress: string;
}

interface RaffleOnchainParticipationProps {
    contractAddress: string;
    raffleId: string;
    basicInfo?: any;
    raffleData?: any;
    timingData?: any;
    settingsData?: any;
    feeData?: any;
    statusData?: any;
    isStatusLoading?: boolean;
    onParticipationSuccess?: (
        ticket: TicketData,
        isInstantDraw: boolean
    ) => void;
}

export default memo(function RaffleOnchainParticipation({
    contractAddress,
    raffleId,
    basicInfo,
    timingData,
    settingsData,
    feeData,
    statusData,
    onParticipationSuccess,
}: RaffleOnchainParticipationProps) {
    const { data: session } = useSession();
    const toast = useToast();
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [showParticipationLog, setShowParticipationLog] = useState(false);

    const {
        userParticipationSummary,
        refetchUserParticipationSummary,
        participateAsync,
        participateAndDrawAsync,
        isParticipatePending,
        isParticipateAndDrawPending,
        isParticipateError,
        isParticipateAndDrawError,
        participateError,
        participateAndDrawError,
    } = useOnchainRaffles({
        getUserParticipationSummaryInput: {
            contractAddress,
            raffleId,
            userId: session?.user.id || "",
        },
    });

    const { asset } = useAssetsGet({
        getAssetInput: {
            id: feeData?.participationFeeAssetId || "",
        },
    });

    const { playerAsset } = usePlayerAssetsGet({
        getPlayerAssetInput: {
            playerId: session?.player?.id || "",
            assetId: feeData?.participationFeeAssetId || "",
        },
    });

    const entryFeeAsset = useMemo(() => (asset ? asset : null), [asset]);

    const currentTime = new Date().getTime();
    const isLive =
        !statusData?.isDrawn &&
        timingData?.endDate &&
        currentTime <= Number(timingData.endDate) * 1000;

    const isUpcoming =
        timingData?.startDate &&
        currentTime < Number(timingData.startDate) * 1000;

    const hasParticipated =
        userParticipationSummary?.success &&
        userParticipationSummary.data &&
        userParticipationSummary.data.participationCount > 0;
    const participationCount =
        userParticipationSummary?.data?.participationCount || 0;

    const participationLimit = settingsData?.participationLimitPerPlayer
        ? Number(settingsData.participationLimitPerPlayer)
        : null;

    const isUnlimited =
        participationLimit === null ||
        participationLimit >= Number.MAX_SAFE_INTEGER;
    const hasReachedLimit =
        !isUnlimited &&
        participationLimit &&
        participationCount >= participationLimit;

    const canParticipate = useMemo(() => {
        const feeAmount = feeData?.participationFeeAmount;
        const hasEnoughBalance =
            feeAmount != null && Number(feeAmount) > 0
                ? Number(feeAmount) <= (playerAsset?.data?.balance || 0)
                : true;

        return (
            isLive && (!hasParticipated || !hasReachedLimit) && hasEnoughBalance
        );
    }, [
        isLive,
        hasParticipated,
        hasReachedLimit,
        feeData?.participationFeeAmount,
        playerAsset?.data?.balance,
    ]);

    const handleParticipate = useCallback(async () => {
        if (!session?.player?.id || !session?.user.id) {
            toast.error("Please login to participate");
            return;
        }

        try {
            const participateAction = timingData?.instantDraw
                ? participateAndDrawAsync
                : participateAsync;

            const result = await participateAction({
                contractAddress,
                raffleId,
                playerId: session.player.id,
                userId: session.user.id,
            });

            const ticket = {
                raffleTitle: basicInfo?.title || "Raffle",
                participantId: result?.participantId || 0,
                ticketNumber:
                    "ticketNumber" in (result || {})
                        ? (result as any).ticketNumber
                        : undefined,
                txHash: result?.txHash || "",
                participatedAt:
                    "participatedAt" in (result || {})
                        ? (result as any).participatedAt
                        : Math.floor(Date.now() / 1000),
                entryFeePaid: result?.entryFeePaid || 0,
                entryFeeAsset: entryFeeAsset
                    ? {
                          symbol: entryFeeAsset.symbol || "tokens",
                          iconUrl: entryFeeAsset.iconUrl || undefined,
                      }
                    : undefined,
                prizeWon:
                    "prizeWon" in (result || {})
                        ? (result as any).prizeWon
                        : undefined,
                isInstantDraw: Boolean(timingData?.instantDraw),
                explorerUrl: "https://beratrail.io",
                walletAddress: (result as any)?.walletAddress || "",
            };

            if (onParticipationSuccess) {
                onParticipationSuccess(
                    ticket,
                    Boolean(timingData?.instantDraw)
                );
            }

            if (timingData?.instantDraw && ticket.prizeWon) {
                toast.success("🎉 Prize drawn! Scratch to reveal your reward!");
            } else {
                toast.success("🎫 Ticket successfully obtained! Good luck!");
            }

            refetchUserParticipationSummary().catch((err: any) => {
                console.error("Refetch error:", err);
            });
        } catch (error) {
            console.error("Participation error:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Looks like network is busy now. Please try again!";

            toast.error(errorMessage);
        }
    }, [
        session?.user.id,
        session?.player?.id,
        participateAndDrawAsync,
        participateAsync,
        contractAddress,
        raffleId,
        timingData,
        basicInfo?.title,
        entryFeeAsset,
        toast,
        refetchUserParticipationSummary,
        onParticipationSuccess,
    ]);

    const handleShare = useCallback(
        async (type: "copy" | "twitter" | "telegram") => {
            const url = `${window.location.origin}/raffles/test/${contractAddress}/${raffleId}`;
            const text = `Participate in the raffle: ${basicInfo?.title}! Transparent raffle with blockchain! @Starglow_world`;

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
        [contractAddress, raffleId, basicInfo?.title]
    );

    const isPending = isParticipatePending || isParticipateAndDrawPending;
    const isError = isParticipateError || isParticipateAndDrawError;
    const error = participateError || participateAndDrawError;

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

    const getParticipationStatusConfig = useCallback(() => {
        if (isUpcoming) {
            return {
                color: "text-amber-400",
                bg: "bg-amber-400/20",
                border: "border-amber-400/40",
                text: "Starting Soon",
                icon: Timer,
                shadowColor: "shadow-amber-500/20",
                gradient: "from-amber-500/10 to-orange-500/10",
            };
        }
        if (canParticipate) {
            return {
                color: "text-emerald-400",
                bg: "bg-emerald-400/20",
                border: "border-emerald-400/40",
                text: "Ready to Join",
                icon: Play,
                shadowColor: "shadow-emerald-500/20",
                gradient: "from-emerald-500/10 to-teal-500/10",
            };
        }
        if (hasReachedLimit) {
            return {
                color: "text-purple-400",
                bg: "bg-purple-400/20",
                border: "border-purple-400/40",
                text: "Max Tickets",
                icon: Crown,
                shadowColor: "shadow-purple-500/20",
                gradient: "from-purple-500/10 to-pink-500/10",
            };
        }
        return {
            color: "text-slate-400",
            bg: "bg-slate-400/20",
            border: "border-slate-400/40",
            text: "Closed",
            icon: CheckCircle2,
            shadowColor: "shadow-slate-500/20",
            gradient: "from-slate-500/10 to-slate-400/10",
        };
    }, [isUpcoming, canParticipate, hasReachedLimit]);

    const statusConfig = getParticipationStatusConfig();
    const StatusIcon = statusConfig.icon;

    return (
        <>
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
                    "relative bg-gradient-to-br from-slate-900/95 via-purple-950/70 to-pink-950/50",
                    "backdrop-blur-xl border border-purple-400/30 rounded-3xl overflow-hidden",
                    "shadow-2xl shadow-purple-500/20 hover:shadow-purple-500/30",
                    "p-3 transition-all duration-500 gpu-accelerate"
                )}
            >
                <Particles
                    className="absolute inset-0"
                    quantity={15}
                    staticity={35}
                    color="#a855f7"
                    size={0.7}
                    refresh={false}
                />

                {canParticipate && (
                    <BorderBeam
                        size={80}
                        duration={15}
                        colorFrom="#a855f7"
                        colorTo="#ec4899"
                        borderWidth={1}
                        className="opacity-50"
                    />
                )}

                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        className="absolute inset-0"
                        animate={{
                            background: [
                                "radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 60%)",
                                "radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.15) 0%, transparent 60%)",
                                "radial-gradient(circle at 40% 40%, rgba(147, 51, 234, 0.15) 0%, transparent 60%)",
                            ],
                        }}
                        transition={{
                            duration: 25,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />

                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full gpu-animate"
                            style={{
                                width: `${1.5 + Math.random() * 2}px`,
                                height: `${1.5 + Math.random() * 2}px`,
                                background: `rgba(168, 85, 247, ${
                                    0.4 + Math.random() * 0.4
                                })`,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [0, -40 - Math.random() * 30, 0],
                                opacity: [0.4, 1, 0.4],
                                scale: [0.3, 2, 0.3],
                            }}
                            transition={{
                                duration: 8 + Math.random() * 3,
                                repeat: Infinity,
                                delay: Math.random() * 4,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10">
                    <motion.div
                        variants={itemVariants}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={cn(
                            "flex items-center justify-between mb-6",
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
                                        rotate: [0, 15, -15, 0],
                                        scale: [1, 1.08, 1],
                                    }}
                                    transition={{
                                        duration: 8,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    className="p-3 rounded-2xl bg-purple-400/15 border-2 border-purple-400/40 backdrop-blur-sm"
                                >
                                    <Ticket
                                        className={cn(
                                            getResponsiveClass(30).frameClass,
                                            "text-purple-400"
                                        )}
                                    />
                                </motion.div>
                                <div className="absolute inset-0 bg-purple-400/20 rounded-2xl blur-lg opacity-50" />
                            </div>
                            <div>
                                <h3
                                    className={cn(
                                        "font-bold bg-gradient-to-r from-purple-300 via-pink-200 to-purple-100 bg-clip-text text-transparent",
                                        getResponsiveClass(25).textClass
                                    )}
                                >
                                    Participation
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowParticipationLog(true)}
                                className="relative p-3 rounded-2xl bg-blue-400/15 border-2 border-blue-400/30 backdrop-blur-sm hover:bg-blue-400/25 transition-all duration-300"
                            >
                                <Trophy
                                    className={cn(
                                        "text-blue-300",
                                        getResponsiveClass(20).frameClass
                                    )}
                                />
                                <div className="absolute inset-0 bg-blue-400/10 rounded-2xl blur-md" />
                            </motion.button>

                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() =>
                                        setShowShareMenu(!showShareMenu)
                                    }
                                    className="relative p-3 rounded-2xl bg-purple-400/15 border-2 border-purple-400/30 backdrop-blur-sm hover:bg-purple-400/25 transition-all duration-300"
                                >
                                    <Share2
                                        className={cn(
                                            "text-purple-300",
                                            getResponsiveClass(20).frameClass
                                        )}
                                    />
                                    <div className="absolute inset-0 bg-purple-400/10 rounded-2xl blur-md" />
                                </motion.button>

                                <AnimatePresence>
                                    {showShareMenu && (
                                        <motion.div
                                            initial={{
                                                opacity: 0,
                                                y: 10,
                                                scale: 0.8,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                y: 10,
                                                scale: 0.8,
                                            }}
                                            className="absolute top-full right-0 mt-3 bg-slate-900/95 backdrop-blur-xl border-2 border-purple-400/30 rounded-2xl p-3 z-50 shadow-2xl shadow-purple-500/20"
                                        >
                                            <div className="flex flex-col gap-2 min-w-[140px]">
                                                <button
                                                    onClick={() =>
                                                        handleShare("copy")
                                                    }
                                                    className="flex items-center gap-3 px-4 py-3 text-sm text-purple-200 hover:bg-purple-400/15 rounded-xl transition-all duration-300 hover:scale-105"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                    {copySuccess
                                                        ? "Copied!"
                                                        : "Copy Link"}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleShare("twitter")
                                                    }
                                                    className="flex items-center gap-3 px-4 py-3 text-sm text-purple-200 hover:bg-purple-400/15 rounded-xl transition-all duration-300 hover:scale-105"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    Twitter
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleShare("telegram")
                                                    }
                                                    className="flex items-center gap-3 px-4 py-3 text-sm text-purple-200 hover:bg-purple-400/15 rounded-xl transition-all duration-300 hover:scale-105"
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
                    </motion.div>

                    <div className="space-y-4 mb-6">
                        {feeData?.participationFeeAmount != null &&
                            Number(feeData.participationFeeAmount) > 0 && (
                                <motion.div
                                    variants={itemVariants}
                                    transition={{
                                        duration: 0.6,
                                        ease: "easeOut",
                                        delay: 0.2,
                                    }}
                                    whileHover={{ x: 4, scale: 1.02 }}
                                    className={cn(
                                        "relative flex items-center justify-between p-2 rounded-2xl overflow-hidden",
                                        "bg-slate-800/40 border-2 border-yellow-400/30",
                                        "shadow-2xl shadow-yellow-500/20 backdrop-blur-lg"
                                    )}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/8 to-orange-500/8" />
                                    <div className="relative z-10 flex items-center gap-2">
                                        <div className="relative">
                                            <div className="p-1 rounded-2xl bg-yellow-400/25 border-2 border-yellow-400/50">
                                                <Coins className="w-6 h-6 text-yellow-300" />
                                            </div>
                                            <div className="absolute inset-0 bg-yellow-400/20 rounded-2xl blur-md" />
                                        </div>
                                        <div>
                                            <h4
                                                className={cn(
                                                    "font-bold text-yellow-200 drop-shadow-md",
                                                    getResponsiveClass(15)
                                                        .textClass
                                                )}
                                            >
                                                ENTRY FEE
                                            </h4>
                                            <p
                                                className={cn(
                                                    "text-slate-300 font-medium",
                                                    getResponsiveClass(10)
                                                        .textClass
                                                )}
                                            >
                                                Required to participate
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative z-10 text-right">
                                        <div
                                            className={cn(
                                                "font-bold text-yellow-300 drop-shadow-md",
                                                getResponsiveClass(15).textClass
                                            )}
                                        >
                                            {entryFeeAsset ? (
                                                <div className="flex items-center gap-2">
                                                    {entryFeeAsset.iconUrl && (
                                                        <Image
                                                            src={
                                                                entryFeeAsset.iconUrl
                                                            }
                                                            alt={
                                                                entryFeeAsset.symbol ||
                                                                "token"
                                                            }
                                                            width={20}
                                                            height={20}
                                                            className="object-contain"
                                                        />
                                                    )}
                                                    <span>
                                                        {`${Number(
                                                            feeData.participationFeeAmount ||
                                                                0
                                                        ).toLocaleString()} ${
                                                            entryFeeAsset.symbol ||
                                                            "tokens"
                                                        }`}
                                                    </span>
                                                </div>
                                            ) : (
                                                `${Number(
                                                    feeData.participationFeeAmount ||
                                                        0
                                                ).toLocaleString()} tokens`
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                        <motion.div
                            variants={itemVariants}
                            transition={{
                                duration: 0.6,
                                ease: "easeOut",
                                delay: 0.3,
                            }}
                            whileHover={{ x: 4, scale: 1.02 }}
                            className={cn(
                                "relative flex items-center justify-between p-2 rounded-2xl overflow-hidden",
                                "border-2 backdrop-blur-lg shadow-2xl",
                                statusConfig.bg,
                                statusConfig.border,
                                statusConfig.shadowColor
                            )}
                        >
                            <div
                                className={cn(
                                    "absolute inset-0 bg-gradient-to-r",
                                    statusConfig.gradient
                                )}
                            />
                            <div className="relative z-10 flex items-center gap-2">
                                <div className="relative">
                                    <div
                                        className={cn(
                                            "p-1 rounded-2xl border-2",
                                            statusConfig.bg,
                                            statusConfig.border
                                        )}
                                    >
                                        <StatusIcon
                                            className={cn(
                                                "w-6 h-6",
                                                statusConfig.color
                                            )}
                                        />
                                    </div>
                                    <div
                                        className={cn(
                                            "absolute inset-0 rounded-2xl blur-md",
                                            statusConfig.bg
                                        )}
                                    />
                                </div>
                                <div>
                                    <h4
                                        className={cn(
                                            "font-bold drop-shadow-md",
                                            statusConfig.color,
                                            getResponsiveClass(15).textClass
                                        )}
                                    >
                                        STATUS
                                    </h4>
                                    <p
                                        className={cn(
                                            "text-slate-300 font-medium",
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        Current participation status
                                    </p>
                                </div>
                            </div>
                            <div className="relative z-10 text-right">
                                <div>
                                    <div
                                        className={cn(
                                            "font-bold drop-shadow-md",
                                            statusConfig.color,
                                            getResponsiveClass(15).textClass
                                        )}
                                    >
                                        {statusConfig.text}
                                    </div>
                                    <div
                                        className={cn(
                                            "text-slate-300 font-medium",
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        {isUnlimited
                                            ? participationCount > 0
                                                ? `${participationCount} Tickets`
                                                : "Unlimited"
                                            : `${participationCount}/${participationLimit}`}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        variants={itemVariants}
                        transition={{
                            duration: 0.6,
                            ease: "easeOut",
                            delay: 0.4,
                        }}
                        className="space-y-3"
                    >
                        <motion.button
                            whileHover={{
                                scale: canParticipate && !isPending ? 1.05 : 1,
                                boxShadow:
                                    canParticipate && !isPending
                                        ? "0 0 50px rgba(168, 85, 247, 0.6)"
                                        : "none",
                            }}
                            whileTap={{
                                scale: canParticipate && !isPending ? 0.95 : 1,
                            }}
                            disabled={!canParticipate || isPending}
                            onClick={handleParticipate}
                            className={cn(
                                "relative w-full font-bold rounded-3xl transition-all duration-500 overflow-hidden",
                                "flex items-center justify-center gap-3 border-2 shadow-2xl",
                                canParticipate && !isPending
                                    ? "bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white border-purple-400/40 hover:shadow-purple-500/50"
                                    : isUpcoming
                                    ? "bg-gradient-to-r from-slate-700 to-slate-800 text-slate-400 cursor-not-allowed border-slate-600/40"
                                    : "bg-slate-800 text-slate-500 cursor-not-allowed border-slate-600/40",
                                getResponsiveClass(60).paddingClass,
                                "px-2",
                                getResponsiveClass(20).textClass
                            )}
                        >
                            {canParticipate && !isPending && (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer gpu-animate" />
                                </>
                            )}

                            <div className="relative z-10 flex items-center gap-2 font-main">
                                {isPending ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{
                                                duration: 1,
                                                repeat: Infinity,
                                                ease: "linear",
                                            }}
                                        >
                                            <Loader2
                                                className={cn(
                                                    "w-6 h-6",
                                                    getResponsiveClass(30)
                                                        .frameClass
                                                )}
                                            />
                                        </motion.div>
                                        {timingData?.instantDraw
                                            ? "Drawing Prize..."
                                            : "Getting Ticket..."}
                                    </>
                                ) : canParticipate ? (
                                    <>
                                        {timingData?.instantDraw ? (
                                            <Zap
                                                className={cn(
                                                    "w-6 h-6",
                                                    getResponsiveClass(30)
                                                        .frameClass
                                                )}
                                            />
                                        ) : (
                                            <Gift
                                                className={cn(
                                                    "w-6 h-6",
                                                    getResponsiveClass(30)
                                                        .frameClass
                                                )}
                                            />
                                        )}
                                        {timingData?.instantDraw
                                            ? "GET TICKET & DRAW"
                                            : "GET TICKET"}
                                    </>
                                ) : isUpcoming ? (
                                    <>
                                        <Timer
                                            className={cn(
                                                "w-6 h-6",
                                                getResponsiveClass(30)
                                                    .frameClass
                                            )}
                                        />
                                        Upcoming
                                    </>
                                ) : hasReachedLimit ? (
                                    <>
                                        <Crown
                                            className={cn(
                                                "w-6 h-6",
                                                getResponsiveClass(30)
                                                    .frameClass
                                            )}
                                        />
                                        Max Tickets Owned
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2
                                            className={cn(
                                                "w-6 h-6",
                                                getResponsiveClass(30)
                                                    .frameClass
                                            )}
                                        />
                                        Ticket Sales Closed
                                    </>
                                )}
                            </div>
                        </motion.button>

                        {isError && error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative p-2 rounded-2xl bg-red-900/40 border-2 border-red-400/40 backdrop-blur-lg"
                            >
                                <p className="text-red-300 text-center font-medium">
                                    {error.message}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </motion.div>

            <RaffleOnchainParticipationLog
                isOpen={showParticipationLog}
                onClose={() => setShowParticipationLog(false)}
                contractAddress={contractAddress}
                raffleId={raffleId}
                raffleTitle={basicInfo?.title || "Raffle"}
            />
        </>
    );
});
