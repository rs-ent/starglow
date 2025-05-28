/// components/molecules/MediaCarousel.tsx

"use client";

import Slider from "react-slick";
import YoutubeViewer, { YoutubeViewerProps } from "../atoms/YoutubeViewer";
import ImageViewer, { ImageViewerProps } from "../atoms/ImageViewer";
import { cn } from "@/lib/utils/tailwind";
import { useState } from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export type CarouselItem =
    | ({ type: "youtube" } & YoutubeViewerProps)
    | ({ type: "image" } & ImageViewerProps);

export interface CarouselProps {
    items: CarouselItem[];
    className?: string;
    showTitle?: boolean;
    dots?: boolean;
    arrows?: boolean;
    centerMode?: boolean;
    centerPadding?: string;
    adaptiveHeight?: boolean;
    infinite?: boolean;
    speed?: number;
    slidesToShow?: number;
    slidesToScroll?: number;
    autoplay?: boolean;
    autoplaySpeed?: number;
    pauseOnHover?: boolean;
    pauseOnFocus?: boolean;
    pauseOnDotsHover?: boolean;
    pauseOnMouseEnter?: boolean;
    pauseOnTouchStart?: boolean;
    pauseOnTouchEnd?: boolean;
    pauseOnScroll?: boolean;
    pauseOnScrollEnd?: boolean;
    framePadding?: number;
}

export default function MediaCarousel({
    items,
    className = "",
    showTitle = true,
    dots = true,
    arrows = true,
    centerMode = true,
    centerPadding = "0px",
    adaptiveHeight = false,
    infinite = false,
    speed = 500,
    slidesToShow = 1,
    slidesToScroll = 1,
    autoplay = false,
    autoplaySpeed = 3000,
    pauseOnHover = true,
    pauseOnFocus = true,
    pauseOnDotsHover = true,
    pauseOnMouseEnter = true,
    pauseOnTouchStart = true,
    pauseOnTouchEnd = true,
    pauseOnScroll = true,
    pauseOnScrollEnd = true,
    framePadding = undefined,
}: CarouselProps) {
    const settings = {
        dots: dots,
        arrows: arrows,
        centerMode: centerMode,
        centerPadding: centerPadding,
        adaptiveHeight: adaptiveHeight,
        infinite: infinite,
        speed: speed,
        slidesToShow: slidesToShow,
        slidesToScroll: slidesToScroll,
        autoplay: autoplay,
        autoplaySpeed: autoplaySpeed,
        pauseOnHover: pauseOnHover,
        pauseOnFocus: pauseOnFocus,
        pauseOnDotsHover: pauseOnDotsHover,
        pauseOnMouseEnter: pauseOnMouseEnter,
        pauseOnTouchStart: pauseOnTouchStart,
        pauseOnTouchEnd: pauseOnTouchEnd,
        pauseOnScroll: pauseOnScroll,
        pauseOnScrollEnd: pauseOnScrollEnd,
    };

    return (
        <div className={cn("relative w-full mx-auto p-2 h-full", className)}>
            <Slider {...settings} className={className}>
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="flex flex-col items-center justify-center p-4 h-full"
                    >
                        <div className="flex-1 w-full flex flex-col items-center justify-center h-full">
                            {item.type === "youtube" ? (
                                <YoutubeViewer
                                    videoId={item.videoId}
                                    artist={item.artist}
                                    title={item.title}
                                    framePadding={framePadding}
                                    className="w-full mx-auto"
                                />
                            ) : (
                                <ImageViewer
                                    url={item.url}
                                    title={showTitle ? item.title : ""}
                                    img={item.img}
                                    framePadding={framePadding}
                                    className="w-full mx-auto"
                                />
                            )}
                        </div>
                    </div>
                ))}
            </Slider>

            <style jsx global>
                {`
                    .slick-dots li button:before {
                        color: white !important;
                        opacity: 0.35 !important;
                        font-size: 6px !important;
                        top: -10px;
                    }

                    .slick-dots li.slick-active button:before {
                        color: white !important;
                        opacity: 1 !important;
                    }
                    .slick-prev,
                    .slick-next {
                        width: 45px;
                        height: 45px;
                        z-index: 10;
                    }
                    .slick-prev:before,
                    .slick-next:before {
                        font-size: 20px;
                        color: white;
                    }
                    .slick-prev {
                        left: -30px;
                    }
                    .slick-next {
                        right: -30px;
                    }
                `}
            </style>
        </div>
    );
}
