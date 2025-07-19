/// components/raffles/web3/Raffle.Onchain.Participation.Ticket.tsx

"use client";

import { memo, useState } from "react";
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

export default memo(function RaffleOnchainParticipationTicket({
    isVisible,
    onClose,
    onInstantDraw,
    ticketData,
}: TicketProps) {
    const [copySuccess, setCopySuccess] = useState(false);

    // Responsive classes
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

    const handleCopyTxHash = async () => {
        try {
            await navigator.clipboard.writeText(ticketData.txHash);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

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

    const generateBarcodeFromHash = (hash: string) => {
        const cleanHash = hash.replace("0x", "");
        const barcodeData: Array<{
            height: number;
            width: number;
            char: string;
            index: number;
        }> = [];

        cleanHash
            .slice(0, 64)
            .split("")
            .forEach((char, index) => {
                const charCode = char.charCodeAt(0);
                const height = 30 + (charCode % 20);
                const width = (charCode % 3) + 1;
                barcodeData.push({ height, width, char, index });
            });

        return barcodeData;
    };

    const hasInstantPrize =
        ticketData.isInstantDraw &&
        ticketData.prizeWon &&
        ticketData.prizeWon.prizeType !== 0;

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

    const ticketNumber =
        ticketData.lotteryTicketNumber ||
        ticketData.ticketNumber ||
        generateLotteryNumber(ticketData.txHash);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative max-w-lg w-full mx-auto max-h-[800px] h-full overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 rounded-full bg-black/70 hover:bg-black/90 transition-colors p-3"
                >
                    <X className="w-5 h-5 text-white" />
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
                            0 0 30px rgba(34, 211, 238, 0.2),
                            0 0 60px rgba(34, 211, 238, 0.1)
                        `,
                    }}
                >
                    <div className="absolute inset-0">
                        {/* Top perforated edge */}
                        <div className="absolute top-0 left-0 right-0 h-2 flex justify-center">
                            {[...Array(25)].map((_, i) => (
                                <div
                                    key={`top-${i}`}
                                    className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse mx-1"
                                    style={{
                                        boxShadow:
                                            "0 0 4px rgba(34, 211, 238, 0.8)",
                                        animationDelay: `${i * 50}ms`,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Bottom perforated edge */}
                        <div className="absolute bottom-0 left-0 right-0 h-2 flex justify-center">
                            {[...Array(25)].map((_, i) => (
                                <div
                                    key={`bottom-${i}`}
                                    className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse mx-1"
                                    style={{
                                        boxShadow:
                                            "0 0 4px rgba(34, 211, 238, 0.8)",
                                        animationDelay: `${i * 50}ms`,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Middle divider */}
                        <div
                            className="absolute left-0 right-0"
                            style={{ top: "65%" }}
                        >
                            <div className="flex justify-center">
                                {[...Array(30)].map((_, i) => (
                                    <div
                                        key={`divider-${i}`}
                                        className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse mx-1"
                                        style={{
                                            boxShadow:
                                                "0 0 2px rgba(34, 211, 238, 0.6)",
                                            animationDelay: `${i * 30}ms`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Grid pattern overlay */}
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

                    {/* Diagonal lines */}
                    <div className="absolute inset-0 opacity-5">
                        <div
                            className="w-full h-full"
                            style={{
                                backgroundImage: `repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 10px,
                                #22d3ee 10px,
                                #22d3ee 20px
                            )`,
                            }}
                        />
                    </div>

                    <div className="relative z-10 h-full flex flex-col p-8">
                        <div className="text-center mb-6">
                            <div className="p-4 mb-4 flex flex-col">
                                <div
                                    className="text-xs font-bold text-cyan-300 tracking-widest"
                                    style={{
                                        textShadow:
                                            "0 0 10px rgba(34, 211, 238, 0.8)",
                                    }}
                                >
                                    ★ RAFFLE LOTTERY TICKET ★
                                </div>
                                <div
                                    className="text-3xl font-bold text-cyan-100 break-words font-mono"
                                    style={{
                                        textShadow:
                                            "0 0 15px rgba(34, 211, 238, 0.6)",
                                    }}
                                >
                                    {ticketData.raffleTitle}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                                        Date
                                    </div>
                                    <div
                                        className="text-lg font-black text-cyan-100 font-mono"
                                        style={{
                                            textShadow:
                                                "0 0 8px rgba(34, 211, 238, 0.5)",
                                        }}
                                    >
                                        {formatDate(ticketData.participatedAt)}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                                        Time
                                    </div>
                                    <div
                                        className="text-lg font-black text-cyan-100 font-mono"
                                        style={{
                                            textShadow:
                                                "0 0 8px rgba(34, 211, 238, 0.5)",
                                        }}
                                    >
                                        {formatTime(ticketData.participatedAt)}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                                        Entry Fee
                                    </div>
                                    <div
                                        className="text-lg font-black text-cyan-100 font-mono"
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
                                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                                        Participant
                                    </div>
                                    <div
                                        className="text-lg font-black text-cyan-100 font-mono"
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
                                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                                        Seat
                                    </div>
                                    <div
                                        className="text-lg font-black text-cyan-100 font-mono"
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
                                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                                        Row
                                    </div>
                                    <div
                                        className="text-lg font-black text-cyan-100 font-mono"
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

                        <div className="text-center mb-6">
                            <div
                                className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2"
                                style={{
                                    textShadow:
                                        "0 0 15px rgba(34, 211, 238, 0.8)",
                                }}
                            >
                                ★ LOTTERY NUMBER ★
                            </div>
                            <div
                                className="text-5xl font-black text-cyan-100 tracking-wider font-mono bg-slate-800/70 border-2 border-cyan-400 border-dashed p-4"
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

                        <div
                            className="border-t-2 border-cyan-400/60 border-dashed py-3 mt-auto"
                            style={{
                                boxShadow:
                                    "0 -2px 10px rgba(34, 211, 238, 0.2)",
                            }}
                        >
                            <div className="mb-4 flex flex-col items-center justify-center text-center gap-2">
                                <div className="flex flex-row justify-between items-end gap-2 w-full">
                                    <div className="flex flex-col items-start text-left">
                                        <div
                                            className="text-xs font-black text-cyan-100 font-mono"
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
                                        {generateBarcodeFromHash(
                                            ticketData.txHash
                                        ).map((bar, index) => (
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
                                    className="text-xs font-black text-cyan-100 tracking-wider font-mono bg-slate-800/70 border border-cyan-400 border-dashed w-full text-center truncate cursor-pointer p-2"
                                    onClick={handleCopyTxHash}
                                    style={{
                                        textShadow:
                                            "0 0 8px rgba(34, 211, 238, 0.6)",
                                        boxShadow:
                                            "inset 0 0 10px rgba(34, 211, 238, 0.2)",
                                    }}
                                >
                                    {ticketData.txHash}
                                </div>
                            </div>

                            <div
                                className="flex flex-col justify-between items-center gap-3 w-full border-t-2 border-cyan-400/60 border-dashed pt-3"
                                style={{
                                    boxShadow:
                                        "0 -1px 5px rgba(34, 211, 238, 0.2)",
                                }}
                            >
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={handleCopyTxHash}
                                        className="text-xs font-black text-cyan-100 tracking-wider font-mono bg-slate-800/70 border-2 border-cyan-400 border-dashed py-2 hover:bg-slate-700/70 transition-colors"
                                        style={{
                                            textShadow:
                                                "0 0 8px rgba(34, 211, 238, 0.6)",
                                            boxShadow:
                                                "inset 0 0 10px rgba(34, 211, 238, 0.2)",
                                        }}
                                    >
                                        {copySuccess
                                            ? "✅ Copied!"
                                            : "COPY HASH"}
                                    </button>

                                    {ticketData.explorerUrl && (
                                        <button
                                            onClick={() =>
                                                window.open(
                                                    `https://beratrail.io/tx/${ticketData.txHash}`,
                                                    "_blank"
                                                )
                                            }
                                            className="text-xs font-black text-cyan-100 tracking-wider font-mono bg-slate-800/70 border-2 border-cyan-400 border-dashed py-2"
                                            style={{
                                                textShadow:
                                                    "0 0 8px rgba(34, 211, 238, 0.6)",
                                                boxShadow:
                                                    "inset 0 0 10px rgba(34, 211, 238, 0.2)",
                                            }}
                                        >
                                            EXPLORER
                                        </button>
                                    )}
                                </div>

                                {hasInstantPrize && (
                                    <button
                                        onClick={() => {
                                            onInstantDraw?.();
                                        }}
                                        className="text-lg font-black text-cyan-100 tracking-wider font-mono bg-slate-800/70 border-2 border-cyan-400 border-dashed w-full p-6 hover:bg-slate-700/70 transition-colors"
                                        style={{
                                            textShadow:
                                                "0 0 15px rgba(34, 211, 238, 0.8)",
                                            boxShadow:
                                                "inset 0 0 20px rgba(34, 211, 238, 0.3), 0 0 30px rgba(34, 211, 238, 0.4)",
                                        }}
                                    >
                                        🚀 INSTANT PRIZE DRAW
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
});
