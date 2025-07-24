"use client";

import { memo, useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Eye } from "lucide-react";
import { useSession } from "next-auth/react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useOnchainRafflesV2 } from "@/app/actions/raffles/onchain/hooks-v2";
import { useToast } from "@/app/hooks/useToast";
import PartialLoading from "@/components/atoms/PartialLoading";
import RaffleOnchainParticipationLogCard from "./Raffle.Onchain.Participation.Log.Card";

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

interface RaffleOnchainParticipationLogProps {
    isOpen: boolean;
    onClose: () => void;
    contractAddress: string;
    raffleId: string;
    raffleTitle: string;
}

export default memo(function RaffleOnchainParticipationLog({
    isOpen,
    onClose,
    contractAddress,
    raffleId,
    raffleTitle,
}: RaffleOnchainParticipationLogProps) {
    const { data: session } = useSession();
    const toast = useToast();
    const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const {
        userParticipation: participationData,
        isUserParticipationLoading: isParticipationLoading,
        isUserParticipationError: participationError,
        refetchUserParticipation: refetchUserParticipationDetails,
    } = useOnchainRafflesV2({
        getUserParticipationInput: {
            contractAddress,
            raffleId,
            playerId: session?.player?.id || "",
        },
    });

    const { allParticipations, participationSummary, unrevealed } =
        useMemo(() => {
            if (!participationData?.success || !participationData?.data) {
                return {
                    allParticipations: [],
                    participationSummary: {
                        totalParticipations: 0,
                        revealedCount: 0,
                        unrevealedCount: 0,
                        totalWins: 0,
                        winners: [],
                    },
                    unrevealed: [],
                };
            }

            const data = participationData.data;
            const participations = data.participations || [];

            const unrevealedData = participations.filter(
                (p) => p.hasLotteryResult && !p.claimed
            );

            const summary = {
                totalParticipations: data.participationCount,
                revealedCount: data.revealedCount,
                unrevealedCount: data.unrevealedCount,
                totalWins: data.totalWins,
                winners: participations.filter(
                    (p) => p.hasLotteryResult && p.prizeIndex > 0
                ),
            };

            return {
                allParticipations: participations,
                participationSummary: summary,
                unrevealed: unrevealedData,
            };
        }, [participationData]);

    const handleRevealSingle = useCallback(
        async (participantId: string) => {
            if (!session?.user?.id) return;

            try {
                setSelectedRecord(participantId);
                toast.success("🎊 Result revealed!");
            } catch (error) {
                console.error("Reveal error:", error);
                toast.error("An error occurred while revealing result");
            } finally {
                setSelectedRecord(null);
            }
        },
        [session?.user?.id, toast]
    );

    const handleRevealAll = useCallback(async () => {
        if (!session?.user?.id || unrevealed.length === 0) return;

        try {
            toast.success(`🎉 Revealed ${unrevealed.length} results!`);
        } catch (error) {
            console.error("Reveal all error:", error);
            toast.error("An error occurred while revealing results");
        }
    }, [session?.user?.id, unrevealed.length, toast]);

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
                                    {raffleTitle} •{" "}
                                    {participationSummary.totalParticipations}{" "}
                                    entries
                                </p>
                            </div>
                        </div>
                    </motion.div>

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
                                onClick={handleRevealAll}
                                className={cn(
                                    "w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white font-bold rounded-[12px] transition-all duration-300 flex items-center justify-center gap-2",
                                    getResponsiveClass(25).textClass,
                                    getResponsiveClass(30).paddingClass,
                                    getResponsiveClass(15).marginYClass
                                )}
                            >
                                <Eye
                                    className={cn(
                                        "w-5 h-5",
                                        getResponsiveClass(25).frameClass
                                    )}
                                />
                                Reveal All {unrevealed.length} Results
                            </motion.button>
                        </motion.div>
                    )}

                    <div
                        ref={scrollContainerRef}
                        className={cn("flex-1 overflow-y-auto py-2 px-1")}
                    >
                        {isParticipationLoading && (
                            <div className="py-8">
                                <PartialLoading text="Loading participation records..." />
                            </div>
                        )}

                        {participationError && (
                            <div className="py-8 text-center">
                                <p className="text-red-400">
                                    Failed to load participation records
                                </p>
                                <button
                                    className="mt-2 text-sm text-white/60 underline underline-offset-2"
                                    onClick={() =>
                                        refetchUserParticipationDetails()
                                    }
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {!isParticipationLoading &&
                            !participationError &&
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

                        {allParticipations.length > 0 && (
                            <div className="space-y-3 w-full max-w-[800px] mx-auto">
                                {allParticipations.map(
                                    (record: any, index: number) => (
                                        <RaffleOnchainParticipationLogCard
                                            key={safeBigIntToNumber(
                                                record.participantId
                                            )}
                                            record={record}
                                            index={index}
                                            onReveal={handleRevealSingle}
                                            selectedRecord={selectedRecord}
                                            contractAddress={contractAddress}
                                        />
                                    )
                                )}

                                {allParticipations.length > 0 && (
                                    <div className="py-4 flex justify-center">
                                        <span className="text-white/40 text-sm">
                                            🎉 All records loaded!
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
});
