/// components/molecules/ArtistSlideSelector.tsx

"use client";

import { useArtistsGet } from "@/app/hooks/useArtists";
import ArtistSelector from "@/components/atoms/ArtistSelector";
import PartialLoading from "@/components/atoms/PartialLoading";
import { cn } from "@/lib/utils/tailwind";
import { Artist } from "@prisma/client";
import { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface ArtistSlideSelectorProps {
    className?: string;
    onSelect?: (artist: Artist | null) => void;
}

export default function ArtistSlideSelector({
    className,
    onSelect,
}: ArtistSlideSelectorProps) {
    const { artists, isLoading, error } = useArtistsGet({});
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

    const sliderSettings = {
        dots: false,
        arrows: false,
        infinite: artists && artists.length > 1,
        speed: 430,
        slidesToShow: Math.min(5, artists?.length || 0),
        slidesToScroll: 1,
        swipeToSlide: artists && artists.length > 1,
        centerMode: artists && artists.length > 1,
        focusOnSelect: true,
        edgeFriction: 0.1,
        centerPadding: "0px",
        cssEase: "cubic-bezier(0.33, 1, 0.68, 1)",
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: Math.min(5, artists?.length || 0),
                },
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: Math.min(5, artists?.length || 0),
                },
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: Math.min(5, artists?.length || 0),
                },
            },
        ],
    };

    return (
        <div
            className={cn(
                "max-w-[1000px] w-screen px-[20px] sm:px-[30px] md:px-[40px] lg:px-[50px] h-auto",
                className
            )}
        >
            <div className="relative">
                <Slider {...sliderSettings}>
                    {isLoading && (
                        <PartialLoading text="Loading..." size="sm" />
                    )}
                    {error && <div>Error: {error.message}</div>}
                    {artists &&
                        artists.map((artist: Artist) => (
                            <div
                                key={artist.id}
                                className={cn(
                                    "px-2",
                                    "pt-[20px] sm:pt-[25px] md:pt-[30px] lg:pt-[35px] xl:pt-[40px]"
                                )}
                            >
                                <ArtistSelector
                                    artist={artist}
                                    isSelected={
                                        selectedArtist?.id === artist.id
                                    }
                                    onSelect={() => {
                                        if (selectedArtist?.id === artist.id) {
                                            setSelectedArtist(null);
                                            onSelect?.(null);
                                        } else {
                                            setSelectedArtist(artist);
                                            onSelect?.(artist);
                                        }
                                    }}
                                />
                            </div>
                        ))}
                </Slider>
            </div>
        </div>
    );
}
