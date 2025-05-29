/// components/artists/Artist.Feed.tsx

"use client";

import { useArtistFeedsGet } from "@/app/hooks/useArtistFeeds";
import { Artist } from "@prisma/client";
import { useState } from "react";
import { Loader2, Grid3X3 } from "lucide-react";
import ArtistFeedCard from "./Artist.Feed.Card";
import ArtistFeedModal from "./Artist.Feed.Modal";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import PartialLoading from "../atoms/PartialLoading";

interface ArtistFeedProps {
    artist: Artist | null;
}

export default function ArtistFeed({ artist }: ArtistFeedProps) {
    const [selectedFeedIndex, setSelectedFeedIndex] = useState<number | null>(
        null
    );

    const { artistFeeds, isLoading, error } = useArtistFeedsGet({
        getArtistFeedsInput: {
            artistId: artist?.id || "",
        },
    });

    // Loading state
    if (isLoading) {
        return <PartialLoading text="Loading feeds..." size="sm" />;
    }

    // Error state
    if (error || !artist) {
        return (
            <div className="text-center text-gray-500">
                <p className="text-lg font-medium text-gray-900 mb-2">
                    Unable to load feeds
                </p>
                <p className="text-sm">Please try again later</p>
            </div>
        );
    }

    const feeds = artistFeeds?.feeds || [];

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
            >
                {feeds.map((feed, index) => (
                    <ArtistFeedCard
                        key={feed.id}
                        feed={feed}
                        artist={artist}
                        onClick={() => setSelectedFeedIndex(index)}
                    />
                ))}
            </div>

            {/* Feed modal */}
            <ArtistFeedModal
                feeds={feeds}
                artist={artist}
                initialFeedIndex={selectedFeedIndex || 0}
                isOpen={selectedFeedIndex !== null}
                onClose={() => setSelectedFeedIndex(null)}
            />
        </>
    );
}
