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
    const [duplicatedArtists, setDuplicatedArtists] = useState<Artist[]>([]);
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

    const sliderSettings = {
        dots: false,
        arrows: false,
        infinite: false,
        speed: 430,
        slidesToShow: 5,
        slidesToScroll: 1,
        swipeToSlide: true,
        centerMode: true,
        focusOnSelect: true,
        cssEase: "cubic-bezier(0.33, 1, 0.68, 1)",
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 5,
                },
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 4,
                },
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 3,
                },
            },
        ],
    };

    useEffect(() => {
        if (artists && artists.length > 0) {
            const duplicated: Artist[] = [];

            for (let i = 0; i < 15; i++) {
                artists.forEach((artist) => {
                    duplicated.push({
                        ...artist,
                        id: i === 0 ? artist.id : `${artist.id}_dup_${i}`,
                    });
                });
            }

            setDuplicatedArtists(duplicated);
        }
    }, [artists]);

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
                    {duplicatedArtists &&
                        duplicatedArtists.map((artist: Artist) => (
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
