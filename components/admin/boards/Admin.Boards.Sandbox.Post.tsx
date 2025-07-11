/// components/admin/boards/Admin.Boards.Sandbox.Post.tsx

"use client";

import React, { useState, useMemo } from "react";
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

import { cn } from "@/lib/utils/tailwind";
import { Button } from "../../ui/button";
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
} from "../../ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

import type {
    BoardPostWithDetails,
    BoardWithPosts,
} from "@/app/actions/boards/actions";

import AdminBoardsSandboxComment from "./Admin.Boards.Sandbox.Comment";
import ImageVideoPopup from "../../atoms/ImageVideoPopup";

interface AdminBoardsSandboxPostProps {
    post: BoardPostWithDetails;
    activeBoard: BoardWithPosts;
    expandedPosts: Set<string>;
    expandedPostContent: Set<string>;
    deletingPostId: string | null;
    isDeleteBoardPostPending: boolean;
    onReaction: (postId: string, type: "LIKE" | "RECOMMEND") => void;
    onDeletePost: (postId: string) => void;
    onToggleComments: (postId: string) => void;
    onTogglePostContent: (postId: string) => void;
}

export default function AdminBoardsSandboxPost({
    post,
    activeBoard,
    expandedPosts,
    expandedPostContent,
    deletingPostId,
    isDeleteBoardPostPending,
    onReaction,
    onDeletePost,
    onToggleComments,
    onTogglePostContent,
}: AdminBoardsSandboxPostProps) {
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
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 hover:bg-slate-800/70 transition-all duration-200">
                <div className="space-y-4">
                    {/* Author info */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Image
                                src={
                                    post.isSandbox
                                        ? post.sandboxImgUrl ||
                                          "/default-avatar.jpg"
                                        : post.author?.image ||
                                          "/default-avatar.jpg"
                                }
                                alt={
                                    post.isSandbox
                                        ? post.sandboxNickname || "Admin User"
                                        : post.author?.nickname ||
                                          post.author?.name ||
                                          "Fan"
                                }
                                width={48}
                                height={48}
                                className={cn(
                                    "rounded-full object-cover border-2 border-slate-600"
                                )}
                            />
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-white">
                                        {post.isSandbox
                                            ? post.sandboxNickname ||
                                              "Admin User"
                                            : post.author?.nickname ||
                                              post.author?.name ||
                                              "Fan"}
                                    </span>
                                    {(post.isSandbox
                                        ? post.isSandboxBoardArtist
                                        : post.author?.artistId) && (
                                        <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-500/30">
                                            Artist
                                        </span>
                                    )}
                                    {post.isSandbox && (
                                        <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-500/30">
                                            Admin
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm text-slate-400">
                                    {formatTimeAgo(post.createdAt, true)}
                                </span>
                            </div>
                        </div>

                        {/* Actions dropdown */}
                        {post.isSandbox && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg"
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="bg-slate-800 border-slate-700"
                                >
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem
                                                onSelect={(e) =>
                                                    e.preventDefault()
                                                }
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete Post
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-slate-800 border-slate-700">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-white">
                                                    Delete Post?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="text-slate-400">
                                                    This action cannot be
                                                    undone. This will
                                                    permanently delete the post
                                                    and all its comments.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600">
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() =>
                                                        onDeletePost(post.id)
                                                    }
                                                    disabled={
                                                        deletingPostId ===
                                                            post.id ||
                                                        isDeleteBoardPostPending
                                                    }
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    {deletingPostId === post.id
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

                    {/* Title and expand button */}
                    <div
                        className="flex items-center justify-between cursor-pointer p-3 hover:bg-slate-700/50 rounded-xl transition-colors"
                        onClick={() => onTogglePostContent(post.id)}
                    >
                        <h3 className="font-semibold text-white flex-1">
                            {post.title}
                        </h3>
                        <ChevronDown
                            className={cn(
                                "w-5 h-5 text-slate-400 transition-transform",
                                expandedPostContent.has(post.id) && "rotate-180"
                            )}
                        />
                    </div>

                    {/* Expandable content */}
                    {expandedPostContent.has(post.id) && (
                        <div className="space-y-4">
                            <p className="text-slate-300 leading-relaxed">
                                {post.content}
                            </p>

                            {/* Attached files */}
                            {post.files && post.files.length > 0 && (
                                <div
                                    className="grid gap-3"
                                    style={{
                                        gridTemplateColumns: `repeat(${Math.min(
                                            post.files.length,
                                            3
                                        )}, 1fr)`,
                                    }}
                                >
                                    {(post.files as any[]).map(
                                        (file, index) => (
                                            <div
                                                key={file.id || index}
                                                className="relative rounded-xl overflow-hidden bg-slate-700/50 border border-slate-600/50"
                                            >
                                                {file.mimeType?.startsWith(
                                                    "image/"
                                                ) ? (
                                                    <div className="aspect-video relative">
                                                        <Image
                                                            src={file.url}
                                                            alt="Post attachment"
                                                            fill
                                                            className="object-cover cursor-pointer"
                                                            onClick={() =>
                                                                handleImageClick(
                                                                    index
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                ) : file.mimeType?.startsWith(
                                                      "video/"
                                                  ) ? (
                                                    <div className="aspect-video relative">
                                                        <video
                                                            src={file.url}
                                                            controls
                                                            className="w-full h-full object-cover"
                                                            preload="metadata"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="aspect-video relative flex items-center justify-center">
                                                        <ImageIcon className="w-8 h-8 text-slate-400" />
                                                        <div className="absolute bottom-2 left-2 right-2">
                                                            <p className="text-slate-300 text-xs truncate">
                                                                {file.url
                                                                    .split("/")
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
                    )}

                    {/* Reaction buttons */}
                    <div className="flex items-center gap-6 pt-4 border-t border-slate-700/50">
                        <button
                            onClick={() => onReaction(post.id, "LIKE")}
                            className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
                        >
                            <Heart
                                className={cn(
                                    "w-5 h-5",
                                    post.reactions?.find(
                                        (reaction: any) =>
                                            reaction.playerId === "sandbox" &&
                                            reaction.type === "LIKE"
                                    )
                                        ? "text-red-500 fill-red-500"
                                        : "text-slate-400"
                                )}
                            />
                            <span className="text-sm">{post.likeCount}</span>
                        </button>

                        <button
                            onClick={() => onReaction(post.id, "RECOMMEND")}
                            className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
                        >
                            <TrendingUp
                                className={cn(
                                    "w-5 h-5",
                                    post.reactions?.find(
                                        (reaction: any) =>
                                            reaction.playerId === "sandbox" &&
                                            reaction.type === "RECOMMEND"
                                    )
                                        ? "text-blue-500 fill-blue-500"
                                        : "text-slate-400"
                                )}
                            />
                            <span className="text-sm">
                                {post.recommendCount}
                            </span>
                            {activeBoard?.popularPostRewardEnabled &&
                                activeBoard.popularPostThreshold &&
                                post.recommendCount >=
                                    activeBoard.popularPostThreshold && (
                                    <span className="text-yellow-500">🔥</span>
                                )}
                        </button>

                        <button
                            onClick={() => onToggleComments(post.id)}
                            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
                        >
                            <MessageSquare className="w-5 h-5 text-slate-400" />
                            <span className="text-sm">{post.commentCount}</span>
                        </button>
                    </div>

                    {/* Comments section */}
                    {expandedPosts.has(post.id) && (
                        <div className="border-t border-slate-700/50 pt-4">
                            <AdminBoardsSandboxComment postId={post.id} />
                        </div>
                    )}
                </div>
            </div>

            {/* Image popup */}
            {imageFiles.length > 0 && (
                <ImageVideoPopup
                    images={imageFiles.map((file) => file.url)}
                    initialIndex={selectedImageIndex}
                    isOpen={isImagePopupOpen}
                    onClose={() => setIsImagePopupOpen(false)}
                />
            )}
        </>
    );
}
