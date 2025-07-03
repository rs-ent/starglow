/// components/polls/Polls.Contents.Total.tsx

"use client";

import { memo, useMemo, useState } from "react";

import { usePollsGet } from "@/app/hooks/usePolls";
import PartialLoading from "@/components/atoms/PartialLoading";
import { cn } from "@/lib/utils/tailwind";
import PollsList from "./Polls.List";
import PollsFilter, {
    getPollActualStatus,
} from "./Polls.Contents.Total.Filter";
import type { ClientPollFilters } from "./Polls.Contents.Total.Filter";

import type { Player, PollLog } from "@prisma/client";

interface PollsContentsTotalProps {
    player: Player | null;
    pollLogs?: PollLog[];
    className?: string;
}

function PollsContentsTotal({
    player,
    pollLogs,
    className,
}: PollsContentsTotalProps) {
    // 필터 상태 관리
    const [filters, setFilters] = useState<ClientPollFilters>({
        isActive: true,
    });

    // 전체 데이터를 한 번만 가져오기
    const { pollsList, isLoading, error } = usePollsGet({
        getPollsInput: { isActive: true, showOnPollPage: true },
    });

    // 클라이언트 사이드 필터링
    const filteredPolls = useMemo(() => {
        if (!pollsList?.items) return [];

        return pollsList.items.filter((poll) => {
            // 아티스트 필터
            if (filters.artistId !== undefined) {
                if (filters.artistId === null && poll.artistId !== null) {
                    return false;
                }
                if (
                    filters.artistId !== null &&
                    poll.artistId !== filters.artistId
                ) {
                    return false;
                }
            }

            // 실제 상태 필터
            if (filters.actualStatus) {
                const actualStatus = getPollActualStatus(
                    poll.startDate,
                    poll.endDate
                );
                if (actualStatus !== filters.actualStatus) {
                    return false;
                }
            }

            // 베팅모드 필터
            if (
                filters.bettingMode !== undefined &&
                poll.bettingMode !== filters.bettingMode
            ) {
                return false;
            }

            // 다중 투표 필터
            if (
                filters.allowMultipleVote !== undefined &&
                poll.allowMultipleVote !== filters.allowMultipleVote
            ) {
                return false;
            }

            return true;
        });
    }, [pollsList?.items, filters]);

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
                onFiltersChange={setFilters}
                allPolls={pollsList?.items || []}
                filteredCount={filteredPolls.length}
                className="mb-1"
            />

            <div className="relative">
                {isLoading ? (
                    <PartialLoading text="Loading..." />
                ) : error ? (
                    <div className="text-center text-red-400 py-4">
                        Error: {error.message}
                    </div>
                ) : (
                    <div key="public-polls">
                        {filteredPolls && filteredPolls.length > 0 ? (
                            <PollsList
                                polls={filteredPolls}
                                player={player}
                                pollLogs={
                                    pollLogs &&
                                    pollLogs.filter((log) =>
                                        filteredPolls.some(
                                            (poll) => poll.id === log.pollId
                                        )
                                    )
                                }
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
