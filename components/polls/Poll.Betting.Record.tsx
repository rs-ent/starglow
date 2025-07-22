/// components/polls/Poll.Betting.Record.tsx

"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/tailwind";
import type {
    PollOption,
    GetPlayerPollLogsResponse,
    PollDetail,
} from "@/app/actions/polls";
import type { PlayerAssetWithAsset } from "@/app/actions/playerAssets/actions";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import Countdown from "../atoms/Countdown";

interface BettingRecordProps {
    isOpen: boolean;
    onClose: () => void;
    poll: PollDetail;
    pollLogs: GetPlayerPollLogsResponse[];
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
                "text-center rounded-xl <Ip-6",
                "bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-green-500/20",
                "border-2 border-yellow-400/60"
            )}
        >
            <h2
                className={cn(
                    "text-xl font-bold text-white mb-2",
                    getResponsiveClass(20).textClass
                )}
            >
                If your prediction wins
            </h2>

            <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                <h3
                    className={cn(
                        "text-3xl font-black",
                        getResponsiveClass(40).textClass,
                        "text-yellow-300"
                    )}
                >
                    +{Math.abs(stats.potentialProfit).toLocaleString()}
                </h3>
                <div className="flex flex-row items-center justify-center gap-2">
                    {asset.imageUrl && (
                        <Image
                            src={asset.imageUrl}
                            alt={asset.name}
                            width={40}
                            height={40}
                            className={cn(
                                "object-contain",
                                getResponsiveClass(20).frameClass
                            )}
                        />
                    )}
                    <p
                        className={cn(
                            "text-white/80 font-semibold",
                            getResponsiveClass(15).textClass
                        )}
                    >
                        {asset.symbol}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

function Summary({
    pollTitle,
    option,
    myBetAmount,
    totalOptionBets,
    totalBetAmount,
    asset,
}: {
    pollTitle: string;
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
            <h2
                className={cn(
                    "text-gray-400 text-sm text-center mb-2",
                    getResponsiveClass(15).textClass
                )}
            >
                {pollTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="bg-black/20 rounded-lg p-3 flex flex-col items-center justify-center gap-1 relative overflow-hidden">
                    {option.imgUrl && (
                        <div className="absolute inset-0">
                            <Image
                                src={option.imgUrl}
                                alt={option.name}
                                width={600}
                                height={600}
                                className={cn(
                                    "w-full h-full object-cover bg-blend-overlay opacity-20"
                                )}
                            />
                        </div>
                    )}

                    <p
                        className={cn(
                            "text-gray-400 text-center text-xs",
                            getResponsiveClass(10).textClass
                        )}
                    >
                        Your Choice
                    </p>

                    <div className="flex flex-col items-center justify-center">
                        <h4
                            className={cn(
                                "text-white font-bold text-sm",
                                getResponsiveClass(20).textClass
                            )}
                        >
                            {option.name}
                        </h4>
                        {option.description && (
                            <p
                                className={cn(
                                    "text-gray-400 text-xs",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                {option.description}
                            </p>
                        )}
                    </div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 flex flex-col items-center justify-center gap-1">
                    <p
                        className={cn(
                            "text-gray-400 text-center text-xs",
                            getResponsiveClass(10).textClass
                        )}
                    >
                        Your Bet
                    </p>
                    <div className="flex flex-row items-center justify-center gap-1">
                        <Image
                            src={asset.imageUrl}
                            alt={asset.name}
                            width={20}
                            height={20}
                            className={cn(
                                "object-contain",
                                getResponsiveClass(20).frameClass
                            )}
                        />
                        <p
                            className={cn(
                                "text-indigo-300 font-bold text-center",
                                getResponsiveClass(20).textClass
                            )}
                        >
                            {myBetAmount.toLocaleString()}
                        </p>
                        <p
                            className={cn(
                                "text-indigo-200 text-center text-xs",
                                getResponsiveClass(10).textClass
                            )}
                        >
                            {asset.symbol}
                        </p>
                    </div>
                </div>

                <div className="bg-black/20 rounded-lg p-3 flex flex-col items-center justify-center gap-1">
                    <p
                        className={cn(
                            "text-gray-400 text-center text-xs",
                            getResponsiveClass(10).textClass
                        )}
                    >
                        Potential Win
                    </p>
                    <div className="flex flex-row items-center justify-center gap-1">
                        <Image
                            src={asset.imageUrl}
                            alt={asset.name}
                            width={20}
                            height={20}
                            className={cn(
                                "object-contain",
                                getResponsiveClass(20).frameClass
                            )}
                        />
                        <p
                            className={cn(
                                "text-green-300 font-bold text-center",
                                getResponsiveClass(20).textClass
                            )}
                        >
                            {potentialWin.toLocaleString()}
                        </p>
                        <p
                            className={cn(
                                "text-green-200 text-center text-xs",
                                getResponsiveClass(10).textClass
                            )}
                        >
                            {asset.symbol}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PollBettingRecord({
    isOpen,
    onClose,
    poll,
    pollLogs,
    bettingAsset,
}: BettingRecordProps) {
    const bettingStats = useMemo((): BettingStats => {
        const optionBetAmounts = (poll.optionBetAmounts as any) || {};

        const totalBetAmount = Object.values(optionBetAmounts).reduce(
            (sum: number, amount: any) => sum + (amount || 0),
            0
        );

        const myBetsByOption: Record<string, number> = {};
        let myTotalBets = 0;

        pollLogs.forEach((log) => {
            myBetsByOption[log.optionId] =
                (myBetsByOption[log.optionId] || 0) + log.amount;
            myTotalBets += log.amount;
        });

        const totalCommission = poll.totalCommissionAmount || 0;
        const payoutPool = totalBetAmount - totalCommission;

        let bestScenarioPayout = 0;
        let maxWinChance = 0;

        // Calculate the best winning scenario for each option
        Object.entries(myBetsByOption).forEach(([optionId, myBetAmount]) => {
            const optionTotalBets = optionBetAmounts[optionId] || 0;
            if (optionTotalBets > 0) {
                // Calculate what we would get if THIS specific option wins
                const potentialPayout =
                    (payoutPool * myBetAmount) / optionTotalBets;

                // Keep track of the best scenario
                bestScenarioPayout = Math.max(
                    bestScenarioPayout,
                    potentialPayout
                );

                const winChance = (myBetAmount / optionTotalBets) * 100;
                maxWinChance = Math.max(maxWinChance, winChance);
            }
        });

        // Calculate profit based on the best winning scenario
        const potentialProfit = bestScenarioPayout - myTotalBets;

        return {
            totalBetAmount,
            myTotalBets,
            myBetsByOption,
            expectedPayout: bestScenarioPayout,
            potentialProfit,
            winningChance: maxWinChance,
            isProfit: potentialProfit > 0,
        };
    }, [poll, pollLogs]);

    const options = poll.options as unknown as PollOption[];
    const optionBetAmounts = (poll.optionBetAmounts as any) || {};

    if (!bettingAsset) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogTitle> </DialogTitle>
            <DialogContent className="sm:max-w-[800px] bg-gray-900 border-gray-800 p-0 max-h-[90vh] overflow-y-auto">
                <div className="absolute inset-0 pointer-events-none z-0 opacity-10">
                    <img
                        src="/elements/fire-background.gif"
                        alt="Fire background"
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                        style={{
                            mixBlendMode: "overlay",
                            filter: "hue-rotate(10deg) saturate(1.3) brightness(1.1)",
                        }}
                    />
                </div>
                <div className="px-3 py-12 space-y-3">
                    {/* Profit/Loss Display */}
                    <ProfitDisplay
                        stats={bettingStats}
                        asset={bettingAsset.asset}
                    />

                    {/* Detailed Breakdown */}
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                        >
                            {options.map((option) => {
                                const myBetAmount =
                                    bettingStats.myBetsByOption[
                                        option.optionId
                                    ] || 0;
                                const totalOptionBets =
                                    optionBetAmounts[option.optionId] || 0;

                                if (myBetAmount === 0) return null;

                                return (
                                    <Summary
                                        key={option.optionId}
                                        pollTitle={poll.title}
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
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="bg-gray-800/40 rounded-lg border border-gray-600/30 text-center p-6">
                        <Clock
                            className={cn(
                                "text-orange-400 mx-auto mb-3",
                                getResponsiveClass(30).frameClass
                            )}
                        />
                        <p
                            className={cn(
                                "text-gray-300 font-semibold mb-2",
                                getResponsiveClass(20).textClass
                            )}
                        >
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

                        <Countdown
                            endDate={new Date(poll.endDate)}
                            className="text-gray-300 font-semibold"
                            size={15}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
