/// components/artists/Artist.Feed.Card.tsx

import { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import { Artist } from "@prisma/client";
import Image from "next/image";
import { Heart, MessageCircle, Play } from "lucide-react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useState, useRef, useEffect } from "react";

interface ArtistFeedCardProps {
    feed: ArtistFeedWithReactions;
    artist: Artist;
    onClick: () => void;
}

export default function ArtistFeedCard({
    feed,
    artist,
    onClick,
}: ArtistFeedCardProps) {
    const firstMedia = feed.imageUrls?.[0] || feed.videoUrls?.[0];
    const isVideo = !feed.imageUrls?.[0] && feed.videoUrls?.[0];

    // Intersection Observer를 위한 ref와 상태
    const cardRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [hasError, setHasError] = useState(false);

    // 반응 통계
    const likeCount =
        feed.reactions?.filter((r) => r.reaction === "like").length || 0;
    const commentCount = feed.reactions?.filter((r) => r.comment).length || 0;

    // Intersection Observer 설정
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    // 한 번 보이면 observer 해제
                    observer.disconnect();
                }
            },
            {
                // 뷰포트에 들어오기 100px 전에 로드 시작
                rootMargin: "100px",
                threshold: 0.01,
            }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={cardRef}
            className="aspect-square relative bg-gray-100 cursor-pointer group overflow-hidden"
            onClick={onClick}
        >
            {/* 미디어 또는 텍스트 콘텐츠 */}
            {firstMedia ? (
                <>
                    {/* 이미지 표시 */}
                    {!isVideo ? (
                        <>
                            {/* 로딩 전 placeholder */}
                            {!isVisible && (
                                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                            )}

                            {isVisible && !hasError && (
                                <Image
                                    src={firstMedia}
                                    alt=""
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                    quality={50}
                                    loading="lazy"
                                    placeholder="blur"
                                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                                    onError={() => setHasError(true)}
                                />
                            )}

                            {hasError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                                    <div className="text-gray-400">
                                        <svg
                                            className="w-8 h-8"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* 비디오 썸네일 */
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                            <Play className="w-12 h-12 text-white opacity-80" />
                        </div>
                    )}
                </>
            ) : (
                /* 텍스트만 있는 피드 */
                <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-gray-100 to-gray-200">
                    <p className="text-sm text-gray-700 text-center line-clamp-6 leading-relaxed">
                        {feed.text || "No content"}
                    </p>
                </div>
            )}

            {/* 인스타그램 스타일 호버 오버레이 */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/50",
                    "opacity-0 group-hover:opacity-100",
                    "transition-opacity duration-200",
                    "flex items-center justify-center",
                    getResponsiveClass(60).gapClass
                )}
            >
                {/* 좋아요 통계 */}
                <div className="flex items-center gap-[5px] text-white">
                    <Heart
                        className={cn(
                            "w-6 h-6 fill-white",
                            getResponsiveClass(20).frameClass
                        )}
                    />
                    <span
                        className={cn(
                            "font-bold text-lg",
                            getResponsiveClass(20).textClass
                        )}
                    >
                        {likeCount}
                    </span>
                </div>

                {/* 댓글 통계 */}
                <div className="flex items-center gap-[5px] text-white">
                    <MessageCircle
                        className={cn(
                            "w-6 h-6 fill-white",
                            getResponsiveClass(20).frameClass
                        )}
                    />
                    <span
                        className={cn(
                            "font-bold text-lg",
                            getResponsiveClass(20).textClass
                        )}
                    >
                        {commentCount}
                    </span>
                </div>
            </div>

            {/* 비디오 인디케이터 (우상단) */}
            {isVideo && (
                <div className="absolute top-3 right-3 z-10">
                    <div className="w-6 h-6 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                </div>
            )}
        </div>
    );
}
