"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Clock, Trophy, Eye, EyeOff, XCircle, Copy } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useToast } from "@/app/hooks/useToast";
import { useOnchainRaffles } from "@/app/actions/raffles/onchain/hooks";

const safeBigIntToNumber = (value: any): number => {
    if (typeof value === "bigint") {
        return Number(value);
    }
    if (typeof value === "string") {
        return parseInt(value, 10);
    }
    if (typeof value === "number") {
        return value;
    }
    return 0;
};

const generateLotteryNumber = (txHash: string) => {
    const cleanHash = txHash.replace("0x", "");
    let sum = 0;
    for (let i = 0; i < cleanHash.length; i += 4) {
        const chunk = cleanHash.slice(i, i + 4);
        sum += parseInt(chunk, 16);
    }
    const lotteryNumber = ((sum % 900000) + 100000).toString();
    return lotteryNumber.replace(/(\d{3})(\d{3})/, "$1-$2");
};

interface ParticipationRecord {
    participantId: bigint;
    ticketNumber: string;
    participatedAt: bigint;
    hasLotteryResult: boolean;
    resultId: bigint;
    prizeIndex: bigint;
    claimed: boolean;
    drawnAt: bigint;
    claimedAt: bigint;
}

interface RaffleOnchainParticipationLogCardProps {
    record: ParticipationRecord;
    index: number;
    onReveal: (participantId: string) => Promise<void>;
    selectedRecord: string | null;
    contractAddress: string;
}

export default memo(function RaffleOnchainParticipationLogCard({
    record,
    index,
    onReveal,
    selectedRecord,
    contractAddress,
}: RaffleOnchainParticipationLogCardProps) {
    const toast = useToast();
    const isDrawn = record.hasLotteryResult;
    const isRevealed = record.hasLotteryResult;
    const hasWon =
        record.hasLotteryResult && safeBigIntToNumber(record.prizeIndex) > 0;
    const isRevealingThis =
        selectedRecord === safeBigIntToNumber(record.participantId).toString();

    const { lotteryResult } = useOnchainRaffles({
        getLotteryResultInput:
            isRevealed && hasWon
                ? {
                      contractAddress,
                      resultId: safeBigIntToNumber(record.resultId).toString(),
                  }
                : undefined,
    });

    const prizeData = lotteryResult?.data?.prize;

    const getStatusIcon = () => {
        if (!isDrawn)
            return (
                <Clock
                    className={cn(
                        "w-6 h-6 text-yellow-400",
                        getResponsiveClass(30).frameClass
                    )}
                />
            );
        if (!isRevealed)
            return (
                <EyeOff
                    className={cn(
                        "w-6 h-6 text-blue-400",
                        getResponsiveClass(30).frameClass
                    )}
                />
            );
        if (hasWon)
            return (
                <Trophy
                    className={cn(
                        "w-6 h-6 text-green-400",
                        getResponsiveClass(30).frameClass
                    )}
                />
            );
        return (
            <XCircle
                className={cn(
                    "w-6 h-6 text-red-400",
                    getResponsiveClass(30).frameClass
                )}
            />
        );
    };

    const getCardStyle = () => {
        if (!isDrawn)
            return "from-yellow-500/10 to-orange-500/10 border-yellow-400/30";
        if (!isRevealed)
            return "from-blue-500/10 to-cyan-500/10 border-blue-400/30";
        if (hasWon)
            return "from-green-500/10 to-emerald-500/10 border-green-400/30";
        return "from-gray-500/10 to-gray-600/10 border-gray-400/30";
    };

    const handleCopyTicketNumber = () => {
        navigator.clipboard.writeText(record.ticketNumber).catch((err) => {
            console.error(err);
        });
        toast.success("Copied to clipboard");
    };

    const handleReveal = () => {
        onReveal(safeBigIntToNumber(record.participantId).toString()).catch(
            (err) => {
                console.error(err);
            }
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: index * 0.02,
            }}
            className={cn(
                "bg-gradient-to-br border rounded-[12px] p-3",
                "hover:shadow-lg transition-all duration-300",
                getCardStyle()
            )}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                        <motion.div
                            animate={
                                !isRevealed && isDrawn
                                    ? {
                                          scale: [1, 1.1, 1],
                                      }
                                    : {}
                            }
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                            }}
                            className="relative"
                        >
                            {getStatusIcon()}
                            {!isRevealed && isDrawn && (
                                <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20" />
                            )}
                        </motion.div>
                    </div>

                    <div className="flex-1">
                        <div className="flex flex-col gap-0.5 mb-2">
                            <span
                                className={cn(
                                    "text-lg font-bold text-white",
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                Ticket #
                                {generateLotteryNumber(record.ticketNumber)}
                            </span>
                            <span
                                className={cn(
                                    "text-white/50 text-sm",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                {formatDate(
                                    new Date(
                                        safeBigIntToNumber(
                                            record.participatedAt
                                        ) * 1000
                                    )
                                )}
                            </span>
                            <span
                                className={cn(
                                    "truncate text-ellipsis overflow-hidden",
                                    "text-white/50 cursor-pointer flex flex-row gap-1",
                                    getResponsiveClass(5).textClass
                                )}
                            >
                                {record.ticketNumber.slice(0, 8) + "..."}
                                <Copy
                                    className={cn(
                                        "w-4 h-4",
                                        getResponsiveClass(5).frameClass
                                    )}
                                    onClick={handleCopyTicketNumber}
                                />
                            </span>
                        </div>
                    </div>

                    {isRevealed && hasWon ? (
                        <div className="flex items-center gap-1">
                            <div className="text-right font-main">
                                {prizeData ? (
                                    <div
                                        className={cn(
                                            "font-bold text-green-400 text-lg",
                                            getResponsiveClass(20).textClass
                                        )}
                                    >
                                        {prizeData.title}
                                    </div>
                                ) : (
                                    <div
                                        className={cn(
                                            "font-bold text-green-400 text-lg",
                                            getResponsiveClass(20).textClass
                                        )}
                                    >
                                        Prize #
                                        {safeBigIntToNumber(record.prizeIndex) +
                                            1}
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        "text-sm text-white/60",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {record.claimed ? "Claimed" : "Unclaimed"}
                                </div>
                            </div>
                        </div>
                    ) : (
                        isRevealed && (
                            <p
                                className={cn(
                                    "text-white/40 text-sm text-center",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                😔 No Prize
                            </p>
                        )
                    )}
                </div>

                {!isRevealed && isDrawn && (
                    <motion.button
                        whileHover={{
                            scale: 1.05,
                        }}
                        whileTap={{
                            scale: 0.95,
                        }}
                        disabled={isRevealingThis}
                        onClick={handleReveal}
                        className="ml-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all duration-300 flex items-center gap-2"
                    >
                        {isRevealingThis ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b border-white" />
                        ) : (
                            <Eye className="w-4 h-4" />
                        )}
                        {isRevealingThis ? "..." : "Reveal"}
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
});
