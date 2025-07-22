/// components/polls/Polls.Contents.Total.tsx

"use client";

import { memo, useState, useEffect } from "react";

import { usePollsGet } from "@/app/hooks/usePolls";
import { cn } from "@/lib/utils/tailwind";
import PollsList from "./Polls.List";
import PollsFilter from "./Polls.Contents.Total.Filter";
import type { ClientPollFilters } from "./Polls.Contents.Total.Filter";

import type { Player } from "@prisma/client";

interface PollsContentsTotalProps {
    player: Player | null;
    className?: string;
}

function PollsContentsTotal({ player, className }: PollsContentsTotalProps) {
    // 필터 상태 관리
    const [filters, setFilters] = useState<ClientPollFilters>({
        isActive: true,
    });

    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState(1);
    const [allPolls, setAllPolls] = useState<any[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // 페이지네이션된 데이터 가져오기
    const { pollsList, isLoading, error } = usePollsGet({
        getPollsInput: {
            isActive: true,
            showOnPollPage: true,
            test: player?.tester ?? false,
            // 지원되는 필터 조건들만 추가
            artistId: filters.artistId,
            bettingMode: filters.bettingMode,
            hasAnswer: filters.hasAnswer,
            participationRewardAssetId: filters.participationRewardAssetId,
        },
        pagination: {
            currentPage: currentPage,
            itemsPerPage: 5,
        },
    });

    // 새로운 데이터가 로드되면 누적
    useEffect(() => {
        if (pollsList?.items) {
            if (currentPage === 1) {
                setAllPolls(pollsList.items);
            } else {
                setAllPolls((prev) => [...prev, ...pollsList.items]);
            }
            setTotalItems(pollsList.totalItems);
            setTotalPages(pollsList.totalPages);
        }
    }, [
        pollsList?.items,
        currentPage,
        pollsList?.totalItems,
        pollsList?.totalPages,
    ]);

    // 캐러셀 인덱스 변경 핸들러
    const handleCarouselIndexChange = (index: number) => {
        // 인덱스가 현재 로드된 데이터의 80% 지점에 도달하면 다음 페이지 로드
        const loadedItems = allPolls.length;
        const threshold = Math.floor(loadedItems * 0.5);

        if (
            index >= threshold &&
            pollsList?.totalPages &&
            currentPage < pollsList.totalPages
        ) {
            setCurrentPage(currentPage + 1);
        }
    };

    // 필터 변경 시 페이지 리셋 및 데이터 초기화
    const handleFiltersChange = (newFilters: ClientPollFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
        setAllPolls([]); // 기존 데이터 초기화
    };

    return (
        <div
            className={cn(
                "max-w-[1400px] w-screen",
                "px-[10px] sm:px-[10px] md:px-[20px] lg:px-[20px]",
                "mt-[10px] sm:mt-[15px] md:mt-[20px] lg:mt-[25px] xl:mt-[30px]",
                className
            )}
        >
            {/* 필터 컴포넌트 */}
            <PollsFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
                allPolls={pollsList?.items || []}
                filteredCount={pollsList?.items?.length || 0}
                className="mb-1"
            />

            <div className="relative">
                {error ? (
                    <div className="text-center text-red-400 py-4">
                        Error: {error.message}
                    </div>
                ) : (
                    <div key="public-polls">
                        {allPolls && allPolls.length > 0 ? (
                            <PollsList
                                polls={allPolls}
                                player={player}
                                totalItems={totalItems}
                                totalPages={totalPages}
                                currentPage={currentPage}
                                onPageChange={handleCarouselIndexChange}
                                isListLoading={isLoading}
                            />
                        ) : (
                            <div className="text-center text-2xl py-10">
                                {isLoading ? "Loading..." : "No polls found"}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(PollsContentsTotal);
