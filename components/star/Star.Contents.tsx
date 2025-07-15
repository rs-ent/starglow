/// components/star/Star.Contents.tsx

"use client";

import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, VoteIcon, Trophy, Users, MessageCircleHeart } from "lucide-react";
import Image from "next/image";
import Head from "next/head";

import { usePollsGet } from "@/app/hooks/usePolls";
import { useQuestGet } from "@/app/hooks/useQuest";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { ArtistBG, ArtistFG } from "@/lib/utils/get/artist-colors";

import ArtistMessage from "../artists/ArtistMessage";
import PollsContentsPrivateArtistList from "../polls/Polls.Contents.Private.ArtistList";
import QuestsArtistMissions from "../quests/Quests.Contents.Private.ArtistMissions";
import BoardContent from "../boards/Board.Content";
import StarStore from "../store/Star.Store";

import type { Player } from "@prisma/client";
import type { ArtistForStarPage } from "@/app/actions/artists";
import { useBoards } from "@/app/actions/boards/hooks";

interface StarContentsProps {
    player: Player | null;
    artist: ArtistForStarPage;
}

export default React.memo(function StarContents({
    player,
    artist,
}: StarContentsProps) {
    const artistColors = useMemo(
        () => ({
            background: {
                bg0: ArtistBG(artist, 0, 100),
                bg1: ArtistBG(artist, 1, 100),
                bg2: ArtistBG(artist, 2, 100),
                bg3: ArtistBG(artist, 3, 100),
                bg0_20: ArtistBG(artist, 0, 20),
                bg1_20: ArtistBG(artist, 1, 20),
                bg2_20: ArtistBG(artist, 2, 20),
                bg2_10: ArtistBG(artist, 2, 10),
            },
            foreground: {
                fg0: ArtistFG(artist, 0, 100),
                fg1: ArtistFG(artist, 1, 100),
                fg2: ArtistFG(artist, 2, 100),
            },
        }),
        [artist]
    );

    const backgroundStyle = {
        background: `linear-gradient(to bottom right, ${artistColors.background.bg0}, ${artistColors.background.bg1})`,
    };

    const heroSectionStyle = {
        background: `linear-gradient(to bottom right, ${artistColors.background.bg0_20}, ${artistColors.background.bg1_20}, ${artistColors.background.bg2_20})`,
        boxShadow: `0 0 20px ${artistColors.background.bg0_20}`,
    };

    const titleStyle = {
        background: `linear-gradient(to right, ${artistColors.foreground.fg0}, ${artistColors.foreground.fg1}, ${artistColors.foreground.fg2})`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
    };

    const pollsProps = useMemo(
        () => ({
            bgColorFrom: artistColors.background.bg0,
            bgColorTo: artistColors.background.bg1,
            bgColorAccentFrom: artistColors.background.bg2,
            bgColorAccentTo: artistColors.background.bg3,
            fgColorFrom: artistColors.background.bg2_10,
            fgColorTo: artistColors.background.bg1,
        }),
        [artistColors]
    );

    const { artistAllBoardPostCountData: totalPosts } = useBoards({
        getArtistAllBoardPostCountInput: {
            artistId: artist.id,
        },
    });

    const { artistAllActivePollCount: totalPolls } = usePollsGet({
        getArtistAllActivePollCountInput: {
            artistId: artist.id,
        },
    });

    const { artistAllActiveQuestCount: totalQuests } = useQuestGet({
        getArtistAllActiveQuestCountInput: {
            artistId: artist.id,
        },
    });

    return (
        <>
            <Head>
                <link
                    rel="preload"
                    as="image"
                    href={artist.imageUrl || "/default-avatar.jpg"}
                    fetchPriority="high"
                />
            </Head>
            <div className="relative h-full w-full mb-[100px] md:mb-[50px]">
                <div
                    className="fixed inset-0 bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#16213e] -z-10"
                    style={backgroundStyle}
                />

                <div
                    className={cn(
                        "fixed inset-0 overflow-hidden -z-10 bg-blend-overlay",
                        "bg-gradient-to-br from-[rgba(0,0,0,0.6)] via-[rgba(0,0,0,0.25)] to-[rgba(0,0,0,0.5)]"
                    )}
                />

                <div className="relative z-10 w-full flex flex-col items-center">
                    <div className="w-full max-w-[1200px] flex flex-col">
                        <HeroSection
                            artist={artist}
                            heroSectionStyle={heroSectionStyle}
                            titleStyle={titleStyle}
                        />

                        <div className="w-full p-2">
                            <StatsSection
                                totalPosts={totalPosts || 0}
                                totalPolls={totalPolls || 0}
                                totalQuests={totalQuests || 0}
                            />

                            <CommunitySection artist={artist} />

                            <BoardSection artist={artist} player={player} />

                            <InteractiveSection
                                artist={artist}
                                player={player}
                                pollsProps={pollsProps}
                            />

                            <StoreSection artist={artist} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
});

const StatsSection = memo(function StatsSection({
    totalPosts,
    totalPolls,
    totalQuests,
}: {
    totalPosts: number;
    totalPolls: number;
    totalQuests: number;
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={cn("w-full", getResponsiveClass(30).marginYClass)}
        >
            <div
                className={cn(
                    "grid grid-cols-3 max-w-2xl mx-auto",
                    getResponsiveClass(25).gapClass
                )}
            >
                <div
                    className={cn(
                        "rounded-xl text-center backdrop-blur-sm shadow-md",
                        "bg-gradient-to-br from-[rgba(0,0,0,0.05)] to-[rgba(0,0,0,0.1)]",
                        getResponsiveClass(25).paddingClass
                    )}
                >
                    <MessageCircleHeart
                        className={cn(
                            "mx-auto text-white/80",
                            getResponsiveClass(35).frameClass,
                            getResponsiveClass(10).marginYClass
                        )}
                    />
                    <p
                        className={cn(
                            "text-white/80",
                            getResponsiveClass(12).textClass,
                            getResponsiveClass(5).marginYClass
                        )}
                    >
                        Posts
                    </p>
                    <p
                        className={cn(
                            "text-white font-bold",
                            getResponsiveClass(25).textClass
                        )}
                    >
                        {totalPosts}
                    </p>
                </div>
                <div
                    className={cn(
                        "rounded-xl text-center backdrop-blur-sm shadow-md",
                        "bg-gradient-to-br from-[rgba(0,0,0,0.05)] to-[rgba(0,0,0,0.1)]",
                        getResponsiveClass(25).paddingClass
                    )}
                >
                    <VoteIcon
                        className={cn(
                            "mx-auto text-white/80",
                            getResponsiveClass(35).frameClass,
                            getResponsiveClass(10).marginYClass
                        )}
                    />
                    <p
                        className={cn(
                            "text-white/80",
                            getResponsiveClass(12).textClass,
                            getResponsiveClass(5).marginYClass
                        )}
                    >
                        Engages
                    </p>
                    <p
                        className={cn(
                            "text-white font-bold",
                            getResponsiveClass(25).textClass
                        )}
                    >
                        {totalPolls || 0}
                    </p>
                </div>
                <div
                    className={cn(
                        "rounded-xl text-center backdrop-blur-sm shadow-md",
                        "bg-gradient-to-br from-[rgba(0,0,0,0.05)] to-[rgba(0,0,0,0.1)]",
                        getResponsiveClass(25).paddingClass
                    )}
                >
                    <Trophy
                        className={cn(
                            "mx-auto text-white/80",
                            getResponsiveClass(35).frameClass,
                            getResponsiveClass(10).marginYClass
                        )}
                    />
                    <p
                        className={cn(
                            "text-white/80",
                            getResponsiveClass(12).textClass,
                            getResponsiveClass(5).marginYClass
                        )}
                    >
                        Quests
                    </p>
                    <p
                        className={cn(
                            "text-white font-bold",
                            getResponsiveClass(25).textClass
                        )}
                    >
                        {totalQuests || 0}
                    </p>
                </div>
            </div>
        </motion.section>
    );
});

const CommunitySection = memo(function CommunitySection({
    artist,
}: {
    artist: ArtistForStarPage;
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={cn("w-full", getResponsiveClass(40).marginYClass)}
        >
            <div
                className={cn(
                    "backdrop-blur-lg rounded-3xl shadow-xl transition-all duration-500",
                    "bg-gradient-to-br from-[rgba(0,0,0,0.05)] to-[rgba(0,0,0,0.2)]",
                    getResponsiveClass(35).paddingClass
                )}
            >
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className={cn(
                        "flex items-center",
                        getResponsiveClass(25).marginYClass,
                        getResponsiveClass(15).gapClass
                    )}
                >
                    <div className="rounded-xl bg-gradient-to-r from-white/20 to-white/30 p-3">
                        <Users
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
                        Spotlight
                    </h2>
                </motion.div>
                <MessageSection artist={artist} />
            </div>
        </motion.section>
    );
});

const BoardSection = memo(function BoardSection({
    artist,
    player,
}: {
    artist: ArtistForStarPage;
    player: Player | null;
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className={cn("w-full", getResponsiveClass(40).marginYClass)}
        >
            <div
                className={cn(
                    "backdrop-blur-lg rounded-3xl shadow-xl transition-all duration-500",
                    "bg-gradient-to-br from-[rgba(0,0,0,0.05)] to-[rgba(0,0,0,0.2)]",
                    getResponsiveClass(35).paddingClass
                )}
            >
                <BoardContent
                    artistId={artist.id}
                    artistName={artist.name}
                    artistLogoUrl={artist.logoUrl || ""}
                    backgroundColors={artist.backgroundColors}
                    foregroundColors={artist.foregroundColors}
                    player={player}
                />
            </div>
        </motion.section>
    );
});

const InteractiveSection = memo(function InteractiveSection({
    artist,
    player,
    pollsProps,
}: {
    artist: ArtistForStarPage;
    player: Player | null;
    pollsProps: {
        bgColorFrom: string;
        bgColorTo: string;
        bgColorAccentFrom: string;
        bgColorAccentTo: string;
        fgColorFrom: string;
        fgColorTo: string;
    };
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className={cn("w-full", getResponsiveClass(40).marginYClass)}
        >
            <div
                className={cn(
                    "backdrop-blur-lg rounded-3xl shadow-xl transition-all duration-500",
                    "bg-gradient-to-br from-[rgba(0,0,0,0.05)] to-[rgba(0,0,0,0.2)]",
                    getResponsiveClass(35).paddingClass
                )}
            >
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className={cn(
                        "flex items-center",
                        getResponsiveClass(25).marginYClass,
                        getResponsiveClass(15).gapClass
                    )}
                >
                    <div className="rounded-xl bg-gradient-to-r from-white/20 to-white/30 p-3">
                        <Zap
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
                        Quests & Engages
                    </h2>
                </motion.div>

                <div
                    className={cn(
                        "grid grid-cols-1 lg:grid-cols-2",
                        getResponsiveClass(25).gapClass
                    )}
                >
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                        className={cn(
                            "bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.2)] rounded-2xl border border-white/20",
                            "overflow-hidden"
                        )}
                    >
                        <QuestsArtistMissions
                            artistId={artist.id}
                            player={player}
                            showInviteFriends={false}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 }}
                        className={cn(
                            "bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.2)] rounded-2xl border border-white/20",
                            getResponsiveClass(10).paddingClass
                        )}
                    >
                        <PollsContentsPrivateArtistList
                            artistId={artist.id}
                            player={player}
                            forceSlidesToShow={1}
                            {...pollsProps}
                        />
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
});

const StoreSection = memo(function StoreSection({
    artist,
}: {
    artist: ArtistForStarPage;
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={cn("w-full", getResponsiveClass(40).marginYClass)}
        >
            <div
                className={cn(
                    "backdrop-blur-lg rounded-3xl shadow-xl transition-all duration-500",
                    "bg-gradient-to-br from-[rgba(0,0,0,0.05)] to-[rgba(0,0,0,0.2)]",
                    getResponsiveClass(35).paddingClass
                )}
            >
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className={cn(
                        "flex items-center",
                        getResponsiveClass(25).marginYClass,
                        getResponsiveClass(15).gapClass
                    )}
                >
                    <div className="rounded-xl bg-gradient-to-r from-white/20 to-white/30 p-3">
                        <VoteIcon
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
                        {artist.name || "Star"} Store
                    </h2>
                    <div
                        className={cn(
                            "rounded-full font-medium",
                            "bg-gradient-to-r from-purple-500/20 to-blue-500/20",
                            "border border-purple-400/30 text-purple-200",
                            getResponsiveClass(15).paddingClass,
                            getResponsiveClass(10).textClass
                        )}
                    >
                        🚀 Coming Soon
                    </div>
                </motion.div>

                <StarStore backgroundColors={artist.backgroundColors} />
            </div>
        </motion.section>
    );
});

const MessageSection = memo(function MessageSection({
    artist,
}: {
    artist: ArtistForStarPage;
}) {
    return (
        <div className={cn("space-y-8")}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <ArtistMessage
                    artistId={artist.id}
                    backgroundColors={artist.backgroundColors}
                />
            </motion.div>
        </div>
    );
});

const HeroSection = memo(function HeroSection({
    artist,
    heroSectionStyle,
    titleStyle,
}: {
    artist: ArtistForStarPage;
    heroSectionStyle: React.CSSProperties;
    titleStyle: React.CSSProperties;
}) {
    return (
        <section>
            <div
                className={cn(
                    "backdrop-blur-lg shadow-2xl overflow-hidden transition-all duration-500"
                )}
                style={heroSectionStyle}
            >
                <motion.div
                    initial={{ opacity: 0.6, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: 0.2,
                        duration: 2.0,
                        ease: [0.19, 1, 0.22, 1],
                    }}
                    className="relative flex items-center justify-center overflow-hidden aspect-[4/3]"
                >
                    <Image
                        src={artist.imageUrl || "/default-avatar.jpg"}
                        alt={artist.name}
                        sizes="100vw"
                        quality={100}
                        fill
                        className="object-cover object-center w-full h-full"
                        priority={true}
                        unoptimized={false}
                    />
                    <div className="absolute h-[50% ] inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.5)] via-[rgba(0,0,0,0.1)] to-transparent" />

                    <div
                        className={cn(
                            "absolute bottom-0 right-1 text-center flex flex-col items-center justify-center",
                            getResponsiveClass(35).paddingClass
                        )}
                    >
                        <motion.h1
                            initial={{
                                opacity: 0,
                                x: -80,
                                scale: 0.9,
                            }}
                            animate={{
                                opacity: 1,
                                x: 0,
                                scale: 1,
                            }}
                            transition={{
                                delay: 0.5,
                                duration: 1.5,
                                ease: [0.23, 1, 0.32, 1],
                            }}
                            className={cn(
                                "text-transparent bg-clip-text text-center w-full",
                                "font-bold drop-shadow-2xl",
                                "text-glow-white-smooth",
                                getResponsiveClass(55).textClass,
                                getResponsiveClass(15).marginYClass
                            )}
                            style={titleStyle}
                        >
                            {artist.name}
                        </motion.h1>
                    </div>
                </motion.div>
            </div>
        </section>
    );
});
