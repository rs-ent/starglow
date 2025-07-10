/// components/admin/boards/Admin.Boards.Sandbox.Comment.tsx

"use client";

import React, { useState, useCallback } from "react";
import { MessageCircle, X, Image as ImageIcon, Video } from "lucide-react";
import Image from "next/image";
import { useBoards } from "@/app/actions/boards/hooks";
import { cn } from "@/lib/utils/tailwind";
import FileUploader from "../../atoms/FileUploader";
import { Button } from "../../ui/button";
import type { FileData } from "../../atoms/FileUploader";
import AdminBoardsSandboxCommentItem from "./Admin.Boards.Sandbox.Comment.Item";
import { useToast } from "@/app/hooks/useToast";

interface AdminBoardsSandboxCommentProps {
    postId: string;
}

export default function AdminBoardsSandboxComment({
    postId,
}: AdminBoardsSandboxCommentProps) {
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

    const handleCreateComment = useCallback(async () => {
        if (!newComment.trim()) return;

        try {
            setIsSubmitting(true);

            await createBoardCommentAsync({
                postId,
                authorId: "sandbox",
                authorType: "PLAYER",
                content: newComment.trim(),
                files: commentFiles.map((f) => ({
                    id: f.id,
                    url: f.url,
                    mimeType: f.mimeType,
                    width: f.width,
                    height: f.height,
                    sizeBytes: f.sizeBytes,
                })),
            });

            setNewComment("");
            setCommentFiles([]);
            toast.success("Comment posted successfully!");
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
    }, [newComment, commentFiles, createBoardCommentAsync, postId, toast]);

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
            <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full border-b-2 border-blue-600 w-6 h-6"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 댓글 수 표시 */}
            {totalComments > 0 && (
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                        {totalComments}{" "}
                        {totalComments === 1 ? "comment" : "comments"}
                    </span>
                </div>
            )}

            {/* 기존 댓글 목록 */}
            {comments.length > 0 && (
                <div className="space-y-3">
                    {comments.map((comment: any) => (
                        <AdminBoardsSandboxCommentItem
                            key={comment.id}
                            comment={comment}
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
            <div className="border-t pt-4 space-y-3">
                <div className="flex items-start gap-3">
                    <Image
                        src={"/default-avatar.jpg"}
                        alt={"User"}
                        width={32}
                        height={32}
                        className="rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 space-y-3">
                        <textarea
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                        />

                        {/* 파일 업로드 토글 버튼 */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    setShowCommentFileUploader(
                                        !showCommentFileUploader
                                    )
                                }
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm",
                                    showCommentFileUploader
                                        ? "bg-blue-50 border-blue-200 text-blue-700"
                                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                <ImageIcon className="w-4 h-4" />
                                <Video className="w-4 h-4" />
                                <span>Add Files</span>
                            </button>

                            {commentFiles.length > 0 && (
                                <span className="text-sm text-gray-600">
                                    {commentFiles.length} file
                                    {commentFiles.length > 1 ? "s" : ""}{" "}
                                    attached
                                </span>
                            )}
                        </div>

                        {/* 파일 업로더 */}
                        {showCommentFileUploader && (
                            <div className="space-y-3">
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
                                    className="border-dashed"
                                />

                                {/* 업로드된 파일 미리보기 */}
                                {commentFiles.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {commentFiles.map((file) => (
                                            <div
                                                key={file.id}
                                                className="relative group rounded-lg overflow-hidden bg-gray-100 border aspect-square"
                                            >
                                                {file.mimeType?.startsWith(
                                                    "image/"
                                                ) ? (
                                                    <Image
                                                        src={file.url}
                                                        alt="Comment file"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : file.mimeType?.startsWith(
                                                      "video/"
                                                  ) ? (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Video className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                )}

                                                {/* 파일 제거 버튼 */}
                                                <button
                                                    onClick={() =>
                                                        removeCommentFile(
                                                            file.id
                                                        )
                                                    }
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button
                                onClick={handleCreateComment}
                                size="sm"
                                disabled={isSubmitting || !newComment.trim()}
                            >
                                {isSubmitting ? "Posting..." : "Comment"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
