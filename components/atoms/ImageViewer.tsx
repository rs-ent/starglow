/// components/atoms/ImageViewer.tsx

"use client";

import { useState } from "react";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import { cn } from "@/lib/utils/tailwind";

import PartialLoading from "./PartialLoading";
import Image from "next/image";

export interface ImageViewerProps {
    img: string;
    title?: string;
    showTitle?: boolean;
    className?: string;
    shadowColor?: string;
}

export default function ImageViewer({
    img,
    title,
    showTitle,
    className,
    shadowColor = "rgba(132, 78, 236, 0.2)",
}: ImageViewerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const handleImageLoad = () => {
        setIsLoading(false);
    };

    const handleImageError = () => {
        setIsError(true);
    };

    return (
        <div className={cn("relative", className)}>
            {isLoading && <PartialLoading text="Loading..." />}
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
                        style={{
                            width: "100%",
                            height: "100%",
                        }}
                    >
                        <TransformWrapper
                            initialScale={1}
                            minScale={1}
                            maxScale={5}
                            doubleClick={{ mode: "zoomIn" }}
                            wheel={{ step: 0.2 }}
                            panning={{ velocityDisabled: true }}
                            limitToBounds={false}
                        >
                            <TransformComponent
                                wrapperClass="w-full h-full flex items-center justify-center"
                                wrapperStyle={{
                                    width: "100%",
                                    height: "100%",
                                }}
                            >
                                <Image
                                    src={img}
                                    alt={title || ""}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        userSelect: "none",
                                        pointerEvents: "all",
                                        boxShadow: `0 0 12px 2px ${shadowColor}`,
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
