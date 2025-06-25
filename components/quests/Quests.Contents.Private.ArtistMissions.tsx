/// components/quests/Quests.Contents.Private.ArtistMissions.tsx

"use client";

import { memo, useCallback } from "react";
import { useQuestGet } from "@/app/hooks/useQuest";
import { cn } from "@/lib/utils/tailwind";

import QuestsMissions from "./Quests.Missions";
import InviteFriends from "../atoms/InviteFriends";

import type { Artist, Player, QuestLog, ReferralLog } from "@prisma/client";

interface QuestsArtistMissionsProps {
    artist: Artist;
    player: Player | null;
    questLogs: QuestLog[];
    referralLogs: ReferralLog[];
    showInviteFriends?: boolean;
    bgColorFromInviteFriends?: string;
    bgColorToInviteFriends?: string;
}

function QuestsArtistMissions({
    artist,
    player,
    questLogs,
    referralLogs,
    showInviteFriends = true,
    bgColorFromInviteFriends = "#A5D7FB",
    bgColorToInviteFriends = "#8E76FA",
}: QuestsArtistMissionsProps) {
    const { quests, isLoading, error } = useQuestGet({
        getQuestsInput: {
            artistId: artist.id,
            isActive: true,
        },
    });

    const renderLoading = useCallback(
        () => (
            <div className="w-full py-8 flex justify-center">
                <div className="text-white/80 text-lg">Loading quests...</div>
            </div>
        ),
        []
    );

    const renderError = useCallback(
        () => (
            <div className="text-center text-red-400 py-6">
                Error: {error?.message || "Failed to load quests"}
            </div>
        ),
        [error]
    );

    const renderNoQuests = useCallback(
        () => (
            <div className="text-center text-2xl py-10 text-white/80">
                No quests found for this artist
            </div>
        ),
        []
    );

    const renderQuestsList = useCallback(
        () => (
            <div key={artist.id} className="relative">
                <div
                    className={cn(
                        "duration-1000 transition-all",
                        "w-full",
                        "py-1 px-2 sm:py-1 sm:px-3 md:py-2 md:px-4 lg:py-3 lg:px-5"
                    )}
                >
                    {quests?.items && questLogs && (
                        <div>
                            <QuestsMissions
                                player={player}
                                quests={quests.items}
                                questLogs={questLogs}
                                isLoading={isLoading}
                                error={error}
                                permission={true}
                                referralLogs={referralLogs || []}
                            />
                        </div>
                    )}
                    {showInviteFriends && (
                        <div className="mt-[70px] md:mt-[80px] lg:mt-[90px] mb-[100px] lg:mb-[0px]">
                            <InviteFriends
                                player={player}
                                bgColorFrom={bgColorFromInviteFriends}
                                bgColorTo={bgColorToInviteFriends}
                            />
                        </div>
                    )}
                </div>
            </div>
        ),
        [
            artist.id,
            quests?.items,
            questLogs,
            isLoading,
            error,
            referralLogs,
            showInviteFriends,
            bgColorFromInviteFriends,
            bgColorToInviteFriends,
            player,
        ]
    );

    const renderContent = useCallback(() => {
        if (isLoading) {
            return renderLoading();
        }
        if (error) {
            return renderError();
        }
        if (!quests?.items || quests.items.length === 0) {
            return renderNoQuests();
        }
        return renderQuestsList();
    }, [
        isLoading,
        error,
        quests?.items,
        renderLoading,
        renderError,
        renderNoQuests,
        renderQuestsList,
    ]);

    return renderContent();
}

export default memo(QuestsArtistMissions);
