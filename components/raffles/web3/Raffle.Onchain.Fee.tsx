/// components/raffles/web3/Raffle.Onchain.Fee.tsx

"use client";

import { memo, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { DollarSign, Gift, Coins, Zap } from "lucide-react";
import Image from "next/image";

import { useAssetsGet } from "@/app/actions/assets/hooks";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { Particles } from "@/components/magicui/particles";
import { NumberTicker } from "@/components/magicui/number-ticker";

interface RaffleOnchainFeeProps {
    data?: {
        participationFeeAmount?: bigint | number;
        participationFeeAssetId?: string;
    };
}

export default memo(function RaffleOnchainFee({ data }: RaffleOnchainFeeProps) {
    const { asset } = useAssetsGet({
        getAssetInput: {
            id: data?.participationFeeAssetId || "",
        },
    });

    const feeAmount = useMemo(
        () =>
            data?.participationFeeAmount
                ? Number(data.participationFeeAmount)
                : 0,
        [data?.participationFeeAmount]
    );

    const isFree = useMemo(() => feeAmount === 0, [feeAmount]);

    const containerVariants = useMemo(
        () => ({
            hidden: { opacity: 0, y: 30, scale: 0.95 },
            visible: {
                opacity: 1,
                y: 0,
                scale: 1,
            },
        }),
        []
    );

    const itemVariants = useMemo(
        () => ({
            hidden: { opacity: 0, x: -20 },
            visible: {
                opacity: 1,
                x: 0,
            },
        }),
        []
    );

    const renderLoadingState = useCallback(
        () => (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "relative bg-gradient-to-br from-slate-900/90 via-blue-950/60 to-purple-950/40",
                    "backdrop-blur-xl border border-cyan-400/30 rounded-3xl shadow-2xl shadow-cyan-500/20",
                    "p-6 overflow-hidden"
                )}
            >
                <Particles
                    className="absolute inset-0"
                    quantity={30}
                    staticity={50}
                    color="#06b6d4"
                    size={0.8}
                />

                <div className="flex items-center justify-center relative z-10">
                    <motion.div
                        className="relative"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    >
                        <div className="h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
                        <div
                            className="absolute inset-0 h-8 w-8 border-2 border-purple-400/50 border-b-transparent rounded-full animate-spin"
                            style={{
                                animationDirection: "reverse",
                                animationDuration: "1.5s",
                            }}
                        />
                    </motion.div>
                    <span className="ml-3 text-cyan-100 font-medium">
                        Scanning entry parameters...
                    </span>
                </div>
            </motion.div>
        ),
        []
    );

    if (!data) {
        return renderLoadingState();
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            transition={{
                duration: 0.8,
                ease: "easeOut",
                staggerChildren: 0.1,
            }}
            className={cn(
                "relative bg-gradient-to-br from-slate-900/95 via-blue-950/70 to-purple-950/50",
                "backdrop-blur-xl border border-cyan-400/30 rounded-3xl overflow-hidden",
                "shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/30",
                "p-3 transition-all duration-500"
            )}
        >
            <Particles
                className="absolute inset-0"
                quantity={40}
                staticity={30}
                color={isFree ? "#10b981" : "#f59e0b"}
                size={1}
                refresh={false}
            />

            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute inset-0"
                    animate={{
                        background: isFree
                            ? [
                                  "radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
                                  "radial-gradient(circle at 80% 20%, rgba(52, 211, 153, 0.15) 0%, transparent 70%)",
                                  "radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 70%)",
                              ]
                            : [
                                  "radial-gradient(circle at 30% 70%, rgba(245, 158, 11, 0.12) 0%, transparent 60%)",
                                  "radial-gradient(circle at 70% 30%, rgba(251, 191, 36, 0.12) 0%, transparent 60%)",
                                  "radial-gradient(circle at 40% 60%, rgba(239, 68, 68, 0.12) 0%, transparent 60%)",
                              ],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: `${1.5 + Math.random() * 2}px`,
                            height: `${1.5 + Math.random() * 2}px`,
                            background: isFree
                                ? `rgba(6, 182, 212, ${
                                      0.4 + Math.random() * 0.4
                                  })`
                                : `rgba(245, 158, 11, ${
                                      0.4 + Math.random() * 0.4
                                  })`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -25 - Math.random() * 15, 0],
                            opacity: [0.4, 1, 0.4],
                            scale: [0.3, 1.5, 0.3],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 3,
                            repeat: Infinity,
                            delay: Math.random() * 3,
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10">
                <motion.div
                    variants={itemVariants}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={cn(
                        "flex items-center mb-3",
                        getResponsiveClass(15).gapClass
                    )}
                >
                    <div className="relative">
                        <motion.div
                            animate={{
                                rotate: [0, 8, -8, 0],
                                scale: [1, 1.05, 1],
                            }}
                            transition={{
                                duration: 6,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className={cn(
                                "p-3 rounded-2xl backdrop-blur-sm border-2",
                                isFree
                                    ? "bg-emerald-400/15 border-emerald-400/40"
                                    : "bg-amber-400/15 border-amber-400/40"
                            )}
                        >
                            <DollarSign
                                className={cn(
                                    getResponsiveClass(30).frameClass,
                                    isFree
                                        ? "text-emerald-400"
                                        : "text-amber-400"
                                )}
                            />
                        </motion.div>
                        <div
                            className={cn(
                                "absolute inset-0 rounded-2xl blur-lg opacity-50",
                                isFree ? "bg-emerald-400/20" : "bg-amber-400/20"
                            )}
                        />
                    </div>
                    <div>
                        <h3
                            className={cn(
                                "font-bold bg-gradient-to-r bg-clip-text text-transparent",
                                isFree
                                    ? "from-emerald-300 via-cyan-200 to-emerald-100"
                                    : "from-amber-300 via-yellow-200 to-amber-100",
                                getResponsiveClass(30).textClass
                            )}
                        >
                            Entry Fee
                        </h3>
                        <p
                            className={cn(
                                "text-slate-400 font-medium",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            {isFree ? "Access Granted" : "Payment Required"}
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    whileHover={{
                        scale: 1.02,
                        y: -2,
                        transition: { duration: 0.3, ease: "easeOut" },
                    }}
                    className={cn(
                        "relative rounded-3xl overflow-hidden backdrop-blur-lg shadow-2xl",
                        "border-2 transition-all duration-500",
                        isFree
                            ? "bg-gradient-to-br from-emerald-900/50 via-teal-900/40 to-cyan-900/30 border-emerald-400/40 shadow-emerald-500/25"
                            : "bg-gradient-to-br from-amber-900/50 via-orange-900/40 to-red-900/30 border-amber-400/40 shadow-amber-500/25",
                        "p-2"
                    )}
                >
                    <div
                        className={cn(
                            "absolute inset-0 opacity-30",
                            isFree
                                ? "bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-teal-500/10"
                                : "bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10"
                        )}
                    />

                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    "relative rounded-full border-1 overflow-hidden",
                                    isFree &&
                                        "bg-emerald-400/20 border-emerald-400/50 p-2"
                                )}
                            >
                                <div
                                    className={cn(
                                        "absolute inset-0 rounded-full blur-md",
                                        isFree
                                            ? "bg-emerald-400/30"
                                            : "bg-amber-400/30"
                                    )}
                                />
                                {isFree ? (
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.08, 1],
                                            rotate: [0, 5, -5, 0],
                                        }}
                                        transition={{
                                            duration: 5,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    >
                                        <Gift
                                            className={cn(
                                                "text-emerald-300 relative z-10 drop-shadow-lg",
                                                getResponsiveClass(60)
                                                    .frameClass
                                            )}
                                        />
                                    </motion.div>
                                ) : asset ? (
                                    <div>
                                        <Image
                                            src={asset.iconUrl || ""}
                                            alt={asset.symbol || "Token"}
                                            width={50}
                                            height={50}
                                            className={cn(
                                                "rounded-full object-contain relative z-10 border-2 border-amber-400/50",
                                                getResponsiveClass(70)
                                                    .frameClass
                                            )}
                                        />
                                    </div>
                                ) : (
                                    <motion.div
                                        animate={{
                                            rotate: [0, 8, -8, 0],
                                            scale: [1, 1.05, 1],
                                        }}
                                        transition={{
                                            duration: 6,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    >
                                        <Coins
                                            className={cn(
                                                "text-amber-300 relative z-10 drop-shadow-lg",
                                                getResponsiveClass(60)
                                                    .frameClass
                                            )}
                                        />
                                    </motion.div>
                                )}
                            </div>

                            <div>
                                <h4
                                    className={cn(
                                        "font-bold text-white drop-shadow-md flex items-center gap-2",
                                        getResponsiveClass(40).textClass
                                    )}
                                >
                                    {isFree ? (
                                        <>
                                            <Zap className="text-emerald-400 w-5 h-5" />
                                            FREE ENTRY
                                        </>
                                    ) : asset ? (
                                        <>
                                            <NumberTicker
                                                value={feeAmount}
                                                className="font-bold text-slate-200"
                                            />{" "}
                                            {asset.symbol}
                                        </>
                                    ) : (
                                        "PAID ENTRY"
                                    )}
                                </h4>
                                <p
                                    className={cn(
                                        "text-slate-300 font-medium",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    {isFree
                                        ? "Complimentary station access"
                                        : `${
                                              asset?.name ||
                                              asset?.symbol ||
                                              "Digital currency"
                                          } required for entry ticket`}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
});

/*
participationFeeAmount
: 
4n
participationFeeAsset
: 
"cmcq98cyn00vpjt0vlxsb9esn"
participationFeeAssetId
: 
"cmcq98cyn00vpjt0vlxsb9esn"*/
