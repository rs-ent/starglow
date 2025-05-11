/// components/organisms/Polls.ArtistList.tsx

"use client";

import { AdvancedTokenGateResult } from "@/app/actions/blockchain";
import { usePollsGet } from "@/app/hooks/usePolls";
import { Artist, Player, PollLog } from "@prisma/client";
import PollsList from "./Polls.List";
import PartialLoading from "../atoms/PartialLoading";
import { cn } from "@/lib/utils/tailwind";
import { useEffect, useState } from "react";

interface PollsArtistListProps {
    artist: Artist;
    player: Player | null;
    pollLogs?: PollLog[];
    tokenGatingResult?: AdvancedTokenGateResult | null;
    className?: string;
}

export default function PollsArtistList({
    artist,
    player,
    pollLogs,
    tokenGatingResult,
    className,
}: PollsArtistListProps) {
    const { pollsList, isLoading, error } = usePollsGet({
        getPollsInput: {
            artistId: artist.id,
        },
    });

    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (pollsList && tokenGatingResult && !isLoading) {
            if (pollsList.items.length === 0) {
                setIsReady(false);
            } else {
                setIsReady(true);
            }
        }
    }, [pollsList, tokenGatingResult, isLoading]);

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
                {!isReady ? (
                    <PartialLoading text="Loading..." size="sm" />
                ) : error ? (
                    <div>
                        Error:{" "}
                        {typeof error === "string" ? error : error.message}
                    </div>
                ) : pollsList?.items && pollsList.items.length > 0 ? (
                    <PollsList
                        polls={pollsList.items}
                        artist={artist}
                        player={player}
                        tokenGatingData={tokenGatingResult}
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
