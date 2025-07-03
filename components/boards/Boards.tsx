/// components/boards/Boards.tsx

"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageCircle, Users, Crown, Lock, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

import { useBoards } from "@/app/actions/boards/hooks";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import PartialLoading from "../atoms/PartialLoading";

import type { ArtistWithSPG } from "@/app/actions/artists";

interface BoardsProps {
    artist: ArtistWithSPG;
}

export default React.memo(function Boards({ artist }: BoardsProps) {
    const router = useRouter();

    const { boardsData, isBoardsLoading } = useBoards({
        getBoardsInput: {
            artistId: artist.id,
            isPublic: true,
            isActive: true,
        },
    });

    const handleBoardClick = (boardId: string) => {
        router.push(`/boards/${boardId}`);
    };

    if (isBoardsLoading) {
        return (
            <div
                className={cn(
                    "w-full flex justify-center items-center",
                    getResponsiveClass(40).paddingClass
                )}
            >
                <PartialLoading text="Loading boards..." />
            </div>
        );
    }

    const boards = boardsData?.boards || [];

    if (boards.length === 0) {
        return (
            <div
                className={cn(
                    "text-center",
                    getResponsiveClass(40).paddingClass
                )}
            >
                <MessageCircle
                    className={cn(
                        "mx-auto text-white/40",
                        getResponsiveClass(60).frameClass,
                        getResponsiveClass(15).marginYClass
                    )}
                />
                <p
                    className={cn(
                        "text-white/60",
                        getResponsiveClass(18).textClass
                    )}
                >
                    No boards available yet
                </p>
                <p
                    className={cn(
                        "text-white/40",
                        getResponsiveClass(14).textClass,
                        getResponsiveClass(5).marginYClass
                    )}
                >
                    Amazing communities coming soon!
                </p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={cn(
                    "flex items-center",
                    getResponsiveClass(25).marginYClass,
                    getResponsiveClass(15).gapClass
                )}
            >
                <div
                    className={cn(
                        "rounded-xl bg-gradient-to-r from-white/20 to-white/30",
                        getResponsiveClass(15).paddingClass
                    )}
                >
                    <MessageCircle
                        className={cn(
                            "text-white",
                            getResponsiveClass(30).frameClass
                        )}
                    />
                </div>
                <h2
                    className={cn(
                        "font-bold text-white",
                        getResponsiveClass(30).textClass
                    )}
                >
                    Community Boards
                </h2>
                <div
                    className={cn(
                        "ml-auto px-3 py-1 rounded-full text-xs font-medium",
                        "bg-white/10 text-white/80 backdrop-blur-sm"
                    )}
                >
                    {boards.length} boards
                </div>
            </motion.div>

            <div
                className={cn(
                    "grid grid-cols-1 md:grid-cols-2",
                    getResponsiveClass(20).gapClass
                )}
            >
                {boards.map((board, index) => (
                    <motion.div
                        key={board.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        whileHover={{ y: -3, scale: 1.02 }}
                        onClick={() => handleBoardClick(board.id)}
                        className={cn(
                            "bg-gradient-to-br from-black/20 to-gray-900/40",
                            "backdrop-blur-sm border border-white/10",
                            "rounded-2xl overflow-hidden shadow-xl",
                            "hover:border-white/20 hover:shadow-2xl",
                            "transition-all duration-300 cursor-pointer group",
                            getResponsiveClass(25).paddingClass
                        )}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div
                                        className={cn(
                                            "rounded-lg p-2 shadow-lg bg-gradient-to-br from-white/15 to-white/25"
                                        )}
                                    >
                                        <MessageCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3
                                            className={cn(
                                                "font-bold text-white group-hover:text-white",
                                                getResponsiveClass(18).textClass
                                            )}
                                        >
                                            {board.name}
                                        </h3>
                                        {board.description && (
                                            <p
                                                className={cn(
                                                    "text-white/60 line-clamp-2 mt-1",
                                                    getResponsiveClass(14)
                                                        .textClass
                                                )}
                                            >
                                                {board.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {!board.isPublic && (
                                            <Lock className="w-4 h-4 text-white/70" />
                                        )}
                                        {board.artist && (
                                            <Crown className="w-4 h-4 text-white/70" />
                                        )}
                                    </div>
                                </div>

                                {/* Board Stats */}
                                <div className="flex items-center gap-4 text-sm text-white/60">
                                    <div className="flex items-center gap-1">
                                        <MessageCircle className="w-4 h-4" />
                                        <span>{board.posts.length}</span>
                                    </div>
                                    {board.popularPostRewardEnabled && (
                                        <div className="flex items-center gap-1">
                                            <TrendingUp className="w-4 h-4 text-white/70" />
                                            <span>
                                                {board.popularPostThreshold}{" "}
                                                likes
                                            </span>
                                        </div>
                                    )}
                                    {(board.postCreationRewardEnabled ||
                                        board.popularPostRewardEnabled ||
                                        board.qualityContentRewardEnabled) && (
                                        <div className="flex items-center gap-1">
                                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-white/60 to-white/80" />
                                            <span>Rewards</span>
                                        </div>
                                    )}
                                </div>

                                {/* Reward Info */}
                                {(board.postCreationRewardEnabled ||
                                    board.popularPostRewardEnabled ||
                                    board.qualityContentRewardEnabled) && (
                                    <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-white/5 to-white/10 border border-white/15">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-white/60 to-white/80" />
                                            <span className="text-xs font-medium text-white/80">
                                                Reward System Active
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-xs text-white/70">
                                            {board.postCreationRewardEnabled && (
                                                <div>
                                                    💰 Post Creation:{" "}
                                                    {
                                                        board.postCreationRewardAmount
                                                    }{" "}
                                                    SGP
                                                    {(board.dailyPostLimit ||
                                                        board.weeklyPostLimit) && (
                                                        <span className="text-white/50">
                                                            {" "}
                                                            (
                                                            {board.dailyPostLimit &&
                                                                `${board.dailyPostLimit}/day`}
                                                            {board.dailyPostLimit &&
                                                                board.weeklyPostLimit &&
                                                                ", "}
                                                            {board.weeklyPostLimit &&
                                                                `${board.weeklyPostLimit}/week`}
                                                            )
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {board.popularPostRewardEnabled && (
                                                <div>
                                                    🔥 Popular Post Bonus:{" "}
                                                    {
                                                        board.popularPostRewardAmount
                                                    }{" "}
                                                    SGP
                                                </div>
                                            )}
                                            {board.qualityContentRewardEnabled && (
                                                <div>
                                                    ⭐ Quality Content:{" "}
                                                    {
                                                        board.qualityContentRewardAmount
                                                    }{" "}
                                                    SGP
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Board Rules Preview */}
                                {board.rules && (
                                    <div className="mt-3 p-3 rounded-xl bg-black/10 border border-white/15">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Users className="w-3 h-3 text-white/70" />
                                            <span className="text-xs font-medium text-white/80">
                                                Board Rules
                                            </span>
                                        </div>
                                        <p className="text-xs text-white/70 line-clamp-2">
                                            {board.rules}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Hover Effect Overlay */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl bg-gradient-to-br from-white/20 to-white/40" />
                    </motion.div>
                ))}
            </div>

            {/* Action Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + boards.length * 0.1 }}
                className={cn(
                    "mt-6 p-4 rounded-xl bg-gradient-to-r from-white/5 to-white/10",
                    "border border-white/15 text-center"
                )}
            >
                <p className="text-white/80 text-sm">
                    {`💬 Click boards to join the community and earn ${artist.name} tokens!`}
                </p>
            </motion.div>
        </div>
    );
});
