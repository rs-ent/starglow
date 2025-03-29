/// components/molecules/YoutubeCarousel.tsx

'use client';

import Slider from "react-slick";
import YoutubeViewer, { YoutubeViewerProps } from "../atoms/YoutubeViewer";
import ImageViewer, { ImageViewerProps } from "../atoms/ImageViewer";
import { cn } from "@/lib/utils/tailwind";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export type CarouselItem =
    | ({ type: "youtube" } & YoutubeViewerProps)
    | ({ type: "image" } & ImageViewerProps);

export interface CarouselProps {
    items: CarouselItem[];
    className?: string;
}

export default function YoutubeCarousel({ items, className = "" }: CarouselProps) {
    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        centerMode: true,
        centerPadding: '0px',
        adaptiveHeight: false,
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
                                    className="w-full max-w-[800px] min-w-[270px] h-[100%] mx-auto"
                                />
                            ) : (
                                <ImageViewer
                                    url={item.url}
                                    title={item.title}
                                    img={item.img}
                                    className="w-full max-w-[800px] min-w-[270px] h- mx-auto"
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
                    .slick-prev, .slick-next {
                        width: 45px;
                        height: 45px;
                        z-index: 10;
                    }
                    .slick-prev:before, .slick-next:before {
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
    )
};