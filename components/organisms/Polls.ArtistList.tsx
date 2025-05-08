/// components/organisms/Polls.ArtistList.tsx

"use client";

import { AdvancedTokenGateResult } from "@/app/actions/blockchain";
import { usePollsGet } from "@/app/hooks/usePolls";
import { Artist, Player } from "@prisma/client";
import PollsList from "./Polls.List";
import PartialLoading from "../atoms/PartialLoading";
import { cn } from "@/lib/utils/tailwind";
import { useEffect, useState } from "react";

interface PollsArtistListProps {
    artist: Artist;
    player: Player;
    tokenGatingResult?: AdvancedTokenGateResult | null;
    className?: string;
}

export default function PollsArtistList({
    artist,
    player,
    tokenGatingResult,
    className,
}: PollsArtistListProps) {
    const { pollsList, isLoading, error } = usePollsGet({
        getPollsInput: {
            artistId: artist.id,
        },
    });

    const [permission, setPermission] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (
            tokenGatingResult &&
            tokenGatingResult.success &&
            tokenGatingResult.data &&
            tokenGatingResult.data.hasToken
        ) {
            const hasAnyToken = Object.values(
                tokenGatingResult.data.hasToken
            ).some(Boolean);
            setPermission(hasAnyToken);
        } else {
            setPermission(false);
        }
    }, [tokenGatingResult]);

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
                "px-[40px] sm:px-[40px] md:px-[40px] lg:px-[40px]",
                "mt-[20px] sm:mt-[35px] md:mt-[40px] lg:mt-[45px] xl:mt-[50px]",
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
                    <PollsList polls={pollsList.items} />
                ) : (
                    <div className="text-center text-2xl">No polls found</div>
                )}
            </div>
        </div>
    );
}
