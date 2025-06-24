/// components/user/User.MyStar.Modal.tsx

"use client";

import { motion } from "framer-motion";
import { ArrowBigLeft, Sparkles, TrendingUp, Award } from "lucide-react";

import { ArtistBG } from "@/lib/utils/get/artist-colors";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";

import UserMyStarModalContents from "./User.MyStar.Modal.Contents";

import type { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import type { VerifiedSPG } from "@/app/story/interaction/actions";
import type { Artist, Player, QuestLog, PollLog } from "@prisma/client";

interface UserMyStarModalProps {
    player: Player | null;
    questLogs: QuestLog[];
    pollLogs: PollLog[];
    artist: Artist | null;
    verifiedSPGs: VerifiedSPG[];
    onClose: () => void;
    onSelectFeed?: (
        initialFeeds: ArtistFeedWithReactions[],
        selectedFeedIndex: number
    ) => void;
}

export default function UserMyStarModal({
    artist,
    verifiedSPGs,
    onClose,
    player,
    questLogs,
    pollLogs,
    onSelectFeed,
}: UserMyStarModalProps) {
    if (!artist) return null;

    // 통계 계산
    const stats = {
        totalNFTs: verifiedSPGs.reduce(
            (sum, spg) => sum + spg.verifiedTokens.length,
            0
        ),
        collections: verifiedSPGs.length,
        questsAvailable: questLogs.filter((log) => !log.isClaimed).length,
        pollsAvailable: pollLogs.length,
    };

    return (
        <div className={cn("w-full h-full relative overflow-y-auto")}>
            {/* 헤더 */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={cn(
                    "relative z-10 flex items-center justify-between",
                    "p-6 border-b border-white/10"
                )}
            >
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className={cn(
                        "p-2 rounded-lg bg-white/10 backdrop-blur-sm",
                        "hover:bg-white/20 transition-all"
                    )}
                >
                    <ArrowBigLeft className="w-6 h-6 text-white" />
                </motion.button>

                <div className="flex items-center gap-3">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                            delay: 0.2,
                            type: "spring",
                            stiffness: 200,
                        }}
                        className={cn(
                            "rounded-full p-2",
                            getResponsiveClass(50).frameClass
                        )}
                        style={{
                            background: `linear-gradient(135deg, ${ArtistBG(
                                artist,
                                0,
                                100
                            )}, ${ArtistBG(artist, 1, 100)})`,
                        }}
                    >
                        <Sparkles className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className={cn(
                                "font-bold text-white",
                                getResponsiveClass(25).textClass
                            )}
                        >
                            {artist.name}
                        </motion.h1>
                    </div>
                </div>
            </motion.div>

            {/* Web3 통계 카드들 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={cn(
                    "grid grid-cols-1 md:grid-cols-4 gap-4",
                    "p-6 border-b border-white/10"
                )}
            >
                {[
                    {
                        label: "NFTs",
                        value: stats.totalNFTs,
                        icon: Award,
                        color: "purple",
                    },
                    {
                        label: "Collections",
                        value: stats.collections,
                        icon: Sparkles,
                        color: "pink",
                    },
                    {
                        label: "Quests",
                        value: stats.questsAvailable,
                        icon: TrendingUp,
                        color: "blue",
                    },
                    {
                        label: "Polls",
                        value: stats.pollsAvailable,
                        icon: Award,
                        color: "green",
                    },
                ].map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className={cn(
                            "bg-gradient-to-br from-white/10 to-white/5",
                            "backdrop-blur-sm border border-white/10",
                            "rounded-xl p-4 text-center"
                        )}
                    >
                        <stat.icon
                            className={cn(
                                "w-6 h-6 mx-auto mb-2",
                                stat.color === "purple" && "text-purple-400",
                                stat.color === "pink" && "text-pink-400",
                                stat.color === "blue" && "text-blue-400",
                                stat.color === "green" && "text-green-400"
                            )}
                        />
                        <p
                            className={cn(
                                "font-bold text-white",
                                getResponsiveClass(20).textClass
                            )}
                        >
                            {stat.value}
                        </p>
                        <p className="text-xs text-white/70">{stat.label}</p>
                    </motion.div>
                ))}
            </motion.div>

            {/* 메인 콘텐츠 */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex-1 overflow-y-auto"
            >
                <div
                    className={cn(
                        "bg-gradient-to-br from-white/5 to-transparent",
                        "backdrop-blur-sm border-t border-white/10",
                        "min-h-full"
                    )}
                >
                    <UserMyStarModalContents
                        artist={artist}
                        verifiedSPGs={verifiedSPGs}
                        player={player}
                        questLogs={questLogs}
                        pollLogs={pollLogs}
                        onSelectFeed={onSelectFeed}
                    />
                </div>
            </motion.div>
        </div>
    );
}
