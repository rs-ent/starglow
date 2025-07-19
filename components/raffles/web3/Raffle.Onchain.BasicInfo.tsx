/// components/raffles/web3/Raffle.Onchain.BasicInfo.tsx

"use client";

import { memo } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";

interface RaffleOnchainBasicInfoProps {
    data?: {
        title?: string;
        description?: string;
        imageUrl?: string;
        iconUrl?: string;
    };
}

export default memo(function RaffleOnchainBasicInfo({
    data,
}: RaffleOnchainBasicInfoProps) {
    if (!data) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "bg-gradient-to-br from-[rgba(15,15,25,0.6)] to-[rgba(25,25,35,0.4)]",
                    "backdrop-blur-lg border border-[rgba(255,255,255,0.06)] rounded-3xl",
                    getResponsiveClass(25).paddingClass
                )}
            >
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgba(160,140,200,0.6)]"></div>
                    <span className="ml-3 text-[rgba(255,255,255,0.6)]">
                        Loading basic info...
                    </span>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "relative overflow-hidden rounded-3xl",
                "bg-gradient-to-br from-[rgba(15,25,35,0.8)] to-[rgba(25,35,45,0.6)]",
                "backdrop-blur-lg border border-[rgba(100,150,200,0.15)]",
                "shadow-2xl shadow-cyan-500/10",
                getResponsiveClass(30).paddingClass
            )}
        >
            {/* Animated background effects */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-purple-500/5" />

                {/* Floating particles */}
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.2, 0.8, 0.2],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 3,
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
});
