/// components/polls/Polls.Contents.Private.ArtistList.tsx

"use client";

import { memo, useCallback } from "react";

import { usePollsGet } from "@/app/hooks/usePolls";
import { cn } from "@/lib/utils/tailwind";

import PollsList from "./Polls.List";
import PartialLoading from "../atoms/PartialLoading";
import type { Player } from "@prisma/client";

interface PollsContentsPrivateArtistListProps {
    artistId: string;
    player: Player | null;
    className?: string;
    fgColorFrom?: string;
    fgColorTo?: string;
    bgColorFrom?: string;
    bgColorTo?: string;
    bgColorAccentFrom?: string;
    bgColorAccentTo?: string;
    forceSlidesToShow?: number;
}

function PollsContentsPrivateArtistList({
    artistId,
    player,
    className,
    fgColorFrom,
    fgColorTo,
    bgColorFrom,
    bgColorTo,
    bgColorAccentFrom,
    bgColorAccentTo,
    forceSlidesToShow,
}: PollsContentsPrivateArtistListProps) {
    const { pollsList, isLoading, error } = usePollsGet({
        getPollsInput: {
            artistId: artistId,
            isActive: true,
        },
    });

    // 로딩 상태 렌더링
    const renderLoading = useCallback(
        () => (
            <div className="w-full py-8 flex justify-center">
                <PartialLoading text="Loading!..." />
            </div>
        ),
        []
    );

    // 에러 상태 렌더링
    const renderError = useCallback(
        () => (
            <div className="text-center text-red-400 py-6">
                Error: {error?.message || "Failed to load polls"}
            </div>
        ),
        [error]
    );

    // 폴 없음 상태 렌더링
    const renderNoPolls = useCallback(
        () => (
            <div className="text-center text-2xl py-10 text-white/80">
                No polls found for this artist
            </div>
        ),
        []
    );

    // 폴 목록 렌더링
    const renderPollsList = useCallback(() => {
        if (!pollsList?.items) return null;

        return (
            <PollsList
                polls={pollsList.items}
                player={player}
                fgColorFrom={fgColorFrom}
                fgColorTo={fgColorTo}
                bgColorFrom={bgColorFrom}
                bgColorTo={bgColorTo}
                bgColorAccentFrom={bgColorAccentFrom}
                bgColorAccentTo={bgColorAccentTo}
                forceSlidesToShow={forceSlidesToShow}
                needMarginBottom={false}
            />
        );
    }, [
        pollsList?.items,
        player,
        fgColorFrom,
        fgColorTo,
        bgColorFrom,
        bgColorTo,
        bgColorAccentFrom,
        bgColorAccentTo,
        forceSlidesToShow,
    ]);

    // 컨텐츠 렌더링 결정
    const renderContent = useCallback(() => {
        if (isLoading) {
            return renderLoading();
        }

        if (error) {
            return renderError();
        }

        if (!pollsList?.items || pollsList.items.length === 0) {
            return renderNoPolls();
        }

        return renderPollsList();
    }, [
        isLoading,
        error,
        pollsList?.items,
        renderLoading,
        renderError,
        renderNoPolls,
        renderPollsList,
    ]);

    return (
        <div className={cn("w-full", className)}>
            <div className="relative">{renderContent()}</div>
        </div>
    );
}

export default memo(PollsContentsPrivateArtistList);
