/// components/admin/boards/Admin.Boards.Sandbox.Comment.Item.tsx

"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
    Heart,
    ChevronDown,
    ChevronUp,
    MoreHorizontal,
    Trash2,
    X,
    Image as ImageIcon,
    Video,
} from "lucide-react";
import Image from "next/image";
import { formatTimeAgo } from "@/lib/utils/format";

import { useBoards } from "@/app/actions/boards/hooks";
import { cn } from "@/lib/utils/tailwind";
import FileUploader from "../../atoms/FileUploader";
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

import type { FileData } from "../../atoms/FileUploader";
import { usePlayerGet } from "@/app/hooks/usePlayer";
import { useToast } from "@/app/hooks/useToast";
import ImageVideoPopup from "../../atoms/ImageVideoPopup";

interface AdminBoardsSandboxCommentItemProps {
    comment: any;
    onReply: (commentId: string) => void;
    replyingTo: string | null;
    onCancelReply: () => void;
    createBoardCommentAsync: any;
    deleteBoardCommentAsync: any;
    isSubmitting: boolean;
    isDeletingComment: boolean;
    level?: number;
}

export default function AdminBoardsSandboxCommentItem({
    comment,
    onReply,
    replyingTo,
    onCancelReply,
    createBoardCommentAsync,
    deleteBoardCommentAsync,
    isSubmitting,
    isDeletingComment,
    level = 0,
}: AdminBoardsSandboxCommentItemProps) {
    const toast = useToast();
    const [newReply, setNewReply] = useState("");
    const [showReplies, setShowReplies] = useState(true);

    // 대댓글 파일 업로드 상태
    const [replyFiles, setReplyFiles] = useState<FileData[]>([]);
    const [showReplyFileUploader, setShowReplyFileUploader] = useState(false);

    // 이미지 팝업 상태
    const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const { createBoardReactionAsync, deleteBoardReactionAsync } = useBoards();

    // 이미지 파일들만 필터링
    const imageFiles = useMemo(() => {
        if (!comment.files) return [];
        return (comment.files as any[]).filter(
            (file) => file?.mimeType?.startsWith("image/") && file?.url
        );
    }, [comment.files]);

    // 이미지 클릭 핸들러
    const handleImageClick = (fileIndex: number) => {
        const imageIndex = imageFiles.findIndex((imageFile) => {
            const allFiles = comment.files as any[];
            return allFiles[fileIndex]?.url === imageFile?.url;
        });

        if (imageIndex !== -1) {
            setSelectedImageIndex(imageIndex);
            setIsImagePopupOpen(true);
        }
    };

    const {
        playerProfile: commentAuthorProfile,
        isPlayerProfileLoading: isCommentAuthorProfileLoading,
    } = usePlayerGet({
        getPlayerProfileInput: {
            playerId: comment.author?.id || "",
        },
    });

    const {
        playerProfile: currentPlayerProfile,
        isPlayerProfileLoading: isCurrentPlayerProfileLoading,
    } = usePlayerGet({
        getPlayerProfileInput: {
            playerId: "sandbox",
        },
    });

    const handleCreateReply = useCallback(async () => {
        if (!newReply.trim()) return;

        try {
            const result = await createBoardCommentAsync({
                postId: comment.postId,
                authorId: "sandbox",
                authorType: "PLAYER",
                content: newReply.trim(),
                parentId: comment.id,
                files: replyFiles.map((f) => ({
                    id: f.id,
                    url: f.url,
                    mimeType: f.mimeType,
                    width: f.width,
                    height: f.height,
                    sizeBytes: f.sizeBytes,
                })),
            });

            if (result?.success) {
                setNewReply("");
                setReplyFiles([]);
                onCancelReply();
                toast.success("Reply posted successfully!");
            } else {
                toast.error(
                    result?.message || "Failed to post reply. Please try again."
                );
            }
        } catch (error) {
            console.error("Failed to create reply:", error);
            toast.error("Failed to post reply. Please try again.");
        }
    }, [
        newReply,
        replyFiles,
        createBoardCommentAsync,
        comment.postId,
        comment.id,
        onCancelReply,
        toast,
    ]);

    // 대댓글 파일 업로드 핸들러
    const handleReplyFilesSelected = useCallback((files: FileData[]) => {
        setReplyFiles((prev) => [...prev, ...files]);
    }, []);

    // 대댓글 파일 제거 핸들러
    const removeReplyFile = useCallback((fileId: string) => {
        setReplyFiles((prev) => prev.filter((f) => f.id !== fileId));
    }, []);

    const handleDeleteComment = useCallback(async () => {
        try {
            await deleteBoardCommentAsync(comment.id);
            toast.success("Comment deleted successfully!");
        } catch (error) {
            console.error("Failed to delete comment:", error);
            toast.error("Failed to delete comment");
        }
    }, [deleteBoardCommentAsync, comment.id, toast]);

    const handleCommentReaction = useCallback(async () => {
        try {
            const existingReaction = comment.reactions?.find(
                (reaction: any) =>
                    reaction.playerId === "sandbox" && reaction.type === "LIKE"
            );

            if (existingReaction) {
                await deleteBoardReactionAsync({
                    playerId: "sandbox",
                    commentId: comment.id,
                    type: "LIKE",
                });
            } else {
                await createBoardReactionAsync({
                    playerId: "sandbox",
                    commentId: comment.id,
                    type: "LIKE",
                });
            }
        } catch (error) {
            console.error("Failed to react to comment:", error);
        }
    }, [
        createBoardReactionAsync,
        deleteBoardReactionAsync,
        comment.id,
        comment.reactions,
    ]);

    return (
        <>
            <div
                className={cn(
                    "border rounded-lg p-3 bg-white",
                    level === 0 && "border-l-4 border-l-blue-200",
                    level === 1 && "ml-6 border-l-4 border-l-gray-200",
                    level === 2 && "ml-12 border-l-2 border-l-gray-100",
                    level === 3 && "ml-18 border-l border-l-gray-100"
                )}
            >
                <div className="space-y-3">
                    {/* Author info */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Image
                                src={
                                    commentAuthorProfile?.image ||
                                    comment.author?.image ||
                                    "/default-avatar.jpg"
                                }
                                alt={
                                    commentAuthorProfile?.name ||
                                    comment.author?.name ||
                                    "User"
                                }
                                width={level > 0 ? 28 : 32}
                                height={level > 0 ? 28 : 32}
                                className={cn(
                                    "rounded-full object-cover flex-shrink-0",
                                    isCommentAuthorProfileLoading &&
                                        "animate-pulse blur-sm"
                                )}
                            />
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 text-sm">
                                    {commentAuthorProfile?.name ||
                                        comment.author?.name ||
                                        "Fan"}
                                </span>
                                {comment.author?.artistId && (
                                    <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                                        Artist
                                    </span>
                                )}
                                <span className="text-xs text-gray-500">
                                    {formatTimeAgo(comment.createdAt, true)}
                                </span>
                            </div>
                        </div>

                        {/* Delete button for author */}
                        {comment.author?.id === "sandbox" && (
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
                                                Delete Comment
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Delete Comment?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be
                                                    undone. This will
                                                    permanently delete the
                                                    comment.
                                                    {comment.replies &&
                                                        comment.replies.length >
                                                            0 && (
                                                            <span className="block mt-2 text-yellow-600">
                                                                ⚠️ This comment
                                                                has{" "}
                                                                {
                                                                    comment
                                                                        .replies
                                                                        .length
                                                                }{" "}
                                                                {comment.replies
                                                                    .length ===
                                                                1
                                                                    ? "reply"
                                                                    : "replies"}{" "}
                                                                that will also
                                                                be deleted.
                                                            </span>
                                                        )}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={
                                                        handleDeleteComment
                                                    }
                                                    disabled={isDeletingComment}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    {isDeletingComment
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

                    {/* Comment content */}
                    <p className="text-gray-700 text-sm leading-relaxed">
                        {comment.content}
                    </p>

                    {/* Attached files */}
                    {comment.files && comment.files.length > 0 && (
                        <div
                            className="grid gap-2"
                            style={{
                                gridTemplateColumns: `repeat(${Math.min(
                                    comment.files.length,
                                    3
                                )}, 1fr)`,
                            }}
                        >
                            {(comment.files as any[]).map((file, index) => (
                                <div
                                    key={file.id || index}
                                    className="relative rounded-lg overflow-hidden bg-gray-100 border"
                                >
                                    {file.mimeType?.startsWith("image/") ? (
                                        <div className="aspect-video relative">
                                            <Image
                                                src={file.url}
                                                alt="Comment attachment"
                                                fill
                                                className="object-cover cursor-pointer"
                                                onClick={() =>
                                                    handleImageClick(index)
                                                }
                                            />
                                        </div>
                                    ) : file.mimeType?.startsWith("video/") ? (
                                        <div className="aspect-video relative">
                                            <video
                                                src={file.url}
                                                controls
                                                className="w-full h-full object-cover"
                                                preload="metadata"
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-square relative flex items-center justify-center">
                                            <ImageIcon className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <button
                            onClick={handleCommentReaction}
                            className="flex items-center gap-1 hover:text-red-600 transition-colors"
                        >
                            <Heart
                                className={cn(
                                    "w-4 h-4",
                                    comment.reactions?.find(
                                        (reaction: any) =>
                                            reaction.playerId === "sandbox" &&
                                            reaction.type === "LIKE"
                                    )
                                        ? "text-red-500 fill-red-500"
                                        : "text-gray-400"
                                )}
                            />
                            <span>{comment.likeCount}</span>
                        </button>

                        {level < 1 && (
                            <button
                                onClick={() => onReply(comment.id)}
                                className="hover:text-blue-600 transition-colors"
                            >
                                Reply
                            </button>
                        )}

                        {comment.replies && comment.replies.length > 0 && (
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="flex items-center gap-1 hover:text-gray-800 transition-colors"
                            >
                                {showReplies ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                                <span>
                                    {comment.replies.length}{" "}
                                    {comment.replies.length === 1
                                        ? "reply"
                                        : "replies"}
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Reply form */}
                    {replyingTo === comment.id && (
                        <div className="border-t pt-3 space-y-3">
                            <div className="flex items-start gap-3">
                                <Image
                                    src={
                                        currentPlayerProfile?.image ||
                                        "/default-avatar.jpg"
                                    }
                                    alt={currentPlayerProfile?.name || "User"}
                                    width={24}
                                    height={24}
                                    className={cn(
                                        "rounded-full object-cover flex-shrink-0",
                                        isCurrentPlayerProfileLoading &&
                                            "animate-pulse blur-sm"
                                    )}
                                />
                                <div className="flex-1 space-y-3">
                                    <textarea
                                        placeholder={`Reply to ${
                                            comment.author?.name ||
                                            "this comment"
                                        }...`}
                                        value={newReply}
                                        onChange={(e) =>
                                            setNewReply(e.target.value)
                                        }
                                        className="w-full p-2 border rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={2}
                                    />

                                    {/* Reply file upload */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                setShowReplyFileUploader(
                                                    !showReplyFileUploader
                                                )
                                            }
                                            className={cn(
                                                "flex items-center gap-1 px-2 py-1 rounded border transition-colors text-xs",
                                                showReplyFileUploader
                                                    ? "bg-blue-50 border-blue-200 text-blue-700"
                                                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                            )}
                                        >
                                            <ImageIcon className="w-3 h-3" />
                                            <Video className="w-3 h-3" />
                                        </button>

                                        {replyFiles.length > 0 && (
                                            <span className="text-xs text-gray-600">
                                                {replyFiles.length} file
                                                {replyFiles.length > 1
                                                    ? "s"
                                                    : ""}
                                            </span>
                                        )}
                                    </div>

                                    {/* Reply file uploader */}
                                    {showReplyFileUploader && (
                                        <div className="space-y-2">
                                            <FileUploader
                                                purpose="board-comment"
                                                bucket="board-comments"
                                                onFiles={
                                                    handleReplyFilesSelected
                                                }
                                                accept={{
                                                    "image/*": [
                                                        ".png",
                                                        ".jpg",
                                                        ".jpeg",
                                                        ".gif",
                                                        ".webp",
                                                    ],
                                                    "video/*": [
                                                        ".mp4",
                                                        ".mov",
                                                        ".avi",
                                                        ".webm",
                                                    ],
                                                }}
                                                maxSize={500 * 1024 * 1024}
                                                multiple={true}
                                                className="border-dashed"
                                            />

                                            {replyFiles.length > 0 && (
                                                <div className="grid grid-cols-4 gap-1">
                                                    {replyFiles.map((file) => (
                                                        <div
                                                            key={file.id}
                                                            className="relative group rounded overflow-hidden bg-gray-100 border aspect-square"
                                                        >
                                                            {file.mimeType?.startsWith(
                                                                "image/"
                                                            ) ? (
                                                                <Image
                                                                    src={
                                                                        file.url
                                                                    }
                                                                    alt="Reply file"
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Video className="w-4 h-4 text-gray-400" />
                                                                </div>
                                                            )}

                                                            <button
                                                                onClick={() =>
                                                                    removeReplyFile(
                                                                        file.id
                                                                    )
                                                                }
                                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-2 h-2" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            onClick={() => {
                                                onCancelReply();
                                                setReplyFiles([]);
                                            }}
                                            size="sm"
                                            variant="outline"
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleCreateReply}
                                            size="sm"
                                            disabled={
                                                isSubmitting || !newReply.trim()
                                            }
                                        >
                                            {isSubmitting
                                                ? "Replying..."
                                                : "Reply"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Replies */}
            {showReplies && comment.replies && comment.replies.length > 0 && (
                <div className="space-y-2">
                    {comment.replies.map((reply: any) => (
                        <AdminBoardsSandboxCommentItem
                            key={reply.id}
                            comment={reply}
                            onReply={onReply}
                            replyingTo={replyingTo}
                            onCancelReply={onCancelReply}
                            createBoardCommentAsync={createBoardCommentAsync}
                            deleteBoardCommentAsync={deleteBoardCommentAsync}
                            isSubmitting={isSubmitting}
                            isDeletingComment={isDeletingComment}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}

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
