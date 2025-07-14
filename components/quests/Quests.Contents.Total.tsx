/// components/quests/Quests.Contents.Total.tsx

"use client";

import { memo, useCallback, useMemo, useState, useRef, useEffect } from "react";

import { useInfiniteQuest } from "@/app/hooks/useQuest";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import QuestsMissions from "./Quests.Missions";
import InviteFriends from "../atoms/InviteFriends";
import type { QuestWithArtistAndRewardAsset } from "@/app/actions/quests";
import Image from "next/image";

import type { Artist, Player, QuestLog, ReferralLog } from "@prisma/client";

interface QuestsTotalProps {
    player: Player | null;
    questLogs: QuestLog[];
    referralLogs?: ReferralLog[];
}

const now = new Date();

function QuestsTotal({ player, questLogs, referralLogs }: QuestsTotalProps) {
    const [selectedType, setSelectedType] = useState<string>("All");

    // 무한 스크롤을 위한 ref
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // 무한 스크롤 쿼리
    const {
        data: infiniteData,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        error,
    } = useInfiniteQuest({
        isActive: true,
        startDate: now,
        endDate: now,
        startDateIndicator: "after",
        endDateIndicator: "before",
        test: player?.tester ?? false,
    });

    // 모든 퀘스트를 하나의 배열로 합치기
    const allQuests = useMemo(() => {
        const data = infiniteData as any;
        if (!data?.pages) return [];
        return data.pages.flatMap((page: any) => page.items);
    }, [infiniteData]);

    const { types, artistsMap } = useMemo(() => {
        if (!allQuests || allQuests.length === 0) {
            return {
                types: ["All"],
                artistsMap: new Map<string, Artist>(),
            };
        }

        const uniqueTypesSet = new Set<string>();
        const uniqueArtistsMap = new Map<string, Artist>();

        allQuests.forEach((quest: QuestWithArtistAndRewardAsset) => {
            if (quest.type) uniqueTypesSet.add(quest.type);
            if (quest.artist) {
                uniqueArtistsMap.set(quest.artist.name, quest.artist);
            }
        });

        const questTypes = Array.from(uniqueTypesSet);
        const artistNames = Array.from(uniqueArtistsMap.keys());

        return {
            types: ["All", ...questTypes, ...artistNames],
            artistsMap: uniqueArtistsMap,
        };
    }, [allQuests]);

    const filteredQuests = useMemo(() => {
        if (!allQuests) return [];

        return selectedType === "All"
            ? allQuests
            : allQuests.filter(
                  (quest: QuestWithArtistAndRewardAsset) =>
                      quest.type === selectedType ||
                      quest.artist?.name === selectedType
              );
    }, [allQuests, selectedType]);

    // Intersection Observer로 무한 스크롤 구현
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const target = entries[0];
                if (
                    target.isIntersecting &&
                    hasNextPage &&
                    !isFetchingNextPage
                ) {
                    fetchNextPage().catch((error) => {
                        console.error("Failed to fetch next page:", error);
                    });
                }
            },
            {
                root: null,
                rootMargin: "100px", // 100px 전에 미리 로딩
                threshold: 0.1,
            }
        );

        const currentRef = loadMoreRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handleTypeClick = useCallback((type: string) => {
        setSelectedType(type);
    }, []);

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

                <div>
                    <div
                        key={selectedType}
                        className={cn("mb-[100px] lg:mb-[0px]")}
                    >
                        {allQuests && questLogs && (
                            <QuestsMissions
                                player={player}
                                quests={filteredQuests}
                                questLogs={questLogs}
                                isLoading={isLoading}
                                error={error}
                                permission={true}
                                tokenGating={null}
                                referralLogs={referralLogs || []}
                            />
                        )}

                        {/* 무한 스크롤 로딩 영역 */}
                        {(isFetchingNextPage || hasNextPage) && (
                            <div
                                ref={loadMoreRef}
                                className="py-6 md:py-8 flex justify-center"
                            >
                                {isFetchingNextPage ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full border-b-2 border-white/50 w-4 h-4 md:w-5 md:h-5"></div>
                                        <span className="text-white/60 text-xs md:text-sm">
                                            Loading more quests...
                                        </span>
                                    </div>
                                ) : hasNextPage ? (
                                    <span className="text-white/40 text-xs md:text-sm">
                                        Scroll to load more
                                    </span>
                                ) : (
                                    <span className="text-white/40 text-xs md:text-sm">
                                        🎉 You've reached the end!
                                    </span>
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
        artist?: Artist;
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
