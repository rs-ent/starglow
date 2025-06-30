/// components/polls/Poll.Betting.Record.tsx

"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Eye, EyeOff, Clock } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/tailwind";
import type { PollsWithArtist, PollOption } from "@/app/actions/polls";
import type { Player, PollLog } from "@prisma/client";
import type { PlayerAssetWithAsset } from "@/app/actions/playerAssets";

interface BettingRecordProps {
    isOpen: boolean;
    onClose: () => void;
    poll: PollsWithArtist;
    player: Player;
    pollLogs: PollLog[];
    bettingAsset: PlayerAssetWithAsset | null;
}

interface BettingStats {
    totalBetAmount: number;
    myTotalBets: number;
    myBetsByOption: Record<string, number>;
    expectedPayout: number;
    potentialProfit: number;
    winningChance: number;
    isProfit: boolean;
}

// Extracted sub-components for better organization
function ProfitDisplay({ stats, asset }: { stats: BettingStats; asset: any }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "text-center rounded-xl p-6",
                "bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20",
                "border-2",
                stats.isProfit ? "border-yellow-400/60" : "border-red-400/60"
            )}
        >
            <div className="flex justify-center mb-4">
                {stats.isProfit ? (
                    <TrendingUp className="w-12 h-12 text-yellow-400" />
                ) : (
                    <TrendingDown className="w-12 h-12 text-red-400" />
                )}
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
                {stats.isProfit ? "Potential Profit" : "Potential Loss"}
            </h2>

            <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                <h3
                    className={cn(
                        "text-3xl font-black",
                        stats.isProfit ? "text-yellow-300" : "text-red-300"
                    )}
                >
                    {stats.isProfit ? "+" : ""}
                    {Math.abs(stats.potentialProfit).toLocaleString()}
                </h3>
                <p className="text-white/80 font-semibold">{asset.symbol}</p>
            </div>

            <p className="text-white/70 text-sm mt-3">
                If your prediction wins
            </p>
        </motion.div>
    );
}

function BettingSummary({
    stats,
    asset,
    poll,
}: {
    stats: BettingStats;
    asset: any;
    poll: PollsWithArtist;
}) {
    return (
        <div className="bg-gray-900/80 rounded-xl border border-white/10 p-6">
            <div className="flex items-center gap-4 mb-4">
                {asset.imageUrl && (
                    <Image
                        src={asset.imageUrl}
                        alt={asset.name}
                        width={40}
                        height={40}
                        className="object-contain"
                    />
                )}
                <div>
                    <h3 className="text-white font-bold text-lg">Summary</h3>
                    <p className="text-gray-400 text-sm">{poll.title}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-xs font-medium">
                        Total Invested
                    </p>
                    <p className="text-blue-300 font-bold text-lg mt-1">
                        {stats.myTotalBets.toLocaleString()}
                    </p>
                    <p className="text-blue-200 text-xs">{asset.symbol}</p>
                </div>

                <div className="bg-black/30 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-xs font-medium">
                        Pool Share
                    </p>
                    <p className="text-purple-300 font-bold text-lg mt-1">
                        {(
                            (stats.myTotalBets / stats.totalBetAmount) *
                            100
                        ).toFixed(1)}
                        %
                    </p>
                    <p className="text-purple-200 text-xs">
                        of {stats.totalBetAmount.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}

function BettingOption({
    option,
    myBetAmount,
    totalOptionBets,
    totalBetAmount,
    asset,
}: {
    option: PollOption;
    myBetAmount: number;
    totalOptionBets: number;
    totalBetAmount: number;
    asset: any;
}) {
    const oddsRatio =
        totalOptionBets > 0 ? totalBetAmount / totalOptionBets : 0;
    const potentialWin = myBetAmount * oddsRatio;

    return (
        <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 rounded-lg border border-indigo-500/30 p-4">
            <div className="flex items-start gap-3 mb-4">
                {option.imgUrl && (
                    <Image
                        src={option.imgUrl}
                        alt={option.name}
                        width={40}
                        height={40}
                        className="rounded-lg border border-indigo-400/30 object-cover flex-shrink-0"
                    />
                )}
                <div className="flex-1">
                    <h4 className="text-white font-bold text-sm">
                        {option.name}
                    </h4>
                    {option.description && (
                        <p className="text-gray-400 text-xs">
                            {option.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded-lg p-3">
                    <p className="text-gray-400 text-center text-xs">
                        Your Bet
                    </p>
                    <p className="text-indigo-300 font-bold text-center">
                        {myBetAmount.toLocaleString()}
                    </p>
                    <p className="text-indigo-200 text-center text-xs">
                        {asset.symbol}
                    </p>
                </div>

                <div className="bg-black/20 rounded-lg p-3">
                    <p className="text-gray-400 text-center text-xs">
                        Potential Win
                    </p>
                    <p className="text-green-300 font-bold text-center">
                        {potentialWin.toLocaleString()}
                    </p>
                    <p className="text-green-200 text-center text-xs">
                        {asset.symbol}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function PollBettingRecord({
    isOpen,
    onClose,
    poll,
    player,
    pollLogs,
    bettingAsset,
}: BettingRecordProps) {
    const [showDetails, setShowDetails] = useState(false);

    // Optimized betting stats calculation
    const bettingStats = useMemo((): BettingStats => {
        const optionBetAmounts = (poll.optionBetAmounts as any) || {};

        const totalBetAmount = Object.values(optionBetAmounts).reduce(
            (sum: number, amount: any) => sum + (amount || 0),
            0
        );

        const myBetsByOption: Record<string, number> = {};
        let myTotalBets = 0;

        // Filter logs once for better performance
        const relevantLogs = pollLogs.filter(
            (log) => log.pollId === poll.id && log.playerId === player.id
        );

        relevantLogs.forEach((log) => {
            myBetsByOption[log.optionId] =
                (myBetsByOption[log.optionId] || 0) + log.amount;
            myTotalBets += log.amount;
        });

        const totalCommission = poll.totalCommissionAmount || 0;
        const payoutPool = totalBetAmount - totalCommission;

        let expectedPayout = 0;
        let maxWinChance = 0;

        Object.entries(myBetsByOption).forEach(([optionId, myBetAmount]) => {
            const optionTotalBets = optionBetAmounts[optionId] || 0;
            if (optionTotalBets > 0) {
                const potentialPayout =
                    (payoutPool * myBetAmount) / optionTotalBets;
                expectedPayout += potentialPayout;

                const winChance = (myBetAmount / optionTotalBets) * 100;
                maxWinChance = Math.max(maxWinChance, winChance);
            }
        });

        const potentialProfit = expectedPayout - myTotalBets;

        return {
            totalBetAmount,
            myTotalBets,
            myBetsByOption,
            expectedPayout,
            potentialProfit,
            winningChance: maxWinChance,
            isProfit: potentialProfit > 0,
        };
    }, [poll, pollLogs, player.id]);

    const options = poll.options as unknown as PollOption[];
    const optionBetAmounts = (poll.optionBetAmounts as any) || {};

    if (!bettingAsset) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogTitle> </DialogTitle>
            <DialogContent className="sm:max-w-[800px] bg-gray-900 border-gray-800 p-0 max-h-[90vh] overflow-y-auto">
                <div className="p-12 space-y-6">
                    {/* Profit/Loss Display */}
                    <ProfitDisplay
                        stats={bettingStats}
                        asset={bettingAsset.asset}
                    />

                    {/* Betting Summary */}
                    <BettingSummary
                        stats={bettingStats}
                        asset={bettingAsset.asset}
                        poll={poll}
                    />

                    {/* Details Toggle */}
                    <div className="flex justify-center">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                            {showDetails ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                            {showDetails
                                ? "Hide Details"
                                : "Show Betting Details"}
                        </button>
                    </div>

                    {/* Detailed Breakdown */}
                    <AnimatePresence>
                        {showDetails && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4"
                            >
                                <h3 className="text-center text-white font-bold text-lg">
                                    Detailed Betting Breakdown
                                </h3>

                                {options.map((option) => {
                                    const myBetAmount =
                                        bettingStats.myBetsByOption[
                                            option.optionId
                                        ] || 0;
                                    const totalOptionBets =
                                        optionBetAmounts[option.optionId] || 0;

                                    if (myBetAmount === 0) return null;

                                    return (
                                        <BettingOption
                                            key={option.optionId}
                                            option={option}
                                            myBetAmount={myBetAmount}
                                            totalOptionBets={totalOptionBets}
                                            totalBetAmount={
                                                bettingStats.totalBetAmount
                                            }
                                            asset={bettingAsset.asset}
                                        />
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="bg-gray-800/40 rounded-lg border border-gray-600/30 text-center p-6">
                        <Clock className="text-orange-400 mx-auto mb-3 w-6 h-6" />
                        <p className="text-gray-300 font-semibold mb-2">
                            Results on{" "}
                            <span className="text-orange-300 font-bold">
                                {new Date(poll.endDate).toLocaleDateString(
                                    "en-US",
                                    {
                                        month: "short",
                                        day: "numeric",
                                    }
                                )}
                            </span>
                        </p>
                        <p className="text-gray-400 text-sm">
                            Winners get automatic payouts 🎉
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
