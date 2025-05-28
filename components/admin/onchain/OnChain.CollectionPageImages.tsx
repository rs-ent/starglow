/// components/admin/onchain/OnChain.CollectionPageImages.tsx

"use client";

import { useState } from "react";
import { CollectionContract } from "@prisma/client";
import Image from "next/image";
import FileUploader from "@/components/atoms/FileUploader";
import { useToast } from "@/app/hooks/useToast";
import { useCollectionSet } from "@/app/hooks/useCollectionV2";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";

interface OnChainCollectionPageImagesProps {
    collection: CollectionContract;
}

interface SortableImageProps {
    id: string;
    url: string;
    onRemove: (url: string) => void;
    onPreview: (url: string) => void;
    listeners: any;
    attributes: any;
}

function SortableImage({
    id,
    url,
    onRemove,
    onPreview,
    listeners,
    attributes,
}: SortableImageProps) {
    return (
        <div className="flex items-center gap-2">
            {/* Drag Handle */}
            <span
                {...listeners}
                {...attributes}
                className="cursor-grab p-2"
                title="드래그해서 순서 변경"
            >
                <GripVertical className="w-5 h-5 text-gray-400" />
            </span>
            {/* Image Preview */}
            <div
                className="w-[100px] h-[100px] flex items-center justify-center bg-gray-100 border rounded preview-image"
                onClick={() => onPreview(url)}
                style={{ userSelect: "none" }}
            >
                <Image
                    src={url}
                    alt="page image"
                    width={500}
                    height={500}
                    className="object-contain max-w-full max-h-full cursor-pointer"
                />
            </div>
            <button onClick={() => onRemove(url)}>삭제</button>
        </div>
    );
}

function SortableImageWrapper({
    id,
    url,
    onRemove,
    onPreview,
}: {
    id: string;
    url: string;
    onRemove: (url: string) => void;
    onPreview: (url: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    return (
        <div ref={setNodeRef} style={style}>
            <SortableImage
                id={id}
                url={url}
                onRemove={onRemove}
                onPreview={onPreview}
                listeners={listeners}
                attributes={attributes}
            />
        </div>
    );
}

export default function OnChainCollectionPageImages({
    collection,
}: OnChainCollectionPageImagesProps) {
    const toast = useToast();
    const [images, setImages] = useState<string[]>(collection.pageImages || []);
    const { addPageImages, isLoading } = useCollectionSet();
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const sensors = useSensors(useSensor(PointerSensor));

    console.log("collection.pageImages", collection.pageImages);

    // 업로드 완료 시 이미지 추가
    const handleUploadComplete = (files: { id: string; url: string }[]) => {
        const newUrls = files.map((f) => f.url);
        setImages((prev) => [...prev, ...newUrls]);
    };

    // 이미지 삭제
    const handleRemove = (url: string) => {
        setImages((prev) => prev.filter((img) => img !== url));
    };

    // 이미지 클릭 시 미리보기
    const handlePreview = (url: string) => {
        setPreviewImage(url);
    };

    // 저장
    const handleSave = async () => {
        const result = await addPageImages({
            collectionAddress: collection.address,
            images,
        });

        if (result.success) {
            toast.success("페이지 이미지 저장 완료");
        } else {
            toast.error("페이지 이미지 저장 실패");
        }
    };

    // DnD 순서 변경
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = images.findIndex((img) => img === active.id);
            const newIndex = images.findIndex((img) => img === over?.id);
            setImages((imgs) => arrayMove(imgs, oldIndex, newIndex));
        }
    };

    return (
        <div className="flex flex-col gap-2 border border-gray-300 rounded-md p-2 overflow-y-auto max-h-[500px]">
            {/* 이미지 전체 보기 모달 */}
            {previewImage && (
                <Dialog
                    open={!!previewImage}
                    onOpenChange={() => setPreviewImage(null)}
                >
                    <div className="flex items-center justify-center p-4 bg-black bg-opacity-80">
                        <img
                            src={previewImage}
                            alt="원본 이미지"
                            className="max-w-[90vw] max-h-[90vh] rounded shadow-lg"
                        />
                    </div>
                </Dialog>
            )}
            <FileUploader
                bucket="collection-page-images"
                onComplete={handleUploadComplete}
                multiple
            />
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={images}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-2">
                        {images.map((img) => (
                            <SortableImageWrapper
                                key={img}
                                id={img}
                                url={img}
                                onRemove={handleRemove}
                                onPreview={handlePreview}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
            <button
                onClick={handleSave}
                disabled={isLoading}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                {isLoading ? "저장 중..." : "저장"}
            </button>
        </div>
    );
}
