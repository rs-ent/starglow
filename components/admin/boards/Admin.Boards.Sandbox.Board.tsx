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

    // Sandbox 프로필 설정 상태
    const [sandboxNickname, setSandboxNickname] = useState("Admin User");
    const [sandboxImgUrl, setSandboxImgUrl] = useState("/default-avatar.jpg");
    const [isSandboxBoardArtist, setIsSandboxBoardArtist] = useState(false);

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
                authorType: "ADMIN",
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
                // Sandbox 모드 필드
                isSandbox: true,
                sandboxNickname: sandboxNickname.trim() || "Admin User",
                sandboxImgUrl: sandboxImgUrl,
                isSandboxBoardArtist: isSandboxBoardArtist,
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
        sandboxNickname,
        sandboxImgUrl,
        isSandboxBoardArtist,
    ]);

    // 파일 업로드 핸들러
    const handleFilesSelected = useCallback((files: FileData[]) => {
        setUploadedFiles((prev) => [...prev, ...files]);
    }, []);

    // 파일 제거 핸들러
    const removeFile = useCallback((fileId: string) => {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    }, []);

    // Sandbox 프로필 이미지 업로드 핸들러
    const handleSandboxImageSelected = useCallback((files: FileData[]) => {
        if (files.length > 0) {
            setSandboxImgUrl(files[0].url);
        }
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
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-slate-400">Loading board content...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
            {/* Modern Header */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl border-b border-slate-700/50 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                            <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {board.name}
                            </h2>
                            {board.artist && (
                                <p className="text-slate-400 text-sm">
                                    by {board.artist.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* 정렬 드롭다운 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 rounded-xl"
                                >
                                    <ArrowUpDown className="w-4 h-4 mr-2" />
                                    {getSortLabel(sortBy)}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="bg-slate-800 border-slate-700"
                            >
                                <DropdownMenuItem
                                    onClick={() => setSortBy("popularity")}
                                    className={cn(
                                        "cursor-pointer text-white hover:bg-slate-700",
                                        sortBy === "popularity" &&
                                            "bg-slate-700 text-purple-300"
                                    )}
                                >
                                    🔥 Popular
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setSortBy("newest")}
                                    className={cn(
                                        "cursor-pointer text-white hover:bg-slate-700",
                                        sortBy === "newest" &&
                                            "bg-slate-700 text-purple-300"
                                    )}
                                >
                                    🕒 Latest
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setSortBy("oldest")}
                                    className={cn(
                                        "cursor-pointer text-white hover:bg-slate-700",
                                        sortBy === "oldest" &&
                                            "bg-slate-700 text-purple-300"
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
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Post
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-6 p-6">
                {/* Post Editor */}
                {showPostEditor && (
                    <div className="bg-slate-700/50 backdrop-blur-xl rounded-2xl border border-slate-600/50 p-6 space-y-6">
                        {/* Sandbox Profile Settings */}
                        <div className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 backdrop-blur-xl rounded-xl border border-purple-500/30 p-4 space-y-4">
                            <h4 className="font-medium text-purple-300 flex items-center gap-2">
                                👤 Sandbox Profile
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
                                                onFiles={
                                                    handleSandboxImageSelected
                                                }
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
                                        setIsSandboxBoardArtist(
                                            e.target.checked
                                        )
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

                        <input
                            type="text"
                            placeholder="Post title..."
                            value={newPostTitle}
                            onChange={(e) => setNewPostTitle(e.target.value)}
                            className="w-full p-4 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <textarea
                            placeholder="What's on your mind?"
                            rows={4}
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            className="w-full p-4 bg-slate-800/50 border border-slate-600 rounded-xl resize-none text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />

                        {/* 파일 업로드 토글 */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() =>
                                    setShowFileUploader(!showFileUploader)
                                }
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200",
                                    showFileUploader
                                        ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-blue-500/30 text-blue-300"
                                        : "bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                                )}
                            >
                                <ImageIcon className="w-4 h-4" />
                                <Video className="w-4 h-4" />
                                <span className="text-sm">Add Files</span>
                            </button>

                            {uploadedFiles.length > 0 && (
                                <span className="text-sm text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg">
                                    {uploadedFiles.length} file
                                    {uploadedFiles.length > 1 ? "s" : ""}{" "}
                                    attached
                                </span>
                            )}
                        </div>

                        {/* 파일 업로더 */}
                        {showFileUploader && (
                            <div className="space-y-4">
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
                                    className="border-dashed border-purple-500/30 bg-slate-800/30 text-slate-300"
                                />

                                {/* 업로드된 파일 미리보기 */}
                                {uploadedFiles.length > 0 && (
                                    <div className="grid grid-cols-4 gap-3">
                                        {uploadedFiles.map((file) => (
                                            <div
                                                key={file.id}
                                                className="relative group rounded-xl overflow-hidden bg-slate-800/50 border border-slate-600/50 aspect-square"
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
                                                        <Video className="w-8 h-8 text-slate-400" />
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() =>
                                                        removeFile(file.id)
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

                        {/* 버튼들 */}
                        <div className="flex justify-end gap-3">
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
                                className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50 rounded-xl"
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
                                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl"
                            >
                                {isCreateBoardPostPending
                                    ? "Posting..."
                                    : "Post"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Posts Feed */}
                <div className="space-y-6">
                    {allPosts.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <MessageCircle className="w-10 h-10 text-blue-400" />
                            </div>
                            <h3 className="text-white text-xl font-semibold mb-2">
                                No posts yet
                            </h3>
                            <p className="text-slate-400">
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
                            <div ref={loadMoreRef} className="py-8 text-center">
                                {isFetchingNextPage ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
                                        <span className="text-slate-400 text-sm">
                                            Loading more posts...
                                        </span>
                                    </div>
                                ) : hasNextPage ? (
                                    <span className="text-slate-500 text-sm">
                                        Scroll to load more
                                    </span>
                                ) : allPosts.length > 5 ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-slate-500 text-sm">
                                            {`🎉 You've reached the end!`}
                                        </span>
                                    </div>
                                ) : null}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
