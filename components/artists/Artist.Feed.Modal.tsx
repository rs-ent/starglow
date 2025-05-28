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
    const [loadedFeeds, setLoadedFeeds] = useState<ArtistFeedWithReactions[]>(
        []
    );
    const containerRef = useRef<HTMLDivElement>(null);
    const feedRefs = useRef<(HTMLDivElement | null)[]>([]);

    // 초기 피드 로드 및 현재 피드 설정
    useEffect(() => {
        if (isOpen && feeds.length > 0) {
            // 초기에 현재 피드 주변 3개씩 로드
            const startIndex = Math.max(0, initialFeedIndex - 1);
            const endIndex = Math.min(feeds.length, initialFeedIndex + 2);
            setLoadedFeeds(feeds.slice(startIndex, endIndex));
            setCurrentFeedIndex(initialFeedIndex);
        }
    }, [isOpen, feeds, initialFeedIndex]);

    // 무한 스크롤 구현
    const loadMoreFeeds = useCallback(() => {
        const nextIndex = loadedFeeds.length;
        if (nextIndex < feeds.length) {
            const nextBatch = feeds.slice(nextIndex, nextIndex + 2);
            setLoadedFeeds((prev) => [...prev, ...nextBatch]);
        }
    }, [feeds, loadedFeeds.length]);

    // 스크롤 이벤트 처리
    const handleScroll = useCallback(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const { scrollTop, scrollHeight, clientHeight } = container;

        // 80% 스크롤 시 추가 로드
        if (scrollTop + clientHeight >= scrollHeight * 0.8) {
            loadMoreFeeds();
        }

        // 현재 보이는 피드 감지
        feedRefs.current.forEach((ref, index) => {
            if (!ref) return;

            const rect = ref.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // 피드가 화면 중앙에 50% 이상 보이는 경우
            if (
                rect.top < containerRect.height * 0.5 &&
                rect.bottom > containerRect.height * 0.5
            ) {
                setCurrentFeedIndex(index);
            }
        });
    }, [loadMoreFeeds]);

    // 키보드 이벤트 (ESC로 닫기)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    // react-slick 설정
    const sliderSettings = {
        initialSlide: initialFeedIndex,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        vertical: true,
        verticalSwiping: true,
        afterChange: (index: number) => setCurrentFeedIndex(index),
        arrows: false,
        dots: false,
        swipe: true,
        swipeToSlide: true,
        touchMove: true,
        draggable: true,
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div
                className="fixed inset-0 w-screen h-screen bg-black flex"
                style={{
                    zIndex: 1000,
                }}
            >
                {/* 헤더 */}
                <div className="absolute top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm">
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
                <div
                    className="absolute inset-0 top-16 overflow-hidden"
                    style={{ touchAction: "pan-y" }}
                >
                    <div className="w-full h-full">
                        <Slider {...sliderSettings} className="h-full">
                            {feeds.map((feed, index) => (
                                <div
                                    key={feed.id}
                                    className="!h-full !w-full"
                                    style={{
                                        height: "calc(100vh - 64px)",
                                        display: "block",
                                    }}
                                >
                                    <ArtistFeedModalCard
                                        feed={feed}
                                        artist={artist}
                                        isActive={index === currentFeedIndex}
                                    />
                                </div>
                            ))}
                        </Slider>
                    </div>
                </div>

                {/* 피드 인디케이터 (우측) */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 space-y-2">
                    {feeds
                        .slice(0, Math.min(feeds.length, 5))
                        .map((_, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "w-1 h-8 rounded-full transition-all",
                                    index === currentFeedIndex
                                        ? "bg-white"
                                        : "bg-white/30"
                                )}
                            />
                        ))}
                    {feeds.length > 5 && (
                        <div className="text-white/60 text-xs text-center mt-2">
                            +{feeds.length - 5}
                        </div>
                    )}
                </div>
            </div>
        </Portal>
    );
}
