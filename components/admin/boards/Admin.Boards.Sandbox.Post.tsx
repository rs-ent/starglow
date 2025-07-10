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
            <div className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                <div className="space-y-3">
                    {/* Author info */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Image
                                src={
                                    post.author?.image || "/default-avatar.jpg"
                                }
                                alt={
                                    post.author?.nickname ||
                                    post.author?.name ||
                                    ""
                                }
                                width={40}
                                height={40}
                                className={cn("rounded-full object-cover")}
                            />
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">
                                        {post.author?.nickname ||
                                            post.author?.name ||
                                            "Fan"}
                                    </span>
                                    {post.author?.artistId && (
                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                            Artist
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm text-gray-500">
                                    {formatTimeAgo(post.createdAt, true)}
                                </span>
                            </div>
                        </div>

                        {/* Actions dropdown */}
                        {post.author?.id === "sandbox" && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem
                                                onSelect={(e) =>
                                                    e.preventDefault()
                                                }
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete Post
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Delete Post?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be
                                                    undone. This will
                                                    permanently delete the post
                                                    and all its comments.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
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
                        className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-100 rounded-lg"
                        onClick={() => onTogglePostContent(post.id)}
                    >
                        <h3 className="font-semibold text-gray-900 flex-1">
                            {post.title}
                        </h3>
                        <ChevronDown
                            className={cn(
                                "w-5 h-5 text-gray-400 transition-transform",
                                expandedPostContent.has(post.id) && "rotate-180"
                            )}
                        />
                    </div>

                    {/* Expandable content */}
                    {expandedPostContent.has(post.id) && (
                        <div className="space-y-3">
                            <p className="text-gray-700 leading-relaxed">
                                {post.content}
                            </p>

                            {/* Attached files */}
                            {post.files && post.files.length > 0 && (
                                <div
                                    className="grid gap-2"
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
                                                className="relative rounded-lg overflow-hidden bg-gray-100 border"
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
                                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                                        <div className="absolute bottom-1 left-1 right-1">
                                                            <p className="text-gray-600 text-xs truncate">
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
                    <div className="flex items-center gap-6 pt-2 border-t">
                        <button
                            onClick={() => onReaction(post.id, "LIKE")}
                            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
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
                                        : "text-gray-400"
                                )}
                            />
                            <span className="text-sm">{post.likeCount}</span>
                        </button>

                        <button
                            onClick={() => onReaction(post.id, "RECOMMEND")}
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
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
                                        : "text-gray-400"
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
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <MessageSquare className="w-5 h-5 text-gray-400" />
                            <span className="text-sm">{post.commentCount}</span>
                        </button>
                    </div>

                    {/* Comments section */}
                    {expandedPosts.has(post.id) && (
                        <div className="border-t pt-4">
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
