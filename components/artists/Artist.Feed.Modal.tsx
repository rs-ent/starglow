/// components/artists/Artist.Feed.Modal.tsx

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import { Artist } from "@prisma/client";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";
import ArtistFeedModalCard from "./Artist.Feed.Modal.Card";
import { ArtistBG } from "@/lib/utils/get/artist-colors";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import Portal from "../atoms/Portal";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface ArtistFeedModalProps {
    feeds: ArtistFeedWithReactions[];
    artist: Artist;
    initialFeedIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function ArtistFeedModal({
    feeds,
    artist,
    initialFeedIndex = 0,
    isOpen,
    onClose,
}: ArtistFeedModalProps) {
    const [currentFeedIndex, setCurrentFeedIndex] = useState(initialFeedIndex);

    const sliderSettings = {
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        vertical: true,
        verticalSwiping: true,
        swipeToSlide: true,
        afterChange: (index: number) => setCurrentFeedIndex(index),
        arrows: false,
        dots: false,
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div
                className="fixed inset-0 max-w-[768px] mx-auto w-screen h-screen bg-black flex shadow-2xl backdrop-blur-lg"
                style={{
                    zIndex: 1000,
                }}
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
                <div className="overflow-hidden max-w-[768px] mx-auto w-screen h-screen">
                    <Slider {...sliderSettings}>
                        {feeds.map((feed, index) => (
                            <ArtistFeedModalCard
                                key={feed.id}
                                feed={feed}
                                artist={artist}
                                isActive={index === currentFeedIndex}
                            />
                        ))}
                    </Slider>
                </div>
            </div>
        </Portal>
    );
}
