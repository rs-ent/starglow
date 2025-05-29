/// components/artists/Artist.Feed.Card.tsx

"use client";

import { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import { Artist } from "@prisma/client";
import Image from "next/image";
import { Heart, MessageCircle, Grid3X3, Play } from "lucide-react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

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

    // 반응 통계
    const likeCount = feed.reactions?.length || 0;
    const commentCount = feed.reactions?.filter((r) => r.comment).length || 0;

    return (
        <div
            className="aspect-square relative bg-gray-100 cursor-pointer group overflow-hidden"
            onClick={onClick}
        >
            {/* 미디어 또는 텍스트 콘텐츠 */}
            {firstMedia ? (
                <>
                    {/* 이미지 표시 */}
                    {!isVideo ? (
                        <Image
                            src={firstMedia}
                            alt=""
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        />
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
