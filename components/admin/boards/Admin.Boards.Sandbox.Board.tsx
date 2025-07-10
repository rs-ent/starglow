/// components/admin/boards/Admin.Boards.Sandbox.Board.tsx

"use client";

import React, {
    useState,
    useMemo,
    useCallback,
    useRef,
    useEffect,
} from "react";
import {
    MessageCircle,
    Plus,
    X,
    Image as ImageIcon,
    Video,
    ArrowUpDown,
} from "lucide-react";
import Image from "next/image";

import { useBoards, useInfiniteBoardPosts } from "@/app/actions/boards/hooks";
import { cn } from "@/lib/utils/tailwind";

import FileUploader from "../../atoms/FileUploader";
import { Button } from "../../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

import type { FileData } from "../../atoms/FileUploader";
import type {
    BoardPostWithDetails,
    BoardWithPosts,
} from "@/app/actions/boards/actions";

import AdminBoardsSandboxPost from "./Admin.Boards.Sandbox.Post";
import { useToast } from "@/app/hooks/useToast";

interface AdminBoardsSandboxBoardProps {
    board: BoardWithPosts;
}

// 정렬 옵션 타입 정의
type SortOption = "popularity" | "newest" | "oldest";

export default function AdminBoardsSandboxBoard({
    board,
}: AdminBoardsSandboxBoardProps) {
    const toast = useToast();
    const [showPostEditor, setShowPostEditor] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState("");
    const [newPostContent, setNewPostContent] = useState("");
    const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

    // 파일 업로드 관련 상태
    const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
    const [showFileUploader, setShowFileUploader] = useState(false);

    // 댓글 관련 상태
    const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

    // 게시글 내용 확장/축소 상태
    const [expandedPostContent, setExpandedPostContent] = useState<Set<string>>(
        new Set()
    );

    // 정렬 상태
    const [sortBy, setSortBy] = useState<SortOption>("newest");

    // 무한 스크롤을 위한 ref
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const {
        createBoardPostAsync,
        isCreateBoardPostPending,
        createBoardReactionAsync,
        deleteBoardReactionAsync,
        deleteBoardPostAsync,
        isDeleteBoardPostPending,
    } = useBoards();

    // 무한 스크롤 쿼리
    const {
        data: infiniteData,
        isLoading: isInfiniteLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteBoardPosts({
        boardId: board.id,
        sortBy: sortBy,
    });

    // 모든 게시글을 하나의 배열로 합치기
    const allPosts = useMemo(() => {
        const data = infiniteData as any;
        if (!data?.pages) return [];
        return data.pages.flatMap((page: any) => page.posts);
    }, [infiniteData]);

    // Intersection Observer로 무한 스크롤 구현
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const target = entries[0];
                if (
                    target.isIntersecting &&
                    hasNextPage &&
                    !isFetchingNextPage
                ) {
                    fetchNextPage().catch((error) => {
                        console.error("Failed to fetch next page:", error);
                    });
                }
            },
            {
                root: null,
                rootMargin: "100px",
                threshold: 0.1,
            }
        );

        const currentRef = loadMoreRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // 정렬 옵션 레이블
    const getSortLabel = (sort: SortOption) => {
        switch (sort) {
            case "popularity":
                return "🔥 Popular";
            case "newest":
                return "🕒 Latest";
            case "oldest":
                return "📅 Oldest";
            default:
                return "Sort";
        }
    };

    const handleCreatePost = useCallback(async () => {
        if (!newPostTitle.trim() || !newPostContent.trim()) {
            toast.info("Please fill in all fields");
            return;
        }

        const title = newPostTitle.trim();
        const content = newPostContent.trim();
        const files = uploadedFiles;

        setNewPostTitle("");
        setNewPostContent("");
        setUploadedFiles([]);
        setShowPostEditor(false);

        try {
            await createBoardPostAsync({
                boardId: board.id,
                authorId: "sandbox",
                authorType: "PLAYER",
                title,
                content,
                files: files.map((f) => ({
                    id: f.id,
                    url: f.url,
                    mimeType: f.mimeType,
                    width: f.width,
                    height: f.height,
                    sizeBytes: f.sizeBytes,
                })),
            });

            toast.success("Post created successfully!");
        } catch (error) {
            console.error("Failed to create post:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to create post"
            );

            setNewPostTitle(title);
            setNewPostContent(content);
            setUploadedFiles(files);
            setShowPostEditor(true);
        }
    }, [
        newPostTitle,
        newPostContent,
        uploadedFiles,
        createBoardPostAsync,
        board.id,
        toast,
    ]);

    // 파일 업로드 핸들러
    const handleFilesSelected = useCallback((files: FileData[]) => {
        setUploadedFiles((prev) => [...prev, ...files]);
    }, []);

    // 파일 제거 핸들러
    const removeFile = useCallback((fileId: string) => {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    }, []);

    const handleReaction = useCallback(
        async (postId: string, type: "LIKE" | "RECOMMEND") => {
            try {
                const currentPost = allPosts.find(
                    (p: BoardPostWithDetails) => p.id === postId
                );
                if (!currentPost) return;

                const existingReaction = currentPost.reactions?.find(
                    (reaction: any) =>
                        reaction.playerId === "sandbox" &&
                        reaction.type === type
                );

                if (existingReaction) {
                    await deleteBoardReactionAsync({
                        playerId: "sandbox",
                        postId,
                        type,
                    });
                } else {
                    await createBoardReactionAsync({
                        playerId: "sandbox",
                        postId,
                        type,
                    });
                }
            } catch (error) {
                console.error("Failed to react:", error);
            }
        },
        [createBoardReactionAsync, deleteBoardReactionAsync, allPosts]
    );

    const handleDeletePost = useCallback(
        async (postId: string) => {
            try {
                setDeletingPostId(postId);
                await deleteBoardPostAsync(postId);
                setDeletingPostId(null);
                toast.success("Post deleted successfully!");
            } catch (error) {
                console.error("Failed to delete post:", error);
                toast.error("Failed to delete post");
                setDeletingPostId(null);
            }
        },
        [deleteBoardPostAsync, toast]
    );

    // 댓글 토글
    const toggleComments = useCallback((postId: string) => {
        setExpandedPosts((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    }, []);

    // 게시글 내용 토글
    const togglePostContent = useCallback((postId: string) => {
        setExpandedPostContent((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    }, []);

    if (isInfiniteLoading) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <div className="animate-spin rounded-full border-b-2 border-blue-600 w-8 h-8 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading board content...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5" />
                        <span>{board.name}</span>
                        {board.artist && (
                            <span className="text-sm text-gray-500">
                                by {board.artist.name}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* 정렬 드롭다운 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <ArrowUpDown className="w-4 h-4 mr-2" />
                                    {getSortLabel(sortBy)}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => setSortBy("popularity")}
                                    className={cn(
                                        "cursor-pointer",
                                        sortBy === "popularity" && "bg-gray-100"
                                    )}
                                >
                                    🔥 Popular
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setSortBy("newest")}
                                    className={cn(
                                        "cursor-pointer",
                                        sortBy === "newest" && "bg-gray-100"
                                    )}
                                >
                                    🕒 Latest
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setSortBy("oldest")}
                                    className={cn(
                                        "cursor-pointer",
                                        sortBy === "oldest" && "bg-gray-100"
                                    )}
                                >
                                    📅 Oldest
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* New Post Button */}
                        <Button
                            onClick={() => setShowPostEditor(!showPostEditor)}
                            size="sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Post
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Post Editor */}
                {showPostEditor && (
                    <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                        <input
                            type="text"
                            placeholder="Post title..."
                            value={newPostTitle}
                            onChange={(e) => setNewPostTitle(e.target.value)}
                            className="w-full p-3 border rounded-lg"
                        />
                        <textarea
                            placeholder="What's on your mind?"
                            rows={3}
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            className="w-full p-3 border rounded-lg resize-none"
                        />

                        {/* 파일 업로드 토글 */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    setShowFileUploader(!showFileUploader)
                                }
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                                    showFileUploader
                                        ? "bg-blue-50 border-blue-200 text-blue-700"
                                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                <ImageIcon className="w-4 h-4" />
                                <Video className="w-4 h-4" />
                                <span className="text-sm">Add Files</span>
                            </button>

                            {uploadedFiles.length > 0 && (
                                <span className="text-sm text-gray-600">
                                    {uploadedFiles.length} file
                                    {uploadedFiles.length > 1 ? "s" : ""}{" "}
                                    attached
                                </span>
                            )}
                        </div>

                        {/* 파일 업로더 */}
                        {showFileUploader && (
                            <div className="space-y-3">
                                <FileUploader
                                    purpose="board-post"
                                    bucket="board-posts"
                                    onFiles={handleFilesSelected}
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
                                {uploadedFiles.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {uploadedFiles.map((file) => (
                                            <div
                                                key={file.id}
                                                className="relative group rounded-lg overflow-hidden bg-gray-100 border aspect-square"
                                            >
                                                {file.mimeType?.startsWith(
                                                    "image/"
                                                ) ? (
                                                    <Image
                                                        src={file.url}
                                                        alt="Upload preview"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Video className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() =>
                                                        removeFile(file.id)
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

                        {/* 버튼들 */}
                        <div className="flex justify-end gap-2">
                            <Button
                                onClick={() => {
                                    setShowPostEditor(false);
                                    setUploadedFiles([]);
                                    setNewPostTitle("");
                                    setNewPostContent("");
                                }}
                                variant="outline"
                                size="sm"
                                disabled={isCreateBoardPostPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreatePost}
                                size="sm"
                                disabled={
                                    isCreateBoardPostPending ||
                                    !newPostTitle.trim() ||
                                    !newPostContent.trim()
                                }
                            >
                                {isCreateBoardPostPending
                                    ? "Posting..."
                                    : "Post"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Posts Feed */}
                <div className="space-y-4">
                    {allPosts.length === 0 ? (
                        <div className="text-center py-8">
                            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 text-lg">
                                No posts yet
                            </p>
                            <p className="text-gray-400 text-sm">
                                Be the first to post something!
                            </p>
                        </div>
                    ) : (
                        <>
                            {allPosts.map((post: BoardPostWithDetails) => (
                                <AdminBoardsSandboxPost
                                    key={post.id}
                                    post={post}
                                    activeBoard={board}
                                    expandedPosts={expandedPosts}
                                    expandedPostContent={expandedPostContent}
                                    deletingPostId={deletingPostId}
                                    isDeleteBoardPostPending={
                                        isDeleteBoardPostPending
                                    }
                                    onReaction={handleReaction}
                                    onDeletePost={handleDeletePost}
                                    onToggleComments={toggleComments}
                                    onTogglePostContent={togglePostContent}
                                />
                            ))}

                            {/* 무한 스크롤 로딩 */}
                            <div ref={loadMoreRef} className="py-4 text-center">
                                {isFetchingNextPage ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full border-b-2 border-blue-600 w-4 h-4"></div>
                                        <span className="text-gray-600 text-sm">
                                            Loading more posts...
                                        </span>
                                    </div>
                                ) : hasNextPage ? (
                                    <span className="text-gray-400 text-sm">
                                        Scroll to load more
                                    </span>
                                ) : allPosts.length > 5 ? (
                                    <span className="text-gray-400 text-sm">
                                        {`🎉 You've reached the end!`}
                                    </span>
                                ) : null}
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
