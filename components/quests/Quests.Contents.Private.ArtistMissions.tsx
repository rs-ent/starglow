/// components/quests/Quests.Contents.Private.ArtistMissions.tsx

"use client";

import { memo, useCallback, useMemo } from "react";

import Image from "next/image";

import { useQuestGet } from "@/app/hooks/useQuest";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import QuestsMissions from "./Quests.Missions";
import InviteFriends from "../atoms/InviteFriends";

import type {
    TokenGatingData,
    TokenGatingResult,
} from "@/app/story/nft/actions";
import type { Artist, Player, QuestLog, ReferralLog } from "@prisma/client";

interface QuestsArtistMissionsProps {
    artist: Artist;
    player: Player | null;
    questLogs: QuestLog[];
    tokenGating?: TokenGatingResult | null;
    referralLogs: ReferralLog[];
    bgColorFrom?: string;
    bgColorTo?: string;
    showInviteFriends?: boolean;
    bgColorFromInviteFriends?: string;
    bgColorToInviteFriends?: string;
}

function QuestsArtistMissions({
    artist,
    player,
    questLogs,
    tokenGating,
    referralLogs,
    bgColorFrom = "rgba(18,6,53,0.85)",
    bgColorTo = "rgba(55,34,160,0.7)",
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

    const backgroundStyle = useMemo(
        () => ({
            background: `linear-gradient(to bottom right, ${bgColorFrom}, ${bgColorTo})`,
        }),
        [bgColorFrom, bgColorTo]
    );

    const responsiveClass30 = useMemo(() => getResponsiveClass(30), []);
    const responsiveClass25 = useMemo(() => getResponsiveClass(25), []);

    const permission = useMemo(() => {
        if (!tokenGating) return false;
        return Object.values(tokenGating.data).some(
            (data: TokenGatingData) => data.hasToken
        );
    }, [tokenGating]);

    const { claimedQuestLogs } = useMemo(() => {
        const logs =
            questLogs?.filter(
                (questLog) =>
                    questLog.isClaimed &&
                    quests?.items.find((quest) => quest.id === questLog.questId)
            ) || [];

        return {
            claimedQuestLogs: logs,
        };
    }, [questLogs, quests]);

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
                        "w-full rounded-3xl",
                        "py-4 px-6 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-12"
                    )}
                    style={backgroundStyle}
                >
                    <div className="w-full flex justify-between items-end">
                        <div
                            className={cn("shadow-lg rounded-full mb-2")}
                            style={{
                                boxShadow: `0 0 16px 3px rgba(255,255,255,0.15) inset`,
                                background: "transparent",
                                display: "inline-block",
                                position: "relative",
                            }}
                        >
                            <div
                                className={cn(
                                    "flex flex-row gap-2 items-center justify-center",
                                    "px-5 py-3"
                                )}
                            >
                                {artist.logoUrl && (
                                    <Image
                                        src={artist.logoUrl}
                                        alt={artist.name}
                                        width={100}
                                        height={100}
                                        className={cn(
                                            responsiveClass30.frameClass,
                                            "aspect-square"
                                        )}
                                        style={{ objectFit: "contain" }}
                                        priority={true}
                                    />
                                )}
                                <h2 className={cn(responsiveClass25.textClass)}>
                                    {artist.name}
                                </h2>
                            </div>
                        </div>
                        {quests?.items && questLogs && (
                            <div className="flex gap-0">
                                <h2 className="text-center text-base">
                                    {claimedQuestLogs.length}
                                </h2>
                                <h2 className="text-center text-base opacity-70">
                                    /{quests.items.length}
                                </h2>
                            </div>
                        )}
                    </div>

                    {quests?.items && questLogs && tokenGating && (
                        <div>
                            <QuestsMissions
                                player={player}
                                quests={quests.items}
                                questLogs={questLogs}
                                isLoading={isLoading}
                                error={error}
                                permission={permission}
                                tokenGating={tokenGating}
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
            backgroundStyle,
            claimedQuestLogs.length,
            quests?.items,
            questLogs,
            tokenGating,
            isLoading,
            error,
            permission,
            referralLogs,
            showInviteFriends,
            bgColorFromInviteFriends,
            bgColorToInviteFriends,
            responsiveClass30.frameClass,
            responsiveClass25.textClass,
            artist.logoUrl,
            artist.name,
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
