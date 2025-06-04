/// components/artists/Artist.Feed.tsx

"use client";

import { useMemo } from "react";
import { useArtistFeedsGet } from "@/app/hooks/useArtistFeeds";
import { Artist } from "@prisma/client";
import { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import { useState } from "react";
import ArtistFeedCard from "./Artist.Feed.Card";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import PartialLoading from "../atoms/PartialLoading";

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
        return <PartialLoading text="Loading feeds..." size="sm" />;
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
            <div
                className={cn(
                    "grid grid-cols-3 gap-1 w-full",
                    getResponsiveClass(30).paddingClass
                )}
                style={{
                    WebkitMaskImage:
                        feeds.length <= 6
                            ? "none"
                            : "linear-gradient(to bottom, black 40%, transparent 80%)",
                    maskImage:
                        feeds.length <= 6
                            ? "none"
                            : "linear-gradient(to bottom, black 40%, transparent 80%)",
                }}
            >
                {feeds.slice(0, 9).map((feed, index) => (
                    <ArtistFeedCard
                        key={feed.id}
                        feed={feed}
                        artist={artist}
                        onClick={() => {
                            onSelectFeed?.(feeds, index);
                        }}
                    />
                ))}
            </div>
        </>
    );
}
