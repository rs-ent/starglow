/// components/boards/Board.Content.Comment.Item.tsx

"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import FileUploader from "../atoms/FileUploader";
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

import type { Player } from "@prisma/client";
import type { FileData } from "../atoms/FileUploader";
import { usePlayerGet } from "@/app/hooks/usePlayer";

interface BoardContentCommentItemProps {
    comment: any;
    player: Player | null;
    onReply: (commentId: string) => void;
    replyingTo: string | null;
    onCancelReply: () => void;
    createBoardCommentAsync: any;
    deleteBoardCommentAsync: any;
    isSubmitting: boolean;
    isDeletingComment: boolean;
    level?: number;
}

export default React.memo(function BoardContentCommentItem({
    comment,
    player,
    onReply,
    replyingTo,
    onCancelReply,
    createBoardCommentAsync,
    deleteBoardCommentAsync,
    isSubmitting,
    isDeletingComment,
    level = 0,
}: BoardContentCommentItemProps) {
    const [newReply, setNewReply] = useState("");
    const [showReplies, setShowReplies] = useState(true);

    // 대댓글 파일 업로드 상태
    const [replyFiles, setReplyFiles] = useState<FileData[]>([]);
    const [showReplyFileUploader, setShowReplyFileUploader] = useState(false);

    const { createBoardReactionAsync, deleteBoardReactionAsync } = useBoards();

    const { playerImage, isPlayerImageLoading } = usePlayerGet({
        getPlayerImageInput: {
            playerId: comment.author?.id || "",
        },
    });

    const {
        playerImage: currentPlayerImage,
        isPlayerImageLoading: isCurrentPlayerImageLoading,
    } = usePlayerGet({
        getPlayerImageInput: {
            playerId: player?.id || "",
        },
    });

    const handleCreateReply = useCallback(async () => {
        if (!player || !newReply.trim()) return;

        try {
            await createBoardCommentAsync({
                postId: comment.postId,
                authorId: player.id,
                authorType: "PLAYER",
                content: newReply.trim(),
                parentId: comment.id,
                // 업로드된 파일 정보 전송
                files: replyFiles.map((f) => ({
                    id: f.id,
                    url: f.url,
                    mimeType: f.mimeType,
                    width: f.width,
                    height: f.height,
                    sizeBytes: f.sizeBytes,
                })),
            });

            setNewReply("");
            setReplyFiles([]);
            onCancelReply();
        } catch (error) {
            console.error("Failed to create reply:", error);
        }
    }, [
        player,
        newReply,
        replyFiles,
        createBoardCommentAsync,
        comment.postId,
        comment.id,
        onCancelReply,
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
        if (!player) return;

        try {
            await deleteBoardCommentAsync(comment.id);
        } catch (error) {
            console.error("Failed to delete comment:", error);
        }
    }, [player, deleteBoardCommentAsync, comment.id]);

    const handleCommentReaction = useCallback(async () => {
        if (!player) return;

        try {
            // 현재 사용자가 이 댓글에 LIKE 반응했는지 확인
            const existingReaction = comment.reactions?.find(
                (reaction: any) =>
                    reaction.playerId === player.id && reaction.type === "LIKE"
            );

            if (existingReaction) {
                // 이미 반응했다면 삭제 (토글 off)
                await deleteBoardReactionAsync({
                    playerId: player.id,
                    commentId: comment.id,
                    type: "LIKE",
                });
            } else {
                // 반응하지 않았다면 추가 (토글 on)
                await createBoardReactionAsync({
                    playerId: player.id,
                    commentId: comment.id,
                    type: "LIKE",
                });
            }
        } catch (error) {
            console.error("Failed to react to comment:", error);
        }
    }, [
        player,
        createBoardReactionAsync,
        deleteBoardReactionAsync,
        comment.id,
        comment.reactions,
    ]);

    return (
        <div className={cn("space-y-1")}>
            <div
                className={cn(
                    "flex items-start gap-3 md:gap-4 p-1 rounded-[6px]",
                    level === 0 && "bg-[rgba(255,255,255,0.05)]",
                    level === 1 && "ml-[10px]",
                    level === 2 && "ml-[20px]",
                    level === 3 && "ml-[30px]"
                )}
            >
                <div className="flex-1 min-w-0">
                    <div className={cn("flex items-center justify-between")}>
                        <div
                            className={cn(
                                "flex items-center flex-1 min-w-0",
                                getResponsiveClass(5).gapClass
                            )}
                        >
                            <Image
                                src={
                                    playerImage ||
                                    comment.author?.image ||
                                    "/default-avatar.jpg"
                                }
                                alt={comment.author?.name || "User"}
                                width={32}
                                height={32}
                                priority={false}
                                unoptimized={true}
                                className={cn(
                                    "rounded-full flex-shrink-0",
                                    isPlayerImageLoading &&
                                        "animate-pulse blur-sm",
                                    level > 0
                                        ? getResponsiveClass(20).frameClass
                                        : getResponsiveClass(30).frameClass
                                )}
                            />
                            <span
                                className={cn(
                                    "font-medium text-white/50 truncate min-w-0 flex-shrink",
                                    level > 0
                                        ? getResponsiveClass(10).textClass
                                        : getResponsiveClass(15).textClass
                                )}
                            >
                                {comment.author?.name || "Fan"}
                            </span>
                            <span
                                className={cn(
                                    "text-white/50 flex-shrink-0",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                {formatTimeAgo(comment.createdAt, true)}
                            </span>
                            {comment.authorType === "ARTIST" && (
                                <span
                                    className={cn(
                                        "bg-white/20 text-white/80 rounded-full flex-shrink-0",
                                        getResponsiveClass(10).paddingClass,
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Artist
                                </span>
                            )}
                        </div>

                        {/* 작성자만 삭제 가능 */}
                        {player && comment.author?.id === player.id && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <MoreHorizontal
                                        className={cn(
                                            "ml-2",
                                            getResponsiveClass(20).frameClass
                                        )}
                                    />
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
                                                Delete Comment
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-gray-900 border-gray-700">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-white">
                                                    Delete Comment
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="text-white/70">
                                                    Are you sure you want to
                                                    delete this comment? This
                                                    action cannot be undone.
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
                                                <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={
                                                        handleDeleteComment
                                                    }
                                                    disabled={isDeletingComment}
                                                    className="bg-red-600 hover:bg-red-700 text-white"
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
                    <p
                        className={cn(
                            "text-white/80 leading-relaxed",
                            getResponsiveClass(15).textClass,
                            getResponsiveClass(30).marginYClass
                        )}
                    >
                        {comment.content}
                    </p>

                    {/* 댓글 첨부 파일들 표시 */}
                    {comment.files && comment.files.length > 0 && (
                        <div
                            className={cn(
                                "grid",
                                getResponsiveClass(10).gapClass,
                                getResponsiveClass(10).marginYClass,
                                comment.files.length === 1
                                    ? "grid-cols-1"
                                    : comment.files.length === 2
                                    ? "grid-cols-2"
                                    : "grid-cols-2"
                            )}
                        >
                            {(comment.files as any[]).map((file, index) => (
                                <div
                                    key={file.id || index}
                                    className="relative group rounded-lg overflow-hidden bg-black/10 border border-white/10"
                                >
                                    {file.mimeType?.startsWith("image/") ? (
                                        <div className="aspect-video relative">
                                            <Image
                                                src={file.url}
                                                alt="Comment attachment"
                                                fill
                                                className="object-cover cursor-pointer"
                                                sizes="(max-width: 768px) 50vw, 33vw"
                                                onClick={() =>
                                                    window.open(
                                                        file.url,
                                                        "_blank"
                                                    )
                                                }
                                            />
                                        </div>
                                    ) : file.mimeType?.startsWith("video/") ? (
                                        <div className="aspect-video relative">
                                            <video
                                                src={file.url}
                                                controls
                                                className="w-full h-full object-cover rounded"
                                                preload="metadata"
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-square relative flex items-center justify-center">
                                            <ImageIcon
                                                className={cn(
                                                    "text-white/60",
                                                    getResponsiveClass(30)
                                                        .frameClass
                                                )}
                                            />
                                            <div className="absolute bottom-1 left-1 right-1">
                                                <p
                                                    className={cn(
                                                        "text-white/70 truncate",
                                                        getResponsiveClass(10)
                                                            .textClass
                                                    )}
                                                >
                                                    {file.url.split("/").pop()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <div
                        className={cn(
                            "flex items-center text-white/60",
                            getResponsiveClass(15).gapClass,
                            getResponsiveClass(10).textClass
                        )}
                    >
                        <button
                            onClick={handleCommentReaction}
                            className={cn(
                                "flex items-center hover:text-white/80 transition-colors disabled:opacity-50",
                                getResponsiveClass(5).gapClass
                            )}
                            disabled={!player}
                        >
                            <Heart
                                className={cn(
                                    getResponsiveClass(15).frameClass,
                                    player &&
                                        comment.reactions?.find(
                                            (reaction: any) =>
                                                reaction.playerId ===
                                                    player.id &&
                                                reaction.type === "LIKE"
                                        )
                                        ? "text-red-500 fill-red-500"
                                        : "text-white/60"
                                )}
                            />
                            <span>{comment.likeCount}</span>
                        </button>
                        {player && level < 3 && (
                            <button
                                onClick={() => onReply(comment.id)}
                                className="hover:text-white/80 transition-colors"
                            >
                                Reply
                            </button>
                        )}
                        {comment.replies && comment.replies.length > 0 && (
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className={cn(
                                    "flex items-center hover:text-white/80 transition-colors",
                                    getResponsiveClass(5).gapClass
                                )}
                            >
                                {showReplies ? (
                                    <ChevronUp
                                        className={
                                            getResponsiveClass(15).frameClass
                                        }
                                    />
                                ) : (
                                    <ChevronDown
                                        className={
                                            getResponsiveClass(15).frameClass
                                        }
                                    />
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

                    {/* 대댓글 작성 폼 */}
                    <AnimatePresence>
                        {replyingTo === comment.id && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className={getResponsiveClass(5).marginYClass}
                            >
                                <div
                                    className={cn(
                                        "flex items-start",
                                        getResponsiveClass(10).gapClass
                                    )}
                                >
                                    <Image
                                        src={
                                            currentPlayerImage ||
                                            player?.image ||
                                            "/default-avatar.jpg"
                                        }
                                        alt={player?.name || "User"}
                                        width={24}
                                        height={24}
                                        priority={false}
                                        unoptimized={true}
                                        className={cn(
                                            "rounded-full flex-shrink-0 w-3 h-3 md:w-4 md:h-4",
                                            isCurrentPlayerImageLoading &&
                                                "animate-pulse blur-sm",
                                            getResponsiveClass(20).frameClass
                                        )}
                                    />
                                    <div
                                        className={cn(
                                            "flex-1",
                                            getResponsiveClass(10).gapClass
                                        )}
                                    >
                                        <textarea
                                            placeholder={`Reply to ${
                                                comment.author?.name ||
                                                "this comment"
                                            }...`}
                                            value={newReply}
                                            onChange={(e) =>
                                                setNewReply(e.target.value)
                                            }
                                            className={cn(
                                                "w-full rounded-lg bg-black/20 border border-white/10 text-white placeholder-white/50 focus:border-white/30 transition-colors resize-none",
                                                getResponsiveClass(15)
                                                    .paddingClass,
                                                getResponsiveClass(15).textClass
                                            )}
                                            rows={2}
                                        />

                                        {/* 대댓글 파일 업로드 토글 버튼 */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    setShowReplyFileUploader(
                                                        !showReplyFileUploader
                                                    )
                                                }
                                                className={cn(
                                                    "flex items-center gap-1 px-2 py-1 rounded border transition-all duration-200",
                                                    "text-xs md:text-sm",
                                                    showReplyFileUploader
                                                        ? "bg-white/15 border-white/25 text-white"
                                                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white"
                                                )}
                                            >
                                                <ImageIcon className="w-3 h-3 md:w-4 md:h-4" />
                                            </button>

                                            {replyFiles.length > 0 && (
                                                <span className="text-white/50 text-xs md:text-sm">
                                                    {replyFiles.length} file
                                                    {replyFiles.length > 1
                                                        ? "s"
                                                        : ""}
                                                </span>
                                            )}
                                        </div>

                                        {/* 대댓글 파일 업로더 (토글) */}
                                        <motion.div
                                            initial={false}
                                            animate={{
                                                height: showReplyFileUploader
                                                    ? "auto"
                                                    : 0,
                                                opacity: showReplyFileUploader
                                                    ? 1
                                                    : 0,
                                            }}
                                            transition={{
                                                duration: 0.2,
                                                ease: "easeInOut",
                                            }}
                                            className="overflow-hidden"
                                        >
                                            <div className="space-y-2 pt-2">
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
                                                    className="bg-black/10 border-white/10"
                                                />

                                                {/* 업로드된 파일 미리보기 */}
                                                {replyFiles.length > 0 && (
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        {replyFiles.map(
                                                            (file) => (
                                                                <div
                                                                    key={
                                                                        file.id
                                                                    }
                                                                    className="relative group rounded-lg overflow-hidden bg-black/20 border border-white/10"
                                                                >
                                                                    {file.mimeType?.startsWith(
                                                                        "image/"
                                                                    ) ? (
                                                                        <div className="aspect-square relative">
                                                                            <Image
                                                                                src={
                                                                                    file.url
                                                                                }
                                                                                alt="Reply file"
                                                                                fill
                                                                                className="object-cover"
                                                                                sizes="(max-width: 768px) 50vw, 25vw"
                                                                            />
                                                                        </div>
                                                                    ) : file.mimeType?.startsWith(
                                                                          "video/"
                                                                      ) ? (
                                                                        <div className="aspect-square relative flex items-center justify-center">
                                                                            <Video className="text-white/60 w-5 h-5 md:w-6 md:h-6" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="aspect-square relative flex items-center justify-center">
                                                                            <ImageIcon className="text-white/60 w-5 h-5 md:w-6 md:h-6" />
                                                                        </div>
                                                                    )}

                                                                    {/* 파일 제거 버튼 */}
                                                                    <button
                                                                        onClick={() =>
                                                                            removeReplyFile(
                                                                                file.id
                                                                            )
                                                                        }
                                                                        className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>

                                        <div className="flex justify-end gap-2">
                                            <Button
                                                onClick={() => {
                                                    onCancelReply();
                                                    setReplyFiles([]);
                                                }}
                                                size="sm"
                                                variant="outline"
                                                className="border-white/20 text-white/80 hover:bg-white/10 text-xs md:text-sm px-3 py-1.5"
                                                disabled={isSubmitting}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleCreateReply}
                                                size="sm"
                                                className="bg-white/15 hover:bg-white/25 text-white text-xs md:text-sm px-3 py-1.5"
                                                disabled={
                                                    isSubmitting ||
                                                    !newReply.trim()
                                                }
                                            >
                                                {isSubmitting
                                                    ? "Replying..."
                                                    : "Reply"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 대댓글들 표시 */}
            <AnimatePresence>
                {showReplies &&
                    comment.replies &&
                    comment.replies.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className={cn("space-y-1")}
                        >
                            {comment.replies.map((reply: any) => (
                                <BoardContentCommentItem
                                    key={reply.id}
                                    comment={reply}
                                    player={player}
                                    onReply={onReply}
                                    replyingTo={replyingTo}
                                    onCancelReply={onCancelReply}
                                    createBoardCommentAsync={
                                        createBoardCommentAsync
                                    }
                                    deleteBoardCommentAsync={
                                        deleteBoardCommentAsync
                                    }
                                    isSubmitting={isSubmitting}
                                    isDeletingComment={isDeletingComment}
                                    level={level + 1}
                                />
                            ))}
                        </motion.div>
                    )}
            </AnimatePresence>
        </div>
    );
});
