"use client";

import { useState, useMemo, useCallback } from "react";
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


interface ArtistFeedModalCardProps {
    feed: ArtistFeedWithReactions;
    artist: Artist;
    distance: number;
}

export default function ArtistFeedModalCard({
    feed,
    artist,
    distance = 0,
}: ArtistFeedModalCardProps) {
    const toast = useToast();
    const { data: session } = useSession();
    const { createArtistFeedReaction, deleteArtistFeedReaction } =
        useArtistFeedsSet();

    const [isTextExpanded, setIsTextExpanded] = useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    const isLowPriority = distance <= 20;

    const mediaSliderSettings = useMemo(() => ({
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        beforeChange: (index: number) => setCurrentMediaIndex(index),
    }), []);

    const { player, allMedia, userLikeReaction, isLiked, likeCount, commentCount } = useMemo(() => {
        if (isLowPriority) {
            return {
                player: null,
                allMedia: feed.imageUrls?.map(url => ({ type: "image" as const, url })) || [],
                userLikeReaction: null,
                isLiked: false,
                likeCount: 0,
                commentCount: 0
            };
        }

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
            (r) => r.playerId === player?.id && r.reaction === "like"
        );
        const isLiked = Boolean(userLikeReaction);
        const likeCount = feed.reactions?.filter((r) => r.reaction === "like").length || 0;
        const commentCount = feed.reactions?.filter((r) => r.comment).length || 0;

        return { player, allMedia, userLikeReaction, isLiked, likeCount, commentCount };
    }, [feed, session, isLowPriority]);

    const handleLikeToggle = useCallback(() => {
        if (isLowPriority) return;
        
        if (!player?.id) {
            toast.error("Please sign in to like posts");
            return;
        }

        if (isLiked && userLikeReaction) {
            deleteArtistFeedReaction({
                input: {
                    id: userLikeReaction.id,
                    artistFeedId: feed.id,
                    playerId: player.id,
                },
            });
        } else {
            createArtistFeedReaction({
                input: {
                    artistFeedId: feed.id,
                    playerId: player.id,
                    reaction: "like",
                },
            });
        }
    }, [player?.id, isLiked, userLikeReaction, feed.id, deleteArtistFeedReaction, createArtistFeedReaction, toast, isLowPriority]);

    const {imageQuality, sizes} = useMemo(() => {
        const imageQuality = distance;
        const sizes = `(max-width: 768px) ${distance}vw, 768px`;
        return { imageQuality, sizes };
    }, [distance]);

    return (
        <div className="relative max-w-[768px] mx-auto w-screen h-screen bg-black flex items-center justify-center">
            {/* Media section - render placeholder for low priority */}
            {allMedia.length > 0 ? (
                <div
                    onClick={(e) => {
                        if (!isLowPriority) e.stopPropagation();
                    }}
                    className="w-full"
                    style={{ touchAction: "none" }}
                >
                    {isLowPriority ? (
                        <div className="relative w-full aspect-[1/1] bg-gray-900"></div>
                    ) : (
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
                                                sizes={sizes}
                                                quality={imageQuality}
                                                priority={index === 0 && distance > 80}
                                                loading={index === 0 && distance > 80 ? "eager" : "lazy"}
                                            />
                                        </Suspense>
                                    </div>
                                </div>
                            ))}
                        </Slider>
                    )}

                    {/* Media indicators - only show for visible cards */}
                    {!isLowPriority && allMedia.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {allMedia.map((_, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "h-1 rounded-full transition-all duration-300",
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
                    {!isLowPriority && (
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
                    )}
                </div>
            )}

            {/* Action buttons - only render for visible cards */}
            {!isLowPriority && (
                <div className="absolute right-4 bottom-44 flex flex-col items-center gap-6">
                    {/* Like button */}
                    <div className="flex flex-col items-center">
                        <button
                            onClick={handleLikeToggle}
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
                                )}
                            />
                        </button>
                        {likeCount > 0 && (
                            <span className="text-white text-sm font-semibold">
                                {likeCount}
                            </span>
                        )}
                    </div>

                    {/* Comment button */}
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
            )}

            {/* Bottom info section - only render for visible cards */}
            {!isLowPriority && feed.text && (
                <div
                    className="absolute bottom-0 left-0 right-0 p-4 pb-6"
                    style={{
                        background:
                            isTextExpanded ? "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0) 100%)" : "rgba(0,0,0,0.8)"
                    }}
                >
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
                    <p className="text-gray-400 text-xs mt-2">
                        {formatDistanceToNow(new Date(feed.createdAt), {
                            addSuffix: true,
                        })}
                    </p>
                </div>
            )}
        </div>
    );
}
