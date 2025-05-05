/// components/molecules/ArtistSlideSelector.tsx

"use client";

import { useArtistsGet } from "@/app/hooks/useArtists";
import ArtistSelector from "@/components/atoms/ArtistSelector";
import PartialLoading from "@/components/atoms/PartialLoading";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { Artist } from "@prisma/client";
import { useState, useEffect } from "react";

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
        <div className="max-w-[1000px] w-screen overflow-x-hidden px-[20px] sm:px-[30px] md:px-[40px] lg:px-[50px] h-auto">
            <div className="w-full h-full overflow-x-auto">
                <div
                    className={cn(
                        "ml-5 flex flex-row items-center justify-around",
                        "gap-8 sm:gap-9 md:gap-10 lg:gap-11 xl:gap-12",
                        "min-w-0 overflow-visible",
                        "transition-all duration-700",
                        className
                    )}
                >
                    {isLoading && (
                        <PartialLoading text="Loading..." size="sm" />
                    )}
                    {error && <div>Error: {error.message}</div>}
                    {duplicatedArtists &&
                        duplicatedArtists.map((artist: Artist) => (
                            <ArtistSelector
                                key={artist.id}
                                artist={artist}
                                isSelected={selectedArtist?.id === artist.id}
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
                        ))}
                </div>
            </div>
        </div>
    );
}
