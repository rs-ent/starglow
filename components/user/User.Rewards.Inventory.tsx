/// components/user/User.Rewards.Inventory.Deprecated.tsx

"use client";

import React, { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Loader2 } from "lucide-react";

import { useInfinitePlayerAssetsQuery } from "@/app/actions/playerAssets/queries";
import RewardButton from "@/components/atoms/Reward.Button";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";

import UserRewardsModal from "./User.Rewards.Modal";

import type { Player } from "@prisma/client";
import type { PlayerAssetWithAsset } from "@/app/actions/playerAssets/actions";

interface UserRewardsProps {
    player: Player | null;
}

const ITEMS_PER_PAGE = 9;

export default function UserRewards({ player }: UserRewardsProps) {
    const triggerRef = useRef<HTMLDivElement>(null);

    // 무한 스크롤 쿼리 - 다른 컴포넌트와 동일한 패턴
    const {
        data: infiniteData,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        error,
    } = useInfinitePlayerAssetsQuery(
        player?.id
            ? {
                  filter: {
                      playerId: player.id,
                  },
                  pagination: {
                      limit: ITEMS_PER_PAGE,
                  },
              }
            : undefined
    );

    // 모든 자산을 하나의 배열로 합치기 (다른 컴포넌트와 동일한 패턴)
    const allAssets = useMemo(() => {
        const data = infiniteData as any;
        if (!data?.pages) return [];
        return data.pages.flatMap((page: any) =>
            page.success ? page.data?.assets || [] : []
        );
    }, [infiniteData]);

    // Intersection Observer로 무한 스크롤 구현 (다른 컴포넌트와 동일한 패턴)
    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const target = entries[0];
                if (
                    target.isIntersecting &&
                    hasNextPage &&
                    !isFetchingNextPage
                ) {
                    fetchNextPage().catch((error) => {
                        console.error("Failed to fetch next page:", error);
                    });
                }
            },
            {
                root: null,
                rootMargin: "100px",
                threshold: 0.1,
            }
        );

        const currentRef = triggerRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const { playerAssetList, slots } = useMemo(() => {
        const length = allAssets.length;
        const rest = length % 3 === 0 ? 0 : 3 - (length % 3);
        const slots = Array.from({ length: length + rest }).map((_, idx) =>
            idx < length ? allAssets[idx] : null
        );

        return { playerAssetList: allAssets, slots };
    }, [allAssets]);

    const [selectedReward, setSelectedReward] =
        useState<PlayerAssetWithAsset | null>(null);
    const [showModal, setShowModal] = useState(false);

    const handleRewardClick = (asset: PlayerAssetWithAsset) => {
        setSelectedReward(asset);
        setShowModal(true);
    };

    const isInitialLoading = isLoading && allAssets.length === 0;

    return (
        <>
            <UserRewardsModal
                showModal={showModal}
                setShowModal={setShowModal}
                selectedReward={selectedReward}
                rewards={playerAssetList}
                playerId={player?.id ?? ""}
            />

            <div
                className={cn(
                    "w-full max-w-[1000px] mx-auto",
                    "px-4 sm:px-6 lg:px-8",
                    "max-h-[500px] sm:max-h-[600px] md:max-h-[700px] lg:max-h-[800px]",
                    "overflow-y-auto overflow-x-hidden",
                    "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30",
                    "scroll-smooth"
                )}
            >
                {/* Initial Loading State */}
                {isInitialLoading && (
                    <div className="grid grid-cols-3 gap-1 md:gap-2 lg:gap-4 my-[50px]">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                className={cn(
                                    "aspect-square rounded-[20px]",
                                    "bg-gradient-to-br from-white/5 to-white/10",
                                    "border border-white/10",
                                    "backdrop-blur-sm",
                                    "relative overflow-hidden"
                                )}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="text-center py-8">
                        <p className="text-red-400">Failed to load rewards</p>
                        <button
                            className="mt-2 text-sm text-white/60 underline underline-offset-2"
                            onClick={() => window.location.reload()}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Inventory Grid */}
                {!isInitialLoading && !error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className={cn(
                            "grid grid-cols-3 gap-1 md:gap-2 lg:gap-4",
                            "my-[50px]"
                        )}
                    >
                        <AnimatePresence>
                            {slots.map(
                                (asset: PlayerAssetWithAsset | null, idx) => (
                                    <InventorySlot
                                        key={idx}
                                        asset={asset}
                                        index={idx}
                                        onClick={
                                            asset
                                                ? () => handleRewardClick(asset)
                                                : undefined
                                        }
                                    />
                                )
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Infinite Scroll Trigger */}
                <div ref={triggerRef} className="w-full h-4" />

                {/* Loading More State */}
                {isFetchingNextPage && (
                    <div className="flex justify-center items-center py-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center space-x-2 text-white/60"
                        >
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span
                                className={cn(getResponsiveClass(14).textClass)}
                            >
                                Loading more rewards...
                            </span>
                        </motion.div>
                    </div>
                )}
            </div>
        </>
    );
}

interface InventorySlotProps {
    asset: PlayerAssetWithAsset | null;
    index: number;
    onClick?: () => void;
}

function InventorySlot({ asset, index, onClick }: InventorySlotProps) {
    const [isHovered, setIsHovered] = useState(false);

    if (asset) {
        // Filled slot with asset
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateY: -180 }}
                transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                }}
                whileHover={{
                    scale: 1.05,
                    rotateY: 5,
                    z: 10,
                }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "aspect-square relative group cursor-pointer",
                    "rounded-[20px] overflow-hidden",
                    "backdrop-blur-xl",
                    "transition-all duration-500 ease-out"
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={onClick}
                style={{
                    background: `
                        linear-gradient(135deg, 
                            rgba(255,255,255,0.1) 0%, 
                            rgba(255,255,255,0.05) 50%, 
                            rgba(255,255,255,0.1) 100%
                        )
                    `,
                    boxShadow: isHovered
                        ? `
                            0 25px 50px -12px rgba(168, 85, 247, 0.4),
                            0 0 30px rgba(168, 85, 247, 0.3),
                            inset 0 1px 0 rgba(255, 255, 255, 0.2)
                        `
                        : `
                            0 10px 25px -12px rgba(0, 0, 0, 0.25),
                            inset 0 1px 0 rgba(255, 255, 255, 0.1)
                        `,
                    border: `1px solid ${
                        isHovered
                            ? "rgba(168, 85, 247, 0.3)"
                            : "rgba(255, 255, 255, 0.1)"
                    }`,
                }}
            >
                {/* Shimmer Effect */}
                <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"
                    style={{
                        animation: isHovered ? "shimmer 2s infinite" : "none",
                        background:
                            "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                        transform: "translateX(-100%) skewX(-12deg)",
                    }}
                />

                {/* Rarity Glow */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-[20px]",
                        "bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20",
                        "opacity-0 group-hover:opacity-100",
                        "transition-opacity duration-500"
                    )}
                />

                {/* Asset Content */}
                <div className="relative w-full h-full z-10 hover:animate-pulse">
                    <RewardButton
                        index={index}
                        balance={asset?.balance ?? 0}
                        icon={asset?.asset?.iconUrl ?? ""}
                        name={asset?.asset?.name ?? ""}
                        className="w-full h-full"
                        isBalanceVisible={false}
                    />
                </div>

                {/* Balance Badge */}
                <div
                    className={cn(
                        "absolute top-3 right-3 z-30",
                        "px-2 py-1 rounded-full",
                        "bg-gradient-to-r from-purple-600/40 to-blue-800/20",
                        "backdrop-blur-sm border border-white/20",
                        "text-xs font-bold text-white",
                        "transform group-hover:scale-110",
                        "transition-transform duration-300",
                        getResponsiveClass(10).textClass
                    )}
                >
                    {asset.balance.toLocaleString()}
                </div>
            </motion.div>
        );
    }

    // Empty slot
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.6,
                delay: index * 0.1,
                type: "spring",
                stiffness: 150,
                damping: 25,
            }}
            className={cn(
                "aspect-square relative group",
                "rounded-[20px] overflow-hidden",
                "backdrop-blur-sm",
                "border-2 border-dashed border-white/20",
                "hover:border-white/40",
                "transition-all duration-500 ease-out",
                "flex items-center justify-center"
            )}
            style={{
                background: `
                    linear-gradient(135deg, 
                        rgba(255,255,255,0.02) 0%, 
                        rgba(255,255,255,0.05) 50%, 
                        rgba(255,255,255,0.02) 100%
                    )
                `,
                boxShadow: `
                    inset 0 2px 4px rgba(255, 255, 255, 0.05),
                    0 4px 12px rgba(0, 0, 0, 0.1)
                `,
            }}
        >
            {/* Subtle pulse animation */}
            <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-[20px]"
            />

            <div className="relative z-10 flex flex-col items-center justify-center text-white/30">
                <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="mb-2"
                >
                    <Plus className="w-8 h-8" />
                </motion.div>
                <span
                    className={cn(
                        getResponsiveClass(10).textClass,
                        "font-medium"
                    )}
                >
                    Empty
                </span>
            </div>
        </motion.div>
    );
}
