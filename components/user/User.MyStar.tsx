/// components/user/User.MyStar.tsx

"use client";

import React, { useCallback, useState } from "react";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { usePollsGet } from "@/app/hooks/usePolls";
import { useQuestGet } from "@/app/hooks/useQuest";
import {
    useArtistActivities,
    useArtistFromSPGs,
} from "@/app/hooks/useArtistActivities";
import ArtistFeedModal from "@/components/artists/Artist.Feed.Modal";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import ArtistButton from "../atoms/Artist.Button";
import PartialLoading from "../atoms/PartialLoading";

import type { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import type { VerifiedSPG } from "@/app/story/interaction/actions";
import type { ModalState } from "@/app/types/user-mystar";
import type { Artist, Player } from "@prisma/client";

interface UserMyStarProps {
    player: Player;
    userVerifiedSPGs: VerifiedSPG[];
}

const UserMyStarModal = dynamic(() => import("./User.MyStar.Modal"), {
    loading: () => {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <PartialLoading text="Loading..." />
            </div>
        );
    },
    ssr: false,
});

export default React.memo(function UserMyStar({
    player,
    userVerifiedSPGs,
}: UserMyStarProps) {
    const [modalState, setModalState] = useState<ModalState>("none");
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    const [initialFeeds, setInitialFeeds] = useState<ArtistFeedWithReactions[]>(
        []
    );
    const [selectedFeedIndex, setSelectedFeedIndex] = useState<number>(0);
    const router = useRouter();

    const {
        pollsList,
        playerPollLogs,
        isLoading: isPollsLoading,
    } = usePollsGet({
        getPollsInput: {
            isActive: true,
        },
        getPlayerPollLogsInput: {
            playerId: player.id,
        },
    });

    const {
        quests,
        playerQuestLogs,
        isLoading: isQuestsLoading,
    } = useQuestGet({
        getQuestsInput: {
            isActive: true,
        },
        getPlayerQuestLogsInput: {
            playerId: player.id,
        },
    });

    const artists = useArtistFromSPGs(userVerifiedSPGs);

    const newArtistsActivities = useArtistActivities({
        artists,
        pollsList,
        quests,
        playerPollLogs,
        playerQuestLogs,
    });

    const handleSelectArtist = useCallback((artist: Artist) => {
        setSelectedArtist(artist);
        setModalState("artist");
    }, []);

    const handleSelectFeed = useCallback(
        (feeds: ArtistFeedWithReactions[], feedIndex: number) => {
            setInitialFeeds(feeds);
            setSelectedFeedIndex(feedIndex);
            setModalState("feed");
        },
        []
    );

    const handleCloseFeedModal = useCallback(() => {
        setModalState("artist");
        setInitialFeeds([]);
        setSelectedFeedIndex(0);
    }, []);

    const handleCloseArtistModal = useCallback(() => {
        setModalState("none");
        setSelectedArtist(null);
    }, []);

    const handleBuyClick = () => {
        router.push("/nfts");
    };

    if (modalState === "feed" && selectedArtist) {
        return (
            <ArtistFeedModal
                initialFeeds={initialFeeds}
                artist={selectedArtist}
                initialFeedIndex={selectedFeedIndex}
                isOpen={true}
                onClose={handleCloseFeedModal}
            />
        );
    }

    if (modalState === "artist" && selectedArtist) {
        return (
            <UserMyStarModal
                player={player}
                questLogs={playerQuestLogs ?? []}
                pollLogs={playerPollLogs ?? []}
                artist={selectedArtist}
                verifiedSPGs={userVerifiedSPGs.filter(
                    (spg) => spg.artistId === selectedArtist.id
                )}
                open={true}
                onClose={handleCloseArtistModal}
                onSelectFeed={handleSelectFeed}
            />
        );
    }

    if (isPollsLoading || isQuestsLoading) {
        return (
            <div className="w-full flex justify-center items-center py-20">
                <PartialLoading text="Loading..." />
            </div>
        );
    }

    if (artists.length === 0) {
        return (
            <div className="text-center py-10 text-white/80 text-xl">
                <h4 className={cn(getResponsiveClass(20).textClass)}>
                    {`You don't have any NFTs yet.`}
                </h4>
                <p
                    className={cn(
                        getResponsiveClass(15).textClass,
                        "text-white/80"
                    )}
                >
                    Discover your favorite artists and start glowing your stars!
                </p>

                <button
                    onClick={handleBuyClick}
                    className={cn(
                        "mt-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-lg hover:scale-105 transition-transform",
                        getResponsiveClass(15).textClass,
                        getResponsiveClass(20).paddingClass
                    )}
                >
                    Buy Now
                </button>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center w-screen max-w-[1000px]",
                "py-4 px-6 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-12",
                "gap-[15px]"
            )}
        >
            {artists.map((artist, index) => {
                const { polls, quests } = newArtistsActivities.get(
                    artist.id
                ) || { polls: [], quests: [] };

                const hasNewActivity = polls.length > 0 || quests.length > 0;

                return (
                    <ArtistButton
                        key={artist.id}
                        artist={artist}
                        index={index}
                        className="w-full"
                        hasNewActivity={hasNewActivity}
                        onClick={() => handleSelectArtist(artist)}
                    />
                );
            })}
        </div>
    );
});
