/// components/raffles/Raffle.Record.tsx

"use client";

import { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Trophy, Eye, EyeOff, XCircle } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { formatDate } from "@/lib/utils/format";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import { useRaffles } from "@/app/actions/raffles/hooks";
import { useToast } from "@/app/hooks/useToast";

import type { RaffleWithDetails } from "@/app/actions/raffles/actions";

interface RaffleRecordProps {
    isOpen: boolean;
    onClose: () => void;
    raffle: RaffleWithDetails;
}

export default memo(function RaffleRecord({
    isOpen,
    onClose,
    raffle,
}: RaffleRecordProps) {
    const { data: session } = useSession();
    const toast = useToast();
    const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

    const {
        playerParticipationsData,
        revealAllRaffleResultsAsync,
        revealRaffleResultAsync,
        isRevealAllRaffleResultsPending,
    } = useRaffles({
        getPlayerParticipationsInput: {
            raffleId: raffle.id,
            playerId: session?.player?.id || "",
            includeUnrevealed: true,
        },
    });

    const participationSummary = useMemo(() => {
        if (!playerParticipationsData?.success) return null;
        return playerParticipationsData.data;
    }, [playerParticipationsData]);

    const participations = useMemo(() => {
        if (!participationSummary?.participations) return [];
        return participationSummary.participations.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
        );
    }, [participationSummary]);

    const unrevealed = participations.filter((p) => !p.isRevealed && p.drawnAt);
    const winningRecords = participations.filter(
        (p) => p.isRevealed && p.prize && p.prize.prizeType !== "EMPTY"
    );

    const handleRevealSingle = async (participantId: string) => {
        if (!session?.player?.id) return;

        try {
            setSelectedRecord(participantId);
            const result = await revealRaffleResultAsync({
                raffleId: raffle.id,
                playerId: session.player.id,
                participantId,
            });

            if (result.success) {
                toast.success("🎊 Result revealed!");
            } else {
                toast.error(result.error || "Failed to reveal result");
            }
        } catch (error) {
            console.error("Reveal error:", error);
            toast.error("An error occurred while revealing result");
        } finally {
            setSelectedRecord(null);
        }
    };

    const handleRevealAll = async () => {
        if (!session?.player?.id || unrevealed.length === 0) return;

        try {
            const result = await revealAllRaffleResultsAsync({
                raffleId: raffle.id,
                playerId: session.player.id,
            });

            if (result.success) {
                toast.success(
                    `🎉 Revealed ${result.data?.length || 0} results!`
                );
            } else {
                toast.error(result.error || "Failed to reveal results");
            }
        } catch (error) {
            console.error("Reveal all error:", error);
            toast.error("An error occurred while revealing results");
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center"
                onClick={onClose}
            >
                {/* Full Screen Modal */}
                <div
                    className={cn(
                        "h-[80vh] w-[95vw] overflow-hidden flex flex-col max-w-[1200px] mx-auto max-h-[800px]",
                        "p-[50px]",
                        "shadow-2xl",
                        "bg-gradient-to-br from-[#040449] to-[#5d0c7b] rounded-xl",
                        "border border-white/10"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className={cn(
                            "flex items-center justify-between p-6 border-b border-white/10",
                            getResponsiveClass(10).paddingClass
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                    className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-20"
                                />
                                <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full">
                                    <Trophy
                                        className={cn(
                                            "w-6 h-6 text-white",
                                            getResponsiveClass(30).frameClass
                                        )}
                                    />
                                </div>
                            </div>
                            <div>
                                <h2
                                    className={cn(
                                        getResponsiveClass(30).textClass
                                    )}
                                >
                                    My Prize Records
                                </h2>
                                <p
                                    className={cn(
                                        "text-white/60",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    {raffle.title} • {participations.length}{" "}
                                    entries
                                </p>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <X
                                className={cn(
                                    "w-6 h-6 text-white/60",
                                    getResponsiveClass(20).frameClass
                                )}
                            />
                        </motion.button>
                    </motion.div>

                    {/* Stats Section */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className={cn(
                            "grid grid-cols-2 md:grid-cols-4 gap-6 p-6 border-b border-white/10",
                            getResponsiveClass(30).paddingClass
                        )}
                    >
                        <div className="text-center">
                            <div
                                className={cn(
                                    "text-3xl font-bold text-blue-400 mb-1",
                                    getResponsiveClass(30).textClass
                                )}
                            >
                                {participations.length}
                            </div>
                            <div
                                className={cn(
                                    "text-sm text-white/60",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                Total Entries
                            </div>
                        </div>
                        <div className="text-center">
                            <div
                                className={cn(
                                    "text-3xl font-bold text-green-400 mb-1",
                                    getResponsiveClass(30).textClass
                                )}
                            >
                                {winningRecords.length}
                            </div>
                            <div
                                className={cn(
                                    "text-sm text-white/60",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                Wins
                            </div>
                        </div>
                        <div className="text-center">
                            <div
                                className={cn(
                                    "text-3xl font-bold text-yellow-400 mb-1",
                                    getResponsiveClass(30).textClass
                                )}
                            >
                                {unrevealed.length}
                            </div>
                            <div
                                className={cn(
                                    "text-sm text-white/60",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                Unrevealed
                            </div>
                        </div>
                        <div className="text-center">
                            <div
                                className={cn(
                                    "text-3xl font-bold text-purple-400 mb-1",
                                    getResponsiveClass(30).textClass
                                )}
                            >
                                {participations.length > 0
                                    ? Math.round(
                                          (winningRecords.length /
                                              participations.length) *
                                              100
                                      )
                                    : 0}
                                %
                            </div>
                            <div
                                className={cn(
                                    "text-sm text-white/60",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                Win Rate
                            </div>
                        </div>
                    </motion.div>

                    {/* Action Bar */}
                    {unrevealed.length > 0 && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className={cn(
                                "p-6 border-b border-white/10",
                                getResponsiveClass(10).paddingClass
                            )}
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={isRevealAllRaffleResultsPending}
                                onClick={handleRevealAll}
                                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white font-bold rounded-xl py-4 px-6 transition-all duration-300 flex items-center justify-center gap-3"
                            >
                                {isRevealAllRaffleResultsPending ? (
                                    <>
                                        <div
                                            className={cn(
                                                "animate-spin rounded-full h-5 w-5 border-b-2 border-white",
                                                getResponsiveClass(20)
                                                    .frameClass
                                            )}
                                        />
                                        Revealing All...
                                    </>
                                ) : (
                                    <>
                                        <Eye
                                            className={cn(
                                                "w-5 h-5",
                                                getResponsiveClass(20)
                                                    .frameClass
                                            )}
                                        />
                                        🎊 Reveal All {unrevealed.length}{" "}
                                        Results
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Records List */}
                    <div
                        className={cn(
                            "flex-1 overflow-y-auto p-6",
                            getResponsiveClass(10).paddingClass
                        )}
                    >
                        {participations.length === 0 ? (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center py-20"
                            >
                                <h3
                                    className={cn(
                                        "text-2xl font-bold text-white mb-4",
                                        getResponsiveClass(30).textClass
                                    )}
                                >
                                    No Records Yet
                                </h3>
                                <p
                                    className={cn(
                                        "text-white/60 text-lg",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {`You haven't participated in this raffle yet.`}
                                </p>
                            </motion.div>
                        ) : (
                            <div className="space-y-4 max-w-4xl mx-auto">
                                {participations.map((record, index) => {
                                    const isDrawn = !!record.drawnAt;
                                    const isRevealed = record.isRevealed;
                                    const hasWon =
                                        record.prize &&
                                        record.prize.prizeType !== "EMPTY";
                                    const isRevealing =
                                        selectedRecord === record.id;

                                    const getStatusIcon = () => {
                                        if (!isDrawn)
                                            return (
                                                <Clock className="w-6 h-6 text-yellow-400" />
                                            );
                                        if (!isRevealed)
                                            return (
                                                <EyeOff className="w-6 h-6 text-blue-400" />
                                            );
                                        if (hasWon)
                                            return (
                                                <Trophy className="w-6 h-6 text-green-400" />
                                            );
                                        return (
                                            <XCircle className="w-6 h-6 text-red-400" />
                                        );
                                    };

                                    const getStatusText = () => {
                                        if (!isDrawn) return "⏳ Pending Draw";
                                        if (!isRevealed)
                                            return "🎁 Ready to Reveal";
                                        if (hasWon) return "🎉 Won Prize!";
                                        return "😔 No Prize";
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

                                    return (
                                        <motion.div
                                            key={record.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={cn(
                                                "bg-gradient-to-br border rounded-2xl p-6",
                                                "hover:shadow-lg transition-all duration-300",
                                                getCardStyle()
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 flex-1">
                                                    {/* Status Icon */}
                                                    <div className="flex-shrink-0">
                                                        <motion.div
                                                            animate={
                                                                !isRevealed &&
                                                                isDrawn
                                                                    ? {
                                                                          scale: [
                                                                              1,
                                                                              1.1,
                                                                              1,
                                                                          ],
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
                                                            {!isRevealed &&
                                                                isDrawn && (
                                                                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20" />
                                                                )}
                                                        </motion.div>
                                                    </div>

                                                    {/* Main Info */}
                                                    <div className="flex-1">
                                                        <div className="flex flex-col gap-1 mb-2">
                                                            <span
                                                                className={cn(
                                                                    "text-lg font-bold text-white",
                                                                    getResponsiveClass(
                                                                        20
                                                                    ).textClass
                                                                )}
                                                            >
                                                                Entry #
                                                                {participations.length -
                                                                    index}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    "text-white/50 text-sm",
                                                                    getResponsiveClass(
                                                                        10
                                                                    ).textClass
                                                                )}
                                                            >
                                                                {formatDate(
                                                                    record.createdAt
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className={cn(
                                                                "text-white/80",
                                                                getResponsiveClass(
                                                                    15
                                                                ).textClass
                                                            )}
                                                        >
                                                            {getStatusText()}
                                                        </div>
                                                    </div>

                                                    {/* Prize Preview */}
                                                    {isRevealed &&
                                                        record.prize &&
                                                        hasWon && (
                                                            <div className="flex items-center gap-3">
                                                                {record.prize
                                                                    .prizeType ===
                                                                    "NFT" &&
                                                                    record.prize
                                                                        .spg
                                                                        ?.imageUrl && (
                                                                        <div
                                                                            className={cn(
                                                                                "w-12 h-12 rounded-[10px] overflow-hidden",
                                                                                getResponsiveClass(
                                                                                    60
                                                                                )
                                                                                    .frameClass
                                                                            )}
                                                                        >
                                                                            <Image
                                                                                src={
                                                                                    record
                                                                                        .prize
                                                                                        .spg
                                                                                        .imageUrl
                                                                                }
                                                                                alt={
                                                                                    record
                                                                                        .prize
                                                                                        .title
                                                                                }
                                                                                width={
                                                                                    48
                                                                                }
                                                                                height={
                                                                                    48
                                                                                }
                                                                                className="object-cover"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                {record.prize
                                                                    .prizeType ===
                                                                    "ASSET" &&
                                                                    record.prize
                                                                        .asset
                                                                        ?.iconUrl && (
                                                                        <div
                                                                            className={cn(
                                                                                "w-12 h-12 overflow-hidden bg-white/10 flex items-center justify-center rounded-[10px]",
                                                                                getResponsiveClass(
                                                                                    60
                                                                                )
                                                                                    .frameClass
                                                                            )}
                                                                        >
                                                                            <Image
                                                                                src={
                                                                                    record
                                                                                        .prize
                                                                                        .asset
                                                                                        .iconUrl
                                                                                }
                                                                                alt={
                                                                                    record
                                                                                        .prize
                                                                                        .asset
                                                                                        .symbol
                                                                                }
                                                                                width={
                                                                                    24
                                                                                }
                                                                                height={
                                                                                    24
                                                                                }
                                                                                className={cn(
                                                                                    "object-contain",
                                                                                    getResponsiveClass(
                                                                                        40
                                                                                    )
                                                                                        .frameClass
                                                                                )}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                <div className="text-right">
                                                                    <div
                                                                        className={cn(
                                                                            "font-bold text-green-400 text-lg",
                                                                            getResponsiveClass(
                                                                                30
                                                                            )
                                                                                .textClass
                                                                        )}
                                                                    >
                                                                        {
                                                                            record
                                                                                .prize
                                                                                .title
                                                                        }
                                                                    </div>
                                                                    <div
                                                                        className={cn(
                                                                            "text-sm text-white/60",
                                                                            getResponsiveClass(
                                                                                10
                                                                            )
                                                                                .textClass
                                                                        )}
                                                                    >
                                                                        {record
                                                                            .prize
                                                                            .prizeType ===
                                                                        "ASSET"
                                                                            ? `${record.prize.assetAmount} ${record.prize.asset?.symbol}`
                                                                            : `${record.prize.nftQuantity} NFT(s)`}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>

                                                {/* Action Button */}
                                                {!isRevealed && isDrawn && (
                                                    <motion.button
                                                        whileHover={{
                                                            scale: 1.05,
                                                        }}
                                                        whileTap={{
                                                            scale: 0.95,
                                                        }}
                                                        disabled={isRevealing}
                                                        onClick={() =>
                                                            handleRevealSingle(
                                                                record.id
                                                            )
                                                        }
                                                        className="ml-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all duration-300 flex items-center gap-2"
                                                    >
                                                        {isRevealing ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b border-white" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                        {isRevealing
                                                            ? "..."
                                                            : "Reveal"}
                                                    </motion.button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
});
