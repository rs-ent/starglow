/// components/raffles/web3/Raffle.Onchain.tsx

"use client";

import { memo, useMemo, useCallback, useReducer } from "react";
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
        order: number;
        rarity: number;
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

const DEFAULT_SCRATCH_CARD_SIZE = { width: 350, height: 250 };
const SCREEN_SIZE_BREAKPOINTS = {
    XL: 1280,
    LG: 1024,
    MD: 768,
} as const;

const getScratchCardSize = (): { width: number; height: number } => {
    if (typeof window === "undefined") {
        return DEFAULT_SCRATCH_CARD_SIZE;
    }

    const screenWidth = window.innerWidth;
    if (screenWidth >= SCREEN_SIZE_BREAKPOINTS.XL) {
        return { width: 450, height: 320 };
    } else if (screenWidth >= SCREEN_SIZE_BREAKPOINTS.LG) {
        return { width: 400, height: 280 };
    } else if (screenWidth >= SCREEN_SIZE_BREAKPOINTS.MD) {
        return { width: 350, height: 250 };
    } else {
        return { width: 300, height: 200 };
    }
};

interface ModalStateData {
    modalState: ModalState;
    ticketData: TicketData | null;
    scratchCardSize: { width: number; height: number };
}

type ModalAction =
    | { type: "OPEN_TICKET"; payload: TicketData }
    | { type: "OPEN_SCRATCH"; payload: { width: number; height: number } }
    | { type: "CLOSE_MODAL" };

const modalReducer = (
    state: ModalStateData,
    action: ModalAction
): ModalStateData => {
    switch (action.type) {
        case "OPEN_TICKET":
            return {
                ...state,
                modalState: "ticket",
                ticketData: action.payload,
            };
        case "OPEN_SCRATCH":
            return {
                ...state,
                modalState: "scratch",
                scratchCardSize: action.payload,
            };
        case "CLOSE_MODAL":
            return {
                ...state,
                modalState: "none",
                ticketData: null,
            };
        default:
            return state;
    }
};

const createPrizeData = (prizeWon: TicketData["prizeWon"]) => {
    if (!prizeWon) return null;

    const prizeType =
        prizeWon.prizeType === 0
            ? ("EMPTY" as const)
            : prizeWon.prizeType === 1
            ? ("ASSET" as const)
            : ("NFT" as const);

    const baseData = {
        id: `prize-${prizeWon.title}-${Date.now()}`,
        title: prizeWon.title,
        prizeType,
        order: prizeWon.order,
        rarity: prizeWon.rarity,
        quantity: 1,
    };

    if (prizeWon.imageUrl) {
        const imageData = {
            imageUrl: prizeWon.imageUrl,
            metadata: { image: prizeWon.imageUrl },
        };

        return {
            ...baseData,
            spg: imageData,
            asset:
                prizeWon.prizeType === 1
                    ? {
                          iconUrl: prizeWon.imageUrl,
                          symbol: "REWARD",
                      }
                    : undefined,
        };
    }

    return {
        ...baseData,
        spg: undefined,
        asset: undefined,
    };
};

export default memo(function RaffleOnchain({
    contractAddress,
    raffleId,
}: RaffleOnchainProps) {
    const [modalState, dispatch] = useReducer(modalReducer, {
        modalState: "none",
        ticketData: null,
        scratchCardSize: DEFAULT_SCRATCH_CARD_SIZE,
    });

    const handleParticipationSuccess = useCallback((ticket: TicketData) => {
        dispatch({ type: "OPEN_TICKET", payload: ticket });
    }, []);

    const handleInstantDraw = useCallback(() => {
        const size = getScratchCardSize();
        dispatch({ type: "OPEN_SCRATCH", payload: size });
    }, []);

    const handleCloseModal = useCallback(() => {
        dispatch({ type: "CLOSE_MODAL" });
    }, []);

    const scratchPrizeData = useMemo(() => {
        return createPrizeData(modalState.ticketData?.prizeWon);
    }, [modalState.ticketData?.prizeWon]);

    const handleScratchReveal = useCallback(() => {
        // 스크래치 완료 후 모달은 유지됨
    }, []);

    const {
        raffleFromContract: raffleData,
        isRaffleFromContractLoading: isStaticLoading,
        isRaffleFromContractError: isStaticError,
        raffleParticipants,
    } = useOnchainRaffles({
        getRaffleFromContractInput: {
            contractAddress,
            raffleId,
            dataKeys: [
                "basicInfo",
                "timing",
                "settings",
                "fee",
                "prizes",
                "status",
            ],
        },
        getRaffleParticipantsInput: {
            contractAddress,
            raffleId,
        },
    });

    const staticRaffleData = useMemo(
        () => (raffleData?.success ? raffleData.data : null),
        [raffleData?.success, raffleData?.data]
    );

    const statusData = useMemo(
        () => (raffleData?.success ? raffleData.data?.status : null),
        [raffleData?.success, raffleData?.data?.status]
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

    if (isStaticError || !raffleData?.success) {
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
                    {staticRaffleData && (
                        <>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <RaffleOnchainHero
                                    raffleData={staticRaffleData}
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
                            {staticRaffleData?.prizes &&
                                staticRaffleData?.prizes.length > 0 && (
                                    <RaffleOnchainPrizesGrandPrize
                                        data={staticRaffleData?.prizes}
                                    />
                                )}

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.3 }}
                                className="relative hidden md:block"
                            >
                                <RaffleOnchainPrizes
                                    data={staticRaffleData?.prizes}
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15, duration: 0.3 }}
                                className="relative group hidden md:block"
                            >
                                <RaffleOnchainSettings
                                    data={staticRaffleData?.settings}
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
                                    basicInfo={staticRaffleData?.basicInfo}
                                    timingData={staticRaffleData?.timing}
                                    settingsData={staticRaffleData?.settings}
                                    feeData={staticRaffleData?.fee}
                                    statusData={transformedStatusData}
                                    isStatusLoading={isStaticLoading}
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
                                    data={staticRaffleData?.timing}
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.3 }}
                                className="relative block md:hidden"
                            >
                                <RaffleOnchainPrizes
                                    data={staticRaffleData?.prizes}
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
                                    isLoading={isStaticLoading}
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15, duration: 0.3 }}
                                className="relative group block md:hidden"
                            >
                                <RaffleOnchainSettings
                                    data={staticRaffleData?.settings}
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {modalState.modalState === "ticket" && modalState.ticketData && (
                <EnhancedPortal layer="modal">
                    <RaffleOnchainParticipationTicket
                        isVisible={modalState.modalState === "ticket"}
                        onClose={handleCloseModal}
                        ticketData={modalState.ticketData}
                        onInstantDraw={handleInstantDraw}
                    />
                </EnhancedPortal>
            )}

            {modalState.modalState === "scratch" &&
                modalState.ticketData?.prizeWon && (
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
                                    cardSize={modalState.scratchCardSize}
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
