import { useMemo } from "react";
import type { Artist, Poll, Quest, PollLog, QuestLog } from "@prisma/client";

interface UseArtistActivitiesProps {
    artists: Artist[];
    pollsList?: { items: Poll[] };
    quests?: { items: Quest[] };
    playerPollLogs?: PollLog[];
    playerQuestLogs?: QuestLog[];
}

export function useArtistActivities({
    artists,
    pollsList,
    quests,
    playerPollLogs,
    playerQuestLogs,
}: UseArtistActivitiesProps) {
    return useMemo(() => {
        const now = new Date().getTime();
        const result = new Map<string, { polls: Poll[]; quests: Quest[] }>();

        // Initialize with empty arrays
        artists.forEach((artist) => {
            result.set(artist.id, { polls: [], quests: [] });
        });

        // Process polls and quests for each artist
        result.forEach((value, artistId) => {
            if (!artistId) return;

            // Filter eligible polls
            value.polls =
                pollsList?.items.filter((poll) => {
                    if (poll.artistId !== artistId || !poll.isActive)
                        return false;

                    // Check if not expired
                    const isNotExpired =
                        (!poll.endDate ||
                            new Date(poll.endDate).getTime() > now) &&
                        (!poll.startDate ||
                            new Date(poll.startDate).getTime() < now);
                    if (!isNotExpired) return false;

                    // Check if player hasn't participated
                    const hasParticipated = (playerPollLogs ?? []).some(
                        (log) => log.pollId === poll.id
                    );
                    return !hasParticipated;
                }) ?? [];

            // Filter eligible quests
            value.quests =
                quests?.items.filter((quest) => {
                    if (quest.artistId !== artistId || !quest.isActive)
                        return false;

                    // Check if not expired (for non-permanent quests)
                    if (!quest.permanent) {
                        const isNotExpired =
                            (!quest.endDate ||
                                new Date(quest.endDate).getTime() > now) &&
                            (!quest.startDate ||
                                new Date(quest.startDate).getTime() < now);
                        if (!isNotExpired) return false;
                    }

                    // Check if not already claimed
                    const log = (playerQuestLogs ?? []).find(
                        (questLog) => questLog.questId === quest.id
                    );
                    const isClaimed = log?.isClaimed;
                    return !isClaimed;
                }) ?? [];
        });

        return result;
    }, [artists, pollsList, quests, playerPollLogs, playerQuestLogs]);
}

export function useArtistFromSPGs(userVerifiedSPGs: any[]) {
    return useMemo(() => {
        const artistMap = new Map<string, Artist>();
        userVerifiedSPGs.forEach((spg) => {
            if (spg.artist && spg.verifiedTokens.length > 0) {
                artistMap.set(spg.artist.id, spg.artist);
            }
        });
        return Array.from(artistMap.values());
    }, [userVerifiedSPGs]);
}
