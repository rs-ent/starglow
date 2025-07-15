/// components/quests/Quests.Contents.Private.ArtistMissions.tsx

"use client";

import { memo, useCallback, useMemo, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useQuestGet } from "@/app/hooks/useQuest";
import { cn } from "@/lib/utils/tailwind";

import QuestsMissions from "./Quests.Missions";
import InviteFriends from "../atoms/InviteFriends";

import type { Player } from "@prisma/client";

interface QuestsArtistMissionsProps {
    artistId: string;
    player: Player | null;
    showInviteFriends?: boolean;
    bgColorFromInviteFriends?: string;
    bgColorToInviteFriends?: string;
    useInfiniteScroll?: boolean;
}

function QuestsArtistMissions({
    artistId,
    player,
    showInviteFriends = true,
    bgColorFromInviteFriends = "#A5D7FB",
    bgColorToInviteFriends = "#8E76FA",
    useInfiniteScroll = false,
}: QuestsArtistMissionsProps) {
    const { quests, isLoading, error, questsInfiniteQuery } = useQuestGet({
        getQuestsInput: {
            artistId: artistId,
            isActive: true,
        },
        useInfiniteScroll,
        pageSize: 10,
    });

    const { ref, inView } = useInView({
        threshold: 0.1,
        triggerOnce: false,
    });

    const allQuests = useMemo(() => {
        if (!quests) return [];

        if (useInfiniteScroll && questsInfiniteQuery?.data) {
            return questsInfiniteQuery.data.pages.flatMap((page) => page.items);
        }

        return "items" in quests ? quests.items : [];
    }, [quests, questsInfiniteQuery?.data, useInfiniteScroll]);

    useEffect(() => {
        if (
            inView &&
            useInfiniteScroll &&
            questsInfiniteQuery?.hasNextPage &&
            !questsInfiniteQuery?.isFetchingNextPage
        ) {
            questsInfiniteQuery.fetchNextPage().catch((error) => {
                console.error(error);
            });
        }
    }, [inView, useInfiniteScroll, questsInfiniteQuery, allQuests.length]);

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
            <div key={artistId} className="relative">
                <div
                    className={cn(
                        "duration-1000 transition-all",
                        "w-full",
                        "py-1 px-2 sm:py-1 sm:px-3 md:py-2 md:px-4 lg:py-3 lg:px-5"
                    )}
                >
                    <div
                        className={cn(
                            useInfiniteScroll ? "overflow-y-auto" : "",
                            useInfiniteScroll
                                ? "max-h-[calc(100vh-300px)]"
                                : "",
                            useInfiniteScroll ? "scroll-smooth" : ""
                        )}
                    >
                        {allQuests && (
                            <div>
                                <QuestsMissions
                                    player={player}
                                    quests={allQuests}
                                    isLoading={isLoading}
                                    error={error}
                                    permission={true}
                                />

                                {useInfiniteScroll && (
                                    <div
                                        ref={ref}
                                        className="h-10 flex items-center justify-center"
                                    >
                                        {questsInfiniteQuery?.isFetchingNextPage && (
                                            <div className="text-sm text-white/60">
                                                Loading more quests...
                                            </div>
                                        )}
                                        {questsInfiniteQuery?.hasNextPage ===
                                            false &&
                                            allQuests.length > 0 && (
                                                <div className="text-sm text-white/40">
                                                    No more quests to load
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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
            artistId,
            allQuests,
            isLoading,
            error,
            showInviteFriends,
            bgColorFromInviteFriends,
            bgColorToInviteFriends,
            player,
            useInfiniteScroll,
            questsInfiniteQuery,
            ref,
        ]
    );

    const renderContent = useCallback(() => {
        if (isLoading) {
            return renderLoading();
        }
        if (error) {
            return renderError();
        }
        if (!allQuests || allQuests.length === 0) {
            return renderNoQuests();
        }
        return renderQuestsList();
    }, [
        isLoading,
        error,
        allQuests,
        renderLoading,
        renderError,
        renderNoQuests,
        renderQuestsList,
    ]);

    return renderContent();
}

export default memo(QuestsArtistMissions);
