/// components/artists/Artist.Feed.tsx

"use client";

import { useMemo } from "react";

import { useArtistFeedsGet } from "@/app/hooks/useArtistFeeds";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import ArtistFeedCard from "./Artist.Feed.Card";
import PartialLoading from "../atoms/PartialLoading";

import type { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import type { Artist } from "@prisma/client";

interface ArtistFeedProps {
    artist: Artist | null;
    onSelectFeed?: (
        initialFeeds: ArtistFeedWithReactions[],
        selectedFeedIndex: number
    ) => void;
}

export default function ArtistFeed({ artist, onSelectFeed }: ArtistFeedProps) {
    const { artistFeeds, isLoading, error } = useArtistFeedsGet({
        getArtistFeedsInput: {
            artistId: artist?.id || "",
            pagination: {
                limit: 9,
                cursor: undefined,
            },
        },
    });

    const feeds = useMemo(() => {
        if (artistFeeds?.feeds && artistFeeds.feeds.length > 0) {
            return artistFeeds.feeds;
        }
        return [];
    }, [artistFeeds]);

    // Loading state
    if (isLoading) {
        return <PartialLoading text="Loading..." />;
    }

    // Error state
    if (error || !artist) {
        return (
            <div className="text-center text-gray-500">
                <p className="text-lg font-medium text-gray-100 mb-2">
                    Unable to load feeds
                </p>
                <p className="text-sm">Please try again later</p>
            </div>
        );
    }

    // Empty state
    if (feeds.length === 0) {
        return <div></div>;
    }

    return (
        <>
            {feeds.length > 0 && (
                <div
                    className={cn(
                        "w-full rounded-[16px] gradient-border",
                        "py-[10px]",
                        "morp-glass-3",
                        "bg-gradient-to-br from-[rgba(0,0,0,0.1)] to-[rgba(0,0,0,0.2)]"
                    )}
                >
                    <div
                        className={cn(
                            "grid grid-cols-3 gap-1 w-full",
                            getResponsiveClass(30).paddingClass
                        )}
                    >
                        {feeds.slice(0, 9).map((feed, index) => (
                            <ArtistFeedCard
                                key={feed.id}
                                feed={feed}
                                onClick={() => {
                                    onSelectFeed?.(feeds, index);
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
