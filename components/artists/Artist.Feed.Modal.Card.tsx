"use client";

import { useState, useMemo, memo, useCallback, useEffect } from "react";
import { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import { Artist } from "@prisma/client";
import { useArtistFeedsSet } from "@/app/hooks/useArtistFeeds";
import { useToast } from "@/app/hooks/useToast";
import { Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import Image from "next/image";
import dynamic from "next/dynamic";

interface ArtistFeedModalCardProps {
    feed: ArtistFeedWithReactions;
    artist: Artist;
}

interface MediaItem {
    type: "image" | "video";
    url: string;
}

const CustomCarousel = dynamic(() => import("../atoms/CustomCarousel"), {
    ssr: false,
});

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
    const [optimisticLikeState, setOptimisticLikeState] = useState<{
        isLiked: boolean;
        likeCount: number;
    } | null>(null);

    // 이미지 로드 에러 상태 추가
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

    const [currentIndex, setCurrentIndex] = useState(0);

    // 이미지 로드 상태 추가
    const [imageLoadStates, setImageLoadStates] = useState<
        Map<number, "loading" | "loaded" | "error">
    >(new Map());

    // 이미지 에러 핸들러
    const handleImageError = useCallback((index: number) => {
        setImageErrors((prev) => new Set([...prev, index]));
    }, []);

    // Prepare media data
    const allMedia = useMemo(() => {
        const media: MediaItem[] = [
            ...(feed.imageUrls || []).map((url) => ({
                type: "image" as const,
                url,
            })),
            ...(feed.videoUrls || []).map((url) => ({
                type: "video" as const,
                url,
            })),
        ];
        return media;
    }, [feed]);

    // Calculate reactions
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

    // Like toggle handler
    const handleLikeToggle = async () => {
        if (!player?.id) {
            toast.error("Please sign in to like posts");
            return;
        }

        // Optimistic update
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

    // 이미지 프리로딩 개선
    useEffect(() => {
        const loadImage = (url: string, index: number) => {
            return new Promise((resolve, reject) => {
                const img = new window.Image();

                img.onload = () => {
                    setImageLoadStates((prev) =>
                        new Map(prev).set(index, "loaded")
                    );
                    resolve(url);
                };

                img.onerror = () => {
                    setImageLoadStates((prev) =>
                        new Map(prev).set(index, "error")
                    );
                    reject(new Error(`Failed to load image: ${url}`));
                };

                img.src = url;
            });
        };

        // 현재 인덱스 기준으로 앞뒤 2개씩 프리로드
        const preloadRange = 2;
        const startIdx = Math.max(0, currentIndex - preloadRange);
        const endIdx = Math.min(
            allMedia.length - 1,
            currentIndex + preloadRange
        );

        for (let i = startIdx; i <= endIdx; i++) {
            const media = allMedia[i];
            if (media?.type === "image" && !imageLoadStates.has(i)) {
                setImageLoadStates((prev) => new Map(prev).set(i, "loading"));
                loadImage(media.url, i).catch(console.error);
            }
        }
    }, [allMedia, currentIndex]);

    return (
        <div className="relative max-w-[768px] mx-auto w-full h-[100dvh] bg-black flex items-center justify-center">
            {/* Media section */}
            {allMedia.length > 0 ? (
                <div className="w-full">
                    <CustomCarousel
                        direction="horizontal"
                        containerClassName="aspect-[1/1] min-h-[300px]"
                        indicatorClassName="bottom-4"
                        swipeThreshold={50}
                        onIndexChange={setCurrentIndex}
                    >
                        {allMedia.map((media, index) => {
                            const isLoading =
                                imageLoadStates.get(index) === "loading";

                            return (
                                <div
                                    key={`${feed.id}-${index}`}
                                    className="relative w-full h-full"
                                >
                                    {/* 로딩 인디케이터 추가 */}
                                    {isLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                                            <div className="w-12 h-12 border-3 border-gray-600 border-t-white rounded-full animate-spin" />
                                        </div>
                                    )}

                                    {!imageErrors.has(index) ? (
                                        <Image
                                            src={media.url}
                                            alt=""
                                            fill
                                            className={cn(
                                                "object-cover",
                                                isLoading && "opacity-0"
                                            )}
                                            sizes="(max-width: 768px) 100vw, 768px"
                                            quality={90}
                                            placeholder="blur"
                                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                                            draggable={false}
                                            unoptimized={false}
                                            loading={
                                                index === 0 ? "eager" : "lazy"
                                            }
                                            onLoadingComplete={(img) => {
                                                img.classList.add("opacity-0");
                                                img.classList.add(
                                                    "transition-opacity"
                                                );
                                                img.classList.add(
                                                    "duration-300"
                                                );
                                                setTimeout(() => {
                                                    img.classList.remove(
                                                        "opacity-0"
                                                    );
                                                }, 10);
                                            }}
                                            onError={() =>
                                                handleImageError(index)
                                            }
                                        />
                                    ) : (
                                        // 에러 fallback UI
                                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                            <div className="text-center">
                                                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-2">
                                                    <svg
                                                        className="w-8 h-8 text-gray-600"
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
                                                <p className="text-gray-500 text-sm">
                                                    Failed to load image
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </CustomCarousel>
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

            {/* Action buttons */}
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
                            style={{
                                filter: "drop-shadow(0 0 6px rgba(0,0,0,0.6))",
                            }}
                        />
                    </button>
                    <span
                        className="text-white text-sm font-semibold text-shadow"
                        style={{
                            filter: "drop-shadow(0 0 6px rgba(0,0,0,0.6))",
                        }}
                    >
                        {likeCount > 0 ? likeCount : "Likes"}
                    </span>
                </div>
            </div>

            {/* Text section */}
            {feed.text && (
                <div
                    className="absolute bottom-0 left-0 right-0 p-4 pb-6"
                    style={{
                        background:
                            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.75) 80%, rgba(0,0,0,0) 100%)",
                    }}
                >
                    <div
                        className={cn(
                            getResponsiveClass(20).textClass,
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
