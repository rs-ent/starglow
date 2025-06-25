/// components/atoms/ImageViewer.tsx

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import { cn } from "@/lib/utils/tailwind";

import PartialLoading from "./PartialLoading";

export interface ImageViewerProps {
    img: string;
    title?: string;
    showTitle?: boolean;
    className?: string;
    shadowColor?: string;
}

interface ImageDimensions {
    width: number;
    height: number;
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
    const [imageDimensions, setImageDimensions] =
        useState<ImageDimensions | null>(null);

    // 이미지 크기 미리 계산
    useEffect(() => {
        const calculateImageDimensions = () => {
            const tempImg = new window.Image();
            tempImg.crossOrigin = "anonymous";

            tempImg.onload = () => {
                setImageDimensions({
                    width: tempImg.naturalWidth,
                    height: tempImg.naturalHeight,
                });
                setIsLoading(false);
            };

            tempImg.onerror = () => {
                setIsError(true);
                setIsLoading(false);
            };

            tempImg.src = img;
        };

        calculateImageDimensions();
    }, [img]);

    const handleImageLoad = () => {
        // Next.js Image 컴포넌트의 onLoad 핸들러
    };

    const handleImageError = () => {
        setIsError(true);
        setIsLoading(false);
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
                            "w-full h-full rounded-3xl",
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
                            doubleClick={{ mode: "zoomIn" }}
                            panning={{ velocityDisabled: true }}
                            limitToBounds={false}
                            wheel={{ disabled: true }}
                        >
                            <TransformComponent
                                wrapperClass="w-full h-full flex items-center justify-center"
                                wrapperStyle={{
                                    width: "100%",
                                    height: "100%",
                                }}
                            >
                                {imageDimensions && (
                                    <Image
                                        src={img}
                                        alt={title || ""}
                                        width={imageDimensions.width}
                                        height={imageDimensions.height}
                                        style={{
                                            width: "100%",
                                            height: "auto",
                                            objectFit: "contain",
                                            userSelect: "none",
                                            pointerEvents: "all",
                                            boxShadow: `0 0 24px 1px ${shadowColor}`,
                                        }}
                                        draggable={false}
                                        onLoad={handleImageLoad}
                                        onError={handleImageError}
                                        quality={100}
                                        unoptimized={false}
                                    />
                                )}
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
