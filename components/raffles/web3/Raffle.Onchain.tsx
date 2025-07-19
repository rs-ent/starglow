/// components/raffles/web3/Raffle.Onchain.tsx

"use client";

import { memo, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useOnchainRaffles } from "@/app/actions/raffles/web3/hooks";
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
import { AnimatePresence } from "framer-motion";

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

interface RaffleOnchainProps {
    contractAddress: string;
    raffleId: string;
}

export default memo(function RaffleOnchain({
    contractAddress,
    raffleId,
}: RaffleOnchainProps) {
    // 모달 상태 관리
    const [showTicket, setShowTicket] = useState(false);
    const [showScratch, setShowScratch] = useState(false);
    const [ticketData, setTicketData] = useState<TicketData | null>(null);

    // 모달 핸들러 함수들
    const handleParticipationSuccess = useCallback((ticket: TicketData) => {
        setTicketData(ticket);
        setShowTicket(true);
    }, []);

    const handleScratchReveal = useCallback(() => {
        // 스크래치 완료 후 모달은 유지되고, 사용자가 직접 닫을 때까지 기다림
    }, []);

    const handleCloseTicket = useCallback(() => {
        setShowTicket(false);
        setTicketData(null);
    }, []);

    const handleCloseScratch = useCallback(() => {
        setShowScratch(false);
        setTicketData(null);
    }, []);

    const handleInstantDraw = useCallback(() => {
        setShowTicket(false);
        setShowScratch(true);
    }, []);

    // 🔒 정적 데이터: 한번에 가져오기 (변화 거의 없음)
    const {
        raffleFromContract: staticData,
        isRaffleFromContractLoading: isStaticLoading,
        isRaffleFromContractError: isStaticError,
    } = useOnchainRaffles({
        getRaffleFromContractInput: {
            contractAddress,
            raffleId,
            dataKeys: ["basicInfo", "timing", "settings", "fee", "prizes"], // 정적 데이터만
        },
    });

    // ⚡ 동적 데이터: 상태 포함하여 가져오기
    const {
        raffleFromContract: dynamicData,
        isRaffleFromContractLoading: isDynamicLoading,
        raffleParticipants,
    } = useOnchainRaffles({
        getRaffleFromContractInput: {
            contractAddress,
            raffleId,
            dataKeys: ["status"], // 동적 상태 데이터만
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

    // Transform statusData to match RaffleOnchainStatus expected props
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

    // 정적 데이터 로딩 중
    if (isStaticLoading) {
        return <OnchainRaffleSkeleton />;
    }

    // 정적 데이터 로딩 실패
    if (isStaticError || !staticData?.success) {
        return <OnchainRaffleError />;
    }

    return (
        <div
            className={cn(
                "relative w-full min-h-screen overflow-hidden mb-[100px] md:mb-[50px]"
            )}
        >
            {/* Background Effects - Elegant Blockchain Theme */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/20 via-transparent to-purple-950/20" />

                {/* Static subtle pattern overlay */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
                                         radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)`,
                    }}
                />
            </div>

            <div
                className={cn(
                    "relative z-10",
                    "mt-[50px] mb-[20px] md:mb-[40px] md:mt-[0px]"
                )}
            >
                <div
                    className={cn(
                        "container mx-auto",
                        getResponsiveClass(20).paddingClass
                    )}
                >
                    {raffleData && (
                        <>
                            {/* Hero Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            >
                                <RaffleOnchainHero raffleData={raffleData} />
                            </motion.div>
                        </>
                    )}

                    {/* Main Content Grid */}
                    <div
                        className={cn(
                            "grid grid-cols-1 lg:grid-cols-5",
                            getResponsiveClass(30).gapClass
                        )}
                    >
                        {/* Left Column - Raffle Information */}
                        <div className="lg:col-span-3 space-y-8">
                            {raffleData?.prizes &&
                                raffleData?.prizes.length > 0 && (
                                    <RaffleOnchainPrizesGrandPrize
                                        data={raffleData?.prizes}
                                    />
                                )}
                            {/* Prizes Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.4 }}
                                className="relative hidden md:block"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-2xl blur-lg" />
                                <div className="relative">
                                    <RaffleOnchainPrizes
                                        data={raffleData?.prizes}
                                    />
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2, duration: 0.4 }}
                                className="relative group hidden md:block"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-xl blur-md group-hover:blur-sm transition-all duration-300" />
                                <div className="relative">
                                    <RaffleOnchainSettings
                                        data={raffleData?.settings}
                                    />
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Column - Participation & Status */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Participation Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15, duration: 0.4 }}
                                className="relative group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-xl blur-md group-hover:blur-sm transition-all duration-300" />
                                <div className="relative">
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
                                </div>
                            </motion.div>

                            {/* Timing Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05, duration: 0.4 }}
                                className="relative group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-xl blur-md group-hover:blur-sm transition-all duration-300" />
                                <div className="relative">
                                    <RaffleOnchainTiming
                                        data={raffleData?.timing}
                                    />
                                </div>
                            </motion.div>

                            {/* Prizes Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.4 }}
                                className="relative block md:hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-2xl blur-lg" />
                                <div className="relative">
                                    <RaffleOnchainPrizes
                                        data={raffleData?.prizes}
                                    />
                                </div>
                            </motion.div>

                            {/* Status Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2, duration: 0.4 }}
                                className="relative group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-500/5 rounded-xl blur-md group-hover:blur-sm transition-all duration-300" />
                                <div className="relative">
                                    <RaffleOnchainStatus
                                        data={transformedStatusData}
                                        isLoading={isDynamicLoading}
                                    />
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2, duration: 0.4 }}
                                className="relative group block md:hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-xl blur-md group-hover:blur-sm transition-all duration-300" />
                                <div className="relative">
                                    <RaffleOnchainSettings
                                        data={raffleData?.settings}
                                    />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 티켓 모달 */}
            {showTicket && ticketData && (
                <RaffleOnchainParticipationTicket
                    isVisible={showTicket}
                    onClose={handleCloseTicket}
                    ticketData={ticketData}
                    onInstantDraw={handleInstantDraw}
                />
            )}

            {/* 스크래치 모달 */}
            <AnimatePresence>
                {showScratch && ticketData?.prizeWon && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                        onClick={handleCloseScratch}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <RaffleScratchCard
                                prize={
                                    ticketData.prizeWon
                                        ? {
                                              id: `prize-${
                                                  ticketData.prizeWon.title
                                              }-${Date.now()}`,
                                              title: ticketData.prizeWon.title,
                                              prizeType:
                                                  ticketData.prizeWon
                                                      .prizeType === 0
                                                      ? "EMPTY"
                                                      : ticketData.prizeWon
                                                            .prizeType === 1
                                                      ? "ASSET"
                                                      : "NFT",
                                              order:
                                                  ticketData.prizeWon
                                                      .prizeType * 10,
                                              quantity: 1,
                                              spg: ticketData.prizeWon.imageUrl
                                                  ? {
                                                        imageUrl:
                                                            ticketData.prizeWon
                                                                .imageUrl,
                                                        metadata: {
                                                            image: ticketData
                                                                .prizeWon
                                                                .imageUrl,
                                                        },
                                                    }
                                                  : undefined,
                                              asset:
                                                  ticketData.prizeWon
                                                      .prizeType === 1
                                                      ? {
                                                            iconUrl:
                                                                ticketData
                                                                    .prizeWon
                                                                    .imageUrl,
                                                            symbol: "REWARD",
                                                        }
                                                      : undefined,
                                          }
                                        : null
                                }
                                onReveal={handleScratchReveal}
                                cardSize={{ width: 350, height: 250 }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

// Loading Skeleton Component
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
                    <div
                        className={cn(
                            "border-4 border-cyan-400 border-t-transparent rounded-full mx-auto animate-spin",
                            getResponsiveClass(50).frameClass
                        )}
                    />
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

// Error Component
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
                <div className={cn("mb-6", getResponsiveClass(65).textClass)}>
                    ⛓️💔
                </div>
                <h3
                    className={cn(
                        "font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent",
                        getResponsiveClass(35).textClass
                    )}
                >
                    Connection Failed
                </h3>
                <p className="text-slate-300 mb-8 leading-relaxed">
                    Unable to fetch raffle data.
                    <br />
                    <span className="text-slate-400 text-sm mt-2 block">
                        Please try again
                    </span>
                </p>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.reload()}
                    className={cn(
                        "w-full bg-gradient-to-r from-red-600 to-orange-600",
                        "hover:from-red-500 hover:to-orange-500",
                        "text-white font-bold rounded-xl transition-colors duration-200",
                        "flex items-center justify-center gap-2",
                        getResponsiveClass(20).paddingClass,
                        getResponsiveClass(15).textClass
                    )}
                >
                    🔄 Retry
                </motion.button>
            </motion.div>
        </div>
    );
});
