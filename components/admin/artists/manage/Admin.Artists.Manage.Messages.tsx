/// components/admin/artists/Admin.Artists.Manage.Messages.tsx

"use client";

import { useState } from "react";

import {
    Pencil,
    Trash2,
    Calendar,
    ExternalLink,
    Clock,
    Plus,
    MessageCircle,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    Power,
} from "lucide-react";
import Image from "next/image";

import { useArtistsGet, useArtistSet } from "@/app/hooks/useArtists";
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
import { ArtistBG, ArtistFG } from "@/lib/utils/get/artist-colors";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import CreateArtistMessage from "./Admin.Artists.Manage.CreateArtistMessage";

import type { Artist, ArtistMessage } from "@prisma/client";

interface AdminArtistsManageMessagesProps {
    artist: Artist;
}

export default function AdminArtistsManageMessages({
    artist,
}: AdminArtistsManageMessagesProps) {
    const toast = useToast();
    const { artistMessages, isLoading, error, refetchArtistMessages } =
        useArtistsGet({
            getArtistMessagesInput: {
                artistId: artist.id,
            },
        });

    const {
        deleteArtistMessage,
        isDeletingArtistMessage,
        deleteArtistMessageError,
    } = useArtistSet();

    const [filterStatus, setFilterStatus] = useState<
        "all" | "active" | "inactive" | "expired" | "upcoming"
    >("all");

    // 반응형 클래스
    const heroText = getResponsiveClass(35);
    const titleText = getResponsiveClass(25);
    const bodyText = getResponsiveClass(15);
    const smallText = getResponsiveClass(10);
    const iconSize = getResponsiveClass(20);
    const buttonPadding = getResponsiveClass(15);

    const [showEditDialog, setShowEditDialog] = useState(false);

    // 로딩 상태 - Apple 스타일
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-gray-400 mb-4" />
                <p className="text-base text-gray-500">
                    메시지를 불러오는 중...
                </p>
            </div>
        );
    }

    // 에러 상태 - Apple 스타일
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
                    {error.message}
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

    // 메시지 필터링
    const filteredMessages =
        artistMessages
            ?.filter((msg) => {
                const now = new Date();
                const isActive =
                    msg.isActive &&
                    (!msg.endDate || new Date(msg.endDate) >= now) &&
                    (!msg.startDate || new Date(msg.startDate) <= now);
                const isUpcoming =
                    msg.startDate && new Date(msg.startDate) > now;
                const isExpired = msg.endDate && new Date(msg.endDate) < now;
                const isInactive = !msg.isActive && !isExpired;

                switch (filterStatus) {
                    case "active":
                        return isActive;
                    case "upcoming":
                        return isUpcoming;
                    case "expired":
                        return isExpired;
                    case "inactive":
                        return isInactive;
                    default:
                        return true;
                }
            })
            .sort((a, b) => {
                const now = new Date();
                const aExpired = a.endDate && new Date(a.endDate) < now;
                const bExpired = b.endDate && new Date(b.endDate) < now;

                // 만료된 것은 뒤로
                if (aExpired && !bExpired) return 1;
                if (!aExpired && bExpired) return -1;

                // 둘 다 만료되지 않았거나 둘 다 만료된 경우
                // startDate가 현재와 가까운 순서로 정렬
                const aStartTime = a.startDate
                    ? new Date(a.startDate).getTime()
                    : now.getTime();
                const bStartTime = b.startDate
                    ? new Date(b.startDate).getTime()
                    : now.getTime();
                const nowTime = now.getTime();

                const aDiff = Math.abs(aStartTime - nowTime);
                const bDiff = Math.abs(bStartTime - nowTime);

                return aDiff - bDiff;
            }) || [];

    // 상태별 카운트
    const statusCounts = {
        all: artistMessages?.length || 0,
        active:
            artistMessages?.filter(
                (msg) =>
                    msg.isActive &&
                    (!msg.endDate || new Date(msg.endDate) >= new Date()) &&
                    (!msg.startDate || new Date(msg.startDate) <= new Date())
            ).length || 0,
        upcoming:
            artistMessages?.filter(
                (msg) => msg.startDate && new Date(msg.startDate) > new Date()
            ).length || 0,
        expired:
            artistMessages?.filter(
                (msg) => msg.endDate && new Date(msg.endDate) < new Date()
            ).length || 0,
        inactive:
            artistMessages?.filter(
                (msg) =>
                    !msg.isActive &&
                    (!msg.endDate || new Date(msg.endDate) >= new Date())
            ).length || 0,
    };

    return (
        <div className="space-y-8">
            {/* 헤더 섹션 - Apple 스타일 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h3 className="text-3xl font-semibold text-gray-900 flex items-center gap-3">
                            <MessageCircle
                                className="w-8 h-8"
                                style={{ color: ArtistBG(artist, 0) }}
                            />
                            메시지 관리
                        </h3>
                        <p className="text-lg text-gray-600 mt-2">
                            총{" "}
                            <span className="font-semibold text-gray-900">
                                {statusCounts.all}
                            </span>
                            개 • 활성{" "}
                            <span
                                className="font-semibold"
                                style={{ color: ArtistBG(artist, 1) }}
                            >
                                {statusCounts.active}
                            </span>
                            개
                        </p>
                    </div>

                    {/* 새 메시지 버튼 - Apple 스타일 */}
                    <Dialog
                        open={showEditDialog}
                        onOpenChange={setShowEditDialog}
                    >
                        <DialogTrigger asChild>
                            <Button className="gap-2 px-6 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm">
                                <Plus className="w-5 h-5" />새 메시지 추가
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-[#f5f5f7] rounded-lg shadow-md h-screen overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-semibold text-gray-900">
                                    새 메시지 추가
                                </DialogTitle>
                            </DialogHeader>
                            <CreateArtistMessage
                                artistId={artist.id}
                                mode="create"
                                onSuccess={() => {
                                    setShowEditDialog(false);
                                }}
                                onCancel={() => {
                                    setShowEditDialog(false);
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* 필터 바 - Apple 스타일 세그먼트 컨트롤 */}
                <div className="mt-6 p-1 bg-gray-100 rounded-xl inline-flex">
                    {[
                        {
                            value: "all",
                            label: "전체",
                            count: statusCounts.all,
                        },
                        {
                            value: "active",
                            label: "활성",
                            count: statusCounts.active,
                        },
                        {
                            value: "upcoming",
                            label: "예정",
                            count: statusCounts.upcoming,
                        },
                        {
                            value: "expired",
                            label: "만료",
                            count: statusCounts.expired,
                        },
                        {
                            value: "inactive",
                            label: "비활성",
                            count: statusCounts.inactive,
                        },
                    ].map((filter) => {
                        const isSelected = filterStatus === filter.value;

                        return (
                            <button
                                key={filter.value}
                                onClick={() =>
                                    setFilterStatus(filter.value as any)
                                }
                                className={cn(
                                    "px-4 py-2 rounded-lg transition-all flex items-center gap-2",
                                    isSelected
                                        ? "bg-white shadow-sm text-gray-900"
                                        : "text-gray-600 hover:text-gray-900"
                                )}
                            >
                                <span className="font-medium text-xs">
                                    {filter.label}
                                </span>
                                <span
                                    className={cn(
                                        "text-xs",
                                        isSelected
                                            ? "text-gray-900"
                                            : "text-gray-500"
                                    )}
                                >
                                    {filter.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 메시지 그리드 */}
            {filteredMessages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredMessages.map((message, index) => (
                        <MessageCard
                            key={message.id}
                            message={message}
                            artist={artist}
                            index={index}
                            refetch={refetchArtistMessages}
                        />
                    ))}
                </div>
            ) : (
                /* 빈 상태 - Apple 스타일 */
                <div className="flex flex-col items-center justify-center py-20 px-8">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                        <MessageCircle className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
                        {filterStatus === "all"
                            ? "아직 메시지가 없습니다"
                            : `${
                                  filterStatus === "active"
                                      ? "활성"
                                      : filterStatus === "upcoming"
                                      ? "예정된"
                                      : filterStatus === "expired"
                                      ? "만료된"
                                      : "비활성"
                              } 메시지가 없습니다`}
                    </h3>
                    <p className="text-base text-gray-600 text-center mb-6 max-w-sm">
                        {filterStatus === "all"
                            ? "팬들에게 전달할 특별한 메시지를 작성해보세요"
                            : "다른 상태의 메시지를 확인하거나 새 메시지를 추가해보세요"}
                    </p>
                    {filterStatus !== "all" && (
                        <Button
                            variant="outline"
                            onClick={() => setFilterStatus("all")}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-full px-6 py-2"
                        >
                            전체 메시지 보기
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

// MessageCard 컴포넌트 - Apple 스타일
function MessageCard({
    message,
    artist,
    index,
    refetch,
}: {
    message: ArtistMessage;
    artist: Artist;
    index: number;
    refetch: () => void;
}) {
    const toast = useToast();
    const { deleteArtistMessage } = useArtistSet();
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteArtistMessage({
                artistId: artist.id,
                id: message.id,
            });

            if (result) {
                toast.success("메시지가 삭제되었습니다");
                refetch();
            } else {
                toast.error("메시지 삭제에 실패했습니다");
            }
        } catch (error) {
            toast.error("메시지 삭제 중 오류가 발생했습니다");
        } finally {
            setIsDeleting(false);
            setShowDeleteAlert(false);
        }
    };

    // 상태 계산
    const now = new Date();
    const isActive =
        message.isActive &&
        (!message.endDate || new Date(message.endDate) >= now) &&
        (!message.startDate || new Date(message.startDate) <= now);
    const isUpcoming = message.startDate && new Date(message.startDate) > now;
    const isExpired = message.endDate && new Date(message.endDate) < now;

    // 상태별 설정 - Apple 스타일 색상
    const statusConfig = {
        active: {
            color: "#34C759", // Apple Green
            bgColor: "#34C75920",
            icon: CheckCircle2,
            label: "활성",
        },
        upcoming: {
            color: "#007AFF", // Apple Blue
            bgColor: "#007AFF20",
            icon: Clock,
            label: "예정",
        },
        expired: {
            color: "#8E8E93", // Apple Gray
            bgColor: "#8E8E9320",
            icon: XCircle,
            label: "만료",
        },
        inactive: {
            color: "#FF9500", // Apple Orange
            bgColor: "#FF950020",
            icon: Power,
            label: "비활성",
        },
    };

    const status = isActive
        ? "active"
        : isUpcoming
        ? "upcoming"
        : isExpired
        ? "expired"
        : "inactive";
    const config = statusConfig[status];
    const StatusIcon = config.icon;

    return (
        <>
            <div
                className={cn(
                    "bg-white rounded-2xl shadow-sm hover:shadow-md transition-all",
                    isExpired && "opacity-60"
                )}
            >
                {/* 배너 이미지 */}
                {message.bannerUrl && (
                    <div className="relative w-full h-48 overflow-hidden rounded-t-2xl">
                        <Image
                            src={message.bannerUrl}
                            alt="배너"
                            fill
                            className="object-cover"
                        />
                        {/* 상태 뱃지 - 배너 위에 */}
                        <div className="absolute top-4 right-4">
                            <div className="px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md bg-white/80">
                                <StatusIcon
                                    className="w-4 h-4"
                                    style={{ color: config.color }}
                                />
                                <span
                                    className="text-sm font-medium"
                                    style={{ color: config.color }}
                                >
                                    {config.label}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 컨텐츠 */}
                <div className="p-6 space-y-4">
                    {/* 배너가 없을 때만 상태 표시 */}
                    {!message.bannerUrl && (
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1" />
                            <div
                                className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
                                style={{ backgroundColor: config.bgColor }}
                            >
                                <StatusIcon
                                    className="w-4 h-4"
                                    style={{ color: config.color }}
                                />
                                <span
                                    className="text-sm font-medium"
                                    style={{ color: config.color }}
                                >
                                    {config.label}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 메시지 */}
                    <p className="text-lg font-medium text-gray-900 line-clamp-3 leading-relaxed">
                        {message.message}
                    </p>

                    {/* 메타 정보 */}
                    <div className="space-y-3">
                        {/* 기간 */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar
                                className="w-4 h-4 flex-shrink-0"
                                style={{ color: ArtistBG(artist, 0) }}
                            />
                            <span>
                                {message.startDate
                                    ? new Date(
                                          message.startDate
                                      ).toLocaleDateString("ko-KR")
                                    : "시작일 미정"}
                                {" ~ "}
                                {message.endDate
                                    ? new Date(
                                          message.endDate
                                      ).toLocaleDateString("ko-KR")
                                    : "무기한"}
                            </span>
                        </div>

                        {/* 외부 링크 */}
                        {message.externalUrl && (
                            <a
                                href={message.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink className="w-4 h-4" />
                                외부 링크 방문
                            </a>
                        )}
                    </div>

                    {/* 구분선 */}
                    <div className="border-t pt-4" />

                    {/* 액션 버튼 - Apple 스타일 */}
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 gap-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg"
                            onClick={() => setShowEditDialog(true)}
                        >
                            <Pencil className="w-4 h-4" />
                            수정
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg"
                            onClick={() => setShowDeleteAlert(true)}
                        >
                            <Trash2 className="w-4 h-4" />
                            삭제
                        </Button>
                    </div>
                </div>
            </div>

            {/* 수정 Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl bg-[#f5f5f7] rounded-lg shadow-md h-screen overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-gray-900">
                            메시지 수정
                        </DialogTitle>
                    </DialogHeader>
                    <CreateArtistMessage
                        artistId={artist.id}
                        mode="update"
                        initialData={message}
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
                            메시지를 삭제하시겠습니까?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            이 작업은 되돌릴 수 없습니다. 메시지가 영구적으로
                            삭제됩니다.
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
