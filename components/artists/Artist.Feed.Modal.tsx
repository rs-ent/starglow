/// components/artists/Artist.Feed.Modal.tsx

import { useState, useRef, useMemo } from "react";
import { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import { useArtistFeedsGet } from "@/app/hooks/useArtistFeeds";
import { Artist } from "@prisma/client";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";
import ArtistFeedModalCard from "./Artist.Feed.Modal.Card";
import { ArtistBG } from "@/lib/utils/get/artist-colors";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import Portal from "../atoms/Portal";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface ArtistFeedModalProps {
    initialFeeds: ArtistFeedWithReactions[];
    artist: Artist;
    initialFeedIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function ArtistFeedModal({
    initialFeeds,
    artist,
    initialFeedIndex = 0,
    isOpen,
    onClose,
}: ArtistFeedModalProps) {
    const [currentFeedIndex, setCurrentFeedIndex] = useState(initialFeedIndex);
    const sliderRef = useRef<Slider>(null);

    const { artistFeedsInfiniteQuery } = useArtistFeedsGet({
        getArtistFeedsInput: {
            artistId: artist.id,
            pagination: { limit: 15 },
        },
    });

    const infiniteFeeds = artistFeedsInfiniteQuery.data
        ? artistFeedsInfiniteQuery.data.pages.flatMap((page) => page.feeds)
        : [];

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

    const handleBeforeChange = (_: number, next: number) => {
        setCurrentFeedIndex(next);
        if (hasNextPage && next >= allFeeds.length - 3 && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const sliderSettings = {
        initialSlide: initialFeedIndex,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        swipeToSlide: true,
        beforeChange: handleBeforeChange,
        vertical: true,
        verticalSwiping: true,
        arrows: false,
        dots: false,
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div
                className="fixed w-screen h-[100dvh] inset-0 bg-[rgba(0,0,0,0.7)] backdrop-blur-xs overscroll-none"
                onClick={onClose}
                style={{
                    zIndex: 1000,
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
                    <div className="overflow-hidden max-w-[768px] mx-auto w-screen h-[100dvh] overscroll-none">
                        <Slider ref={sliderRef} {...sliderSettings}>
                            {allFeeds.map((feed, index) => {
                                return (
                                    <div
                                        key={feed.id}
                                        className="w-full h-[100dvh] flex items-center justify-center"
                                    >
                                        <ArtistFeedModalCard
                                            feed={feed}
                                            artist={artist}
                                        />
                                    </div>
                                );
                            })}
                        </Slider>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
