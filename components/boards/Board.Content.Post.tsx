/// components/boards/Board.Content.Post.tsx

"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Heart,
    MessageSquare,
    TrendingUp,
    MoreHorizontal,
    Trash2,
    ChevronDown,
    Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { formatTimeAgo } from "@/lib/utils/format";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { Button } from "../ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import type { ArtistWithSPG } from "@/app/actions/artists";
import type { Player } from "@prisma/client";
import type { BoardPostWithDetails } from "@/app/actions/boards/actions";

import BoardContentComment from "./Board.Content.Comment";
import { ArtistBG, ArtistFG } from "@/lib/utils/get/artist-colors";
import { usePlayerGet } from "@/app/hooks/usePlayer";
import ImageVideoPopup from "../atoms/ImageVideoPopup";

interface BoardContentPostProps {
    post: BoardPostWithDetails;
    artist: ArtistWithSPG;
    player: Player | null;
    index: number;
    activeBoard: any;
    expandedPosts: Set<string>;
    expandedPostContent: Set<string>;
    deletingPostId: string | null;
    isDeleteBoardPostPending: boolean;
    onReaction: (postId: string, type: "LIKE" | "RECOMMEND") => void;
    onDeletePost: (postId: string) => void;
    onToggleComments: (postId: string) => void;
    onTogglePostContent: (postId: string) => void;
}

export default React.memo(function BoardContentPost({
    post,
    artist,
    player,
    index,
    activeBoard,
    expandedPosts,
    expandedPostContent,
    deletingPostId,
    isDeleteBoardPostPending,
    onReaction,
    onDeletePost,
    onToggleComments,
    onTogglePostContent,
}: BoardContentPostProps) {
    const { playerProfile, isPlayerProfileLoading } = usePlayerGet({
        getPlayerProfileInput: {
            playerId: post.author?.id || "",
        },
    });

    const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // 이미지 파일들만 필터링
    const imageFiles = useMemo(() => {
        if (!post.files) return [];
        return (post.files as any[]).filter(
            (file) => file?.mimeType?.startsWith("image/") && file?.url
        );
    }, [post.files]);

    // 이미지 클릭 핸들러
    const handleImageClick = (fileIndex: number) => {
        // 전체 파일 중에서 클릭된 파일이 몇 번째 이미지인지 찾기
        const imageIndex = imageFiles.findIndex((imageFile) => {
            const allFiles = post.files as any[];
            return allFiles[fileIndex]?.url === imageFile?.url;
        });

        if (imageIndex !== -1) {
            setSelectedImageIndex(imageIndex);
            setIsImagePopupOpen(true);
        }
    };

    return (
        <>
            <motion.div
                key={post.id}
                initial={{
                    opacity: 0,
                    y: 20,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{
                    delay: 0.4 + index * 0.1,
                }}
                className={cn(
                    "rounded-lg md:rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 hover:border-white/20 transition-colors group",
                    "p-3 md:p-5"
                )}
            >
                <div className="flex items-start gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                        {/* Author info */}
                        <div className="flex items-center justify-between mb-[2px]">
                            <div className="flex items-center gap-1 md:gap-2 min-w-0 flex-1">
                                <Image
                                    src={
                                        playerProfile?.image ||
                                        post.author?.image ||
                                        "/default-avatar.jpg"
                                    }
                                    alt={
                                        playerProfile?.name ||
                                        post.author?.nickname ||
                                        post.author?.name ||
                                        ""
                                    }
                                    width={32}
                                    height={32}
                                    priority={false}
                                    unoptimized={true}
                                    className={cn(
                                        "rounded-full flex-shrink-0 w-8 h-8 md:w-10 md:h-10 object-cover",
                                        isPlayerProfileLoading &&
                                            "animate-pulse blur-sm",
                                        getResponsiveClass(35).frameClass
                                    )}
                                    style={{
                                        boxShadow:
                                            post.author?.artistId === artist.id
                                                ? `0 0 16px 0 rgba(255, 255, 255, 0.3)`
                                                : "none",
                                    }}
                                />
                                {post.author?.artistId === artist.id && (
                                    <span
                                        className={cn(
                                            "flex flex-row items-center gap-1 rounded-full px-2 py-0.5 flex-shrink-0 font-medium",
                                            getResponsiveClass(15).textClass
                                        )}
                                        style={{
                                            background: `linear-gradient(to right, ${ArtistBG(
                                                artist,
                                                3,
                                                20
                                            )}, ${ArtistBG(artist, 2, 20)})`,
                                            border: `1px solid ${ArtistFG(
                                                artist,
                                                0,
                                                40
                                            )}`,
                                            boxShadow: `0 0 12px 0 rgba(255, 255, 255, 0.2)`,
                                        }}
                                    >
                                        <Image
                                            src={artist.logoUrl || ""}
                                            alt={artist.name}
                                            width={20}
                                            height={20}
                                            className={cn(
                                                "object-contain",
                                                getResponsiveClass(15)
                                                    .frameClass
                                            )}
                                        />
                                        {post.author?.artistId === artist.id
                                            ? artist.name
                                            : "Artist"}
                                    </span>
                                )}
                                <span
                                    className={cn(
                                        "truncate",
                                        post.author?.artistId === artist.id
                                            ? "rainbow-text font-bold"
                                            : "text-white/90 ",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    {playerProfile?.name ||
                                        post.author?.nickname ||
                                        post.author?.name ||
                                        "Fan"}
                                </span>
                                <span
                                    className={cn(
                                        "text-white/50 flex-shrink-0",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {formatTimeAgo(post.createdAt, true)}
                                </span>
                            </div>

                            {/* 작성자만 삭제 가능 */}
                            {player && post.author?.id === player.id && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-1 text-white/60 hover:text-white/80 hover:bg-white/10 flex-shrink-0"
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="bg-gray-900 border-gray-700"
                                    >
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem
                                                    onSelect={(e) =>
                                                        e.preventDefault()
                                                    }
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete Post
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-gray-900 border-gray-700">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-white">
                                                        Delete Post
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription className="text-white/70">
                                                        Are you sure you want to
                                                        delete this post? This
                                                        action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                                                        Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() =>
                                                            onDeletePost(
                                                                post.id
                                                            )
                                                        }
                                                        disabled={
                                                            deletingPostId ===
                                                                post.id ||
                                                            isDeleteBoardPostPending
                                                        }
                                                        className="bg-red-600 hover:bg-red-700 text-white"
                                                    >
                                                        {deletingPostId ===
                                                        post.id
                                                            ? "Deleting..."
                                                            : "Delete"}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        {/* 제목과 확장 버튼 */}
                        <div
                            className={cn(
                                "flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-[8px]",
                                "p-1 md:p-2",
                                getResponsiveClass(10).marginYClass,
                                expandedPostContent.has(post.id) &&
                                    "bg-white/10"
                            )}
                            onClick={() => onTogglePostContent(post.id)}
                        >
                            <p
                                className={cn(
                                    "font-semibold text-white flex-1 ",
                                    getResponsiveClass(25).textClass
                                )}
                            >
                                {post.title}
                            </p>
                            <button className="text-white/60 hover:text-white/80 transition-colors">
                                <ChevronDown
                                    className={cn(
                                        getResponsiveClass(25).frameClass,
                                        "transition-transform duration-300 ease-in-out",
                                        expandedPostContent.has(post.id)
                                            ? "rotate-180"
                                            : ""
                                    )}
                                />
                            </button>
                        </div>

                        {/* 확장 가능한 내용 */}
                        <AnimatePresence>
                            {expandedPostContent.has(post.id) && (
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        height: 0,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        height: "auto",
                                    }}
                                    exit={{
                                        opacity: 0,
                                        height: 0,
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        ease: "easeInOut",
                                    }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-2 md:space-y-3">
                                        <p
                                            className={cn(
                                                "text-white/80 leading-relaxed ml-[5px] mb-[5px] md:mb-[10px]",
                                                getResponsiveClass(15).textClass
                                            )}
                                        >
                                            {post.content}
                                        </p>

                                        {/* 첨부된 파일들 표시 */}
                                        {post.files &&
                                            post.files.length > 0 && (
                                                <div
                                                    className={cn(
                                                        "grid gap-1 md:gap-2",
                                                        `grid-cols-${imageFiles.length}`
                                                    )}
                                                >
                                                    {(post.files as any[]).map(
                                                        (file, index) => (
                                                            <div
                                                                key={
                                                                    file.id ||
                                                                    index
                                                                }
                                                                className="relative group rounded-lg overflow-hidden bg-black/10 border border-white/10"
                                                            >
                                                                {file.mimeType?.startsWith(
                                                                    "image/"
                                                                ) ? (
                                                                    <div className="aspect-video relative">
                                                                        <Image
                                                                            src={
                                                                                file.url
                                                                            }
                                                                            alt="Post attachment"
                                                                            fill
                                                                            className="object-cover cursor-pointer"
                                                                            sizes="(max-width: 768px) 50vw, 33vw"
                                                                            onClick={() =>
                                                                                handleImageClick(
                                                                                    index
                                                                                )
                                                                            }
                                                                            quality={
                                                                                50
                                                                            }
                                                                            priority={
                                                                                false
                                                                            }
                                                                            unoptimized={
                                                                                true
                                                                            }
                                                                        />
                                                                    </div>
                                                                ) : file.mimeType?.startsWith(
                                                                      "video/"
                                                                  ) ? (
                                                                    <div className="aspect-video relative">
                                                                        <video
                                                                            src={
                                                                                file.url
                                                                            }
                                                                            controls
                                                                            className="w-full h-full object-cover rounded"
                                                                            preload="metadata"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="aspect-video relative flex items-center justify-center">
                                                                        <ImageIcon className="text-white/60 w-8 h-8 md:w-10 md:h-10" />
                                                                        <div className="absolute bottom-1 left-1 right-1">
                                                                            <p className="text-white/80 text-xs truncate">
                                                                                {file.url
                                                                                    .split(
                                                                                        "/"
                                                                                    )
                                                                                    .pop()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 반응 버튼들 */}
                        <div className="flex items-center text-white/60 gap-4 md:gap-6 text-sm md:text-base mt-[5px]">
                            <button
                                onClick={() => onReaction(post.id, "LIKE")}
                                className="flex items-center gap-1 hover:text-white/80 transition-colors disabled:opacity-50"
                                disabled={!player}
                            >
                                <Heart
                                    className={cn(
                                        getResponsiveClass(20).frameClass,
                                        player &&
                                            post.reactions?.find(
                                                (reaction: any) =>
                                                    reaction.playerId ===
                                                        player.id &&
                                                    reaction.type === "LIKE"
                                            )
                                            ? "text-red-500 fill-red-500"
                                            : "text-white/60"
                                    )}
                                />
                                <span
                                    className={cn(
                                        "text-xs md:text-sm",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {post.likeCount}
                                </span>
                            </button>
                            <button
                                onClick={() => onReaction(post.id, "RECOMMEND")}
                                className="flex items-center gap-1 hover:text-white/80 transition-colors disabled:opacity-50"
                                disabled={!player}
                            >
                                <TrendingUp
                                    className={cn(
                                        getResponsiveClass(20).frameClass,
                                        player &&
                                            post.reactions?.find(
                                                (reaction: any) =>
                                                    reaction.playerId ===
                                                        player.id &&
                                                    reaction.type ===
                                                        "RECOMMEND"
                                            )
                                            ? "text-blue-500 fill-blue-500"
                                            : "text-white/60"
                                    )}
                                />
                                <span
                                    className={cn(
                                        "text-xs md:text-sm",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {post.recommendCount}
                                </span>
                                {activeBoard?.popularPostRewardEnabled &&
                                    activeBoard.popularPostThreshold &&
                                    post.recommendCount >=
                                        activeBoard.popularPostThreshold && (
                                        <span
                                            className={cn(
                                                "text-yellow-400 ml-1",
                                                getResponsiveClass(10).textClass
                                            )}
                                        >
                                            🔥
                                        </span>
                                    )}
                            </button>
                            <button
                                onClick={() => {
                                    onToggleComments(post.id);
                                }}
                                className="flex items-center gap-1 hover:text-white/80 transition-colors"
                            >
                                <MessageSquare
                                    className={cn(
                                        getResponsiveClass(20).frameClass
                                    )}
                                />
                                <span
                                    className={cn(
                                        "text-xs md:text-sm",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {post.commentCount}
                                </span>
                            </button>
                        </div>

                        {/* 댓글 섹션 */}
                        {expandedPosts.has(post.id) && (
                            <BoardContentComment
                                postId={post.id}
                                player={player}
                                artist={artist}
                            />
                        )}
                    </div>
                </div>
            </motion.div>
            {imageFiles.length > 0 && (
                <ImageVideoPopup
                    images={imageFiles.map((file) => file.url)}
                    initialIndex={selectedImageIndex}
                    isOpen={isImagePopupOpen}
                    onClose={() => {
                        setIsImagePopupOpen(false);
                    }}
                />
            )}
        </>
    );
});
