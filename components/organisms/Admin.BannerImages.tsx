"use client";

import { useState } from "react";
import FileUploader from "@/components/atoms/FileUploader";
import { StoredImage } from "@prisma/client";
import MediaCarousel, {
    CarouselItem,
} from "@/components/molecules/MediaCarousel";

interface AdminBannerImagesProps {
    initialImages: StoredImage[];
}

export default function AdminBannerImages({
    initialImages,
}: AdminBannerImagesProps) {
    const [images, setImages] = useState<StoredImage[]>(initialImages);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = async (files: File[]) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append("files", file);
            });

            const response = await fetch("/api/admin/banner-images", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to upload images");
            }

            const newImages = await response.json();
            setImages((prev) => [...prev, ...newImages]);
        } catch (error) {
            console.error("Error uploading images:", error);
            alert("Failed to upload images");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (imageId: string) => {
        if (!confirm("Delete this image?")) return;

        try {
            const response = await fetch(
                `/api/admin/banner-images/${imageId}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete image");
            }

            setImages((prev) => prev.filter((img) => img.id !== imageId));
        } catch (error) {
            console.error("Error deleting image:", error);
            alert("Failed to delete image");
        }
    };

    const carouselItems: CarouselItem[] = images.map((image) => ({
        type: "image",
        url: image.url,
        title: image.alt || "Banner Image",
        img: image.url,
    }));

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">
                    Banner Image Management
                </h2>
                <div className="mb-6">
                    <FileUploader
                        onFileSelect={handleFileSelect}
                        maxSize={10 * 1024 * 1024}
                        multiple={true}
                    />
                </div>
            </div>

            {images.length > 0 && (
                <div>
                    <h3 className="text-xl font-semibold mb-4">
                        Current Banner Images
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {images.map((image) => (
                            <div
                                key={image.id}
                                className="relative group rounded-lg overflow-hidden"
                            >
                                <img
                                    src={image.url}
                                    alt={image.alt || "Banner Image"}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => handleDelete(image.id)}
                                        className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-4 py-2 rounded-lg transition-opacity"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {images.length > 0 && (
                <div>
                    <h3 className="text-xl font-semibold mb-4">Preview</h3>
                    <div className="h-[400px]">
                        <MediaCarousel
                            items={carouselItems}
                            autoplay={true}
                            autoplaySpeed={5000}
                            infinite={true}
                            dots={true}
                            arrows={true}
                            centerMode={true}
                            centerPadding="0px"
                            adaptiveHeight={true}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
