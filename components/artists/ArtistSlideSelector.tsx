/// components/artists/ArtistSlideSelector.tsx

"use client";

import { useCallback, useEffect, useMemo } from "react";

import Slider from "react-slick";

import { useArtistsGet } from "@/app/hooks/useArtists";
import ArtistSelector from "@/components/atoms/ArtistSelector";
import PartialLoading from "@/components/atoms/PartialLoading";
import { cn } from "@/lib/utils/tailwind";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import type { VerifiedSPG } from "@/app/story/interaction/actions";
import type { Artist, Story_spg } from "@prisma/client";

interface ArtistSlideSelectorProps {
    className?: string;
    onSelect?: (artist: Artist | null) => void;
    selectedArtist?: Artist | null;
    verifiedSPGs?: VerifiedSPG[];
}

export default function ArtistSlideSelector({
    className,
    onSelect,
    selectedArtist,
    verifiedSPGs,
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

    const verifiedSPGsMap = useMemo(
        () => new Map(verifiedSPGs?.map((spg) => [spg.id, spg]) || []),
        [verifiedSPGs]
    );

    const getTokenCount = useCallback(
        (artist: Artist & { story_spg: Story_spg[] }) => {
            return (
                artist.story_spg?.reduce((count, spg) => {
                    const verifiedSPG = verifiedSPGsMap.get(spg.id);
                    return count + (verifiedSPG?.verifiedTokens?.length || 0);
                }, 0) || 0
            );
        },
        [verifiedSPGsMap]
    );

    const sortedArtists = useMemo(() => {
        if (!artists) return [];
        return [...artists].sort((a, b) => {
            const aArtist = a as Artist & { story_spg: Story_spg[] };
            const bArtist = b as Artist & { story_spg: Story_spg[] };
            const aTokenCount = getTokenCount(aArtist);
            const bTokenCount = getTokenCount(bArtist);
            if (bTokenCount !== aTokenCount) {
                return bTokenCount - aTokenCount;
            }
            return aArtist.name.localeCompare(bArtist.name);
        });
    }, [artists, getTokenCount]);

    useEffect(() => {
        if (sortedArtists.length > 0 && !selectedArtist) {
            onSelect?.(sortedArtists[0]);
        }
    }, [sortedArtists, selectedArtist, onSelect]);

    const handleArtistSelect = useCallback(
        (artist: Artist) => {
            onSelect?.(selectedArtist?.id === artist.id ? null : artist);
        },
        [onSelect, selectedArtist]
    );

    const renderArtists = useMemo(() => {
        if (!sortedArtists.length) {
            return (
                <div className="w-full h-full flex items-center justify-center">
                    No artists found
                </div>
            );
        }

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
    }, [sortedArtists, selectedArtist, handleArtistSelect]);

    return (
        <div
            className={cn(
                "max-w-[1000px] w-screen px-[20px] sm:px-[30px] md:px-[40px] lg:px-[50px] h-auto",
                className
            )}
        >
            <div className="relative">
                {isLoading && <PartialLoading text="Loading..." />}
                {error && <div>Error: {error.message}</div>}
                {artists && !isLoading && artists.length > 0 && (
                    <Slider {...sliderSettings}>{renderArtists}</Slider>
                )}
            </div>
        </div>
    );
}
