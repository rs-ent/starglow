"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import { Artist } from "@prisma/client";
import { useArtistFeedsSet } from "@/app/hooks/useArtistFeeds";
import { useToast } from "@/app/hooks/useToast";
import { Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import Image from "next/image";
import { Suspense } from "react";

// 이미지 로딩 플레이스홀더
const ImagePlaceholder = () => (
    <div className="w-full h-full bg-gray-800 animate-pulse"></div>
);

// 이미지 컴포넌트 메모이제이션
const MediaItem = memo(({ media }: { media: { type: string, url: string } }) => (
    <div className="flex items-center justify-center">
        <div className="relative w-full aspect-[1/1]">
            <Image
                src={media.url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                loading="lazy" // 이미지 지연 로딩 추가
                priority={false} // 첫 번째 이미지만 priority 설정
            />
        </div>
    </div>
));

interface ArtistFeedModalCardProps {
    feed: ArtistFeedWithReactions;
    artist: Artist;
    isActive?: boolean; // 현재 활성화된 카드인지 확인
}

function ArtistFeedModalCard({
    feed,
    artist,
    isActive = false,
}: ArtistFeedModalCardProps) {
    const toast = useToast();
    const { data: session } = useSession();
    const { createArtistFeedReaction, deleteArtistFeedReaction } =
        useArtistFeedsSet();

    const [isTextExpanded, setIsTextExpanded] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    // 슬라이더 설정 메모이제이션
    const mediaSliderSettings = useMemo(() => ({
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        afterChange: (index: number) => setCurrentMediaIndex(index),
    }), []);

    const { player, allMedia, userLikeReaction, isLiked, likeCount, commentCount } = useMemo(() => {
        const player = session?.player;
        const allMedia = [
            ...(feed.imageUrls || []).map((url) => ({
                type: "image" as const,
                url,
            })),
            ...(feed.videoUrls || []).map((url) => ({
                type: "video" as const,
                url,
            })),
        ];

        const userLikeReaction = feed.reactions?.find(
            (r) => r.playerId === player?.id && !r.comment
        );
        const isLiked = Boolean(userLikeReaction);
        const likeCount = feed.reactions?.filter((r) => !r.comment).length || 0;
        const commentCount = feed.reactions?.filter((r) => r.comment).length || 0;

        return { player, allMedia, userLikeReaction, isLiked, likeCount, commentCount };
    }, [feed, session]);



    // 이벤트 핸들러 메모이제이션
    const handleLikeToggle = useCallback(() => {
        if (!player?.id) {
            toast.error("Please sign in to like posts");
            return;
        }

        setIsLikeLoading(true);
        try {
            if (isLiked && userLikeReaction) {
                deleteArtistFeedReaction({
                    input: {
                        id: userLikeReaction.id,
                        playerId: player.id,
                        artistFeedId: feed.id,
                    },
                });
                toast.success("Like removed");
            } else {
                createArtistFeedReaction({
                    input: {
                        artistFeedId: feed.id,
                        playerId: player.id,
                        reaction: "like",
                    },
                });
                toast.success("Liked!");
            }
        } catch (error) {
            toast.error("Failed to update like");
        } finally {
            setIsLikeLoading(false);
        }
    }, [player?.id, isLiked, userLikeReaction, feed.id, deleteArtistFeedReaction, createArtistFeedReaction, toast]);

    // 비활성 상태일 때도 기본 렌더링은 유지하되, 최적화
    if (!isActive) {
        return (
            <div className="relative max-w-[768px] mx-auto w-screen h-screen bg-black flex items-center justify-center">
                {/* 미디어 섹션 - 기본 이미지만 미리 로드 */}
                {allMedia.length > 0 && (
                    <div className="w-full">
                        <div className="relative w-full aspect-[1/1]">
                            <Image
                                src={allMedia[0].url}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 768px"
                                loading="lazy"
                                priority={false}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative max-w-[768px] mx-auto w-screen h-screen bg-black flex items-center justify-center">
            {/* 미디어 섹션 */}
            {allMedia.length > 0 ? (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    className="w-full"
                    style={{ touchAction: "none" }}
                >
                    <Slider {...mediaSliderSettings}>
                        {allMedia.map((media, index) => (
                            <div key={index} className="flex items-center justify-center">
                                <div className="relative w-full aspect-[1/1]">
                                    <Suspense fallback={<ImagePlaceholder />}>
                                        <Image
                                            src={media.url}
                                            alt=""
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 768px"
                                            loading={index === 0 ? "eager" : "lazy"}
                                            priority={index === 0}
                                        />
                                    </Suspense>
                                </div>
                            </div>
                        ))}
                    </Slider>

                    {/* 미디어 인디케이터 추가 */}
                    {allMedia.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {allMedia.map((_, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "h-1 rounded-full transition-all",
                                        index === currentMediaIndex
                                            ? "w-6 bg-white"
                                            : "w-1 bg-white/50"
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1 mx-auto mb-4">
                            <img
                                src={artist.logoUrl || ""}
                                alt={artist.name}
                                className="w-full h-full rounded-full object-cover bg-black"
                            />
                        </div>
                        <p className="text-white/60 text-lg">{artist.name}</p>
                    </div>
                </div>
            )}

            {/* 액션 버튼 섹션 */}
            <div className="absolute right-4 bottom-44 flex flex-col items-center gap-6">
                {/* 좋아요 버튼 */}
                <div className="flex flex-col items-center">
                    <button
                        onClick={handleLikeToggle}
                        disabled={isLikeLoading}
                        className={cn(
                            "p-2 rounded-full transition-all disabled:opacity-50",
                            isLiked
                                ? "text-red-500 scale-110"
                                : "text-white hover:scale-110"
                        )}
                    >
                        <Heart
                            className={cn(
                                "w-8 h-8 transition-all",
                                isLiked && "fill-current",
                                isLikeLoading && "animate-pulse"
                            )}
                        />
                    </button>
                    {likeCount > 0 && (
                        <span className="text-white text-sm font-semibold">
                            {likeCount}
                        </span>
                    )}
                </div>

                {/* 댓글 버튼 */}
                <div className="flex flex-col items-center">
                    <button
                        onClick={() =>
                            toast.info("Comments feature coming soon!")
                        }
                        className="p-2 text-white hover:scale-110 transition-all"
                    >
                        <MessageCircle className="w-8 h-8" />
                    </button>
                    {commentCount > 0 && (
                        <span className="text-white text-sm font-semibold">
                            {commentCount}
                        </span>
                    )}
                </div>
            </div>

            {/* 하단 정보 섹션 */}
            <div
                className="absolute bottom-0 left-0 right-0 p-4 pb-6"
                style={{
                    background:
                        isTextExpanded ? "rgba(0,0,0,0.8)" : "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0) 100%)",
                }}
            >
                {feed.text && (
                    <div
                        className={cn(
                            getResponsiveClass(15).textClass,
                            "mt-[20px]",
                            "relative"
                        )}
                    >
                        <div
                            className={cn(
                                "whitespace-pre-wrap transition-all duration-300",
                                isTextExpanded
                                    ? "max-h-[400px] overflow-y-auto scrollbar-none"
                                    : "line-clamp-2"
                            )}
                        >
                            {feed.text}
                        </div>
                        {feed.text.length > 80 && (
                            <button
                                onClick={() =>
                                    setIsTextExpanded(!isTextExpanded)
                                }
                                className={cn(
                                    "text-gray-300 mt-[5px] hover:text-white transition-colors",
                                    "border border-gray-300/50 rounded-full px-[12px] py-[2px]",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                {isTextExpanded ? "Less" : "More"}
                            </button>
                        )}
                    </div>
                )}
                <p className="text-gray-400 text-xs mt-2">
                    {formatDistanceToNow(new Date(feed.createdAt), {
                        addSuffix: true,
                    })}
                </p>
            </div>
        </div>
    );
}

export default memo(ArtistFeedModalCard);
