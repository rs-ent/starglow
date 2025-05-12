/// components/organisms/Polls.Public.tsx

"use client";

import { usePollsGet } from "@/app/hooks/usePolls";
import { cn } from "@/lib/utils/tailwind";
import { Player, PollLog } from "@prisma/client";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import PartialLoading from "@/components/atoms/PartialLoading";
import PollsList from "./Polls.List";

interface PollsPublicProps {
    player: Player | null;
    pollLogs?: PollLog[];
    className?: string;
}

export default function PollsPublic({
    player,
    pollLogs,
    className,
}: PollsPublicProps) {
    const { pollsList, isLoading, error } = usePollsGet({
        getPollsInput: {
            category: "PUBLIC",
            isActive: true,
        },
    });

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
                    <PartialLoading text="Loading..." size="sm" />
                ) : error ? (
                    <div>
                        Error:{" "}
                        {typeof error === "string" ? error : error.message}
                    </div>
                ) : pollsList?.items && pollsList.items.length > 0 ? (
                    <PollsList
                        polls={pollsList.items}
                        player={player}
                        pollLogs={
                            pollLogs &&
                            pollLogs.filter((log) =>
                                pollsList.items.some(
                                    (poll) => poll.id === log.pollId
                                )
                            )
                        }
                    />
                ) : (
                    <div className="text-center text-2xl">No polls found</div>
                )}
            </div>
        </div>
    );
}
