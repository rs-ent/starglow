/// components/molecules/ArtistSlideSelector.tsx

"use client";

import { useArtistsGet } from "@/app/hooks/useArtists";
import ArtistSelector from "@/components/atoms/ArtistSelector";
import PartialLoading from "@/components/atoms/PartialLoading";
import { cn } from "@/lib/utils/tailwind";
import { Artist, Story_spg } from "@prisma/client";
import { useCallback, useEffect, useMemo } from "react";
import { TokenGatingResult, TokenGatingData } from "@/app/story/nft/actions";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface ArtistSlideSelectorProps {
    className?: string;
    onSelect?: (artist: Artist | null) => void;
    selectedArtist?: Artist | null;
    tokenGating?: TokenGatingResult | null;
}

export default function ArtistSlideSelector({
    className,
    onSelect,
    selectedArtist,
    tokenGating,
}: ArtistSlideSelectorProps) {
    const { artists, isLoading, error } = useArtistsGet({});

    // sliderSettings를 useMemo로 최적화
    const sliderSettings = useMemo(
        () => ({
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
        }),
        [artists]
    );

    // 아티스트 선택 핸들러를 useCallback으로 최적화
    const handleArtistSelect = useCallback(
        (artist: Artist) => {
            const newSelected =
                selectedArtist?.id === artist.id ? null : artist;
            onSelect?.(newSelected);
        },
        [onSelect, selectedArtist]
    );

    useEffect(() => {
        if (artists && artists.length > 0 && !selectedArtist) {
            onSelect?.(artists[0]);
        }
    }, [artists, selectedArtist, onSelect]);

    // 아티스트 렌더링 최적화
    const renderArtists = useMemo(() => {
        if (!artists || artists.length === 0) return null;

        const sortedArtists = [...artists].sort((a, b) => {
            const aWithSpg = a as Artist & { story_spg: Story_spg[] };
            const bWithSpg = b as Artist & { story_spg: Story_spg[] };

            const aTokenCount =
                aWithSpg.story_spg?.reduce((count, spg) => {
                    const tokenGatingData = tokenGating?.data[
                        spg.address as keyof TokenGatingResult
                    ] as unknown as TokenGatingData;
                    return count + (tokenGatingData?.detail?.length || 0);
                }, 0) || 0;

            const bTokenCount =
                bWithSpg.story_spg?.reduce((count, spg) => {
                    const tokenGatingData = tokenGating?.data[
                        spg.address as keyof TokenGatingResult
                    ] as unknown as TokenGatingData;
                    return count + (tokenGatingData?.detail?.length || 0);
                }, 0) || 0;

            if (bTokenCount !== aTokenCount) {
                return bTokenCount - aTokenCount;
            }
            return a.name.localeCompare(b.name);
        });

        return sortedArtists.map((artist: Artist) => {
            const selected = selectedArtist?.id === artist.id;
            return (
                <div
                    key={artist.id}
                    className={cn(
                        "px-2",
                        "pt-[20px] sm:pt-[25px] md:pt-[30px] lg:pt-[35px] xl:pt-[40px]"
                    )}
                >
                    <ArtistSelector
                        artist={artist}
                        isSelected={selected}
                        onSelect={() => handleArtistSelect(artist)}
                    />
                </div>
            );
        });
    }, [artists, selectedArtist, handleArtistSelect]);

    return (
        <div
            className={cn(
                "max-w-[1000px] w-screen px-[20px] sm:px-[30px] md:px-[40px] lg:px-[50px] h-auto",
                className
            )}
        >
            <div className="relative">
                {isLoading && <PartialLoading text="Loading..." size="sm" />}
                {error && <div>Error: {error.message}</div>}
                {artists && !isLoading && artists.length > 0 && (
                    <Slider {...sliderSettings}>{renderArtists}</Slider>
                )}
            </div>
        </div>
    );
}
