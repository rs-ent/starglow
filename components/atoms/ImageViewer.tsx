/// components/atoms/ImageViewer.tsx

"use client";

import { useState } from "react";
import PartialLoading from "./PartialLoading";
import { cn } from "@/lib/utils/tailwind";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface ImageViewerProps {
    img: string;
    title?: string;
    framePadding?: number;
    showTitle?: boolean;
    className?: string;
}

export default function ImageViewer({
    img,
    title,
    framePadding = 1,
    showTitle,
    className,
}: ImageViewerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [bgColor, setBgColor] = useState("#000000");

    const handleImageLoad = () => {
        setIsLoading(false);
    };

    const handleImageError = () => {
        setIsError(true);
    };

    return (
        <div className="relative">
            {isLoading && <PartialLoading text="Loading..." size="sm" />}
            {isError && <div className="text-red-500">Error loading image</div>}
            <div className="w-full">
                <div
                    className={cn(
                        "rounded-3xl aspect-video",
                        "overflow-hidden"
                    )}
                >
                    <div
                        className={cn(
                            "w-full h-full gradient-border rounded-3xl",
                            "bg-gradient-to-br from-[rgba(0,0,0,0.2)] to-[rgba(0,0,0,0.05)]",
                            "backdrop-blur-xs morp-glass-4"
                        )}
                    >
                        <TransformWrapper
                            initialScale={1}
                            minScale={0.5}
                            maxScale={5}
                            doubleClick={{ mode: "zoomIn" }}
                            wheel={{ step: 0.2 }}
                            panning={{ velocityDisabled: true }}
                            limitToBounds={false}
                        >
                            <TransformComponent>
                                <img
                                    src={img}
                                    alt={title || ""}
                                    style={{
                                        width: "100%",
                                        height: "auto",
                                        userSelect: "none",
                                        pointerEvents: "all",
                                        boxShadow:
                                            "0 0 12px 2px rgba(132, 78, 236, 0.2)",
                                    }}
                                    draggable={false}
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                    crossOrigin="anonymous"
                                />
                            </TransformComponent>
                        </TransformWrapper>
                    </div>
                </div>
            </div>
            {showTitle && title && (
                <div className="absolute bottom-0 left-0 right-0 p-2 text-center text-white bg-black/50">
                    {title}
                </div>
            )}
        </div>
    );
}
