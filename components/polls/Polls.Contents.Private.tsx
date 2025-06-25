/// components/polls/Polls.Contents.Private.tsx

"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { ArtistBG } from "@/lib/utils/get/artist-colors";

import PollsContentsPrivateArtistList from "./Polls.Contents.Private.ArtistList";
import ArtistSlideSelector from "../artists/ArtistSlideSelector";

import type { VerifiedSPG } from "@/app/story/interaction/actions";
import type { Artist, Player, PollLog } from "@prisma/client";

interface PollsContentsPrivateProps {
    player: Player | null;
    privateTabClicked: boolean;
    pollLogs?: PollLog[];
    verifiedSPGs?: VerifiedSPG[];
}

const defaultBackgroundStyle = {
    background: `linear-gradient(to bottom right, rgba(109,40,217,0.4), rgba(109,40,217,0.15))`,
};

function PollsContentsPrivate({
    player,
    pollLogs,
    verifiedSPGs,
}: PollsContentsPrivateProps) {
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    const [previousArtist, setPreviousArtist] = useState<Artist | null>(null);
    const [activeBackground, setActiveBackground] = useState<
        "default" | "artist"
    >("default");

    const handleArtistSelect = useCallback(
        (artist: Artist | null) => {
            setPreviousArtist(selectedArtist);
            setSelectedArtist(artist);
            setActiveBackground(artist ? "artist" : "default");
        },
        [selectedArtist]
    );

    const selectedBackgroundStyle = useMemo(() => {
        if (!selectedArtist) return defaultBackgroundStyle;

        return {
            background: `linear-gradient(to bottom right, ${ArtistBG(
                selectedArtist,
                0,
                100
            )}, ${ArtistBG(selectedArtist, 1, 100)})`,
        };
    }, [selectedArtist]);

    const previousBackgroundStyle = useMemo(() => {
        if (!previousArtist) return defaultBackgroundStyle;

        return {
            background: `linear-gradient(to bottom right, ${ArtistBG(
                previousArtist,
                0,
                100
            )}, ${ArtistBG(previousArtist, 1, 100)})`,
        };
    }, [previousArtist]);

    const renderArtistContent = useCallback(() => {
        if (!selectedArtist) return null;

        return (
            <div className="relative w-full h-full" key={selectedArtist.id}>
                <div className="w-screen max-w-[1400px] mx-auto z-0 relative">
                    <PollsContentsPrivateArtistList
                        artist={selectedArtist}
                        player={player}
                        pollLogs={pollLogs}
                        bgColorFrom={ArtistBG(selectedArtist, 0, 60)}
                        bgColorTo={ArtistBG(selectedArtist, 1, 30)}
                        bgColorAccentFrom={ArtistBG(selectedArtist, 2, 100)}
                        bgColorAccentTo={ArtistBG(selectedArtist, 3, 100)}
                        fgColorFrom={ArtistBG(selectedArtist, 2, 10)}
                        fgColorTo={ArtistBG(selectedArtist, 1, 100)}
                    />
                </div>
            </div>
        );
    }, [selectedArtist, player, pollLogs]);

    return (
        <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-center">
                <ArtistSlideSelector
                    className="mt-[5px] sm:mt-[10px] md:mt-[15px] lg:mt-[20px] xl:mt-[25px]"
                    onSelect={handleArtistSelect}
                    selectedArtist={selectedArtist}
                    verifiedSPGs={verifiedSPGs}
                />
            </div>

            <div className="fixed inset-0 w-screen h-screen -z-20">
                <AnimatePresence initial={false}>
                    {activeBackground === "default" && (
                        <motion.div
                            key="default-background"
                            className="absolute inset-0 w-full h-full"
                            style={defaultBackgroundStyle}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                    {activeBackground === "artist" && selectedArtist && (
                        <motion.div
                            key={`artist-background-${selectedArtist.id}`}
                            className="absolute inset-0 w-full h-full"
                            style={selectedBackgroundStyle}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                    {previousArtist && selectedArtist !== previousArtist && (
                        <motion.div
                            key={`previous-artist-background-${previousArtist.id}`}
                            className="absolute inset-0 w-full h-full"
                            style={previousBackgroundStyle}
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                        />
                    )}
                </AnimatePresence>
            </div>

            {renderArtistContent()}
        </div>
    );
}

export default memo(PollsContentsPrivate);
