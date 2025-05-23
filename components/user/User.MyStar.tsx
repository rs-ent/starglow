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
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const artists: Artist[] = useMemo(() => {
        return userVerifiedCollections
            .map((collection) => collection.artist)
            .filter((artist): artist is Artist => artist !== null);
    }, [userVerifiedCollections]);

    const newArtistsActivities: Map<string, [Poll[], Quest[]]> = useMemo(() => {
        const now = new Date();
        const result = new Map<string, [Poll[], Quest[]]>();

        const pollLogsMap = new Map(
            playerPollLogs?.map((log) => [log.pollId, log]) || []
        );
        const questLogsMap = new Map(
            playerQuestLogs?.map((log) => [log.questId, log]) || []
        );

        const getArtistArrays = (artistId: string): [Poll[], Quest[]] => {
            return result.get(artistId) || [[], []];
        };

        for (const poll of pollsList?.items || []) {
            if (!poll?.artistId) continue;
            if (pollLogsMap.has(poll.id)) continue;
            if (
                (poll.endDate && poll.endDate < now) ||
                (poll.startDate && poll.startDate > now)
            )
                continue;

            const [polls, quests] = getArtistArrays(poll.artistId);
            result.set(poll.artistId, [[...polls, poll], quests]);
        }

        for (const quest of quests?.items || []) {
            if (!quest?.artistId || quest.isReferral) continue;
            if (questLogsMap.get(quest.id)?.isClaimed) continue;
            if (
                !quest.permanent &&
                ((quest.endDate && quest.endDate < now) ||
                    (quest.startDate && quest.startDate > now))
            )
                continue;

            const [polls, quests] = getArtistArrays(quest.artistId);
            result.set(quest.artistId, [polls, [...quests, quest]]);
        }

        return result;
    }, [pollsList, quests, playerPollLogs, playerQuestLogs]);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            setSelectedArtist(null);
        }, 800);
    };

    const handleSelectArtist = (artist: Artist) => {
        setSelectedArtist(artist);
        setIsModalOpen(true);
    };

    return (
        <>
            <UserMyStarModal
                artist={selectedArtist}
                open={isModalOpen}
                onClose={handleCloseModal}
            />
            <div
                className={cn(
                    "flex flex-col items-center justify-center w-screen max-w-[1000px]",
                    "py-4 px-6 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-12"
                )}
            >
                {artists.map((artist, index) => {
                    const [polls, quests] = newArtistsActivities.get(
                        artist.id
                    ) || [[], []];

                    const hasNewActivity =
                        polls.length > 0 || quests.length > 0;

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
        </>
    );
}
