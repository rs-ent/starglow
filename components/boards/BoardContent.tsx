/// components/boards/BoardContent.tsx

"use client";

import React, {
    useState,
    useMemo,
    useCallback,
    useRef,
    useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageCircle,
    Plus,
    Heart,
    MessageSquare,
    TrendingUp,
    MoreHorizontal,
    Trash2,
    X,
    Image as ImageIcon,
    Video,
    ChevronDown,
    ChevronUp,
    ArrowUpDown,
} from "lucide-react";
import Image from "next/image";
import { formatTimeAgo } from "@/lib/utils/format";

import { useBoards, useInfiniteBoardPosts } from "@/app/actions/boards/hooks";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import PartialLoading from "../atoms/PartialLoading";
import FileUploader from "../atoms/FileUploader";
import { Button } from "../ui/button";
import BoardRewardsTutorialModal from "./BoardRewardsTutorialModal";
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

import type { ArtistWithSPG } from "@/app/actions/artists";
import type { Player } from "@prisma/client";
import type { FileData } from "../atoms/FileUploader";
import type { BoardPostWithDetails } from "@/app/actions/boards/actions";

import PostComments from "./PostComments";
import { ShinyButton } from "../magicui/shiny-button";

interface BoardContentProps {
    artist: ArtistWithSPG;
    player: Player | null;
}

// 정렬 옵션 타입 정의
type SortOption = "popularity" | "newest" | "oldest";

export default React.memo(function BoardContent({
    artist,
    player,
}: BoardContentProps) {
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

    // 튜토리얼 모달 상태
    const [showRewardsTutorial, setShowRewardsTutorial] = useState(false);

    // 무한 스크롤을 위한 ref
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const {
        boardsData,
        isBoardsLoading,
        createBoardPostAsync,
        isCreateBoardPostPending,
        createBoardReactionAsync,
        deleteBoardReactionAsync,
        deleteBoardPostAsync,
        isDeleteBoardPostPending,
    } = useBoards({
        getBoardsInput: {
            artistId: artist.id,
            isPublic: true,
            isActive: true,
        },
    });

    // 첫 번째 게시판 조회
    const activeBoard = boardsData?.boards?.[0];

    // 무한 스크롤 쿼리
    const {
        data: infiniteData,
        isLoading: isInfiniteLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteBoardPosts(
        activeBoard
            ? {
                  boardId: activeBoard.id,
              }
            : undefined
    );

    // 모든 게시글을 하나의 배열로 합치기
    const allPosts = useMemo(() => {
        const data = infiniteData as any;
        if (!data?.pages) return [];
        return data.pages.flatMap((page: any) => page.posts);
    }, [infiniteData]);

    // 정렬된 게시글
    const sortedPosts = useMemo(() => {
        switch (sortBy) {
            case "popularity":
                return [...allPosts].sort((a, b) => {
                    const scoreA =
                        a.likeCount + a.recommendCount + a.commentCount;
                    const scoreB =
                        b.likeCount + b.recommendCount + b.commentCount;
                    return scoreB - scoreA;
                });
            case "newest":
                return [...allPosts].sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                );
            case "oldest":
                return [...allPosts].sort(
                    (a, b) =>
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime()
                );
            default:
                return allPosts;
        }
    }, [allPosts, sortBy]);

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
                rootMargin: "100px", // 100px 전에 미리 로딩
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
        if (
            !newPostTitle.trim() ||
            !newPostContent.trim() ||
            !activeBoard ||
            !player
        ) {
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
                boardId: activeBoard.id,
                authorId: player.id,
                authorType: player.isArtist ? "ARTIST" : "PLAYER",
                title,
                content,
                // 업로드된 파일 정보 전송
                files: files.map((f) => ({
                    id: f.id,
                    url: f.url,
                    mimeType: f.mimeType,
                    width: f.width,
                    height: f.height,
                    sizeBytes: f.sizeBytes,
                })),
            });
        } catch (error) {
            console.error("Failed to create post:", error);

            setNewPostTitle(title);
            setNewPostContent(content);
            setUploadedFiles(files);
            setShowPostEditor(true);
        }
    }, [
        newPostTitle,
        newPostContent,
        uploadedFiles,
        activeBoard,
        player,
        createBoardPostAsync,
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
            if (!player) return;

            try {
                const currentPost = sortedPosts.find(
                    (p: BoardPostWithDetails) => p.id === postId
                );
                if (!currentPost) return;

                const existingReaction = currentPost.reactions?.find(
                    (reaction: any) =>
                        reaction.playerId === player.id &&
                        reaction.type === type
                );

                if (existingReaction) {
                    await deleteBoardReactionAsync({
                        playerId: player.id,
                        postId,
                        type,
                    });
                } else {
                    await createBoardReactionAsync({
                        playerId: player.id,
                        postId,
                        type,
                    });
                }
            } catch (error) {
                console.error("Failed to react:", error);
            }
        },
        [
            player,
            createBoardReactionAsync,
            deleteBoardReactionAsync,
            sortedPosts,
        ]
    );

    const handleDeletePost = useCallback(
        async (postId: string) => {
            if (!player) return;

            try {
                setDeletingPostId(postId);
                await deleteBoardPostAsync(postId);
                setDeletingPostId(null);
            } catch (error) {
                console.error("Failed to delete post:", error);
                setDeletingPostId(null);
            }
        },
        [player, deleteBoardPostAsync]
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

    // 게시글 내용 토글 함수 추가
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

    if (isBoardsLoading || isInfiniteLoading) {
        return (
            <div
                className={cn(
                    "w-full flex justify-center items-center",
                    getResponsiveClass(40).paddingClass
                )}
            >
                <PartialLoading text="Loading community..." />
            </div>
        );
    }

    if (boardsData?.boards.length === 0) {
        return (
            <div
                className={cn(
                    "text-center",
                    getResponsiveClass(40).paddingClass
                )}
            >
                <MessageCircle
                    className={cn(
                        "mx-auto text-white/40",
                        getResponsiveClass(60).frameClass,
                        getResponsiveClass(15).marginYClass
                    )}
                />
                <p
                    className={cn(
                        "text-white/60",
                        getResponsiveClass(18).textClass
                    )}
                >
                    Community board coming soon!
                </p>
                <p
                    className={cn(
                        "text-white/40",
                        getResponsiveClass(14).textClass,
                        getResponsiveClass(5).marginYClass
                    )}
                >
                    Amazing conversations await!
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            {/* 스크롤 가능한 컨테이너 */}
            <div
                className={cn(
                    "max-h-[600px] md:max-h-[700px] lg:max-h-[800px]",
                    "overflow-y-auto overflow-x-hidden",
                    "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30",
                    "scroll-smooth"
                )}
            >
                <div className="w-full space-y-2">
                    <div className="flex flex-col">
                        {/* Header Section */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className={cn(
                                "backdrop-blur-xl sticky top-0 z-10",
                                "border-b border-white/10 md:border-b-0",
                                "flex flex-col justify-between md:flex-row",
                                "pb-[10px]",
                                getResponsiveClass(20).gapClass
                            )}
                        >
                            <div
                                className={cn(
                                    "flex items-center",
                                    getResponsiveClass(25).marginYClass,
                                    getResponsiveClass(15).gapClass
                                )}
                            >
                                <div className="rounded-xl bg-gradient-to-r from-white/20 to-white/30 p-3">
                                    <MessageCircle
                                        className={cn(
                                            "text-white",
                                            getResponsiveClass(30).frameClass
                                        )}
                                    />
                                </div>
                                <h2
                                    className={cn(
                                        "font-bold text-white truncate",
                                        getResponsiveClass(30).textClass
                                    )}
                                >
                                    {activeBoard?.name || "Community Board"}
                                </h2>
                            </div>

                            {/* Controls Section */}
                            <div
                                className={cn(
                                    "flex items-center justify-between md:justify-end",
                                    getResponsiveClass(10).gapClass
                                )}
                            >
                                {/* 정렬 드롭다운 - 모바일에서 더 컴팩트 */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20",
                                                getResponsiveClass(10)
                                                    .textClass,
                                                getResponsiveClass(15)
                                                    .paddingClass
                                            )}
                                        >
                                            <ArrowUpDown
                                                className={cn(
                                                    getResponsiveClass(15)
                                                        .frameClass,
                                                    getResponsiveClass(5)
                                                        .marginXClass
                                                )}
                                            />
                                            <span className="hidden sm:inline">
                                                {getSortLabel(sortBy)}
                                            </span>
                                            <span
                                                className={cn(
                                                    "sm:hidden",
                                                    getResponsiveClass(20)
                                                        .textClass
                                                )}
                                            >
                                                {sortBy === "popularity"
                                                    ? "🔥"
                                                    : sortBy === "newest"
                                                    ? "🕒"
                                                    : "📅"}
                                            </span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="bg-gray-900 border-gray-700"
                                    >
                                        <DropdownMenuItem
                                            onClick={() =>
                                                setSortBy("popularity")
                                            }
                                            className={cn(
                                                "cursor-pointer text-sm",
                                                sortBy === "popularity" &&
                                                    "bg-white/10"
                                            )}
                                        >
                                            🔥 Popular
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setSortBy("newest")}
                                            className={cn(
                                                "cursor-pointer text-sm",
                                                sortBy === "newest" &&
                                                    "bg-white/10"
                                            )}
                                        >
                                            🕒 Latest
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setSortBy("oldest")}
                                            className={cn(
                                                "cursor-pointer text-sm",
                                                sortBy === "oldest" &&
                                                    "bg-white/10"
                                            )}
                                        >
                                            📅 Oldest
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* New Post Button - 모바일에서 더 컴팩트 */}
                                {player ? (
                                    <Button
                                        onClick={() =>
                                            setShowPostEditor(!showPostEditor)
                                        }
                                        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                                        size="sm"
                                    >
                                        <Plus
                                            className={cn(
                                                getResponsiveClass(15)
                                                    .frameClass,
                                                "md:mr-2"
                                            )}
                                        />
                                        <span
                                            className={cn(
                                                "hidden md:inline",
                                                getResponsiveClass(10).textClass
                                            )}
                                        >
                                            New Post
                                        </span>
                                    </Button>
                                ) : (
                                    <Button
                                        disabled
                                        className="bg-white/5 border border-white/10 text-white/50 cursor-not-allowed"
                                        size="sm"
                                    >
                                        <Plus
                                            className={cn(
                                                getResponsiveClass(15)
                                                    .frameClass,
                                                "md:mr-2"
                                            )}
                                        />
                                        <span
                                            className={cn(
                                                "hidden md:inline",
                                                getResponsiveClass(10).textClass
                                            )}
                                        >
                                            Login to Post
                                        </span>
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                        {/* Post Editor */}
                        {showPostEditor && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                transition={{ delay: 0.2 }}
                                className={cn(
                                    "rounded-lg md:rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/15",
                                    "mt-1 md:mt-3 p-3 md:p-5"
                                )}
                            >
                                <div className="space-y-3 md:space-y-4">
                                    <input
                                        type="text"
                                        placeholder="What's your post title?"
                                        value={newPostTitle}
                                        onChange={(e) =>
                                            setNewPostTitle(e.target.value)
                                        }
                                        className={cn(
                                            "w-full rounded-lg bg-black/20 border border-white/10 text-white placeholder-white/50 focus:border-white/30 transition-colors",
                                            "p-3 md:p-4 text-sm md:text-base"
                                        )}
                                    />
                                    <textarea
                                        placeholder={`Share your thoughts with ${artist.name} fans...`}
                                        rows={3}
                                        value={newPostContent}
                                        onChange={(e) =>
                                            setNewPostContent(e.target.value)
                                        }
                                        className={cn(
                                            "w-full rounded-lg bg-black/20 border border-white/10 text-white placeholder-white/50 focus:border-white/30 transition-colors resize-none",
                                            "p-3 md:p-4 text-sm md:text-base"
                                        )}
                                    />

                                    {/* 파일 업로드 토글 버튼 */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                setShowFileUploader(
                                                    !showFileUploader
                                                )
                                            }
                                            className={cn(
                                                "flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg border transition-all duration-200",
                                                "text-xs md:text-sm",
                                                showFileUploader
                                                    ? "bg-white/20 border-white/30 text-white"
                                                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white"
                                            )}
                                        >
                                            <ImageIcon className="w-3 h-3 md:w-4 md:h-4" />
                                            <span className="hidden sm:inline">
                                                /
                                            </span>
                                            <Video className="w-3 h-3 md:w-4 md:h-4" />
                                        </button>

                                        {uploadedFiles.length > 0 && (
                                            <span className="text-white/60 text-xs md:text-sm">
                                                {uploadedFiles.length} file
                                                {uploadedFiles.length > 1
                                                    ? "s"
                                                    : ""}
                                            </span>
                                        )}
                                    </div>

                                    {/* 파일 업로더 (토글) */}
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            height: showFileUploader
                                                ? "auto"
                                                : 0,
                                            opacity: showFileUploader ? 1 : 0,
                                        }}
                                        transition={{
                                            duration: 0.3,
                                            ease: "easeInOut",
                                        }}
                                        className="overflow-hidden"
                                    >
                                        <div className="space-y-2 md:space-y-3 pt-2 md:pt-3">
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
                                                className="bg-black/10 border-white/10"
                                            />

                                            {/* 업로드된 파일 미리보기 */}
                                            {uploadedFiles.length > 0 && (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                                                    {uploadedFiles.map(
                                                        (file) => (
                                                            <div
                                                                key={file.id}
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
                                                                            alt="Uploaded file"
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
                                                                        removeFile(
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

                                    {/* 버튼 영역 */}
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                        <div className="flex items-center text-white/60 gap-2 text-xs md:text-sm">
                                            <span>
                                                💰 Earn tokens for posting!
                                            </span>
                                            {activeBoard?.postCreationRewardEnabled && (
                                                <span className="text-green-400">
                                                    +
                                                    {
                                                        activeBoard.postCreationRewardAmount
                                                    }{" "}
                                                    SGP
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => {
                                                    setShowPostEditor(false);
                                                    setUploadedFiles([]);
                                                }}
                                                variant="outline"
                                                size="sm"
                                                className="bg-transparentborder-white/20 text-white/80 hover:bg-white/10 text-sm flex-1 sm:flex-none"
                                                disabled={
                                                    isCreateBoardPostPending
                                                }
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleCreatePost}
                                                size="sm"
                                                variant="outline"
                                                className="bg-white/15 hover:bg-white/25 text-white text-sm flex-1 sm:flex-none"
                                                disabled={
                                                    isCreateBoardPostPending ||
                                                    !newPostTitle.trim() ||
                                                    !newPostContent.trim() ||
                                                    !player
                                                }
                                            >
                                                {isCreateBoardPostPending
                                                    ? "Posting..."
                                                    : "Post & Earn"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className={cn("flex flex-col")}>
                        {/* Posts Feed */}
                        <div className="space-y-3 md:space-y-4">
                            {sortedPosts.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-center py-8 md:py-12"
                                >
                                    <MessageCircle className="mx-auto text-white/40 w-12 h-12 md:w-16 md:h-16 mb-4 md:mb-6" />
                                    <p className="text-white/60 text-base md:text-xl">
                                        Be the first to start the conversation!
                                    </p>
                                    <p className="text-white/40 text-sm md:text-base mt-2 md:mt-3">
                                        Share your thoughts and earn{" "}
                                        {artist.name} tokens
                                    </p>
                                    {!player && (
                                        <p className="text-white/30 text-xs md:text-sm mt-4 md:mt-6">
                                            Login to join the community and earn
                                            rewards
                                        </p>
                                    )}
                                </motion.div>
                            ) : (
                                <>
                                    {sortedPosts.map(
                                        (
                                            post: BoardPostWithDetails,
                                            index: number
                                        ) => (
                                            <motion.div
                                                key={post.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    delay: 0.4 + index * 0.1,
                                                }}
                                                className={cn(
                                                    "rounded-lg md:rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 hover:border-white/20 transition-colors group",
                                                    "p-3 md:p-5"
                                                )}
                                            >
                                                <div className="flex items-start gap-3 md:gap-4">
                                                    <Image
                                                        src={
                                                            post.author
                                                                ?.image || ""
                                                        }
                                                        alt={
                                                            post.author?.name ||
                                                            ""
                                                        }
                                                        width={32}
                                                        height={32}
                                                        priority={false}
                                                        unoptimized={true}
                                                        className="rounded-full flex-shrink-0 w-8 h-8 md:w-10 md:h-10"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        {/* Author info */}
                                                        <div className="flex items-center justify-between mb-2 md:mb-3">
                                                            <div className="flex items-center gap-1 md:gap-2 min-w-0 flex-1">
                                                                {post.authorType ===
                                                                    "ARTIST" ||
                                                                    (post.author
                                                                        ?.isArtist && (
                                                                        <span
                                                                            className={cn(
                                                                                "flex flex-row items-center gap-1 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30 text-yellow-200 rounded-full px-2 py-0.5 flex-shrink-0 font-medium",
                                                                                getResponsiveClass(
                                                                                    15
                                                                                )
                                                                                    .textClass
                                                                            )}
                                                                        >
                                                                            <Image
                                                                                src={
                                                                                    artist.logoUrl ||
                                                                                    ""
                                                                                }
                                                                                alt={
                                                                                    artist.name
                                                                                }
                                                                                width={
                                                                                    20
                                                                                }
                                                                                height={
                                                                                    20
                                                                                }
                                                                                className={cn(
                                                                                    "object-contain",
                                                                                    getResponsiveClass(
                                                                                        15
                                                                                    )
                                                                                        .frameClass
                                                                                )}
                                                                            />
                                                                            {post
                                                                                .author
                                                                                ?.artistId ===
                                                                            artist.id
                                                                                ? artist.name
                                                                                : "Artist"}
                                                                        </span>
                                                                    ))}
                                                                <span
                                                                    className={cn(
                                                                        "font-medium text-white/90 truncate",
                                                                        post
                                                                            .author
                                                                            ?.artistId ===
                                                                            artist.id
                                                                            ? "text-yellow-200 font-bold"
                                                                            : "text-white/90",
                                                                        getResponsiveClass(
                                                                            15
                                                                        )
                                                                            .textClass
                                                                    )}
                                                                >
                                                                    {post.author
                                                                        ?.name ||
                                                                        "Fan"}
                                                                </span>
                                                                <span
                                                                    className={cn(
                                                                        "text-white/50 flex-shrink-0",
                                                                        getResponsiveClass(
                                                                            10
                                                                        )
                                                                            .textClass
                                                                    )}
                                                                >
                                                                    {formatTimeAgo(
                                                                        post.createdAt,
                                                                        true
                                                                    )}
                                                                </span>
                                                            </div>

                                                            {/* 작성자만 삭제 가능 */}
                                                            {player &&
                                                                post.author
                                                                    ?.id ===
                                                                    player.id && (
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="p-1 text-white/60 hover:text-white/80 hover:bg-white/10 flex-shrink-0"
                                                                            >
                                                                                <MoreHorizontal className="w-4 h-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent
                                                                            align="end"
                                                                            className="bg-gray-900 border-gray-700"
                                                                        >
                                                                            <AlertDialog>
                                                                                <AlertDialogTrigger
                                                                                    asChild
                                                                                >
                                                                                    <DropdownMenuItem
                                                                                        onSelect={(
                                                                                            e
                                                                                        ) =>
                                                                                            e.preventDefault()
                                                                                        }
                                                                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer"
                                                                                    >
                                                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                                                        Delete
                                                                                        Post
                                                                                    </DropdownMenuItem>
                                                                                </AlertDialogTrigger>
                                                                                <AlertDialogContent className="bg-gray-900 border-gray-700">
                                                                                    <AlertDialogHeader>
                                                                                        <AlertDialogTitle className="text-white">
                                                                                            Delete
                                                                                            Post
                                                                                        </AlertDialogTitle>
                                                                                        <AlertDialogDescription className="text-white/70">
                                                                                            Are
                                                                                            you
                                                                                            sure
                                                                                            you
                                                                                            want
                                                                                            to
                                                                                            delete
                                                                                            this
                                                                                            post?
                                                                                            This
                                                                                            action
                                                                                            cannot
                                                                                            be
                                                                                            undone.
                                                                                        </AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                                                                                            Cancel
                                                                                        </AlertDialogCancel>
                                                                                        <AlertDialogAction
                                                                                            onClick={() =>
                                                                                                handleDeletePost(
                                                                                                    post.id
                                                                                                )
                                                                                            }
                                                                                            disabled={
                                                                                                deletingPostId ===
                                                                                                    post.id ||
                                                                                                isDeleteBoardPostPending
                                                                                            }
                                                                                            className="bg-red-600 hover:bg-red-700 text-white"
                                                                                        >
                                                                                            {deletingPostId ===
                                                                                            post.id
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

                                                        {/* 제목과 확장 버튼 */}
                                                        <div
                                                            className="flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-lg transition-colors p-2 md:p-3 -m-2 md:-m-3 mb-2 md:mb-3"
                                                            onClick={() =>
                                                                togglePostContent(
                                                                    post.id
                                                                )
                                                            }
                                                        >
                                                            <h3 className="font-medium text-white flex-1 text-sm md:text-lg">
                                                                {post.title}
                                                            </h3>
                                                            <button className="ml-2 text-white/60 hover:text-white/80 transition-colors">
                                                                {expandedPostContent.has(
                                                                    post.id
                                                                ) ? (
                                                                    <ChevronUp className="w-4 h-4 md:w-5 md:h-5" />
                                                                ) : (
                                                                    <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
                                                                )}
                                                            </button>
                                                        </div>

                                                        {/* 확장 가능한 내용 */}
                                                        <AnimatePresence>
                                                            {expandedPostContent.has(
                                                                post.id
                                                            ) && (
                                                                <motion.div
                                                                    initial={{
                                                                        opacity: 0,
                                                                        height: 0,
                                                                    }}
                                                                    animate={{
                                                                        opacity: 1,
                                                                        height: "auto",
                                                                    }}
                                                                    exit={{
                                                                        opacity: 0,
                                                                        height: 0,
                                                                    }}
                                                                    transition={{
                                                                        duration: 0.3,
                                                                        ease: "easeInOut",
                                                                    }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="space-y-3 md:space-y-4 mb-3 md:mb-4">
                                                                        <p className="text-white/80 leading-relaxed text-sm md:text-base">
                                                                            {
                                                                                post.content
                                                                            }
                                                                        </p>

                                                                        {/* 첨부된 파일들 표시 */}
                                                                        {post.files &&
                                                                            post
                                                                                .files
                                                                                .length >
                                                                                0 && (
                                                                                <div
                                                                                    className={cn(
                                                                                        "grid gap-2 md:gap-3",
                                                                                        post
                                                                                            .files
                                                                                            .length ===
                                                                                            1
                                                                                            ? "grid-cols-1"
                                                                                            : "grid-cols-2"
                                                                                    )}
                                                                                >
                                                                                    {(
                                                                                        post.files as any[]
                                                                                    ).map(
                                                                                        (
                                                                                            file,
                                                                                            index
                                                                                        ) => (
                                                                                            <div
                                                                                                key={
                                                                                                    file.id ||
                                                                                                    index
                                                                                                }
                                                                                                className="relative group rounded-lg overflow-hidden bg-black/10 border border-white/10"
                                                                                            >
                                                                                                {file.mimeType?.startsWith(
                                                                                                    "image/"
                                                                                                ) ? (
                                                                                                    <div className="aspect-video relative">
                                                                                                        <Image
                                                                                                            src={
                                                                                                                file.url
                                                                                                            }
                                                                                                            alt="Post attachment"
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
                                                                                                ) : file.mimeType?.startsWith(
                                                                                                      "video/"
                                                                                                  ) ? (
                                                                                                    <div className="aspect-video relative">
                                                                                                        <video
                                                                                                            src={
                                                                                                                file.url
                                                                                                            }
                                                                                                            controls
                                                                                                            className="w-full h-full object-cover rounded"
                                                                                                            preload="metadata"
                                                                                                        />
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <div className="aspect-video relative flex items-center justify-center">
                                                                                                        <ImageIcon className="text-white/60 w-8 h-8 md:w-10 md:h-10" />
                                                                                                        <div className="absolute bottom-1 left-1 right-1">
                                                                                                            <p className="text-white/80 text-xs truncate">
                                                                                                                {file.url
                                                                                                                    .split(
                                                                                                                        "/"
                                                                                                                    )
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
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>

                                                        {/* 반응 버튼들 */}
                                                        <div className="flex items-center text-white/60 gap-4 md:gap-6 text-sm md:text-base">
                                                            <button
                                                                onClick={() =>
                                                                    handleReaction(
                                                                        post.id,
                                                                        "LIKE"
                                                                    )
                                                                }
                                                                className="flex items-center gap-1 hover:text-white/80 transition-colors disabled:opacity-50"
                                                                disabled={
                                                                    !player
                                                                }
                                                            >
                                                                <Heart
                                                                    className={cn(
                                                                        "w-4 h-4 md:w-5 md:h-5",
                                                                        player &&
                                                                            post.reactions?.find(
                                                                                (
                                                                                    reaction: any
                                                                                ) =>
                                                                                    reaction.playerId ===
                                                                                        player.id &&
                                                                                    reaction.type ===
                                                                                        "LIKE"
                                                                            )
                                                                            ? "text-red-500 fill-red-500"
                                                                            : "text-white/60"
                                                                    )}
                                                                />
                                                                <span className="text-xs md:text-sm">
                                                                    {
                                                                        post.likeCount
                                                                    }
                                                                </span>
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleReaction(
                                                                        post.id,
                                                                        "RECOMMEND"
                                                                    )
                                                                }
                                                                className="flex items-center gap-1 hover:text-white/80 transition-colors disabled:opacity-50"
                                                                disabled={
                                                                    !player
                                                                }
                                                            >
                                                                <TrendingUp
                                                                    className={cn(
                                                                        "w-4 h-4 md:w-5 md:h-5",
                                                                        player &&
                                                                            post.reactions?.find(
                                                                                (
                                                                                    reaction: any
                                                                                ) =>
                                                                                    reaction.playerId ===
                                                                                        player.id &&
                                                                                    reaction.type ===
                                                                                        "RECOMMEND"
                                                                            )
                                                                            ? "text-blue-500 fill-blue-500"
                                                                            : "text-white/60"
                                                                    )}
                                                                />
                                                                <span className="text-xs md:text-sm">
                                                                    {
                                                                        post.recommendCount
                                                                    }
                                                                </span>
                                                                {activeBoard?.popularPostRewardEnabled &&
                                                                    activeBoard.popularPostThreshold &&
                                                                    post.recommendCount >=
                                                                        activeBoard.popularPostThreshold && (
                                                                        <span className="text-yellow-400 ml-1 text-xs">
                                                                            🔥
                                                                        </span>
                                                                    )}
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    toggleComments(
                                                                        post.id
                                                                    )
                                                                }
                                                                className="flex items-center gap-1 hover:text-white/80 transition-colors"
                                                            >
                                                                <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                                                                <span className="text-xs md:text-sm">
                                                                    {
                                                                        post.commentCount
                                                                    }
                                                                </span>
                                                            </button>
                                                        </div>

                                                        {/* 댓글 섹션 */}
                                                        {expandedPosts.has(
                                                            post.id
                                                        ) && (
                                                            <PostComments
                                                                postId={post.id}
                                                                player={player}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    )}

                                    {/* 무한 스크롤 로딩 영역 - 실제로 스크롤이 필요할 때만 표시 */}
                                    {(isFetchingNextPage ||
                                        hasNextPage ||
                                        (infiniteData as any)?.pages?.length >
                                            1) && (
                                        <div
                                            ref={loadMoreRef}
                                            className="py-6 md:py-8 flex justify-center"
                                        >
                                            {isFetchingNextPage ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="animate-spin rounded-full border-b-2 border-white/50 w-4 h-4 md:w-5 md:h-5"></div>
                                                    <span className="text-white/60 text-xs md:text-sm">
                                                        Loading more posts...
                                                    </span>
                                                </div>
                                            ) : hasNextPage ? (
                                                <span className="text-white/40 text-xs md:text-sm">
                                                    Scroll to load more
                                                </span>
                                            ) : (
                                                <span className="text-white/40 text-xs md:text-sm">
                                                    {`🎉 You've reached the end!`}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Reward Info */}
                            {activeBoard &&
                                (activeBoard.postCreationRewardEnabled ||
                                    activeBoard.popularPostRewardEnabled ||
                                    activeBoard.qualityContentRewardEnabled) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className={cn(
                                            "rounded-lg md:rounded-xl bg-gradient-to-r from-white/5 to-white/10 ",
                                            "morp-glass-1"
                                        )}
                                    >
                                        <ShinyButton
                                            onClick={() =>
                                                setShowRewardsTutorial(true)
                                            }
                                            className="w-full flex flex-row items-center justify-center gap-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group mx-auto p-4"
                                        >
                                            <h2
                                                className={cn(
                                                    "font-medium text-white/80 text-sm md:text-base group-hover:text-white transition-colors",
                                                    getResponsiveClass(20)
                                                        .textClass
                                                )}
                                            >
                                                💡 Earn {artist.name} Tokens!
                                            </h2>
                                        </ShinyButton>
                                    </motion.div>
                                )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Rewards Tutorial Modal */}
            <BoardRewardsTutorialModal
                isOpen={showRewardsTutorial}
                onClose={() => setShowRewardsTutorial(false)}
                artistName={artist.name}
                onComplete={() => {
                    setShowRewardsTutorial(false);
                }}
            />
        </div>
    );
});
