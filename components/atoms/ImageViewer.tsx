/// components/atoms/ImageViewer.tsx

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import { cn } from "@/lib/utils/tailwind";

import PartialLoading from "./PartialLoading";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";

export interface ImageViewerProps {
    img: string;
    title?: string;
    externalUrl?: string;
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
    externalUrl,
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

    return (
        <div className={cn("relative", className)}>
            {isLoading && <PartialLoading text="Loading..." />}
            {isError && <div className="text-red-500">Error loading image</div>}
            <div className="w-full">
                <div
                    className={cn(
                        "relative rounded-3xl aspect-video",
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
                                            width: "100vw",
                                            height: "auto",
                                            objectFit: "contain",
                                            userSelect: "none",
                                            pointerEvents: "all",
                                            boxShadow: `0 0 24px 1px ${shadowColor}`,
                                        }}
                                        draggable={false}
                                        quality={100}
                                        unoptimized={false}
                                    />
                                )}
                            </TransformComponent>
                        </TransformWrapper>
                    </div>
                    {externalUrl && (
                        <div
                            className={cn(
                                "absolute bottom-0 left-0 right-0 p-4",
                                "bg-gradient-to-t from-black/30 to-transparent",
                                "flex items-center justify-end"
                            )}
                        >
                            <button
                                className={cn(
                                    "group relative overflow-hidden",
                                    "text-white text-sm font-medium",
                                    "bg-white/10 backdrop-blur-md",
                                    "border border-white/20",
                                    "rounded-[8px]",
                                    "px-2 py-2 md:px-4 md:py-4",
                                    "shadow-lg shadow-black/20",
                                    "hover:bg-white/20 hover:border-white/30",
                                    "hover:shadow-xl hover:shadow-black/30",
                                    "transition-all duration-300 ease-out",
                                    "hover:scale-105 active:scale-95",
                                    getResponsiveClass(10).textClass
                                )}
                                onClick={() => {
                                    window.open(externalUrl, "_blank");
                                }}
                                aria-label={`external link: ${externalUrl}`}
                                title="external link"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <svg
                                        className={cn(
                                            "w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1",
                                            getResponsiveClass(25).frameClass
                                        )}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                    </svg>
                                </div>
                                {/* 글래스 리플렉션 효과 */}
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                            </button>
                        </div>
                    )}
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
