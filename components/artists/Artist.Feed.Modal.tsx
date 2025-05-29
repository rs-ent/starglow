/// components/artists/Artist.Feed.Modal.tsx

"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
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
    feeds: ArtistFeedWithReactions[];
    artist: Artist;
    initialFeedIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

// ArtistFeedModalCard를 메모이제이션
const MemoizedArtistFeedModalCard = memo(ArtistFeedModalCard);

export default function ArtistFeedModal({
    feeds,
    artist,
    initialFeedIndex = 0,
    isOpen,
    onClose,
}: ArtistFeedModalProps) {
    const [currentFeedIndex, setCurrentFeedIndex] = useState(initialFeedIndex);

    // useCallback으로 이벤트 핸들러 메모이제이션
    const handleAfterChange = useCallback((index: number) => {
        setCurrentFeedIndex(index);
    }, []);

    const sliderSettings = {
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        swipeToSlide: true,
        afterChange: handleAfterChange,
        vertical: true,
        verticalSwiping: true,
        arrows: false,
        dots: false,
    };

    useEffect(() => {
        const preventPullToRefresh = (e: TouchEvent) => {
            // 이벤트 핸들러 최적화: 조건 체크 간소화
            if (isOpen && e.touches[0].clientY > 0) {
                e.preventDefault();
            }
        };

        // 모달이 열려있을 때만 이벤트 리스너 추가
        if (isOpen) {
            document.addEventListener('touchstart', preventPullToRefresh, { passive: false });
        }

        return () => {
            document.removeEventListener('touchstart', preventPullToRefresh);
        };
    }, [isOpen]); // feeds.length 대신 isOpen에 의존

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed w-screen h-screen inset-0 bg-[rgba(0,0,0,0.7)] backdrop-blur-xs" onClick={onClose} style={{
                zIndex: 1000,
            }}>
            <div
                className="absolute inset-0 max-w-[768px] mx-auto w-full h-full bg-black flex shadow-2xl backdrop-blur-lg"
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
                <div className="overflow-hidden max-w-[768px] mx-auto w-screen h-screen" style={{ touchAction: "none" }}>
                    <Slider {...sliderSettings}>
                        {feeds.map((feed, index) => (
                            <MemoizedArtistFeedModalCard
                                key={feed.id}
                                feed={feed}
                                artist={artist}
                                isActive={index === currentFeedIndex}
                            />
                        ))}
                    </Slider>
                </div>
            </div>
            </div>
        </Portal>
    );
}
