/// components/raffles/web3/Raffle.Onchain.Participation.Ticket.tsx

"use client";

import { memo, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";

interface TicketProps {
    isVisible: boolean;
    onClose: () => void;
    onInstantDraw?: () => void;
    ticketData: {
        raffleTitle: string;
        participantId: number;
        ticketNumber?: string;
        lotteryTicketNumber?: string;
        txHash: string;
        participatedAt?: number;
        entryFeePaid: number;
        entryFeeAsset?: {
            symbol: string;
            iconUrl?: string;
        };
        walletAddress: string;
        prizeWon?: {
            title: string;
            description: string;
            imageUrl: string;
            prizeType: number;
            userValue: number;
        };
        isInstantDraw?: boolean;
        explorerUrl?: string;
    };
}

const PerforatedEdge = memo(function PerforatedEdge({
    position,
}: {
    position: "top" | "bottom";
}) {
    return (
        <div
            className={cn(
                "absolute left-0 right-0 h-1 flex justify-center",
                position === "top" ? "top-0" : "bottom-0"
            )}
        >
            {Array.from({ length: 20 }, (_, i) => (
                <div
                    key={`${position}-${i}`}
                    className="w-1 h-1 bg-cyan-400 mx-1"
                    style={{
                        boxShadow: "0 0 4px rgba(34, 211, 238, 0.8)",
                    }}
                />
            ))}
        </div>
    );
});

export default memo(function RaffleOnchainParticipationTicket({
    isVisible,
    onClose,
    onInstantDraw,
    ticketData,
}: TicketProps) {
    const [copySuccess, setCopySuccess] = useState(false);

    const smallText = getResponsiveClass(10);
    const mediumText = getResponsiveClass(20);
    const xlText = getResponsiveClass(40);
    const xxlText = getResponsiveClass(55);
    const smallPadding = getResponsiveClass(15);
    const largePadding = getResponsiveClass(35);
    const smallGap = getResponsiveClass(15);
    const mediumGap = getResponsiveClass(25);
    const smallMargin = getResponsiveClass(15);
    const mediumMargin = getResponsiveClass(25);

    const handleCopyTxHash = useCallback(
        async (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                await navigator.clipboard.writeText(ticketData.txHash);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            } catch (err) {
                console.error("Failed to copy:", err);
            }
        },
        [ticketData.txHash]
    );

    const handleExplorerClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(
                `https://beratrail.io/tx/${ticketData.txHash}`,
                "_blank"
            );
        },
        [ticketData.txHash]
    );

    const handleInstantDrawClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            onInstantDraw?.();
        },
        [onInstantDraw]
    );

    const handleCloseClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
        },
        [onClose]
    );

    const handleBackdropClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        },
        [onClose]
    );

    const {
        formattedDate,
        formattedTime,
        ticketNumber,
        hasInstantPrize,
        barcodeData,
    } = useMemo(() => {
        const formatDate = (timestamp?: number) => {
            if (!timestamp) return "TODAY";
            const date = new Date(timestamp * 1000);
            return date
                .toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                })
                .toUpperCase();
        };

        const formatTime = (timestamp?: number) => {
            if (!timestamp) return "NOW";
            const date = new Date(timestamp * 1000);
            return date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
            });
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

        const generateBarcodeFromHash = (hash: string) => {
            const cleanHash = hash.replace("0x", "");
            return cleanHash
                .slice(0, 64)
                .split("")
                .map((char, index) => {
                    const charCode = char.charCodeAt(0);
                    return {
                        height: 30 + (charCode % 20),
                        width: (charCode % 3) + 1,
                        index,
                    };
                });
        };

        return {
            formattedDate: formatDate(ticketData.participatedAt),
            formattedTime: formatTime(ticketData.participatedAt),
            ticketNumber:
                ticketData.lotteryTicketNumber ||
                ticketData.ticketNumber ||
                generateLotteryNumber(ticketData.txHash),
            hasInstantPrize: ticketData.isInstantDraw && ticketData.prizeWon,
            barcodeData: generateBarcodeFromHash(ticketData.txHash),
        };
    }, [ticketData]);

    if (!isVisible) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="ticket-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                    "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center",
                    smallPadding.paddingClass
                )}
                onClick={handleBackdropClick}
                style={{ pointerEvents: "auto" }}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative max-w-lg w-full mx-auto max-h-[800px] h-full overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                    style={{ pointerEvents: "auto" }}
                >
                    <button
                        onClick={handleCloseClick}
                        className={cn(
                            "absolute top-4 right-4 z-20 rounded-full bg-black/70 hover:bg-black/90 transition-colors",
                            "cursor-pointer",
                            smallPadding.paddingClass
                        )}
                        style={{ pointerEvents: "auto" }}
                        type="button"
                    >
                        <X
                            className={cn(
                                "text-white",
                                getResponsiveClass(20).frameClass
                            )}
                        />
                    </button>

                    <div
                        className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-cyan-900 overflow-hidden border border-cyan-400/30"
                        style={{
                            width: "100%",
                            minHeight: "600px",
                            clipPath: `polygon(
                                0% 0%, 
                                calc(100% - 20px) 0%, 
                                100% 20px, 
                                100% calc(100% - 20px), 
                                calc(100% - 20px) 100%, 
                                20px 100%, 
                                0% calc(100% - 20px), 
                                0% 20px
                            )`,
                            boxShadow: `
                                inset 0 0 50px rgba(34, 211, 238, 0.1),
                                0 0 30px rgba(34, 211, 238, 0.2)
                            `,
                            pointerEvents: "auto",
                        }}
                    >
                        <div className="absolute inset-0">
                            <PerforatedEdge position="top" />
                            <PerforatedEdge position="bottom" />
                        </div>

                        <div className="absolute inset-0 opacity-10">
                            <div
                                className="w-full h-full"
                                style={{
                                    backgroundImage: `
                                        linear-gradient(90deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px),
                                        linear-gradient(180deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px)
                                    `,
                                    backgroundSize: "20px 20px",
                                }}
                            />
                        </div>

                        <div
                            className={cn(
                                "relative z-10 h-full flex flex-col",
                                largePadding.paddingClass
                            )}
                        >
                            <div
                                className={cn(
                                    "text-center",
                                    mediumMargin.marginYClass
                                )}
                            >
                                <div
                                    className={cn(
                                        smallPadding.paddingClass,
                                        smallMargin.marginYClass,
                                        "flex flex-col"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "font-bold text-cyan-300 tracking-widest",
                                            smallText.textClass
                                        )}
                                        style={{
                                            textShadow:
                                                "0 0 10px rgba(34, 211, 238, 0.8)",
                                        }}
                                    >
                                        ★ RAFFLE LOTTERY TICKET ★
                                    </div>
                                    <div
                                        className={cn(
                                            "font-bold text-cyan-100 break-words font-mono",
                                            xlText.textClass
                                        )}
                                        style={{
                                            textShadow:
                                                "0 0 15px rgba(34, 211, 238, 0.6)",
                                        }}
                                    >
                                        {ticketData.raffleTitle}
                                    </div>
                                </div>
                            </div>

                            <div
                                className={cn(
                                    "flex-1 grid grid-cols-2",
                                    mediumGap.gapClass,
                                    mediumMargin.marginYClass
                                )}
                            >
                                <div className="space-y-2">
                                    <div>
                                        <div
                                            className={cn(
                                                "font-bold text-cyan-400 uppercase tracking-wider",
                                                smallText.textClass
                                            )}
                                        >
                                            Date
                                        </div>
                                        <div
                                            className={cn(
                                                "font-black text-cyan-100 font-mono",
                                                mediumText.textClass
                                            )}
                                            style={{
                                                textShadow:
                                                    "0 0 8px rgba(34, 211, 238, 0.5)",
                                            }}
                                        >
                                            {formattedDate}
                                        </div>
                                    </div>

                                    <div>
                                        <div
                                            className={cn(
                                                "font-bold text-cyan-400 uppercase tracking-wider",
                                                smallText.textClass
                                            )}
                                        >
                                            Time
                                        </div>
                                        <div
                                            className={cn(
                                                "font-black text-cyan-100 font-mono",
                                                mediumText.textClass
                                            )}
                                            style={{
                                                textShadow:
                                                    "0 0 8px rgba(34, 211, 238, 0.5)",
                                            }}
                                        >
                                            {formattedTime}
                                        </div>
                                    </div>

                                    <div>
                                        <div
                                            className={cn(
                                                "font-bold text-cyan-400 uppercase tracking-wider",
                                                smallText.textClass
                                            )}
                                        >
                                            Entry Fee
                                        </div>
                                        <div
                                            className={cn(
                                                "font-black text-cyan-100 font-mono",
                                                mediumText.textClass
                                            )}
                                            style={{
                                                textShadow:
                                                    "0 0 8px rgba(34, 211, 238, 0.5)",
                                            }}
                                        >
                                            {ticketData.entryFeePaid.toLocaleString()}{" "}
                                            {ticketData.entryFeeAsset?.symbol ||
                                                "TOKENS"}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <div
                                            className={cn(
                                                "font-bold text-cyan-400 uppercase tracking-wider",
                                                smallText.textClass
                                            )}
                                        >
                                            Participant
                                        </div>
                                        <div
                                            className={cn(
                                                "font-black text-cyan-100 font-mono",
                                                mediumText.textClass
                                            )}
                                            style={{
                                                textShadow:
                                                    "0 0 8px rgba(34, 211, 238, 0.5)",
                                            }}
                                        >
                                            #
                                            {ticketData.participantId
                                                .toString()
                                                .padStart(4, "0")}
                                        </div>
                                    </div>

                                    <div>
                                        <div
                                            className={cn(
                                                "font-bold text-cyan-400 uppercase tracking-wider",
                                                smallText.textClass
                                            )}
                                        >
                                            Seat
                                        </div>
                                        <div
                                            className={cn(
                                                "font-black text-cyan-100 font-mono",
                                                mediumText.textClass
                                            )}
                                            style={{
                                                textShadow:
                                                    "0 0 8px rgba(34, 211, 238, 0.5)",
                                            }}
                                        >
                                            {hasInstantPrize
                                                ? "INSTANT"
                                                : "GENERAL"}
                                        </div>
                                    </div>

                                    <div>
                                        <div
                                            className={cn(
                                                "font-bold text-cyan-400 uppercase tracking-wider",
                                                smallText.textClass
                                            )}
                                        >
                                            Row
                                        </div>
                                        <div
                                            className={cn(
                                                "font-black text-cyan-100 font-mono",
                                                mediumText.textClass
                                            )}
                                            style={{
                                                textShadow:
                                                    "0 0 8px rgba(34, 211, 238, 0.5)",
                                            }}
                                        >
                                            BERACHAIN
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={cn(
                                    "text-center",
                                    mediumMargin.marginYClass
                                )}
                            >
                                <div
                                    className={cn(
                                        "font-bold text-cyan-300 uppercase tracking-wider",
                                        smallText.textClass,
                                        smallMargin.marginYClass
                                    )}
                                    style={{
                                        textShadow:
                                            "0 0 15px rgba(34, 211, 238, 0.8)",
                                    }}
                                >
                                    ★ LOTTERY NUMBER ★
                                </div>
                                <div
                                    className={cn(
                                        "font-black text-cyan-100 tracking-wider font-mono bg-slate-800/70 border-2 border-cyan-400 border-dashed",
                                        xxlText.textClass,
                                        smallPadding.paddingClass
                                    )}
                                    style={{
                                        textShadow:
                                            "0 0 20px rgba(34, 211, 238, 0.9)",
                                        boxShadow:
                                            "inset 0 0 20px rgba(34, 211, 238, 0.2), 0 0 25px rgba(34, 211, 238, 0.3)",
                                    }}
                                >
                                    {ticketNumber}
                                </div>
                            </div>

                            <div className="border-t-2 border-cyan-400/60 border-dashed py-3 mt-auto">
                                <div
                                    className={cn(
                                        smallMargin.marginYClass,
                                        "flex flex-col items-center justify-center text-center gap-2 mb-1"
                                    )}
                                >
                                    <div className="flex flex-row justify-between items-end gap-2 w-full">
                                        <div className="flex flex-col items-start text-left">
                                            <div
                                                className={cn(
                                                    "font-black text-cyan-100 font-mono",
                                                    smallText.textClass
                                                )}
                                                style={{
                                                    textShadow:
                                                        "0 0 8px rgba(34, 211, 238, 0.6)",
                                                }}
                                            >
                                                Ticket
                                                <br />#{ticketNumber}
                                            </div>
                                        </div>
                                        <div className="flex items-end justify-center gap-px overflow-hidden rounded">
                                            {barcodeData.map((bar, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-white"
                                                    style={{
                                                        height: `${bar.height}px`,
                                                        width: `${bar.width}px`,
                                                        minWidth: "1px",
                                                        boxShadow:
                                                            "0 0 3px rgba(34, 211, 238, 0.8)",
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div
                                        className={cn(
                                            "font-black text-cyan-100 tracking-wider font-mono bg-slate-800/70 border border-cyan-400 border-dashed",
                                            "w-full text-center truncate cursor-pointer",
                                            smallText.textClass,
                                            smallPadding.paddingClass
                                        )}
                                        onClick={handleCopyTxHash}
                                        style={{
                                            textShadow:
                                                "0 0 8px rgba(34, 211, 238, 0.6)",
                                            boxShadow:
                                                "inset 0 0 10px rgba(34, 211, 238, 0.2)",
                                            pointerEvents: "auto",
                                        }}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        {ticketData.txHash}
                                    </div>
                                </div>

                                <div
                                    className={cn(
                                        "flex flex-col justify-between items-center gap-1 w-full",
                                        "border-t-2 border-cyan-400/60 border-dashed pt-3 mt-auto"
                                    )}
                                    style={{
                                        boxShadow:
                                            "0 -1px 5px rgba(34, 211, 238, 0.2)",
                                    }}
                                >
                                    <div
                                        className={
                                            smallGap.gapClass +
                                            " grid grid-cols-2 w-full"
                                        }
                                    >
                                        <button
                                            onClick={handleCopyTxHash}
                                            className={cn(
                                                "font-black text-cyan-100 tracking-wider font-mono bg-slate-800/70 border-2 border-cyan-400 border-dashed",
                                                "hover:bg-slate-700/70 transition-colors cursor-pointer",
                                                smallText.textClass,
                                                "py-1"
                                            )}
                                            style={{
                                                textShadow:
                                                    "0 0 8px rgba(34, 211, 238, 0.6)",
                                                boxShadow:
                                                    "inset 0 0 10px rgba(34, 211, 238, 0.2)",
                                                pointerEvents: "auto",
                                            }}
                                            type="button"
                                        >
                                            {copySuccess
                                                ? "✅ Copied!"
                                                : "COPY HASH"}
                                        </button>

                                        {ticketData.explorerUrl && (
                                            <button
                                                onClick={handleExplorerClick}
                                                className={cn(
                                                    "font-black text-cyan-100 tracking-wider font-mono bg-slate-800/70 border-2 border-cyan-400 border-dashed",
                                                    "hover:bg-slate-700/70 transition-colors cursor-pointer",
                                                    smallText.textClass,
                                                    "py-1"
                                                )}
                                                style={{
                                                    textShadow:
                                                        "0 0 8px rgba(34, 211, 238, 0.6)",
                                                    boxShadow:
                                                        "inset 0 0 10px rgba(34, 211, 238, 0.2)",
                                                    pointerEvents: "auto",
                                                }}
                                                type="button"
                                            >
                                                EXPLORER
                                            </button>
                                        )}
                                    </div>

                                    {hasInstantPrize && (
                                        <button
                                            onClick={handleInstantDrawClick}
                                            className={cn(
                                                "font-black text-cyan-100 tracking-wider font-mono bg-slate-800/70 border-2 border-cyan-400 border-dashed w-full",
                                                "hover:bg-slate-700/70 transition-colors cursor-pointer",
                                                largePadding.paddingClass,
                                                mediumText.textClass
                                            )}
                                            style={{
                                                textShadow:
                                                    "0 0 15px rgba(34, 211, 238, 0.8)",
                                                boxShadow:
                                                    "inset 0 0 20px rgba(34, 211, 238, 0.3), 0 0 30px rgba(34, 211, 238, 0.4)",
                                                pointerEvents: "auto",
                                            }}
                                            type="button"
                                        >
                                            🚀 INSTANT PRIZE DRAW
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
});
