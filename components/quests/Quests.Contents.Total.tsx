/// components/quests/Quests.Contents.Total.tsx

"use client";

import { memo, useCallback, useMemo, useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { useQuestGet } from "@/app/hooks/useQuest";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import QuestsMissions from "./Quests.Missions";
import InviteFriends from "../atoms/InviteFriends";
import type { QuestWithClaimStatus } from "@/app/actions/quests";
import Image from "next/image";

import type { Artist, Player } from "@prisma/client";

interface QuestsTotalProps {
    player: Player | null;
    useInfiniteScroll?: boolean;
}

const now = new Date();

function QuestsTotal({ player, useInfiniteScroll = true }: QuestsTotalProps) {
    const { quests, questTypes, isLoading, error, questsInfiniteQuery } =
        useQuestGet({
            getQuestsInput: {
                isActive: true,
                startDate: now,
                endDate: now,
                startDateIndicator: "after",
                endDateIndicator: "before",
                test: player?.tester ?? false,
                playerId: player?.id,
            },
            getQuestTypesInput: {
                isActive: true,
                startDate: now,
                endDate: now,
                test: player?.tester ?? false,
            },
            useInfiniteScroll,
            pageSize: 10,
        });

    const [selectedType, setSelectedType] = useState<string>("All");

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

    const { types, artistsMap } = useMemo(() => {
        if (!questTypes || questTypes.length === 0) {
            return {
                types: ["All"],
                artistsMap: new Map<string, Artist>(),
            };
        }

        const uniqueArtistsMap = new Map<
            string,
            {
                id: string;
                code: string;
                imageUrl: string | null;
                logoUrl: string | null;
                name: string;
            }
        >();
        const regularTypes: string[] = [];
        const artistTypes: string[] = [];

        questTypes.forEach((item) => {
            if (item.type) {
                if (item.artist) {
                    // 아티스트 타입
                    artistTypes.push(item.artist.name);
                    uniqueArtistsMap.set(item.artist.name, {
                        id: "",
                        code: "",
                        name: item.artist.name,
                        imageUrl: item.artist.logoUrl || null,
                        logoUrl: item.artist.logoUrl || null,
                    });
                } else {
                    // 일반 타입
                    regularTypes.push(item.type);
                }
            }
        });

        // 각각 알파벳 순으로 정렬
        const sortedRegularTypes = regularTypes.sort((a, b) =>
            a.localeCompare(b)
        );
        const sortedArtistTypes = artistTypes.sort((a, b) =>
            a.localeCompare(b)
        );

        return {
            types: ["All", ...sortedRegularTypes, ...sortedArtistTypes],
            artistsMap: uniqueArtistsMap,
        };
    }, [questTypes]);

    const filteredQuests = useMemo(() => {
        if (!allQuests) return [];

        return selectedType === "All"
            ? allQuests
            : allQuests.filter(
                  (quest: QuestWithClaimStatus) =>
                      quest.type === selectedType ||
                      quest.artist?.name === selectedType
              );
    }, [allQuests, selectedType]);

    const sortedQuests = useMemo(() => {
        if (!filteredQuests) return [];

        return [...filteredQuests].sort((a, b) => {
            const aLog = a.questLog;
            const bLog = b.questLog;

            const getQuestPriority = (questLog: any) => {
                if (!questLog) return 2;
                if (questLog.completed && !questLog.isClaimed) return 1;
                if (!questLog.completed && !questLog.isClaimed) return 2;
                if (questLog.isClaimed) return 3;
                return 2;
            };

            const aPriority = getQuestPriority(aLog);
            const bPriority = getQuestPriority(bLog);

            return aPriority - bPriority;
        });
    }, [filteredQuests]);

    const handleTypeClick = useCallback((type: string) => {
        setSelectedType(type);
    }, []);

    useEffect(() => {
        if (
            inView &&
            useInfiniteScroll &&
            questsInfiniteQuery?.hasNextPage &&
            !questsInfiniteQuery?.isFetchingNextPage
        ) {
            questsInfiniteQuery.fetchNextPage().catch((error) => {
                console.error("Error fetching next page:", error);
            });
        }
    }, [inView, useInfiniteScroll, questsInfiniteQuery, sortedQuests.length]);

    return (
        <div className="relative max-w-[1000px] w-screen">
            <div
                className={cn(
                    "py-4 px-6 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-12"
                )}
            >
                <div className="my-[20px] mb-[50px] lg:my-[30px] lg:mb-[80px]">
                    <InviteFriends player={player} />
                </div>

                <div className="flex justify-between items-end mb-6">
                    <div className="flex flex-row gap-2 overflow-x-auto whitespace-nowrap pb-2">
                        {types.map((type) => (
                            <TypeButton
                                key={type}
                                type={type}
                                isSelected={selectedType === type}
                                onClick={handleTypeClick}
                                artist={artistsMap.get(type)}
                            />
                        ))}
                    </div>
                </div>

                <div
                    className={cn(
                        "overflow-y-auto",
                        "max-h-[calc(100vh-300px)]",
                        "scroll-smooth"
                    )}
                >
                    <div
                        key={selectedType}
                        className={cn("mb-[100px] lg:mb-[0px]")}
                    >
                        <QuestsMissions
                            player={player}
                            quests={sortedQuests}
                            isLoading={isLoading}
                            error={error}
                            permission={true}
                            tokenGating={null}
                        />

                        {useInfiniteScroll && (
                            <div
                                ref={ref}
                                className="h-10 flex items-center justify-center"
                            >
                                {questsInfiniteQuery?.isFetchingNextPage && (
                                    <div className="text-sm text-gray-500">
                                        Loading more quests...
                                    </div>
                                )}
                                {questsInfiniteQuery?.hasNextPage === false &&
                                    sortedQuests.length > 0 && (
                                        <div className="text-sm text-gray-400">
                                            No more quests to load
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const TypeButton = memo(
    ({
        type,
        artist,
        isSelected,
        onClick,
    }: {
        type: string;
        artist?: {
            id: string;
            code: string | null;
            imageUrl: string | null;
            logoUrl: string | null;
            name: string;
        };
        isSelected: boolean;
        onClick: (type: string) => void;
    }) => {
        const handleClick = useCallback(() => {
            onClick(type);
        }, [onClick, type]);

        return (
            <div
                className={cn(
                    "flex flex-row gap-2 items-center justify-center text-sm transition-all duration-500 morp-glass-1 rounded-full px-4 py-2",
                    "cursor-pointer backdrop-blur-xs",
                    getResponsiveClass(15).textClass,
                    isSelected ? "opacity-100" : "opacity-50"
                )}
                onClick={handleClick}
            >
                {artist && artist.logoUrl && (
                    <Image
                        src={artist.logoUrl}
                        alt={artist.name}
                        width={20}
                        height={20}
                        className={cn(
                            "object-contain",
                            getResponsiveClass(20).frameClass
                        )}
                    />
                )}
                {type}
            </div>
        );
    }
);

TypeButton.displayName = "TypeButton";

export default memo(QuestsTotal);
