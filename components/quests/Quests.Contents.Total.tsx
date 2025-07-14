/// components/quests/Quests.Contents.Total.tsx

"use client";

import { memo, useCallback, useMemo, useState, useRef, useEffect } from "react";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import QuestsMissions from "./Quests.Missions";
import InviteFriends from "../atoms/InviteFriends";
import type { QuestWithArtistAndRewardAsset } from "@/app/actions/quests";
import Image from "next/image";

import type { Artist, Player } from "@prisma/client";

interface QuestsTotalProps {
    player: Player | null;
    questsPageData: {
        infiniteQuests: {
            data: any;
            isLoading: boolean;
            isFetchingNextPage: boolean;
            hasNextPage: boolean;
            fetchNextPage: () => void;
            error: any;
        };
        playerQuestLogs: any[];
        referralLogs: any[];
        isLoading: boolean;
        error: any;
    };
}

function QuestsTotal({ player, questsPageData }: QuestsTotalProps) {
    const [selectedType, setSelectedType] = useState<string>("All");

    // 무한 스크롤을 위한 ref
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // 🚀 통합된 데이터에서 추출
    const {
        infiniteQuests: {
            data: infiniteData,
            isLoading,
            isFetchingNextPage,
            hasNextPage,
            fetchNextPage,
            error,
        },
        playerQuestLogs: questLogs,
        referralLogs,
    } = questsPageData;

    // 모든 퀘스트를 하나의 배열로 합치기
    const allQuests = useMemo(() => {
        const data = infiniteData as any;
        if (!data?.pages) return [];
        return data.pages.flatMap((page: any) => page.items);
    }, [infiniteData]);

    // 🚀 최적화된 types와 artistsMap 계산
    const { types, artistsMap } = useMemo(() => {
        // 빈 배열 처리 최적화
        if (!allQuests?.length) {
            return {
                types: ["All"],
                artistsMap: new Map<string, Artist>(),
            };
        }

        // 초기 용량을 미리 설정하여 성능 향상
        const uniqueTypesSet = new Set<string>();
        const uniqueArtistsMap = new Map<string, Artist>();

        // forEach 대신 for...of 사용 (약간의 성능 향상)
        for (const quest of allQuests) {
            // 조건부 체크를 먼저 하여 불필요한 작업 방지
            if (quest.type) {
                uniqueTypesSet.add(quest.type);
            }
            if (quest.artist?.name) {
                uniqueArtistsMap.set(quest.artist.name, quest.artist);
            }
        }

        // Array.from 최적화
        const questTypes =
            uniqueTypesSet.size > 0 ? Array.from(uniqueTypesSet) : [];
        const artistNames =
            uniqueArtistsMap.size > 0
                ? Array.from(uniqueArtistsMap.keys())
                : [];

        return {
            types: ["All", ...questTypes, ...artistNames],
            artistsMap: uniqueArtistsMap,
        };
    }, [allQuests]); // 의존성 배열 최적화 (length 체크 제거)

    // 🚀 filteredQuests 계산도 최적화
    const filteredQuests = useMemo(() => {
        if (!allQuests?.length) return [];

        // "All" 타입일 때는 필터링 없이 바로 반환
        if (selectedType === "All") {
            return allQuests;
        }

        // 필터링 로직 최적화
        return allQuests.filter((quest: QuestWithArtistAndRewardAsset) => {
            return (
                quest.type === selectedType ||
                quest.artist?.name === selectedType
            );
        });
    }, [allQuests, selectedType]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const target = entries[0];
                if (
                    target.isIntersecting &&
                    hasNextPage &&
                    !isFetchingNextPage &&
                    !isLoading // 초기 로딩 중에는 추가 페치 방지
                ) {
                    try {
                        fetchNextPage();
                    } catch (error) {
                        console.error("Failed to fetch next page:", error);
                    }
                }
            },
            {
                root: null,
                rootMargin: "200px", // 100px → 200px로 늘려서 더 빠른 로딩
                threshold: 0.1,
            }
        );

        const currentRef = loadMoreRef.current;
        if (currentRef && hasNextPage) {
            // hasNextPage 체크 추가
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, isLoading]); // isLoading 의존성 추가

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
                        {/* 🚀 최적화된 콘텐츠 렌더링 */}
                        {isLoading && !allQuests?.length ? (
                            // 초기 로딩 시 스켈레톤
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-20 bg-white/10 rounded-lg"></div>
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            // 에러 상태
                            <div className="text-center py-8">
                                <span className="text-red-400 text-sm">
                                    Failed to load quests. Please try again.
                                </span>
                            </div>
                        ) : allQuests && questLogs ? (
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
                        ) : null}

                        {/* 🚀 최적화된 무한 스크롤 로딩 영역 */}
                        {!isLoading &&
                            allQuests?.length > 0 &&
                            (isFetchingNextPage || hasNextPage) && (
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
                                    ) : null}
                                </div>
                            )}

                        {/* 끝에 도달했을 때만 표시 */}
                        {!isLoading &&
                            !hasNextPage &&
                            allQuests?.length > 0 && (
                                <div className="py-6 md:py-8 flex justify-center">
                                    <span className="text-white/40 text-xs md:text-sm">
                                        🎉 You've reached the end!
                                    </span>
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
