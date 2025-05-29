/// components/user/User.MyStar.tsx

"use client";

import { useMemo, useState } from "react";
import { Artist, Player, Poll, Quest } from "@prisma/client";
import { User } from "next-auth";
import { VerifiedCollection } from "@/app/actions/collectionContracts";
import { cn } from "@/lib/utils/tailwind";
import { usePollsGet } from "@/app/hooks/usePolls";
import { useQuestGet } from "@/app/hooks/useQuest";
import ArtistButton from "../atoms/Artist.Button";
import UserMyStarModal from "./User.MyStar.Modal";

interface UserMyStarProps {
    user: User;
    player: Player;
    userVerifiedCollections: VerifiedCollection[];
}

export default function UserMyStar({
    user,
    player,
    userVerifiedCollections,
}: UserMyStarProps) {
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

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

    const artists = useMemo(() => {
        const artistMap = new Map<string, Artist>();
        userVerifiedCollections.forEach((collection) => {
            if (collection.artist) {
                artistMap.set(collection.artist.id, collection.artist);
            }
        });
        return Array.from(artistMap.values());
    }, [userVerifiedCollections]);

    const newArtistsActivities: Map<
        string,
        { polls: Poll[]; quests: Quest[] }
    > = useMemo(() => {
        const now = new Date().getTime();
        const result = new Map<string, { polls: Poll[]; quests: Quest[] }>();

        artists.forEach((artist) => {
            result.set(artist.id, { polls: [], quests: [] });
        });

        result.forEach((value, key) => {
            if (key) {
                value.polls =
                    pollsList?.items.filter((poll) => {
                        const isArtistMatch = poll.artistId === key;
                        if (!isArtistMatch) return false;

                        const isEligible = poll.isActive;
                        if (!isEligible) return false;

                        const isNotExpired =
                            (!poll.endDate || poll.endDate.getTime() > now) &&
                            (!poll.startDate || poll.startDate.getTime() < now);
                        if (!isNotExpired) return false;

                        const log = (playerPollLogs ?? []).find(
                            (playerPollLog) => playerPollLog.pollId === poll.id
                        );
                        if (log) return false;

                        return true;
                    }) ?? [];
                value.quests =
                    quests?.items.filter((quest) => {
                        const isArtistMatch = quest.artistId === key;
                        if (!isArtistMatch) return false;

                        const isEligible = quest.isActive;
                        if (!isEligible) return false;

                        const isNotExpired =
                            (!quest.endDate || quest.endDate.getTime() > now) &&
                            (!quest.startDate ||
                                quest.startDate.getTime() < now);

                        if (!quest.permanent && !isNotExpired) return false;

                        const log = (playerQuestLogs ?? []).find(
                            (playerQuestLog) =>
                                playerQuestLog.questId === quest.id
                        );

                        const isClaimed = log && log.isClaimed;
                        if (isClaimed) return false;
                        return true;
                    }) ?? [];
            }
        });

        return result;
    }, [artists, pollsList, quests, playerPollLogs, playerQuestLogs]);

    const handleSelectArtist = (artist: Artist) => {
        setSelectedArtist(artist);
    };

    const handleClose = () => {
        setSelectedArtist(null);
    };

    if (selectedArtist) {
        return (
            <UserMyStarModal
                player={player}
                questLogs={playerQuestLogs ?? []}
                pollLogs={playerPollLogs ?? []}
                artist={selectedArtist}
                verifiedCollections={userVerifiedCollections.filter(
                    (collection) => collection.artistId === selectedArtist.id
                )}
                open={true}
                onClose={handleClose}
            />
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
}
