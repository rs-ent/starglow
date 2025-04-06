"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import FileUploader from "@/components/atoms/FileUploader";
import { StoredFile } from "@/app/actions/files";
import MediaCarousel, {
    CarouselItem,
} from "@/components/molecules/MediaCarousel";
import { useFiles } from "@/app/hooks/useFiles";
import { FileQuestion } from "lucide-react";
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
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/app/hooks/useToast";
import { useLoading } from "@/app/hooks/useLoading";

function SortableImage({
    image,
    onDelete,
}: {
    image: StoredFile;
    onDelete: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: image.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group rounded-lg overflow-hidden ${
                isDragging ? "shadow-lg" : ""
            }`}
            {...attributes}
            {...listeners}
        >
            <img
                src={image.url}
                alt={image.name || "Banner Image"}
                className="w-full h-40 object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <button
                    onClick={() => onDelete(image.id)}
                    className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-4 py-2 rounded-lg transition-opacity"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

export default function AdminBannerImages() {
    const [images, setImages] = useState<StoredFile[]>([]);
    const { getFiles, deleteFiles, updateFilesOrder } = useFiles();
    const { files, isLoading } = getFiles("banner", "missions-banners");
    const toast = useToast();
    const { startLoading, endLoading, setProgress } = useLoading();
    const isInitialMount = useRef(true);
    const isUpdating = useRef(false);

    // Optimize sensors with activation constraints
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement required before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Memoize carousel items to prevent unnecessary re-renders
    const carouselItems: CarouselItem[] = useMemo(
        () =>
            images.map((image) => ({
                type: "image",
                url: image.url,
                title: image.name || "Banner Image",
                img: image.url,
            })),
        [images]
    );

    // Update images only when files change and they're different
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            if (files && files.length > 0) {
                setImages(files);
            }
        } else if (files && !isUpdating.current) {
            // Simple length check first for performance
            if (files.length !== images.length) {
                setImages(files);
            } else {
                // Only do deep comparison if lengths match
                const filesChanged = files.some(
                    (file, index) =>
                        file.id !== images[index]?.id ||
                        file.order !== images[index]?.order
                );
                if (filesChanged) {
                    setImages(files);
                }
            }
        }
    }, [files, images]);

    const handleDelete = useCallback(
        async (imageId: string) => {
            if (!confirm("Delete this image?")) return;

            startLoading();
            try {
                const results = await deleteFiles([imageId]);
                if (results[0]) {
                    setImages((prev) =>
                        prev.filter((img) => img.id !== imageId)
                    );
                    setProgress(100);
                    toast.success("Image deleted successfully", 3000);
                }
            } catch (error) {
                console.error("Error deleting image:", error);
                toast.error("Failed to delete image", 3000);
            } finally {
                endLoading();
            }
        },
        [deleteFiles, startLoading, endLoading, setProgress, toast]
    );

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;

            if (!over || active.id === over.id) return;

            const oldIndex = images.findIndex((img) => img.id === active.id);
            const newIndex = images.findIndex((img) => img.id === over.id);

            if (oldIndex === -1 || newIndex === -1) return;

            // Optimistically update UI
            const newImages = arrayMove(images, oldIndex, newIndex);
            setImages(newImages);

            // Prevent multiple simultaneous updates
            if (isUpdating.current) return;
            isUpdating.current = true;

            startLoading();
            try {
                // Update all images' order in a single transaction
                const filesToUpdate = newImages.map((image, index) => ({
                    id: image.id,
                    order: index,
                }));

                await updateFilesOrder(
                    filesToUpdate,
                    "banner",
                    "missions-banners"
                );

                setProgress(100);
                toast.success("Image order updated successfully", 3000);
            } catch (error) {
                console.error("Error updating image order:", error);
                // Revert to original order if update fails
                if (files) {
                    setImages(files);
                }
                toast.error("Failed to update image order", 3000);
            } finally {
                endLoading();
                isUpdating.current = false;
            }
        },
        [
            images,
            files,
            updateFilesOrder,
            startLoading,
            endLoading,
            setProgress,
            toast,
        ]
    );

    return (
        <div className="grid grid-cols-[3fr_1fr] gap-8">
            {images.length > 0 && (
                <div className="flex flex-col gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-xl font-semibold">
                                Banner Images
                            </h3>
                            <div className="relative group">
                                <FileQuestion className="w-5 h-5 text-gray-400 cursor-help" />
                                <div className="absolute left-0 top-full mb-2 w-[350px] p-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                    <div className="h-[210px]">
                                        <MediaCarousel
                                            items={carouselItems}
                                            autoplay={true}
                                            autoplaySpeed={5000}
                                            infinite={true}
                                            dots={false}
                                            arrows={false}
                                            centerMode={true}
                                            centerPadding="0px"
                                            adaptiveHeight={true}
                                            showTitle={false}
                                            framePadding={1}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={images.map((img) => img.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {images.map((image) => (
                                        <SortableImage
                                            key={image.id}
                                            image={image}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4">
                <h2 className="font-bold">Upload Banner Images</h2>
                <FileUploader
                    purpose="banner"
                    bucket="missions-banners"
                    maxSize={10 * 1024 * 1024}
                    multiple={true}
                />
            </div>
        </div>
    );
}
