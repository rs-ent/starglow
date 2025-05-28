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
import { ArtistBG } from "@/lib/utils/get/artist-colors";

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
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    // Error state
    if (error || !artist) {
        return (
            <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Grid3X3 className="w-8 h-8 text-gray-300" />
                </div>
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
                    "grid grid-cols-3 gap-1 w-full my-[20px]",
                    "px-[20px]",
                    getResponsiveClass(30).paddingClass
                )}
                style={{
                    background: `linear-gradient(to bottom, ${ArtistBG(
                        artist,
                        0,
                        0
                    )}, ${ArtistBG(artist, 1, 80)} 100%)`,
                }}
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
