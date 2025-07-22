/// components/raffles/web3/Raffles.Onchain.List.tsx

"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Raffle } from "@/app/actions/raffles/onchain/actions-read";
import RafflesOnchainListCard from "./Raffles.Onchain.List.Card";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";

interface RafflesOnchainListProps {
    raffles: Raffle[];
}

export default memo(function RafflesOnchainList({
    raffles,
}: RafflesOnchainListProps) {
    return (
        <div className="relative flex flex-col w-full min-h-screen h-full overflow-hidden">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />

            <div
                className="absolute inset-0 bg-gradient-radial from-purple-500/30 via-transparent to-transparent blur-xl animate-pulse-slow -z-10"
                style={{
                    background: `
                        radial-gradient(circle at 20% 30%, rgba(33, 109, 172, 0.57) 0%, transparent 60%),
                        radial-gradient(circle at 80% 70%, rgba(177, 112, 171, 0.4) 0%, transparent 50%),
                        radial-gradient(circle at 60% 20%, rgba(102, 72, 236, 0.62) 0%, transparent 40%),
                        radial-gradient(circle at 40% 80%, rgba(88, 45, 74, 0.56) 0%, transparent 45%)
                    `,
                }}
            />

            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float-slow -z-10" />
            <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-pink-400/15 rounded-full blur-2xl animate-float-slow-reverse -z-10" />
            <div className="absolute top-1/2 left-3/4 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-float-medium -z-10" />

            <div className="absolute inset-0 backdrop-blur-sm bg-black/10 -z-10" />

            <div
                className={cn(
                    "flex flex-col w-full max-w-[1400px] mx-auto",
                    getResponsiveClass(20).paddingClass
                )}
            >
                <h2
                    className={cn(
                        "text-center text-4xl font-bold",
                        "mt-[70px] md:mt-[80px] lg:mt-[20px]",
                        getResponsiveClass(45).textClass
                    )}
                >
                    On-chain Raffles
                </h2>

                <AnimatePresence mode="wait">
                    {raffles.length > 0 ? (
                        <motion.div
                            key="raffles"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                                "grid grid-cols-1",
                                "mb-[100px] lg:mb-[40px]",
                                getResponsiveClass(50).gapClass
                            )}
                        >
                            {raffles.map((raffle: any, index: number) => (
                                <RafflesOnchainListCard
                                    key={`${raffle.contractAddress}-${raffle.raffleId}`}
                                    contractAddress={raffle.contractAddress}
                                    raffleId={raffle.raffleId}
                                    index={index}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <EmptyState />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});

const EmptyState = memo(function EmptyState() {
    return (
        <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
                "col-span-full",
                "morp-glass-1 inner-shadow rounded-3xl text-center",
                getResponsiveClass(60).paddingClass
            )}
            style={{
                background:
                    "linear-gradient(to bottom right, rgba(0,0,0,0.2), rgba(0,0,0,0.05))",
            }}
        >
            <div className={cn("mb-4", getResponsiveClass(60).textClass)}>
                🎁
            </div>
            <h3
                className={cn(
                    "font-bold text-white mb-2",
                    getResponsiveClass(30).textClass
                )}
            >
                No On-chain Raffles Available
            </h3>
            <p
                className={cn(
                    "text-white/60",
                    getResponsiveClass(15).textClass
                )}
            >
                New on-chain raffles will appear here when they become
                available.
            </p>
        </motion.div>
    );
});
