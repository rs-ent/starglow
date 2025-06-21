/// components/admin/artists/manage/Admin.Artists.Manage.Feeds.tsx

"use client";

import { useState } from "react";

import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
    Plus,
    Image as ImageIcon,
    Video,
    FileText,
    Heart,
    MessageCircle,
    Loader2,
    Grid3X3,
    List,
    MoreHorizontal,
    Edit,
    Trash2,
    AlertCircle,
} from "lucide-react";
import Image from "next/image";

import {
    useArtistFeedsGet,
    useArtistFeedsSet,
} from "@/app/hooks/useArtistFeeds";
import { useToast } from "@/app/hooks/useToast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArtistBG } from "@/lib/utils/get/artist-colors";
import { cn } from "@/lib/utils/tailwind";

import CreateArtistFeed from "./Admin.Artists.Manage.CreateArtistFeed";

import type { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import type { Artist } from "@prisma/client";

interface AdminArtistsManageFeedsProps {
    artist: Artist;
}

export default function AdminArtistsManageFeeds({
    artist,
}: AdminArtistsManageFeedsProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [showEditDialog, setShowEditDialog] = useState(false);
    const { artistFeeds, isLoading, error, refetch } = useArtistFeedsGet({
        getArtistFeedsInput: {
            artistId: artist.id,
        },
    });

    const { deleteArtistFeed } = useArtistFeedsSet();

    // 로딩 상태
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-gray-400 mb-4" />
                <p className="text-base text-gray-500">피드를 불러오는 중...</p>
            </div>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    오류가 발생했습니다
                </h3>
                <p className="text-base text-gray-600 text-center mb-6 max-w-md">
                    피드를 불러올 수 없습니다
                </p>
                <Button
                    onClick={() => window.location.reload()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full transition-colors"
                >
                    다시 시도
                </Button>
            </div>
        );
    }

    const feeds = artistFeeds?.feeds || [];

    const handleRefresh = async () => {
        await refetch();
    };

    return (
        <div className="space-y-8">
            {/* 헤더 섹션 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h3 className="text-3xl font-semibold text-gray-900 flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{
                                    backgroundColor: `${ArtistBG(artist, 0)}20`,
                                }}
                            >
                                <Grid3X3
                                    className="w-6 h-6"
                                    style={{ color: ArtistBG(artist, 0) }}
                                />
                            </div>
                            아티스트 피드
                        </h3>
                        <p className="text-lg text-gray-600 mt-2">
                            총{" "}
                            <span className="font-semibold text-gray-900">
                                {feeds.length}
                            </span>
                            개의 게시물
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* 뷰 모드 토글 */}
                        <div className="p-1 bg-gray-100 rounded-lg inline-flex">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={cn(
                                    "p-2 rounded transition-all",
                                    viewMode === "grid"
                                        ? "bg-white shadow-sm text-gray-900"
                                        : "text-gray-600 hover:text-gray-900"
                                )}
                            >
                                <Grid3X3 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn(
                                    "p-2 rounded transition-all",
                                    viewMode === "list"
                                        ? "bg-white shadow-sm text-gray-900"
                                        : "text-gray-600 hover:text-gray-900"
                                )}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 새 피드 추가 버튼 */}
                        <Dialog
                            open={showEditDialog}
                            onOpenChange={setShowEditDialog}
                        >
                            <DialogTrigger asChild>
                                <Button className="gap-2 px-6 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm">
                                    <Plus className="w-5 h-5" />새 게시물
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#f5f5f7] max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-semibold text-gray-900">
                                        새 게시물 만들기
                                    </DialogTitle>
                                </DialogHeader>
                                <CreateArtistFeed
                                    artistId={artist.id}
                                    onSuccess={async () => {
                                        setShowEditDialog(false);
                                        await handleRefresh();
                                    }}
                                    onCancel={() => {
                                        setShowEditDialog(false);
                                    }}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* 피드 그리드/리스트 */}
            {feeds.length > 0 ? (
                viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {feeds.map((feed) => (
                            <FeedGridCard
                                key={feed.id}
                                feed={feed}
                                artist={artist}
                                deleteArtistFeed={deleteArtistFeed}
                                refetch={refetch}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {feeds.map((feed) => (
                            <FeedListCard
                                key={feed.id}
                                feed={feed}
                                artist={artist}
                                deleteArtistFeed={deleteArtistFeed}
                                refetch={refetch}
                            />
                        ))}
                    </div>
                )
            ) : (
                /* 빈 상태 */
                <div className="flex flex-col items-center justify-center py-20 px-8">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                        <ImageIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
                        아직 게시물이 없습니다
                    </h3>
                    <p className="text-base text-gray-600 text-center mb-6 max-w-sm">
                        팬들과 소통할 첫 게시물을 작성해보세요
                    </p>
                </div>
            )}
        </div>
    );
}

// 그리드 뷰 카드 컴포넌트
function FeedGridCard({
    feed,
    artist,
    deleteArtistFeed,
    refetch,
}: {
    feed: ArtistFeedWithReactions;
    artist: Artist;
    deleteArtistFeed: any;
    refetch: () => void;
}) {
    const toast = useToast();
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteArtistFeed({
                input: {
                    id: feed.id,
                    artistId: artist.id,
                },
            });

            if (result) {
                toast.success("게시물이 삭제되었습니다");
                refetch();
            } else {
                toast.error("게시물 삭제에 실패했습니다");
            }
        } catch (error) {
            toast.error("게시물 삭제 중 오류가 발생했습니다");
        } finally {
            setIsDeleting(false);
            setShowDeleteAlert(false);
        }
    };

    const mediaCount =
        (feed.imageUrls?.length || 0) + (feed.videoUrls?.length || 0);
    const firstMedia = feed.imageUrls?.[0] || feed.videoUrls?.[0];
    const hasMultipleMedia = mediaCount > 1;

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                {/* 미디어 섹션 */}
                <div className="aspect-square relative bg-gray-100">
                    {firstMedia ? (
                        <>
                            {feed.imageUrls?.[0] ? (
                                <Image
                                    src={feed.imageUrls[0]}
                                    alt=""
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Video className="w-16 h-16 text-gray-400" />
                                </div>
                            )}

                            {/* 멀티 미디어 인디케이터 */}
                            {hasMultipleMedia && (
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                                    <ImageIcon className="w-4 h-4 text-white" />
                                    <span className="text-sm text-white font-medium">
                                        {mediaCount}
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-6">
                            <p className="text-gray-600 text-center line-clamp-6">
                                {feed.text || "내용 없음"}
                            </p>
                        </div>
                    )}

                    {/* 호버 오버레이 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-6 text-white">
                            <div className="flex items-center gap-2">
                                <Heart className="w-6 h-6 fill-white" />
                                <span className="font-semibold">
                                    {feed.reactions?.length || 0}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-6 h-6 fill-white" />
                                <span className="font-semibold">
                                    {feed.reactions?.filter(
                                        (r: any) => r.comment
                                    ).length || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 액션 버튼 */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="bg-white/90 backdrop-blur-sm hover:bg-white rounded-full p-2"
                            >
                                <MoreHorizontal className="w-4 h-4 text-[rgba(0,0,0,0.8)]" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => setShowEditDialog(true)}
                            >
                                <Edit className="w-4 h-4" />
                                수정
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="gap-2 text-red-600 cursor-pointer"
                                onClick={() => setShowDeleteAlert(true)}
                            >
                                <Trash2 className="w-4 h-4" />
                                삭제
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* 수정 Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="bg-[#f5f5f7] max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-gray-900">
                            게시물 수정
                        </DialogTitle>
                    </DialogHeader>
                    <CreateArtistFeed
                        artistId={artist.id}
                        mode="update"
                        initialData={feed}
                        onSuccess={() => {
                            setShowEditDialog(false);
                            refetch();
                        }}
                        onCancel={() => {
                            setShowEditDialog(false);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* 삭제 확인 Alert */}
            <AlertDialog
                open={showDeleteAlert}
                onOpenChange={setShowDeleteAlert}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            게시물을 삭제하시겠습니까?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            이 작업은 되돌릴 수 없습니다. 게시물과 관련된 모든
                            반응과 댓글이 함께 삭제됩니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? "삭제 중..." : "삭제"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// 리스트 뷰 카드 컴포넌트
function FeedListCard({
    feed,
    artist,
    deleteArtistFeed,
    refetch,
}: {
    feed: ArtistFeedWithReactions;
    artist: Artist;
    deleteArtistFeed: any;
    refetch: () => void;
}) {
    const toast = useToast();
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteArtistFeed({
                input: {
                    id: feed.id,
                    artistId: artist.id,
                },
            });

            if (result) {
                toast.success("게시물이 삭제되었습니다");
                refetch();
            } else {
                toast.error("게시물 삭제에 실패했습니다");
            }
        } catch (error) {
            toast.error("게시물 삭제 중 오류가 발생했습니다");
        } finally {
            setIsDeleting(false);
            setShowDeleteAlert(false);
        }
    };

    const mediaCount =
        (feed.imageUrls?.length || 0) + (feed.videoUrls?.length || 0);

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-6">
                <div className="flex gap-6">
                    {/* 미디어 썸네일 */}
                    <div className="w-32 h-32 rounded-xl bg-gray-100 flex-shrink-0 relative overflow-hidden">
                        {feed.imageUrls?.[0] ? (
                            <Image
                                src={feed.imageUrls[0]}
                                alt=""
                                fill
                                className="object-cover"
                            />
                        ) : feed.videoUrls?.[0] ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <Video className="w-8 h-8 text-gray-400" />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                    </div>

                    {/* 콘텐츠 */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 flex flex-col gap-1 items-start justify-center">
                                {/* 미디어 정보 */}
                                {mediaCount > 0 && (
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                        {feed.imageUrls?.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <ImageIcon className="w-4 h-4" />
                                                {feed.imageUrls.length}
                                            </span>
                                        )}
                                        {feed.videoUrls?.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Video className="w-4 h-4" />
                                                {feed.videoUrls.length}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* 통계 */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-2 text-sm text-gray-600">
                                            <Heart className="w-4 h-4" />
                                            {feed.reactions?.length || 0}
                                        </span>
                                        <span className="flex items-center gap-2 text-sm text-gray-600">
                                            <MessageCircle className="w-4 h-4" />
                                            {feed.reactions?.filter(
                                                (r: any) => r.comment
                                            ).length || 0}{" "}
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-400">
                                        {formatDistanceToNow(
                                            new Date(feed.createdAt),
                                            {
                                                addSuffix: true,
                                                locale: ko,
                                            }
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* 액션 버튼 */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-lg"
                                    >
                                        <MoreHorizontal className="w-4 h-4 text-[rgba(0,0,0,0.7)] hover:text-[rgba(255,255,255,1)]" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        className="gap-2 cursor-pointer"
                                        onClick={() => setShowEditDialog(true)}
                                    >
                                        <Edit className="w-4 h-4" />
                                        수정
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="gap-2 text-red-600 cursor-pointer"
                                        onClick={() => setShowDeleteAlert(true)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        삭제
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>

            {/* 수정 Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="bg-[#f5f5f7] max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-gray-900">
                            게시물 수정
                        </DialogTitle>
                    </DialogHeader>
                    <CreateArtistFeed
                        artistId={artist.id}
                        mode="update"
                        initialData={feed}
                        onSuccess={() => {
                            setShowEditDialog(false);
                            refetch();
                        }}
                        onCancel={() => {
                            setShowEditDialog(false);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* 삭제 확인 Alert */}
            <AlertDialog
                open={showDeleteAlert}
                onOpenChange={setShowDeleteAlert}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            게시물을 삭제하시겠습니까?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            이 작업은 되돌릴 수 없습니다. 게시물과 관련된 모든
                            반응과 댓글이 함께 삭제됩니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? "삭제 중..." : "삭제"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
