/// components/boards/Board.Content.Comment.tsx

"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageCircle, X, Image as ImageIcon, Video } from "lucide-react";
import Image from "next/image";
import { useBoards } from "@/app/actions/boards/hooks";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import FileUploader from "../atoms/FileUploader";
import { Button } from "../ui/button";
import type { Player } from "@prisma/client";
import type { FileData } from "../atoms/FileUploader";
import { usePlayerGet } from "@/app/hooks/usePlayer";
import BoardContentCommentItem from "./Board.Content.Comment.Item";
import { useToast } from "@/app/hooks/useToast";
interface BoardContentCommentProps {
    postId: string;
    player: Player | null;
    artistId: string;
    artistName: string;
    artistLogoUrl: string;
    backgroundColors: string[];
    foregroundColors: string[];
}

export default function BoardContentComment({
    postId,
    player,
    artistId,
    artistName,
    artistLogoUrl,
    backgroundColors,
    foregroundColors,
}: BoardContentCommentProps) {
    const toast = useToast();
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    // 메인 댓글 파일 업로드 상태
    const [commentFiles, setCommentFiles] = useState<FileData[]>([]);
    const [showCommentFileUploader, setShowCommentFileUploader] =
        useState(false);

    const {
        boardCommentsData,
        isBoardCommentsLoading,
        createBoardCommentAsync,
        deleteBoardCommentAsync,
        isDeleteBoardCommentPending,
    } = useBoards({
        getBoardCommentsPostId: postId,
    });

    const { playerProfile } = usePlayerGet({
        getPlayerProfileInput: {
            playerId: player?.id || "",
        },
    });

    const handleCreateComment = useCallback(async () => {
        if (!player || !newComment.trim()) return;

        try {
            setIsSubmitting(true);

            await createBoardCommentAsync({
                postId,
                authorId: player.id,
                authorType: "PLAYER",
                content: newComment.trim(),
                // 업로드된 파일 정보 전송
                files: commentFiles.map((f) => ({
                    id: f.id,
                    url: f.url,
                    mimeType: f.mimeType,
                    width: f.width,
                    height: f.height,
                    sizeBytes: f.sizeBytes,
                })),
                // parentId는 없음 (최상위 댓글)
            });

            setNewComment("");
            setCommentFiles([]);
        } catch (error) {
            console.error("Failed to create comment:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to create comment"
            );
        } finally {
            setIsSubmitting(false);
        }
    }, [
        player,
        newComment,
        commentFiles,
        createBoardCommentAsync,
        postId,
        toast,
    ]);

    // 메인 댓글 파일 업로드 핸들러
    const handleCommentFilesSelected = useCallback((files: FileData[]) => {
        setCommentFiles((prev) => [...prev, ...files]);
    }, []);

    // 메인 댓글 파일 제거 핸들러
    const removeCommentFile = useCallback((fileId: string) => {
        setCommentFiles((prev) => prev.filter((f) => f.id !== fileId));
    }, []);

    const handleReply = useCallback((commentId: string) => {
        setReplyingTo(commentId);
    }, []);

    const handleCancelReply = useCallback(() => {
        setReplyingTo(null);
    }, []);

    const comments = boardCommentsData || [];
    const totalComments = comments.reduce((sum: number, comment: any) => {
        return sum + 1 + (comment.replies?.length || 0);
    }, 0);

    if (isBoardCommentsLoading) {
        return (
            <div
                className={cn(
                    "flex justify-center",
                    getResponsiveClass(20).paddingClass
                )}
            >
                <div
                    className={cn(
                        "animate-spin rounded-full border-b-2 border-white/50",
                        getResponsiveClass(25).frameClass
                    )}
                ></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "border-t border-white/10",
                getResponsiveClass(20).marginYClass,
                getResponsiveClass(20).paddingClass
            )}
        >
            {/* 댓글 수 표시 */}
            {totalComments > 0 && (
                <div
                    className={cn(
                        "flex items-center",
                        getResponsiveClass(10).gapClass,
                        getResponsiveClass(15).marginYClass
                    )}
                >
                    <MessageCircle
                        className={cn(
                            "text-white/60",
                            getResponsiveClass(20).frameClass
                        )}
                    />
                    <span
                        className={cn(
                            "text-white/60",
                            getResponsiveClass(15).textClass
                        )}
                    >
                        {totalComments}{" "}
                        {totalComments === 1 ? "comment" : "comments"}
                    </span>
                </div>
            )}

            {/* 기존 댓글 목록 */}
            {comments.length > 0 && (
                <div
                    className={cn(
                        "space-y-2",
                        getResponsiveClass(15).gapClass,
                        getResponsiveClass(20).marginYClass
                    )}
                >
                    {comments.map((comment: any) => (
                        <BoardContentCommentItem
                            key={comment.id}
                            artistId={artistId}
                            artistName={artistName}
                            artistLogoUrl={artistLogoUrl}
                            backgroundColors={backgroundColors}
                            foregroundColors={foregroundColors}
                            comment={comment}
                            player={player}
                            onReply={handleReply}
                            replyingTo={replyingTo}
                            onCancelReply={handleCancelReply}
                            createBoardCommentAsync={createBoardCommentAsync}
                            deleteBoardCommentAsync={deleteBoardCommentAsync}
                            isSubmitting={isSubmitting}
                            isDeletingComment={isDeleteBoardCommentPending}
                            level={0}
                        />
                    ))}
                </div>
            )}

            {/* 새 댓글 작성 폼 */}
            {player ? (
                <div
                    className={cn(
                        "flex items-start",
                        getResponsiveClass(15).gapClass
                    )}
                >
                    <Image
                        src={
                            playerProfile?.image ||
                            player?.image ||
                            "/default-avatar.jpg"
                        }
                        alt={playerProfile?.name || player?.name || "User"}
                        width={25}
                        height={25}
                        priority={false}
                        unoptimized={true}
                        className={cn(
                            "rounded-full flex-shrink-0 object-cover",
                            getResponsiveClass(30).frameClass
                        )}
                    />
                    <div
                        className={cn(
                            "flex-1",
                            getResponsiveClass(10).gapClass
                        )}
                    >
                        <textarea
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className={cn(
                                "w-full rounded-lg bg-black/20 border border-white/10 text-white placeholder-white/50 focus:border-white/30 transition-colors resize-none",
                                getResponsiveClass(20).paddingClass,
                                getResponsiveClass(15).textClass
                            )}
                            rows={3}
                        />

                        {/* 메인 댓글 파일 업로드 토글 버튼 */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    setShowCommentFileUploader(
                                        !showCommentFileUploader
                                    )
                                }
                                className={cn(
                                    "flex items-center rounded-lg border transition-all duration-200",
                                    getResponsiveClass(5).gapClass,
                                    getResponsiveClass(15).paddingClass,
                                    getResponsiveClass(10).textClass,
                                    showCommentFileUploader
                                        ? "bg-white/20 border-white/30 text-white"
                                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white"
                                )}
                            >
                                <ImageIcon
                                    className={
                                        getResponsiveClass(15).frameClass
                                    }
                                />
                                <span className="hidden sm:inline">/</span>
                                <Video
                                    className={
                                        getResponsiveClass(15).frameClass
                                    }
                                />
                            </button>

                            {commentFiles.length > 0 && (
                                <span
                                    className={cn(
                                        "text-white/60",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    {commentFiles.length} file
                                    {commentFiles.length > 1 ? "s" : ""}{" "}
                                    attached
                                </span>
                            )}
                        </div>

                        {/* 메인 댓글 파일 업로더 (토글) */}
                        <motion.div
                            initial={false}
                            animate={{
                                height: showCommentFileUploader ? "auto" : 0,
                                opacity: showCommentFileUploader ? 1 : 0,
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-2 md:space-y-3 pt-2 md:pt-3">
                                <FileUploader
                                    purpose="board-comment"
                                    bucket="board-comments"
                                    onFiles={handleCommentFilesSelected}
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
                                {commentFiles.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                                        {commentFiles.map((file) => (
                                            <div
                                                key={file.id}
                                                className="relative group rounded-lg overflow-hidden bg-black/20 border border-white/10"
                                            >
                                                {file.mimeType?.startsWith(
                                                    "image/"
                                                ) ? (
                                                    <div className="aspect-square relative">
                                                        <Image
                                                            src={file.url}
                                                            alt="Comment file"
                                                            fill
                                                            className="object-cover"
                                                            sizes="(max-width: 768px) 50vw, 25vw"
                                                        />
                                                    </div>
                                                ) : file.mimeType?.startsWith(
                                                      "video/"
                                                  ) ? (
                                                    <div className="aspect-square relative flex items-center justify-center">
                                                        <Video className="text-white/60 w-6 h-6 md:w-8 md:h-8" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                            <span className="text-white/80 text-xs">
                                                                Video
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="aspect-square relative flex items-center justify-center">
                                                        <ImageIcon className="text-white/60 w-6 h-6 md:w-8 md:h-8" />
                                                    </div>
                                                )}

                                                {/* 파일 제거 버튼 */}
                                                <button
                                                    onClick={() =>
                                                        removeCommentFile(
                                                            file.id
                                                        )
                                                    }
                                                    className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <div className="flex justify-end">
                            <Button
                                onClick={handleCreateComment}
                                size="sm"
                                className="bg-white/15 hover:bg-white/25 text-white text-sm px-4 md:px-6 py-2"
                                disabled={isSubmitting || !newComment.trim()}
                            >
                                {isSubmitting ? "Posting..." : "Comment"}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <p
                    className={cn(
                        "text-white/50 text-center",
                        getResponsiveClass(15).textClass,
                        getResponsiveClass(25).paddingClass
                    )}
                >
                    Login to write a comment
                </p>
            )}
        </motion.div>
    );
}
