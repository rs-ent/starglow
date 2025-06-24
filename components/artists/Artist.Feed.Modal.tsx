/// components/artists/Artist.Feed.Modal.tsx

import React, { useState, useMemo, useEffect } from "react";

import { X } from "lucide-react";
import dynamic from "next/dynamic";

import { useArtistFeedsGet } from "@/app/hooks/useArtistFeeds";
import { ArtistBG } from "@/lib/utils/get/artist-colors";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import ArtistFeedModalCard from "./Artist.Feed.Modal.Card";
import EnhancedPortal from "../atoms/Portal.Enhanced";

import type { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import type { Artist } from "@prisma/client";

interface ArtistFeedModalProps {
    initialFeeds: ArtistFeedWithReactions[];
    artist: Artist;
    initialFeedIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

const CustomCarousel = dynamic(() => import("../atoms/CustomCarousel"), {
    ssr: false,
});

export default React.memo(function ArtistFeedModal({
    initialFeeds,
    artist,
    initialFeedIndex = 0,
    isOpen,
    onClose,
}: ArtistFeedModalProps) {
    const { artistFeedsInfiniteQuery } = useArtistFeedsGet({
        getArtistFeedsInput: {
            artistId: artist.id,
            pagination: { limit: 15 },
        },
    });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overscrollBehavior = "none";
        } else {
            document.body.style.overscrollBehavior = "";
        }
        return () => {
            document.body.style.overscrollBehavior = "";
        };
    }, [isOpen]);

    const infiniteFeeds = useMemo(
        () =>
            artistFeedsInfiniteQuery.data
                ? artistFeedsInfiniteQuery.data.pages.flatMap(
                      (page) => page.feeds
                  )
                : [],
        [artistFeedsInfiniteQuery.data]
    );

    const fetchNextPage = artistFeedsInfiniteQuery.fetchNextPage;
    const hasNextPage = artistFeedsInfiniteQuery.hasNextPage;
    const isFetchingNextPage = artistFeedsInfiniteQuery.isFetchingNextPage;

    const allFeeds = useMemo(() => {
        return Array.from(
            new Map(
                [...initialFeeds, ...infiniteFeeds].map((feed) => [
                    feed.id,
                    feed,
                ])
            ).values()
        );
    }, [initialFeeds, infiniteFeeds]);

    const [currentIndex, setCurrentIndex] = useState(initialFeedIndex);

    const handleIndexChange = (next: number) => {
        setCurrentIndex(next);
        if (hasNextPage && next >= allFeeds.length - 3 && !isFetchingNextPage) {
            fetchNextPage().catch((error) => {
                console.error("Failed to fetch next page:", error);
            });
        }
    };

    if (!isOpen) return null;

    return (
        <EnhancedPortal layer="modal">
            <div
                className="fixed w-full h-full inset-0 overscroll-none"
                onClick={onClose}
                style={{
                    zIndex: 1000,
                    background: `linear-gradient(to bottom right, ${ArtistBG(
                        artist,
                        2,
                        100
                    )}, ${ArtistBG(artist, 3, 100)})`,
                    willChange: "transform, opacity",
                }}
            >
                <div
                    className="absolute inset-0 max-w-[768px] mx-auto w-full h-full bg-black flex shadow-2xl backdrop-blur-lg"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 헤더 */}
                    <div className="absolute top-0 left-0 right-0 z-50">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        "flex items-center justify-center rounded-full",
                                        getResponsiveClass(45).frameClass
                                    )}
                                    style={{
                                        background: `linear-gradient(to bottom right, ${ArtistBG(
                                            artist,
                                            0,
                                            60
                                        )}, ${ArtistBG(artist, 1, 80)})`,
                                    }}
                                >
                                    <img
                                        src={artist.logoUrl || ""}
                                        alt={artist.name}
                                        className={cn(
                                            "object-contain",
                                            getResponsiveClass(30).frameClass
                                        )}
                                    />
                                </div>
                                <h4
                                    className={cn(
                                        "text-white font-semibold",
                                        getResponsiveClass(30).textClass
                                    )}
                                >
                                    {artist.name}
                                </h4>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* 피드 컨테이너 */}
                    <div className="overflow-hidden max-w-[768px] mx-auto w-full h-full overscroll-none">
                        <CustomCarousel
                            direction="vertical"
                            initialIndex={initialFeedIndex}
                            onIndexChange={handleIndexChange}
                            containerClassName="w-full h-full"
                            indicatorClassName="right-4"
                            swipeThreshold={50}
                            showIndicators={true}
                        >
                            {allFeeds.map((feed, index) => {
                                if (Math.abs(index - currentIndex) > 2) {
                                    // Lazy: 보이지 않는 영역은 placeholder만 렌더링
                                    return (
                                        <div
                                            key={feed.id}
                                            className="w-full h-full flex items-center justify-center"
                                            aria-hidden="true"
                                        />
                                    );
                                }
                                return (
                                    <div
                                        key={feed.id}
                                        className="w-full h-full flex items-center justify-center"
                                    >
                                        <ArtistFeedModalCard
                                            feed={feed}
                                            artist={artist}
                                        />
                                    </div>
                                );
                            })}
                        </CustomCarousel>
                    </div>
                </div>
            </div>
        </EnhancedPortal>
    );
});
