/// components/star/Star.Contents.tsx

"use client";

import React, { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Users, Trophy } from "lucide-react";
import Image from "next/image";
import Head from "next/head";

import { usePollsGet } from "@/app/hooks/usePolls";
import { useQuestGet } from "@/app/hooks/useQuest";
import ArtistFeedModal from "@/components/artists/Artist.Feed.Modal";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { ArtistBG, ArtistFG } from "@/lib/utils/get/artist-colors";

import ArtistMessage from "../artists/ArtistMessage";
import ArtistFeed from "../artists/Artist.Feed";
import PollsContentsPrivateArtistList from "../polls/Polls.Contents.Private.ArtistList";
import QuestsArtistMissions from "../quests/Quests.Contents.Private.ArtistMissions";
import PartialLoading from "../atoms/PartialLoading";
import BoardContent from "../boards/BoardContent";
import StarStore from "../store/Star.Store";

import type { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import type { ArtistWithSPG } from "@/app/actions/artists";
import type { Player } from "@prisma/client";

interface StarContentsProps {
    player: Player | null;
    artist: ArtistWithSPG;
}

type ModalState = "none" | "feed";

export default React.memo(function StarContents({
    player,
    artist,
}: StarContentsProps) {
    const [modalState, setModalState] = useState<ModalState>("none");
    const [initialFeeds, setInitialFeeds] = useState<ArtistFeedWithReactions[]>(
        []
    );
    const [selectedFeedIndex, setSelectedFeedIndex] = useState<number>(0);

    const { playerPollLogs, isLoading: isPollsLoading } = usePollsGet({
        getPlayerPollLogsInput: player
            ? {
                  playerId: player.id,
              }
            : undefined,
    });

    const { playerQuestLogs, isLoading: isQuestsLoading } = useQuestGet({
        getPlayerQuestLogsInput: player
            ? {
                  playerId: player.id,
              }
            : undefined,
    });

    const handleSelectFeed = useCallback(
        (feeds: ArtistFeedWithReactions[], feedIndex: number) => {
            setInitialFeeds(feeds);
            setSelectedFeedIndex(feedIndex);
            setModalState("feed");
        },
        []
    );

    const handleCloseFeedModal = useCallback(() => {
        setModalState("none");
        setInitialFeeds([]);
        setSelectedFeedIndex(0);
    }, []);

    if (modalState === "feed") {
        return (
            <ArtistFeedModal
                initialFeeds={initialFeeds}
                artist={artist}
                initialFeedIndex={selectedFeedIndex}
                isOpen={true}
                onClose={handleCloseFeedModal}
            />
        );
    }

    if (isPollsLoading || isQuestsLoading) {
        return (
            <div className="relative h-screen w-full flex flex-col items-center justify-center">
                <div className="fixed inset-0 bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#16213e] -z-10" />
                <div
                    className={cn(
                        "w-full h-full flex justify-center items-center",
                        getResponsiveClass(40).paddingClass
                    )}
                >
                    <PartialLoading text="Loading..." />
                </div>
            </div>
        );
    }

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
                {/* Background */}
                <div
                    className="fixed inset-0 bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#16213e] -z-10"
                    style={{
                        background: `linear-gradient(to bottom right, ${ArtistBG(
                            artist,
                            0,
                            100
                        )}, ${ArtistBG(artist, 1, 100)})`,
                    }}
                />

                <div
                    className={cn(
                        "fixed inset-0 overflow-hidden -z-10 bg-blend-overlay",
                        "bg-gradient-to-br from-[rgba(0,0,0,0.6)] via-[rgba(0,0,0,0.25)] to-[rgba(0,0,0,0.5)]"
                    )}
                />

                {/* Main Content */}
                <div className="relative z-10 w-full flex flex-col items-center">
                    <div className="w-full max-w-[1200px] flex flex-col">
                        {/* Hero Section - Artist Introduction */}
                        <section>
                            <div
                                className={cn(
                                    "backdrop-blur-lg shadow-2xl overflow-hidden transition-all duration-500"
                                )}
                                style={{
                                    background: `linear-gradient(to bottom right, ${ArtistBG(
                                        artist,
                                        0,
                                        20
                                    )}, ${ArtistBG(artist, 1, 20)}, ${ArtistBG(
                                        artist,
                                        2,
                                        20
                                    )})`,
                                    boxShadow: `0 0 20px ${ArtistBG(
                                        artist,
                                        0,
                                        20
                                    )}`,
                                }}
                            >
                                <motion.div
                                    initial={{ opacity: 0.6, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: 0.2,
                                        duration: 2.0,
                                        ease: [0.19, 1, 0.22, 1], // easeOutExpo
                                    }}
                                    className="relative flex items-center justify-center overflow-hidden aspect-[4/3]"
                                >
                                    <Image
                                        src={
                                            artist.imageUrl ||
                                            "/default-avatar.jpg"
                                        }
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
                                                ease: [0.23, 1, 0.32, 1], // easeOutExpo
                                            }}
                                            className={cn(
                                                "text-transparent bg-clip-text text-center w-full",
                                                "font-bold drop-shadow-2xl",
                                                "text-glow-white-smooth",
                                                getResponsiveClass(55)
                                                    .textClass,
                                                getResponsiveClass(15)
                                                    .marginYClass
                                            )}
                                            style={{
                                                background: `linear-gradient(to right, ${ArtistFG(
                                                    artist,
                                                    0,
                                                    100
                                                )}, ${ArtistFG(
                                                    artist,
                                                    1,
                                                    100
                                                )}, ${ArtistFG(
                                                    artist,
                                                    2,
                                                    100
                                                )})`,
                                                WebkitBackgroundClip: "text",
                                                backgroundClip: "text",
                                            }}
                                        >
                                            {artist.name}
                                        </motion.h1>

                                        {artist.description && (
                                            <motion.p
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 }}
                                                className={cn(
                                                    "text-white/90 max-w-2xl mx-auto drop-shadow-lg text-center w-full",
                                                    getResponsiveClass(18)
                                                        .textClass
                                                )}
                                            >
                                                {artist.description}
                                            </motion.p>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </section>

                        <div className="w-full p-2">
                            {/* Stats Section */}
                            <motion.section
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className={cn(
                                    "w-full",
                                    getResponsiveClass(30).marginYClass
                                )}
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
                                        <Sparkles
                                            className={cn(
                                                "mx-auto text-white/80",
                                                getResponsiveClass(35)
                                                    .frameClass,
                                                getResponsiveClass(10)
                                                    .marginYClass
                                            )}
                                        />
                                        <p
                                            className={cn(
                                                "text-white/80",
                                                getResponsiveClass(12)
                                                    .textClass,
                                                getResponsiveClass(5)
                                                    .marginYClass
                                            )}
                                        >
                                            NFTs
                                        </p>
                                        <p
                                            className={cn(
                                                "text-white font-bold",
                                                getResponsiveClass(25).textClass
                                            )}
                                        >
                                            {artist.story_spg?.length || 0}
                                        </p>
                                    </div>
                                    <div
                                        className={cn(
                                            "rounded-xl text-center backdrop-blur-sm shadow-md",
                                            "bg-gradient-to-br from-[rgba(0,0,0,0.05)] to-[rgba(0,0,0,0.1)]",
                                            getResponsiveClass(25).paddingClass
                                        )}
                                    >
                                        <Users
                                            className={cn(
                                                "mx-auto text-white/80",
                                                getResponsiveClass(35)
                                                    .frameClass,
                                                getResponsiveClass(10)
                                                    .marginYClass
                                            )}
                                        />
                                        <p
                                            className={cn(
                                                "text-white/80",
                                                getResponsiveClass(12)
                                                    .textClass,
                                                getResponsiveClass(5)
                                                    .marginYClass
                                            )}
                                        >
                                            Polls
                                        </p>
                                        <p
                                            className={cn(
                                                "text-white font-bold",
                                                getResponsiveClass(25).textClass
                                            )}
                                        >
                                            {artist.polls?.length || 0}
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
                                                getResponsiveClass(35)
                                                    .frameClass,
                                                getResponsiveClass(10)
                                                    .marginYClass
                                            )}
                                        />
                                        <p
                                            className={cn(
                                                "text-white/80",
                                                getResponsiveClass(12)
                                                    .textClass,
                                                getResponsiveClass(5)
                                                    .marginYClass
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
                                            {artist.quests?.length || 0}
                                        </p>
                                    </div>
                                </div>
                            </motion.section>

                            {/* Collections Section */}
                            {artist.story_spg &&
                                artist.story_spg.length > 0 && (
                                    <motion.section
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.6,
                                            delay: 0.3,
                                        }}
                                        className={cn(
                                            "w-full",
                                            getResponsiveClass(40).marginYClass
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "backdrop-blur-lg rounded-3xl shadow-xl transition-all duration-500",
                                                "bg-gradient-to-br from-[rgba(0,0,0,0.05)] to-[rgba(0,0,0,0.2)]",
                                                getResponsiveClass(35)
                                                    .paddingClass
                                            )}
                                        >
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 }}
                                                className={cn(
                                                    "flex items-center",
                                                    getResponsiveClass(25)
                                                        .marginYClass,
                                                    getResponsiveClass(15)
                                                        .gapClass
                                                )}
                                            >
                                                <div className="rounded-xl bg-gradient-to-r from-white/20 to-white/30 p-3">
                                                    <Sparkles
                                                        className={cn(
                                                            "text-white",
                                                            getResponsiveClass(
                                                                30
                                                            ).frameClass
                                                        )}
                                                    />
                                                </div>
                                                <h2
                                                    className={cn(
                                                        "font-bold text-white",
                                                        getResponsiveClass(30)
                                                            .textClass
                                                    )}
                                                >
                                                    NFT Collections
                                                </h2>
                                            </motion.div>

                                            <div
                                                className={cn(
                                                    "grid grid-cols-1 md:grid-cols-2",
                                                    getResponsiveClass(25)
                                                        .gapClass
                                                )}
                                            >
                                                {artist.story_spg.map(
                                                    (spg, index) => (
                                                        <motion.div
                                                            key={spg.id}
                                                            initial={{
                                                                opacity: 0,
                                                                y: 20,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                y: 0,
                                                            }}
                                                            transition={{
                                                                delay:
                                                                    0.5 +
                                                                    index * 0.1,
                                                            }}
                                                            whileHover={{
                                                                y: -5,
                                                                scale: 1.02,
                                                            }}
                                                            className={cn(
                                                                "bg-gradient-to-br from-black/20 to-gray-900/40",
                                                                "backdrop-blur-sm border border-white/10",
                                                                "rounded-2xl overflow-hidden shadow-xl",
                                                                "hover:border-white/20 hover:shadow-2xl",
                                                                "transition-all duration-300 cursor-pointer group"
                                                            )}
                                                        >
                                                            <div className="aspect-video relative overflow-hidden">
                                                                <Image
                                                                    src={
                                                                        spg.imageUrl ||
                                                                        "/default-avatar.jpg"
                                                                    }
                                                                    alt={
                                                                        spg.name
                                                                    }
                                                                    fill
                                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                                                <div className="absolute bottom-3 left-3 right-3">
                                                                    <h3
                                                                        className={cn(
                                                                            "text-white font-bold",
                                                                            getResponsiveClass(
                                                                                20
                                                                            )
                                                                                .textClass
                                                                        )}
                                                                    >
                                                                        {
                                                                            spg.name
                                                                        }
                                                                    </h3>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </motion.section>
                                )}

                            {/* Community Section */}
                            <motion.section
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className={cn(
                                    "w-full",
                                    getResponsiveClass(40).marginYClass
                                )}
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
                                                    getResponsiveClass(30)
                                                        .frameClass
                                                )}
                                            />
                                        </div>
                                        <h2
                                            className={cn(
                                                "font-bold text-white",
                                                getResponsiveClass(30).textClass
                                            )}
                                        >
                                            Community Hub
                                        </h2>
                                    </motion.div>

                                    <div className={cn("space-y-8")}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6 }}
                                        >
                                            <ArtistMessage
                                                artistId={artist.id}
                                                artist={artist}
                                            />
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.7 }}
                                        >
                                            <ArtistFeed
                                                artist={artist}
                                                onSelectFeed={handleSelectFeed}
                                            />
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.section>

                            {/* Boards Section */}
                            <motion.section
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className={cn(
                                    "w-full",
                                    getResponsiveClass(40).marginYClass
                                )}
                            >
                                <div
                                    className={cn(
                                        "backdrop-blur-lg rounded-3xl shadow-xl transition-all duration-500",
                                        "bg-gradient-to-br from-[rgba(0,0,0,0.05)] to-[rgba(0,0,0,0.2)]",
                                        getResponsiveClass(35).paddingClass
                                    )}
                                >
                                    <BoardContent
                                        artist={artist}
                                        player={player}
                                    />
                                </div>
                            </motion.section>

                            {/* Interactive Section */}
                            <motion.section
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                                className={cn(
                                    "w-full",
                                    getResponsiveClass(40).marginYClass
                                )}
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
                                                    getResponsiveClass(30)
                                                        .frameClass
                                                )}
                                            />
                                        </div>
                                        <h2
                                            className={cn(
                                                "font-bold text-white",
                                                getResponsiveClass(30).textClass
                                            )}
                                        >
                                            Engage & Earn
                                        </h2>
                                    </motion.div>

                                    <div
                                        className={cn(
                                            "grid grid-cols-1 lg:grid-cols-2",
                                            getResponsiveClass(25).gapClass
                                        )}
                                    >
                                        {/* Quests */}
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
                                                artist={artist}
                                                player={player}
                                                questLogs={
                                                    playerQuestLogs ?? []
                                                }
                                                referralLogs={[]}
                                                showInviteFriends={false}
                                            />
                                        </motion.div>

                                        {/* Polls */}
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.9 }}
                                            className={cn(
                                                "bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.2)] rounded-2xl border border-white/20",
                                                getResponsiveClass(10)
                                                    .paddingClass
                                            )}
                                        >
                                            <PollsContentsPrivateArtistList
                                                artist={artist}
                                                player={player}
                                                pollLogs={playerPollLogs ?? []}
                                                forceSlidesToShow={1}
                                                bgColorFrom={ArtistBG(
                                                    artist,
                                                    0,
                                                    100
                                                )}
                                                bgColorTo={ArtistBG(
                                                    artist,
                                                    1,
                                                    100
                                                )}
                                                bgColorAccentFrom={ArtistBG(
                                                    artist,
                                                    2,
                                                    100
                                                )}
                                                bgColorAccentTo={ArtistBG(
                                                    artist,
                                                    3,
                                                    100
                                                )}
                                                fgColorFrom={ArtistBG(
                                                    artist,
                                                    2,
                                                    10
                                                )}
                                                fgColorTo={ArtistBG(
                                                    artist,
                                                    1,
                                                    100
                                                )}
                                            />
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.section>

                            <motion.section
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className={cn(
                                    "w-full",
                                    getResponsiveClass(40).marginYClass
                                )}
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
                                                    getResponsiveClass(30)
                                                        .frameClass
                                                )}
                                            />
                                        </div>
                                        <h2
                                            className={cn(
                                                "font-bold text-white",
                                                getResponsiveClass(30).textClass
                                            )}
                                        >
                                            Star Store
                                        </h2>
                                        <div
                                            className={cn(
                                                "rounded-full font-medium",
                                                "bg-gradient-to-r from-purple-500/20 to-blue-500/20",
                                                "border border-purple-400/30 text-purple-200",
                                                getResponsiveClass(15)
                                                    .paddingClass,
                                                getResponsiveClass(10).textClass
                                            )}
                                        >
                                            🚀 Coming Soon
                                        </div>
                                    </motion.div>

                                    <StarStore artist={artist} />
                                </div>
                            </motion.section>

                            {/* Web3 Store Section */}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
});
