/// components/polls/Polls.Contents.Public.tsx

"use client";

import { memo, useMemo } from "react";


import { usePollsGet } from "@/app/hooks/usePolls";
import PartialLoading from "@/components/atoms/PartialLoading";
import { cn } from "@/lib/utils/tailwind";

import PollsList from "./Polls.List";

import type { Player, PollLog } from "@prisma/client";


interface PollsContentsPublicProps {
    player: Player | null;
    pollLogs?: PollLog[];
    className?: string;
}

function PollsContentsPublic({
    player,
    pollLogs,
    className,
}: PollsContentsPublicProps) {
    const { pollsList, isLoading, error } = usePollsGet({
        getPollsInput: {
            category: "PUBLIC",
            isActive: true,
            artistId: null,
        },
    });

    const polls = useMemo(() => pollsList?.items, [pollsList?.items]);

    return (
        <div
            className={cn(
                "max-w-[1400px] w-screen",
                "px-[10px] sm:px-[10px] md:px-[20px] lg:px-[20px]",
                "mt-[10px] sm:mt-[15px] md:mt-[20px] lg:mt-[25px] xl:mt-[30px]",
                className
            )}
        >
            <div className="relative">
                {isLoading ? (
                    <PartialLoading text="Loading..." />
                ) : error ? (
                    <div className="text-center text-red-400 py-4">
                        Error: {error.message}
                    </div>
                ) : (
                    <div key="public-polls">
                        {polls && polls.length > 0 ? (
                            <PollsList
                                polls={polls}
                                player={player}
                                pollLogs={
                                    pollLogs &&
                                    pollLogs.filter((log) =>
                                        polls.some(
                                            (poll) => poll.id === log.pollId
                                        )
                                    )
                                }
                            />
                        ) : (
                            <div className="text-center text-2xl py-10">
                                No polls found
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(PollsContentsPublic);
