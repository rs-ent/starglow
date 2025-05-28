"use client";

import { useState, useRef } from "react";
import { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import { Artist } from "@prisma/client";
import { useArtistFeedsSet } from "@/app/hooks/useArtistFeeds";
import { useToast } from "@/app/hooks/useToast";
import Image from "next/image";
import {
    Heart,
    MessageCircle,
    Send,
    Play,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils/tailwind";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";

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

    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [isTextExpanded, setIsTextExpanded] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(false);

    // 실제 좋아요 상태 확인
    const userLikeReaction = feed.reactions?.find(
        (r) => r.playerId === player?.id && !r.comment
    );
    const isLiked = Boolean(userLikeReaction);

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

    const hasMultipleMedia = allMedia.length > 1;
    const currentMedia = allMedia[currentMediaIndex];

    // 반응 통계
    const likeCount = feed.reactions?.filter((r) => !r.comment).length || 0;
    const commentCount = feed.reactions?.filter((r) => r.comment).length || 0;

    // 좋아요 토글
    const handleLikeToggle = async () => {
        if (!player?.id) {
            toast.error("Please sign in to like posts");
            return;
        }

        setIsLikeLoading(true);
        try {
            if (isLiked && userLikeReaction) {
                await deleteArtistFeedReaction({
                    input: {
                        id: userLikeReaction.id,
                        playerId: player.id,
                        artistFeedId: feed.id,
                    },
                });
                toast.success("Like removed");
            } else {
                await createArtistFeedReaction({
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

    // 미디어 네비게이션
    const handlePrevMedia = () => {
        setCurrentMediaIndex((prev) =>
            prev > 0 ? prev - 1 : allMedia.length - 1
        );
    };

    const handleNextMedia = () => {
        setCurrentMediaIndex((prev) =>
            prev < allMedia.length - 1 ? prev + 1 : 0
        );
    };

    return (
        <div
            className="relative w-screen bg-black"
            style={{ height: "calc(100vh - 64px)" }}
        >
            {/* 전체 화면 미디어 */}
            {allMedia.length > 0 && currentMedia ? (
                <div className="absolute inset-0">
                    {currentMedia.type === "image" ? (
                        <img
                            src={currentMedia.url}
                            alt=""
                            className="w-full h-full object-contain"
                            style={{ maxHeight: "100%", maxWidth: "100%" }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                            <Play className="w-20 h-20 text-white opacity-80" />
                        </div>
                    )}

                    {/* 미디어 네비게이션 */}
                    {hasMultipleMedia && (
                        <>
                            <button
                                onClick={handlePrevMedia}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-all"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handleNextMedia}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-all"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}
                </div>
            ) : (
                // 미디어가 없을 때 폴백
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

            {/* 우측 액션 버튼들 */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6">
                {/* 좋아요 */}
                <div className="flex flex-col items-center">
                    <button
                        onClick={handleLikeToggle}
                        disabled={isLikeLoading}
                        className={cn(
                            "p-3 rounded-full transition-all disabled:opacity-50",
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

                {/* 댓글 */}
                <div className="flex flex-col items-center">
                    <button
                        onClick={() => {
                            // TODO: 댓글 슬라이드 열기
                            toast.info("Comments feature coming soon!");
                        }}
                        className="p-3 text-white hover:scale-110 transition-all"
                    >
                        <MessageCircle className="w-8 h-8" />
                    </button>
                    {commentCount > 0 && (
                        <span className="text-white text-sm font-semibold">
                            {commentCount}
                        </span>
                    )}
                </div>

                {/* 공유 */}
                <button className="p-3 text-white hover:scale-110 transition-all">
                    <Send className="w-8 h-8" />
                </button>

                {/* 더보기 */}
                <button className="p-3 text-white hover:scale-110 transition-all">
                    <MoreHorizontal className="w-8 h-8" />
                </button>
            </div>

            {/* 하단 정보 오버레이 */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-black/80 to-transparent">
                {/* 텍스트 내용 */}
                {feed.text && (
                    <div className="text-white">
                        <span
                            className={cn(
                                "whitespace-pre-wrap",
                                !isTextExpanded && "line-clamp-2"
                            )}
                        >
                            {feed.text}
                        </span>
                        {feed.text.length > 80 && (
                            <button
                                onClick={() =>
                                    setIsTextExpanded(!isTextExpanded)
                                }
                                className="text-gray-300 ml-2 hover:text-white transition-colors"
                            >
                                {isTextExpanded ? "Less" : "More"}
                            </button>
                        )}
                    </div>
                )}

                {/* 시간 표시 */}
                <p className="text-gray-400 text-xs mt-2">
                    {formatDistanceToNow(new Date(feed.createdAt), {
                        addSuffix: true,
                    })}
                </p>
            </div>

            {/* 미디어 인디케이터 */}
            {hasMultipleMedia && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1">
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
    );
}
