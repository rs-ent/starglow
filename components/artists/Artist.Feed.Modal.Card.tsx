"use client";

import { useState } from "react";
import { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import { Artist } from "@prisma/client";
import { useArtistFeedsSet } from "@/app/hooks/useArtistFeeds";
import { useToast } from "@/app/hooks/useToast";
import { Heart, MessageCircle, Send, Play, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";

interface ArtistFeedModalCardProps {
    feed: ArtistFeedWithReactions;
    artist: Artist;
    isActive: boolean;
}

export default function ArtistFeedModalCard({
    feed,
    artist,
    isActive,
}: ArtistFeedModalCardProps) {
    const toast = useToast();
    const { data: session } = useSession();
    const player = session?.player;
    const { createArtistFeedReaction, deleteArtistFeedReaction } =
        useArtistFeedsSet();

    const [isTextExpanded, setIsTextExpanded] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    // 미디어 슬라이더 설정
    const mediaSliderSettings = {
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        beforeChange: (current: number, next: number) =>
            setCurrentMediaIndex(next),
    };

    // 미디어 정보
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

    // 반응 상태
    const userLikeReaction = feed.reactions?.find(
        (r) => r.playerId === player?.id && !r.comment
    );
    const isLiked = Boolean(userLikeReaction);
    const likeCount = feed.reactions?.filter((r) => !r.comment).length || 0;
    const commentCount = feed.reactions?.filter((r) => r.comment).length || 0;

    // 좋아요 토글 핸들러
    const handleLikeToggle = () => {
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
    };

    return (
        <div className="relative max-w-[768px] mx-auto w-screen h-screen bg-black">
            {/* 미디어 섹션 */}
            {allMedia.length > 0 ? (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                >
                    <Slider {...mediaSliderSettings}>
                        {allMedia.map((media, index) => (
                            <div
                                key={index}
                                className="max-w-[768px] mx-auto w-screen h-screen flex flex-col items-center justify-center"
                            >
                                <img
                                    src={media.url}
                                    alt=""
                                    className="w-full h-full object-contain"
                                />
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
                        "linear-gradient(to top, #000 0%, rgba(0,0,0,0.8) 90%, rgba(0,0,0,0) 100%)",
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
                                    ? "max-h-[50vh] overflow-y-auto"
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
