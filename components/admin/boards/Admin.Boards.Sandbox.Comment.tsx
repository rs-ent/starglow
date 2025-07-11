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

    // Sandbox 프로필 설정 상태
    const [sandboxNickname, setSandboxNickname] = useState("Admin User");
    const [sandboxImgUrl, setSandboxImgUrl] = useState("/default-avatar.jpg");
    const [isSandboxBoardArtist, setIsSandboxBoardArtist] = useState(false);

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
                authorType: "ADMIN",
                content: newComment.trim(),
                files: commentFiles.map((f) => ({
                    id: f.id,
                    url: f.url,
                    mimeType: f.mimeType,
                    width: f.width,
                    height: f.height,
                    sizeBytes: f.sizeBytes,
                })),
                // Sandbox 모드 필드
                isSandbox: true,
                sandboxNickname: sandboxNickname.trim() || "Admin User",
                sandboxImgUrl: sandboxImgUrl,
                isSandboxBoardArtist: isSandboxBoardArtist,
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
    }, [
        newComment,
        commentFiles,
        createBoardCommentAsync,
        postId,
        toast,
        sandboxNickname,
        sandboxImgUrl,
        isSandboxBoardArtist,
    ]);

    // 메인 댓글 파일 업로드 핸들러
    const handleCommentFilesSelected = useCallback((files: FileData[]) => {
        setCommentFiles((prev) => [...prev, ...files]);
    }, []);

    // 메인 댓글 파일 제거 핸들러
    const removeCommentFile = useCallback((fileId: string) => {
        setCommentFiles((prev) => prev.filter((f) => f.id !== fileId));
    }, []);

    // Sandbox 프로필 이미지 업로드 핸들러
    const handleSandboxImageSelected = useCallback((files: FileData[]) => {
        if (files.length > 0) {
            setSandboxImgUrl(files[0].url);
        }
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
        <div className="space-y-6">
            {/* 댓글 수 표시 */}
            {totalComments > 0 && (
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-slate-300">
                        {totalComments}{" "}
                        {totalComments === 1 ? "comment" : "comments"}
                    </span>
                </div>
            )}

            {/* 기존 댓글 목록 */}
            {comments.length > 0 && (
                <div className="space-y-4">
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
                            sandboxNickname={sandboxNickname}
                            sandboxImgUrl={sandboxImgUrl}
                            isSandboxBoardArtist={isSandboxBoardArtist}
                        />
                    ))}
                </div>
            )}

            {/* 새 댓글 작성 폼 */}
            <div className="border-t border-slate-700/50 pt-6 space-y-4">
                {/* Sandbox Profile Settings */}
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 backdrop-blur-xl rounded-xl border border-purple-500/30 p-4 space-y-4">
                    <h4 className="font-medium text-purple-300 flex items-center gap-2">
                        👤 Comment Profile
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Display Nickname
                            </label>
                            <input
                                type="text"
                                placeholder="Admin User"
                                value={sandboxNickname}
                                onChange={(e) =>
                                    setSandboxNickname(e.target.value)
                                }
                                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Profile Image
                            </label>
                            <div className="flex items-center gap-3">
                                <Image
                                    src={sandboxImgUrl}
                                    alt="Profile preview"
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover border-2 border-purple-500/50"
                                />
                                <div className="flex-1">
                                    <FileUploader
                                        purpose="sandbox-profile"
                                        bucket="profiles"
                                        onFiles={handleSandboxImageSelected}
                                        accept={{
                                            "image/*": [
                                                ".png",
                                                ".jpg",
                                                ".jpeg",
                                                ".gif",
                                                ".webp",
                                            ],
                                        }}
                                        maxSize={10 * 1024 * 1024}
                                        multiple={false}
                                        className="!p-3 !text-xs border-dashed border-purple-500/30 text-slate-300"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={isSandboxBoardArtist}
                            onChange={(e) =>
                                setIsSandboxBoardArtist(e.target.checked)
                            }
                            className="rounded border-slate-600 bg-slate-800/50 focus:ring-purple-500 focus:ring-2"
                        />
                        <span className="text-sm text-slate-300">
                            Show as Artist
                        </span>
                        {isSandboxBoardArtist && (
                            <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-500/30">
                                Artist
                            </span>
                        )}
                    </label>
                </div>

                <div className="flex items-start gap-4">
                    <Image
                        src={sandboxImgUrl}
                        alt={sandboxNickname}
                        width={40}
                        height={40}
                        className="rounded-full object-cover flex-shrink-0 border-2 border-slate-600"
                    />
                    <div className="flex-1 space-y-4">
                        <textarea
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="w-full p-4 bg-slate-800/50 border border-slate-600 rounded-xl resize-none text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            rows={3}
                        />

                        {/* 파일 업로드 토글 버튼 */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() =>
                                    setShowCommentFileUploader(
                                        !showCommentFileUploader
                                    )
                                }
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 text-sm",
                                    showCommentFileUploader
                                        ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-blue-500/30 text-blue-300"
                                        : "bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                                )}
                            >
                                <ImageIcon className="w-4 h-4" />
                                <Video className="w-4 h-4" />
                                <span>Add Files</span>
                            </button>

                            {commentFiles.length > 0 && (
                                <span className="text-sm text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg">
                                    {commentFiles.length} file
                                    {commentFiles.length > 1 ? "s" : ""}{" "}
                                    attached
                                </span>
                            )}
                        </div>

                        {/* 파일 업로더 */}
                        {showCommentFileUploader && (
                            <div className="space-y-4">
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
                                    className="border-dashed border-purple-500/30 bg-slate-800/30 text-slate-300"
                                />

                                {/* 업로드된 파일 미리보기 */}
                                {commentFiles.length > 0 && (
                                    <div className="grid grid-cols-4 gap-3">
                                        {commentFiles.map((file) => (
                                            <div
                                                key={file.id}
                                                className="relative group rounded-xl overflow-hidden bg-slate-800/50 border border-slate-600/50 aspect-square"
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
                                                        <Video className="w-8 h-8 text-slate-400" />
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ImageIcon className="w-8 h-8 text-slate-400" />
                                                    </div>
                                                )}

                                                {/* 파일 제거 버튼 */}
                                                <button
                                                    onClick={() =>
                                                        removeCommentFile(
                                                            file.id
                                                        )
                                                    }
                                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200"
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
                                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl"
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
