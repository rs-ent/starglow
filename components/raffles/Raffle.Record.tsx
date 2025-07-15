/// components/raffles/Raffle.Record.tsx

"use client";

import { memo, useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Trophy, Eye, EyeOff, XCircle } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { formatDate } from "@/lib/utils/format";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import { useRaffles } from "@/app/actions/raffles/hooks";
import { useToast } from "@/app/hooks/useToast";
import PartialLoading from "@/components/atoms/PartialLoading";

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
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const {
        playerParticipationsInfiniteData,
        isPlayerParticipationsInfiniteLoading,
        playerParticipationsInfiniteError,
        playerParticipationsInfiniteFetchNextPage,
        playerParticipationsInfiniteHasNextPage,
        playerParticipationsInfiniteIsFetchingNextPage,
        revealAllRaffleResultsAsync,
        revealRaffleResultAsync,
        isRevealAllRaffleResultsPending,
    } = useRaffles({
        getPlayerParticipationsInfiniteInput: {
            raffleId: raffle.id,
            playerId: session?.player?.id || "",
            includeUnrevealed: true,
        },
    });

    const {
        allParticipations,
        participationSummary,
        unrevealed,
        hasNextPage,
        isFetchingNextPage,
        isInfiniteLoading,
        infiniteError,
    } = useMemo(() => {
        const infiniteData = playerParticipationsInfiniteData;
        const isLoading = isPlayerParticipationsInfiniteLoading;
        const isFetching = playerParticipationsInfiniteIsFetchingNextPage;
        const hasNext = playerParticipationsInfiniteHasNextPage;
        const error = playerParticipationsInfiniteError;

        const allData =
            infiniteData?.pages?.flatMap((page: any) => {
                return page.success && page.data?.participations
                    ? page.data.participations
                    : [];
            }) || [];

        const sortedData = allData.sort(
            (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
        );

        const summary =
            infiniteData?.pages?.[0]?.success && infiniteData.pages[0].data
                ? {
                      totalParticipations:
                          infiniteData.pages[0].data.totalParticipations || 0,
                      revealedCount:
                          infiniteData.pages[0].data.revealedCount || 0,
                      unrevealedCount:
                          infiniteData.pages[0].data.unrevealedCount || 0,
                      totalWins: infiniteData.pages[0].data.totalWins || 0,
                      winners: infiniteData.pages[0].data.winners || [],
                  }
                : {
                      totalParticipations: 0,
                      revealedCount: 0,
                      unrevealedCount: 0,
                      totalWins: 0,
                      winners: [],
                  };

        const unrevealedData = sortedData.filter(
            (p: any) => !p.isRevealed && p.drawnAt
        );

        return {
            allParticipations: sortedData,
            participationSummary: summary,
            unrevealed: unrevealedData,
            hasNextPage: hasNext,
            isFetchingNextPage: isFetching,
            isInfiniteLoading: isLoading,
            infiniteError: error,
        };
    }, [
        playerParticipationsInfiniteData,
        isPlayerParticipationsInfiniteLoading,
        playerParticipationsInfiniteIsFetchingNextPage,
        playerParticipationsInfiniteHasNextPage,
        playerParticipationsInfiniteError,
    ]);

    const handleFetchNextPage = useCallback(async () => {
        if (!session?.player?.id || !raffle.id) return;
        if (!hasNextPage) return;
        if (isFetchingNextPage || isInfiniteLoading) return;

        try {
            await playerParticipationsInfiniteFetchNextPage();
        } catch (error) {
            console.error("Failed to fetch next page:", error);
        }
    }, [
        session?.player?.id,
        raffle.id,
        hasNextPage,
        isFetchingNextPage,
        isInfiniteLoading,
        playerParticipationsInfiniteFetchNextPage,
    ]);

    const handleRevealSingle = useCallback(
        async (participantId: string) => {
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
        },
        [session?.player?.id, raffle.id, revealRaffleResultAsync, toast]
    );

    const handleRevealAll = useCallback(async () => {
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
    }, [
        session?.player?.id,
        unrevealed.length,
        raffle.id,
        revealAllRaffleResultsAsync,
        toast,
    ]);

    const getStatusIcon = useCallback(
        (isDrawn: boolean, isRevealed: boolean, hasWon: boolean) => {
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
        },
        []
    );

    const getCardStyle = useCallback(
        (isDrawn: boolean, isRevealed: boolean, hasWon: boolean) => {
            if (!isDrawn)
                return "from-yellow-500/10 to-orange-500/10 border-yellow-400/30";
            if (!isRevealed)
                return "from-blue-500/10 to-cyan-500/10 border-blue-400/30";
            if (hasWon)
                return "from-green-500/10 to-emerald-500/10 border-green-400/30";
            return "from-gray-500/10 to-gray-600/10 border-gray-400/30";
        },
        []
    );

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
                        "p-[10px] sm:p-[20px] md:p-[30px] lg:p-[40px]",
                        "shadow-2xl",
                        "bg-gradient-to-br from-[#040449] to-[#5d0c7b] rounded-xl",
                        "border border-white/10 relative"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors absolute top-1 right-1"
                    >
                        <X
                            className={cn(
                                "w-6 h-6 text-white/60",
                                getResponsiveClass(15).frameClass
                            )}
                        />
                    </motion.button>

                    {/* Header */}
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className={cn(
                            "flex items-center justify-between p-6 border-b border-white/10",
                            getResponsiveClass(10).paddingClass
                        )}
                    >
                        <div className="flex items-center gap-2 mb-1">
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
                                <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full">
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
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    My Prize Records
                                </h2>
                                <p
                                    className={cn(
                                        "text-white/60",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {raffle.title} •{" "}
                                    {participationSummary.totalParticipations}{" "}
                                    entries
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Section */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className={cn(
                            "grid grid-cols-4 md:grid-cols-4 gap-2 border-b border-white/10",
                            getResponsiveClass(5).paddingClass,
                            "py-2"
                        )}
                    >
                        <div className="text-center">
                            <div
                                className={cn(
                                    "text-3xl font-bold text-blue-400",
                                    getResponsiveClass(25).textClass
                                )}
                            >
                                {participationSummary.totalParticipations}
                            </div>
                            <div
                                className={cn(
                                    "text-sm text-white/60",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                Total Entries
                            </div>
                        </div>
                        <div className="text-center">
                            <div
                                className={cn(
                                    "text-3xl font-bold text-green-400",
                                    getResponsiveClass(25).textClass
                                )}
                            >
                                {participationSummary.totalWins}
                            </div>
                            <div
                                className={cn(
                                    "text-sm text-white/60",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                Wins
                            </div>
                        </div>
                        <div className="text-center">
                            <div
                                className={cn(
                                    "text-3xl font-bold text-yellow-400",
                                    getResponsiveClass(25).textClass
                                )}
                            >
                                {participationSummary.unrevealedCount}
                            </div>
                            <div
                                className={cn(
                                    "text-sm text-white/60",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                Unrevealed
                            </div>
                        </div>
                        <div className="text-center">
                            <div
                                className={cn(
                                    "text-3xl font-bold text-purple-400",
                                    getResponsiveClass(25).textClass
                                )}
                            >
                                {participationSummary.totalParticipations > 0
                                    ? Math.round(
                                          (participationSummary.totalWins /
                                              participationSummary.totalParticipations) *
                                              100
                                      )
                                    : 0}
                                %
                            </div>
                            <div
                                className={cn(
                                    "text-sm text-white/60",
                                    getResponsiveClass(10).textClass
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
                                className={cn(
                                    "w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white font-bold rounded-[12px] transition-all duration-300 flex items-center justify-center gap-2",
                                    getResponsiveClass(25).textClass,
                                    getResponsiveClass(30).paddingClass,
                                    getResponsiveClass(15).marginYClass
                                )}
                            >
                                {isRevealAllRaffleResultsPending ? (
                                    <>
                                        <div
                                            className={cn(
                                                "animate-spin rounded-full h-5 w-5 border-b-2 border-white",
                                                getResponsiveClass(25)
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
                                                getResponsiveClass(25)
                                                    .frameClass
                                            )}
                                        />
                                        Reveal All {unrevealed.length} Results
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Records List */}
                    <div
                        ref={scrollContainerRef}
                        className={cn("flex-1 overflow-y-auto py-2 px-1")}
                    >
                        {/* 초기 로딩 상태 */}
                        {isInfiniteLoading &&
                            allParticipations.length === 0 && (
                                <div className="py-8">
                                    <PartialLoading text="Loading participation records..." />
                                </div>
                            )}

                        {/* 에러 상태 */}
                        {infiniteError && (
                            <div className="py-8 text-center">
                                <p className="text-red-400">
                                    Failed to load participation records
                                </p>
                                <button
                                    className="mt-2 text-sm text-white/60 underline underline-offset-2"
                                    onClick={() => window.location.reload()}
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {/* 데이터 없음 상태 */}
                        {!isInfiniteLoading &&
                            !infiniteError &&
                            allParticipations.length === 0 && (
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
                            )}

                        {/* 참여 기록 목록 */}
                        {allParticipations.length > 0 && (
                            <div className="space-y-3 w-full max-w-[800px] mx-auto">
                                {allParticipations.map(
                                    (record: any, index: number) => {
                                        const isDrawn = !!record.drawnAt;
                                        const isRevealed = record.isRevealed;
                                        const hasWon =
                                            record.prize &&
                                            record.prize.prizeType !== "EMPTY";
                                        const isRevealing =
                                            selectedRecord === record.id;

                                        return (
                                            <motion.div
                                                key={record.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    delay: index * 0.02,
                                                }}
                                                className={cn(
                                                    "bg-gradient-to-br border rounded-[12px] p-3",
                                                    "hover:shadow-lg transition-all duration-300",
                                                    getCardStyle(
                                                        isDrawn,
                                                        isRevealed,
                                                        hasWon
                                                    )
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1">
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
                                                                {getStatusIcon(
                                                                    isDrawn,
                                                                    isRevealed,
                                                                    hasWon
                                                                )}
                                                                {!isRevealed &&
                                                                    isDrawn && (
                                                                        <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20" />
                                                                    )}
                                                            </motion.div>
                                                        </div>

                                                        {/* Main Info */}
                                                        <div className="flex-1">
                                                            <div className="flex flex-col gap-0.5 mb-2">
                                                                <span
                                                                    className={cn(
                                                                        "text-lg font-bold text-white",
                                                                        getResponsiveClass(
                                                                            20
                                                                        )
                                                                            .textClass
                                                                    )}
                                                                >
                                                                    Entry #
                                                                    {participationSummary.totalParticipations -
                                                                        index}
                                                                </span>
                                                                <span
                                                                    className={cn(
                                                                        "text-white/50 text-sm",
                                                                        getResponsiveClass(
                                                                            10
                                                                        )
                                                                            .textClass
                                                                    )}
                                                                >
                                                                    {formatDate(
                                                                        record.createdAt
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Prize Preview */}
                                                        {isRevealed &&
                                                        record.prize &&
                                                        hasWon ? (
                                                            <div className="flex items-center gap-1">
                                                                {record.prize
                                                                    .prizeType ===
                                                                    "NFT" &&
                                                                    record.prize
                                                                        .spg
                                                                        ?.imageUrl && (
                                                                        <div
                                                                            className={cn(
                                                                                "rounded-[8px] overflow-hidden p-1",
                                                                                getResponsiveClass(
                                                                                    40
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
                                                                        <div className="overflow-hidden bg-white/10 flex items-center justify-center rounded-[8px] p-1">
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
                                                                                        35
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
                                                                                20
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
                                                        ) : (
                                                            isRevealed && (
                                                                <p
                                                                    className={cn(
                                                                        "text-white/40 text-sm text-center",
                                                                        getResponsiveClass(
                                                                            15
                                                                        )
                                                                            .textClass
                                                                    )}
                                                                >
                                                                    😔 No Prize
                                                                </p>
                                                            )
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
                                                            disabled={
                                                                isRevealing
                                                            }
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
                                    }
                                )}

                                {/* Load More 버튼 영역 */}
                                <div className="py-4 flex justify-center">
                                    {hasNextPage ? (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            disabled={isFetchingNextPage}
                                            onClick={handleFetchNextPage}
                                            className={cn(
                                                "px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all duration-300 flex items-center gap-2",
                                                getResponsiveClass(20)
                                                    .textClass,
                                                getResponsiveClass(25)
                                                    .paddingClass
                                            )}
                                        >
                                            {isFetchingNextPage ? (
                                                <>
                                                    <div className="animate-spin rounded-full border-b-2 border-white w-4 h-4"></div>
                                                    Loading...
                                                </>
                                            ) : (
                                                "Load More Records"
                                            )}
                                        </motion.button>
                                    ) : allParticipations.length > 0 ? (
                                        <span className="text-white/40 text-sm">
                                            🎉 All records loaded!
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
});
