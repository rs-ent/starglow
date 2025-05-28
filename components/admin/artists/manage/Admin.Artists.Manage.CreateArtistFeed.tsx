/// components/admin/artists/manage/Admin.Artists.Manage.CreateArtistFeed.tsx

"use client";

import { useState } from "react";
import { useArtistFeedsSet } from "@/app/hooks/useArtistFeeds";
import { useToast } from "@/app/hooks/useToast";
import FileUploader from "@/components/atoms/FileUploader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/tailwind";
import {
    Image as ImageIcon,
    Video,
    X,
    Plus,
    Sparkles,
    Upload,
    GripVertical,
    Play,
    Heart,
    MessageCircle,
} from "lucide-react";
import Image from "next/image";
import { ArtistFeed } from "@prisma/client";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Item Component
function SortableImageItem({
    url,
    index,
    onRemove,
}: {
    url: string;
    index: number;
    onRemove: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: url });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            <div className="aspect-square relative rounded-xl overflow-hidden bg-white shadow-sm border border-gray-200">
                <Image
                    src={url}
                    alt={`이미지 ${index + 1}`}
                    fill
                    className="object-cover"
                />
                {/* 순서 표시 */}
                <div className="absolute top-2 left-2 w-6 h-6 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                        {index + 1}
                    </span>
                </div>

                {/* 드래그 핸들 */}
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-lg cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <GripVertical className="w-4 h-4 text-white" />
                </div>
            </div>

            {/* 호버 시 삭제 버튼 */}
            <button
                type="button"
                onClick={onRemove}
                className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
            >
                <X className="w-4 h-4 text-red-600" />
            </button>
        </div>
    );
}

// Sortable Video Item Component
function SortableVideoItem({
    url,
    index,
    onRemove,
}: {
    url: string;
    index: number;
    onRemove: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: url });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-move p-1 hover:bg-gray-100 rounded"
            >
                <GripVertical className="w-4 h-4 text-gray-400" />
            </div>

            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Play className="w-6 h-6 text-gray-400" />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                    동영상 {index + 1}
                </p>
                <p className="text-xs text-gray-500 truncate">
                    {url.split("/").pop()}
                </p>
            </div>

            <button
                type="button"
                onClick={onRemove}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <X className="w-4 h-4 text-gray-600" />
            </button>
        </div>
    );
}

interface CreateArtistFeedProps {
    artistId: string;
    mode?: "create" | "update";
    initialData?: ArtistFeed;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function CreateArtistFeed({
    artistId,
    mode = "create",
    initialData,
    onSuccess,
    onCancel,
}: CreateArtistFeedProps) {
    const toast = useToast();
    const { createArtistFeed, updateArtistFeed, isPending } =
        useArtistFeedsSet();

    // 상태 관리
    const [text, setText] = useState(initialData?.text || "");
    const [imageUrls, setImageUrls] = useState<string[]>(
        initialData?.imageUrls || []
    );
    const [videoUrls, setVideoUrls] = useState<string[]>(
        initialData?.videoUrls || []
    );
    const [activeTab, setActiveTab] = useState<"compose" | "preview">(
        "compose"
    );

    // DnD Kit 센서 설정
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 이미지 드래그 핸들러
    const handleImageDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setImageUrls((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over?.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // 비디오 드래그 핸들러
    const handleVideoDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setVideoUrls((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over?.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // 파일 업로드 핸들러
    const handleImageUpload = (files: { id: string; url: string }[]) => {
        setImageUrls((prev) => [...prev, ...files.map((f) => f.url)]);
    };

    const handleVideoUpload = (files: { id: string; url: string }[]) => {
        setVideoUrls((prev) => [...prev, ...files.map((f) => f.url)]);
    };

    // 미디어 제거
    const removeImage = (index: number) => {
        setImageUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const removeVideo = (index: number) => {
        setVideoUrls((prev) => prev.filter((_, i) => i !== index));
    };

    // 폼 제출
    const handleSubmit = async () => {
        if (!text && imageUrls.length === 0 && videoUrls.length === 0) {
            toast.error("게시물 내용을 입력하거나 미디어를 추가해주세요");
            return;
        }

        try {
            if (mode === "create") {
                await createArtistFeed({
                    input: {
                        artistId,
                        text,
                        imageUrls,
                        videoUrls,
                    },
                });
                toast.success("게시물이 성공적으로 작성되었습니다");
            } else {
                if (!initialData) return;
                await updateArtistFeed({
                    input: {
                        id: initialData.id,
                        artistId,
                        text,
                        imageUrls,
                        videoUrls,
                    },
                });
                toast.success("게시물이 성공적으로 수정되었습니다");
            }
            onSuccess?.();
        } catch (error) {
            toast.error("게시물 작성에 실패했습니다");
        }
    };

    const hasContent = text || imageUrls.length > 0 || videoUrls.length > 0;

    return (
        <div className="space-y-6">
            {/* 탭 네비게이션 */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                    onClick={() => setActiveTab("compose")}
                    className={cn(
                        "flex-1 py-2 px-4 rounded-md transition-all font-medium",
                        activeTab === "compose"
                            ? "bg-white shadow-sm text-gray-900"
                            : "text-gray-600 hover:text-gray-900"
                    )}
                >
                    작성하기
                </button>
                <button
                    onClick={() => setActiveTab("preview")}
                    disabled={!hasContent}
                    className={cn(
                        "flex-1 py-2 px-4 rounded-md transition-all font-medium",
                        activeTab === "preview"
                            ? "bg-white shadow-sm text-gray-900"
                            : "text-gray-600 hover:text-gray-900",
                        !hasContent && "opacity-50 cursor-not-allowed"
                    )}
                >
                    미리보기
                </button>
            </div>

            {activeTab === "compose" ? (
                <div className="space-y-6">
                    {/* 텍스트 입력 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            게시물 내용
                        </label>
                        <Textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="팬들과 공유하고 싶은 이야기를 들려주세요..."
                            className={cn(
                                "min-h-[120px] resize-none",
                                "bg-gray-50 border-gray-200 inner-shadow",
                                "placeholder:text-gray-400",
                                "focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
                                "text-[rgba(0,0,0,0.8)] text-sm",
                                "transition-all duration-200"
                            )}
                        />
                    </div>

                    {/* 미디어 업로드 섹션 */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-700">
                            미디어 추가
                        </h4>

                        {/* 업로드 버튼들 */}
                        <div className="grid grid-cols-2 gap-4 rounded-lg">
                            <FileUploader
                                bucket="artist-feeds"
                                onComplete={handleImageUpload}
                                multiple={true}
                                accept={{
                                    "image/*": [
                                        ".png",
                                        ".jpg",
                                        ".jpeg",
                                        ".gif",
                                        ".webp",
                                    ],
                                }}
                                className="h-full bg-[rgba(0,0,0,0.5)] hover:bg-[rgba(0,0,0,0.7)] shadow-md"
                            />

                            <FileUploader
                                bucket="artist-feeds"
                                onComplete={handleVideoUpload}
                                multiple={true}
                                accept={{
                                    "video/*": [
                                        ".mp4",
                                        ".mov",
                                        ".avi",
                                        ".webm",
                                    ],
                                }}
                                className="h-full bg-[rgba(0,0,0,0.5)] hover:bg-[rgba(0,0,0,0.7)] shadow-md"
                            />
                        </div>

                        {/* 업로드된 미디어 미리보기 */}
                        {(imageUrls.length > 0 || videoUrls.length > 0) && (
                            <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                                {/* 이미지 목록 - 드래그 가능 */}
                                {imageUrls.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-sm font-medium text-gray-700">
                                                이미지 ({imageUrls.length})
                                                <span className="text-xs text-gray-500 ml-2">
                                                    드래그하여 순서 변경
                                                </span>
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setImageUrls([])}
                                                className="text-xs text-red-600 hover:text-red-700"
                                            >
                                                모두 삭제
                                            </button>
                                        </div>
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleImageDragEnd}
                                        >
                                            <SortableContext
                                                items={imageUrls}
                                                strategy={rectSortingStrategy}
                                            >
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {imageUrls.map(
                                                        (url, index) => (
                                                            <SortableImageItem
                                                                key={url}
                                                                url={url}
                                                                index={index}
                                                                onRemove={() =>
                                                                    removeImage(
                                                                        index
                                                                    )
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                    </div>
                                )}

                                {/* 동영상 목록 - 드래그 가능 */}
                                {videoUrls.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-sm font-medium text-gray-700">
                                                동영상 ({videoUrls.length})
                                                <span className="text-xs text-gray-500 ml-2">
                                                    드래그하여 순서 변경
                                                </span>
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setVideoUrls([])}
                                                className="text-xs text-red-600 hover:text-red-700"
                                            >
                                                모두 삭제
                                            </button>
                                        </div>
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleVideoDragEnd}
                                        >
                                            <SortableContext
                                                items={videoUrls}
                                                strategy={
                                                    verticalListSortingStrategy
                                                }
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {videoUrls.map(
                                                        (url, index) => (
                                                            <SortableVideoItem
                                                                key={url}
                                                                url={url}
                                                                index={index}
                                                                onRemove={() =>
                                                                    removeVideo(
                                                                        index
                                                                    )
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* 미리보기 탭 */
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 text-center">
                        실제 피드에서 보이는 모습입니다
                    </p>

                    <div className="max-w-md mx-auto">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* 미디어 미리보기 - 개선된 버전 */}
                            {(imageUrls.length > 0 || videoUrls.length > 0) && (
                                <div className="aspect-square relative bg-gray-100">
                                    {imageUrls.length > 0 ? (
                                        <>
                                            <Image
                                                src={imageUrls[0]}
                                                alt=""
                                                fill
                                                className="object-cover"
                                            />
                                            {/* 멀티미디어 인디케이터 */}
                                            {imageUrls.length +
                                                videoUrls.length >
                                                1 && (
                                                <div className="absolute top-4 right-4 flex gap-2">
                                                    {imageUrls.length > 1 && (
                                                        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                                            <ImageIcon className="w-4 h-4 text-white" />
                                                            <span className="text-sm text-white font-medium">
                                                                {
                                                                    imageUrls.length
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                    {videoUrls.length > 0 && (
                                                        <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                                            <Video className="w-4 h-4 text-white" />
                                                            <span className="text-sm text-white font-medium">
                                                                {
                                                                    videoUrls.length
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : videoUrls.length > 0 ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <Play className="w-10 h-10 text-gray-600" />
                                                </div>
                                                <p className="text-gray-600">
                                                    동영상 {videoUrls.length}개
                                                </p>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {/* 텍스트 내용 */}
                            {(text ||
                                (!imageUrls.length && !videoUrls.length)) && (
                                <div className="p-6">
                                    <p className="text-gray-900 whitespace-pre-wrap">
                                        {text || (
                                            <span className="text-gray-400">
                                                내용을 입력해주세요
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}

                            {/* 하단 정보 */}
                            {(imageUrls.length > 0 ||
                                videoUrls.length > 0 ||
                                text) && (
                                <div className="px-6 pb-6 border-t pt-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Heart className="w-4 h-4" />0
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageCircle className="w-4 h-4" />
                                                0
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            지금
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-3 pt-6 border-t">
                <Button
                    variant="outline"
                    className="flex-1 py-3 rounded-lg bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    onClick={() => {
                        onCancel?.();
                    }}
                >
                    취소
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={!hasContent || isPending}
                    className={cn(
                        "flex-1 py-3 rounded-lg",
                        "bg-blue-500 hover:bg-blue-600",
                        "text-white font-medium",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "transition-colors"
                    )}
                >
                    {isPending ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            처리 중...
                        </span>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            {mode === "create" ? "게시하기" : "수정하기"}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
