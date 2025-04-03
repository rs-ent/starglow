"use client";

import { useState, useEffect } from "react";
import FileUploader from "@/components/atoms/FileUploader";
import { StoredImage } from "@prisma/client";
import MediaCarousel, {
    CarouselItem,
} from "@/components/molecules/MediaCarousel";
import { useAdmin } from "@/hooks/useAdmin";
import { FileQuestion } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/hooks/useToast";
import { useLoading } from "@/hooks/useLoading";

function SortableImage({
    image,
    onDelete,
}: {
    image: StoredImage;
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
                alt={image.alt || "Banner Image"}
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
    const [images, setImages] = useState<StoredImage[]>([]);
    const {
        uploadBannerImages,
        deleteBannerImage,
        updateBannerImageOrder,
        getBannerImages,
        isUploading,
        error,
    } = useAdmin();
    const toast = useToast();
    const { startLoading, endLoading, setProgress } = useLoading();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const fetchImages = async () => {
            startLoading();
            try {
                const bannerImages = await getBannerImages();
                setImages(bannerImages);
                setProgress(100);
            } catch (error) {
                console.error("Error fetching banner images:", error);
                toast.error("Failed to fetch banner images", 3000);
            } finally {
                endLoading();
            }
        };

        fetchImages();
    }, []);

    const handleFileSelect = async (files: File[]) => {
        startLoading();
        try {
            const newImages = await uploadBannerImages(files);
            setImages((prev) => [...prev, ...newImages]);
            setProgress(100);
            toast.success("Images uploaded successfully", 3000);
        } catch (error) {
            console.error("Error uploading images:", error);
            toast.error("Failed to upload images", 3000);
        } finally {
            endLoading();
        }
    };

    const handleDelete = async (imageId: string) => {
        if (!confirm("Delete this image?")) return;

        startLoading();
        try {
            const success = await deleteBannerImage(imageId);
            if (success) {
                setImages((prev) => prev.filter((img) => img.id !== imageId));
                setProgress(100);
                toast.success("Image deleted successfully", 3000);
            }
        } catch (error) {
            console.error("Error deleting image:", error);
            toast.error("Failed to delete image", 3000);
        } finally {
            endLoading();
        }
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = images.findIndex((img) => img.id === active.id);
            const newIndex = images.findIndex((img) => img.id === over.id);

            // Optimistically update UI
            const newImages = arrayMove(images, oldIndex, newIndex);
            setImages(newImages);

            startLoading();
            try {
                // Update all images' order in the database
                const updates = newImages.map((image, index) =>
                    updateBannerImageOrder(image.id, index)
                );
                await Promise.all(updates);
                setProgress(100);
                toast.success("Image order updated successfully", 3000);
            } catch (error) {
                console.error("Error updating image order:", error);
                // Revert to original order if update fails
                const originalImages = await getBannerImages();
                setImages(originalImages);
                toast.error("Failed to update image order", 3000);
            } finally {
                endLoading();
            }
        }
    };

    const carouselItems: CarouselItem[] = images.map((image) => ({
        type: "image",
        url: image.url,
        title: image.alt || "Banner Image",
        img: image.url,
    }));

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
                    onFileSelect={handleFileSelect}
                    maxSize={10 * 1024 * 1024}
                    multiple={true}
                />
            </div>
        </div>
    );
}
