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
    // Sandbox 프로필 설정 추가
    sandboxNickname?: string;
    sandboxImgUrl?: string;
    isSandboxBoardArtist?: boolean;
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
    sandboxNickname = "Admin User",
    sandboxImgUrl = "/default-avatar.jpg",
    isSandboxBoardArtist = false,
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

    const handleCreateReply = useCallback(async () => {
        if (!newReply.trim()) return;

        try {
            const result = await createBoardCommentAsync({
                postId: comment.postId,
                authorId: "sandbox",
                authorType: "ADMIN",
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
                // Sandbox 모드 필드
                isSandbox: true,
                sandboxNickname: sandboxNickname,
                sandboxImgUrl: sandboxImgUrl,
                isSandboxBoardArtist: isSandboxBoardArtist,
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
        sandboxNickname,
        sandboxImgUrl,
        isSandboxBoardArtist,
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
                    "bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 hover:bg-slate-800/70 transition-all duration-200",
                    level === 0 && "border-l-4 border-l-purple-500/50",
                    level === 1 && "ml-6 border-l-4 border-l-blue-500/50",
                    level === 2 && "ml-12 border-l-2 border-l-slate-600/50",
                    level === 3 && "ml-18 border-l border-l-slate-600/50"
                )}
            >
                <div className="space-y-4">
                    {/* Author info */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Image
                                src={
                                    comment.isSandbox
                                        ? comment.sandboxImgUrl ||
                                          "/default-avatar.jpg"
                                        : commentAuthorProfile?.image ||
                                          comment.author?.image ||
                                          "/default-avatar.jpg"
                                }
                                alt={
                                    comment.isSandbox
                                        ? comment.sandboxNickname ||
                                          "Admin User"
                                        : commentAuthorProfile?.name ||
                                          comment.author?.name ||
                                          "User"
                                }
                                width={level > 0 ? 32 : 36}
                                height={level > 0 ? 32 : 36}
                                className={cn(
                                    "rounded-full object-cover flex-shrink-0 border-2 border-slate-600",
                                    !comment.isSandbox &&
                                        isCommentAuthorProfileLoading &&
                                        "animate-pulse blur-sm"
                                )}
                            />
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-white text-sm">
                                    {comment.isSandbox
                                        ? comment.sandboxNickname ||
                                          "Admin User"
                                        : commentAuthorProfile?.name ||
                                          comment.author?.name ||
                                          "Fan"}
                                </span>
                                {(comment.isSandbox
                                    ? comment.isSandboxBoardArtist
                                    : comment.author?.artistId) && (
                                    <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-500/30">
                                        Artist
                                    </span>
                                )}
                                {comment.isSandbox && (
                                    <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-500/30">
                                        Admin
                                    </span>
                                )}
                                <span className="text-xs text-slate-400">
                                    {formatTimeAgo(comment.createdAt, true)}
                                </span>
                            </div>
                        </div>

                        {/* Delete button for author */}
                        {comment.isSandbox && (
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
                                                Delete Comment
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-slate-800 border-slate-700">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-white">
                                                    Delete Comment?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="text-slate-400">
                                                    This action cannot be
                                                    undone. This will
                                                    permanently delete the
                                                    comment.
                                                    {comment.replies &&
                                                        comment.replies.length >
                                                            0 && (
                                                            <span className="block mt-2 text-yellow-400">
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
                                                <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600">
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
                    <p className="text-slate-300 text-sm leading-relaxed">
                        {comment.content}
                    </p>

                    {/* Attached files */}
                    {comment.files && comment.files.length > 0 && (
                        <div
                            className="grid gap-3"
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
                                    className="relative rounded-xl overflow-hidden bg-slate-700/50 border border-slate-600/50"
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
                                            <ImageIcon className="w-6 h-6 text-slate-400" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <button
                            onClick={handleCommentReaction}
                            className="flex items-center gap-1 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
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
                                        : "text-slate-400"
                                )}
                            />
                            <span>{comment.likeCount}</span>
                        </button>

                        {level < 1 && (
                            <button
                                onClick={() => onReply(comment.id)}
                                className="hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
                            >
                                Reply
                            </button>
                        )}

                        {comment.replies && comment.replies.length > 0 && (
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="flex items-center gap-1 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
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
                        <div className="border-t border-slate-700/50 pt-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <Image
                                    src={sandboxImgUrl}
                                    alt={sandboxNickname}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover flex-shrink-0 border-2 border-slate-600"
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
                                        className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg resize-none text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        rows={2}
                                    />

                                    {/* Reply file upload */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() =>
                                                setShowReplyFileUploader(
                                                    !showReplyFileUploader
                                                )
                                            }
                                            className={cn(
                                                "flex items-center gap-1 px-3 py-2 rounded-lg border transition-all duration-200 text-xs",
                                                showReplyFileUploader
                                                    ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-blue-500/30 text-blue-300"
                                                    : "bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                                            )}
                                        >
                                            <ImageIcon className="w-3 h-3" />
                                            <Video className="w-3 h-3" />
                                        </button>

                                        {replyFiles.length > 0 && (
                                            <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
                                                {replyFiles.length} file
                                                {replyFiles.length > 1
                                                    ? "s"
                                                    : ""}
                                            </span>
                                        )}
                                    </div>

                                    {/* Reply file uploader */}
                                    {showReplyFileUploader && (
                                        <div className="space-y-3">
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
                                                className="border-dashed border-purple-500/30 bg-slate-800/30 text-slate-300"
                                            />

                                            {replyFiles.length > 0 && (
                                                <div className="grid grid-cols-4 gap-2">
                                                    {replyFiles.map((file) => (
                                                        <div
                                                            key={file.id}
                                                            className="relative group rounded-lg overflow-hidden bg-slate-800/50 border border-slate-600/50 aspect-square"
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
                                                                    <Video className="w-4 h-4 text-slate-400" />
                                                                </div>
                                                            )}

                                                            <button
                                                                onClick={() =>
                                                                    removeReplyFile(
                                                                        file.id
                                                                    )
                                                                }
                                                                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                            >
                                                                <X className="w-3 h-3" />
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
                                            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50 rounded-lg"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleCreateReply}
                                            size="sm"
                                            disabled={
                                                isSubmitting || !newReply.trim()
                                            }
                                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg"
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
                <div className="space-y-3">
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
                            sandboxNickname={sandboxNickname}
                            sandboxImgUrl={sandboxImgUrl}
                            isSandboxBoardArtist={isSandboxBoardArtist}
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
