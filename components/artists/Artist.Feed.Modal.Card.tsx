"use client";

import { useState, useMemo, memo } from "react";
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
import { Skeleton } from "../ui/skeleton";

interface ArtistFeedModalCardProps {
    feed: ArtistFeedWithReactions;
    artist: Artist;
}

export default memo(function ArtistFeedModalCard({
    feed,
    artist,
}: ArtistFeedModalCardProps) {
    const toast = useToast();
    const { data: session } = useSession();
    const player = session?.player;
    const { createArtistFeedReaction, deleteArtistFeedReaction, isPending } =
        useArtistFeedsSet();

    const [isTextExpanded, setIsTextExpanded] = useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [optimisticLikeState, setOptimisticLikeState] = useState<{
        isLiked: boolean;
        likeCount: number;
    } | null>(null);

    const mediaSliderSettings = useMemo(
        () => ({
            infinite: false,
            speed: 500,
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: false,
            beforeChange: (_: number, next: number) => {
                setCurrentMediaIndex(next);
            },
        }),
        []
    );

    const { allMedia } = useMemo(() => {
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
        return { allMedia };
    }, [feed]);

    const { userLikeReaction, isLiked, likeCount, commentCount } =
        useMemo(() => {
            const userLikeReaction = feed.reactions?.find(
                (r) => r.playerId === player?.id && r.reaction === "like"
            );

            const serverIsLiked = Boolean(userLikeReaction);
            const serverLikeCount =
                feed.reactions?.filter((r) => r.reaction === "like").length ||
                0;

            const isLiked =
                optimisticLikeState !== null
                    ? optimisticLikeState.isLiked
                    : serverIsLiked;
            const likeCount =
                optimisticLikeState !== null
                    ? optimisticLikeState.likeCount
                    : serverLikeCount;

            const commentCount =
                feed.reactions?.filter((r) => r.comment).length || 0;

            return { userLikeReaction, isLiked, likeCount, commentCount };
        }, [feed, player, optimisticLikeState]);

    const handleLikeToggle = async () => {
        if (!player?.id) {
            toast.error("Please sign in to like posts");
            return;
        }

        // 낙관적 업데이트 적용
        setOptimisticLikeState({
            isLiked: !isLiked,
            likeCount: isLiked ? likeCount - 1 : likeCount + 1,
        });

        try {
            if (isLiked && userLikeReaction) {
                await deleteArtistFeedReaction({
                    input: {
                        id: userLikeReaction.id,
                        artistFeedId: feed.id,
                        playerId: player.id,
                    },
                });
            } else {
                await createArtistFeedReaction({
                    input: {
                        artistFeedId: feed.id,
                        playerId: player.id,
                        reaction: "like",
                    },
                });
            }
        } catch (error) {
            setOptimisticLikeState(null);
            toast.error("Failed to update like. Please try again.");
        }
    };

    return (
        <div className="relative max-w-[768px] mx-auto w-full h-[100dvh] bg-black flex items-center justify-center">
            {/* Media section - render placeholder for low priority */}
            {allMedia.length > 0 ? (
                <div className="w-full">
                    <Slider {...mediaSliderSettings}>
                        {allMedia.map((media, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-center"
                            >
                                <div className="relative w-full aspect-[1/1] min-h-[300px] mx-auto">
                                    <Suspense
                                        fallback={
                                            <Skeleton className="w-full h-full" />
                                        }
                                    >
                                        <Image
                                            src={media.url}
                                            alt=""
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 768px"
                                            quality={90}
                                            priority={index === 0}
                                            loading={
                                                index === 0 ? "eager" : "lazy"
                                            }
                                        />
                                    </Suspense>
                                </div>
                            </div>
                        ))}
                    </Slider>

                    {/* Media indicators - only show for visible cards */}
                    {allMedia.length > 1 && (
                        <div className="absolute w-full flex items-center justify-center gap-1 z-10">
                            {allMedia.map((_, index) => (
                                <div
                                    key={`${feed.id}-${index}`}
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

            {/* Action buttons - only render for visible cards */}
            <div className="absolute right-4 bottom-44 flex flex-col items-center gap-6">
                {/* Like button */}
                <div className="flex flex-col items-center">
                    <button
                        onClick={handleLikeToggle}
                        disabled={isPending}
                        className={cn(
                            "p-2 rounded-full transition-all",
                            isLiked
                                ? "text-red-500 scale-110"
                                : "text-white hover:scale-110"
                        )}
                    >
                        <Heart
                            className={cn(
                                "w-8 h-8 transition-all",
                                isLiked && "fill-current"
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

            {/* Bottom info section - only render for visible cards */}
            {feed.text && (
                <div
                    className="absolute bottom-0 left-0 right-0 p-4 pb-6"
                    style={{
                        background:
                            "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0) 100%)",
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
});
