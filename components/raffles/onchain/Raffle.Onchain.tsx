/// components/raffles/web3/Raffle.Onchain.tsx

"use client";

import { memo, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useOnchainRaffles } from "@/app/actions/raffles/onchain/hooks";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import RaffleOnchainHero from "./Raffle.Onchain.Hero";
import RaffleOnchainTiming from "./Raffle.Onchain.Timing";
import RaffleOnchainSettings from "./Raffle.Onchain.Settings";
import RaffleOnchainStatus from "./Raffle.Onchain.Status";
import RaffleOnchainPrizes from "./Raffle.Onchain.Prizes";
import RaffleOnchainParticipation from "./Raffle.Onchain.Participation";
import RaffleOnchainPrizesGrandPrize from "./Raffle.Onchain.Prizes.GrandPrize";
import RaffleOnchainParticipationTicket from "./Raffle.Onchain.Participation.Ticket";
import RaffleScratchCard from "../Raffle.Reveal.Scratch";
import EnhancedPortal from "@/components/atoms/Portal.Enhanced";

interface TicketData {
    raffleTitle: string;
    participantId: number;
    ticketNumber?: string;
    lotteryTicketNumber?: string;
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
    };
    isInstantDraw?: boolean;
    explorerUrl: string;
    walletAddress: string;
}

type ModalState = "none" | "ticket" | "scratch";

interface RaffleOnchainProps {
    contractAddress: string;
    raffleId: string;
}

export default memo(function RaffleOnchain({
    contractAddress,
    raffleId,
}: RaffleOnchainProps) {
    const [modalState, setModalState] = useState<ModalState>("none");
    const [ticketData, setTicketData] = useState<TicketData | null>(null);

    const scratchCardSize = useMemo(() => {
        if (typeof window === "undefined") {
            return { width: 350, height: 250 };
        }

        const screenWidth = window.innerWidth;
        if (screenWidth >= 1280) {
            return { width: 450, height: 320 };
        } else if (screenWidth >= 1024) {
            return { width: 400, height: 280 };
        } else if (screenWidth >= 768) {
            return { width: 350, height: 250 };
        } else {
            return { width: 300, height: 200 };
        }
    }, []);

    const handleParticipationSuccess = useCallback((ticket: TicketData) => {
        setTicketData(ticket);
        setModalState("ticket");
    }, []);

    const handleInstantDraw = useCallback(() => {
        setModalState("scratch");
    }, []);

    const handleCloseModal = useCallback(() => {
        setModalState("none");
        setTimeout(() => {
            setTicketData(null);
        }, 200);
    }, []);

    const scratchPrizeData = useMemo(() => {
        if (!ticketData?.prizeWon) return null;

        const prizeType =
            ticketData.prizeWon.prizeType === 0
                ? ("EMPTY" as const)
                : ticketData.prizeWon.prizeType === 1
                ? ("ASSET" as const)
                : ("NFT" as const);

        return {
            id: `prize-${ticketData.prizeWon.title}-${Date.now()}`,
            title: ticketData.prizeWon.title,
            prizeType,
            order: ticketData.prizeWon.prizeType * 10,
            quantity: 1,
            spg: ticketData.prizeWon.imageUrl
                ? {
                      imageUrl: ticketData.prizeWon.imageUrl,
                      metadata: {
                          image: ticketData.prizeWon.imageUrl,
                      },
                  }
                : undefined,
            asset:
                ticketData.prizeWon.prizeType === 1
                    ? {
                          iconUrl: ticketData.prizeWon.imageUrl,
                          symbol: "REWARD",
                      }
                    : undefined,
        };
    }, [ticketData?.prizeWon]);

    const handleScratchReveal = useCallback(() => {
        // 스크래치 완료 후 모달은 유지됨
    }, []);

    const {
        raffleFromContract: staticData,
        isRaffleFromContractLoading: isStaticLoading,
        isRaffleFromContractError: isStaticError,
    } = useOnchainRaffles({
        getRaffleFromContractInput: {
            contractAddress,
            raffleId,
            dataKeys: ["basicInfo", "timing", "settings", "fee", "prizes"],
        },
    });

    const {
        raffleFromContract: dynamicData,
        isRaffleFromContractLoading: isDynamicLoading,
        raffleParticipants,
    } = useOnchainRaffles({
        getRaffleFromContractInput: {
            contractAddress,
            raffleId,
            dataKeys: ["status"],
        },
        getRaffleParticipantsInput: {
            contractAddress,
            raffleId,
        },
    });

    const raffleData = useMemo(
        () => (staticData?.success ? staticData.data : null),
        [staticData?.success, staticData?.data]
    );
    const statusData = useMemo(
        () => (dynamicData?.success ? dynamicData.data?.status : null),
        [dynamicData?.success, dynamicData?.data?.status]
    );

    const transformedStatusData = useMemo(
        () =>
            statusData
                ? {
                      active: statusData.isActive,
                      isDrawn: statusData.isDrawn,
                      drawnParticipantCount: Number(
                          statusData.drawnParticipantCount
                      ),
                      totalQuantity: Number(statusData.totalQuantity),
                      totalParticipants: raffleParticipants?.data?.totalCount,
                  }
                : undefined,
        [statusData, raffleParticipants?.data?.totalCount]
    );

    if (isStaticLoading) {
        return <OnchainRaffleSkeleton />;
    }

    if (isStaticError || !staticData?.success) {
        return <OnchainRaffleError />;
    }

    return (
        <div className="relative w-full min-h-screen overflow-hidden mb-[100px] md:mb-[50px]">
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/20 via-transparent to-purple-950/20" />
            </div>

            <div className="relative z-10 mt-[50px] mb-[20px] md:mb-[40px] md:mt-[0px]">
                <div
                    className={cn(
                        "container mx-auto",
                        getResponsiveClass(20).paddingClass
                    )}
                >
                    {raffleData && (
                        <>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <RaffleOnchainHero
                                    raffleData={raffleData}
                                    contractAddress={contractAddress}
                                    raffleId={raffleId}
                                />
                            </motion.div>
                        </>
                    )}

                    <div
                        className={cn(
                            "grid grid-cols-1 lg:grid-cols-5",
                            getResponsiveClass(30).gapClass
                        )}
                    >
                        <div className="lg:col-span-3 space-y-8">
                            {raffleData?.prizes &&
                                raffleData?.prizes.length > 0 && (
                                    <RaffleOnchainPrizesGrandPrize
                                        data={raffleData?.prizes}
                                    />
                                )}

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.3 }}
                                className="relative hidden md:block"
                            >
                                <RaffleOnchainPrizes
                                    data={raffleData?.prizes}
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15, duration: 0.3 }}
                                className="relative group hidden md:block"
                            >
                                <RaffleOnchainSettings
                                    data={raffleData?.settings}
                                />
                            </motion.div>
                        </div>

                        <div className="lg:col-span-2 space-y-8">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1, duration: 0.3 }}
                                className="relative group"
                            >
                                <RaffleOnchainParticipation
                                    contractAddress={contractAddress}
                                    raffleId={raffleId}
                                    basicInfo={raffleData?.basicInfo}
                                    timingData={raffleData?.timing}
                                    settingsData={raffleData?.settings}
                                    feeData={raffleData?.fee}
                                    statusData={transformedStatusData}
                                    isStatusLoading={isDynamicLoading}
                                    onParticipationSuccess={
                                        handleParticipationSuccess
                                    }
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05, duration: 0.3 }}
                                className="relative group"
                            >
                                <RaffleOnchainTiming
                                    data={raffleData?.timing}
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.3 }}
                                className="relative block md:hidden"
                            >
                                <RaffleOnchainPrizes
                                    data={raffleData?.prizes}
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15, duration: 0.3 }}
                                className="relative group"
                            >
                                <RaffleOnchainStatus
                                    data={transformedStatusData}
                                    isLoading={isDynamicLoading}
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15, duration: 0.3 }}
                                className="relative group block md:hidden"
                            >
                                <RaffleOnchainSettings
                                    data={raffleData?.settings}
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {modalState === "ticket" && ticketData && (
                <EnhancedPortal layer="modal">
                    <RaffleOnchainParticipationTicket
                        isVisible={modalState === "ticket"}
                        onClose={handleCloseModal}
                        ticketData={ticketData}
                        onInstantDraw={handleInstantDraw}
                    />
                </EnhancedPortal>
            )}

            {modalState === "scratch" && ticketData?.prizeWon && (
                <EnhancedPortal layer="modal">
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                        onClick={handleCloseModal}
                    >
                        <div
                            className="relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <RaffleScratchCard
                                prize={scratchPrizeData}
                                onReveal={handleScratchReveal}
                                cardSize={scratchCardSize}
                                className="mx-auto"
                            />

                            <button
                                onClick={handleCloseModal}
                                className={cn(
                                    "absolute -top-12 right-0 text-white/60 hover:text-white",
                                    "w-10 h-10 flex items-center justify-center rounded-full",
                                    "bg-black/20 backdrop-blur-sm transition-all",
                                    "text-xl font-light",
                                    "touch-manipulation select-none"
                                )}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </EnhancedPortal>
            )}
        </div>
    );
});

const OnchainRaffleSkeleton = memo(function OnchainRaffleSkeleton() {
    return (
        <div className="flex items-center justify-center min-h-screen relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center max-w-md mx-auto px-6 relative z-10"
            >
                <div className="relative mb-8">
                    <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto animate-spin" />
                </div>
                <p className="text-slate-300 leading-relaxed">
                    Loading raffle data...
                    <br />
                    <span className="text-slate-400 text-sm mt-2 block">
                        Please wait
                    </span>
                </p>
            </motion.div>
        </div>
    );
});

const OnchainRaffleError = memo(function OnchainRaffleError() {
    return (
        <div className="flex items-center justify-center min-h-screen relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950 to-slate-950" />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center max-w-md mx-auto px-6 relative z-10"
            >
                <div className="text-6xl mb-6">⛓️💔</div>
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                    Connection Failed
                </h3>
                <p className="text-slate-300 mb-8 leading-relaxed">
                    Unable to fetch raffle data.
                    <br />
                    <span className="text-slate-400 text-sm mt-2 block">
                        Please try again
                    </span>
                </p>

                <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 py-4 px-6 text-lg"
                >
                    🔄 Retry
                </button>
            </motion.div>
        </div>
    );
});
