/// components/atoms/ArtistSelector.tsx

"use client";

import { Artist } from "@prisma/client";
import Image from "next/image";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useState } from "react";
import { ArtistBG, ArtistFG } from "@/lib/utils/get/artist-colors";

interface ArtistSelectorProps {
    artist: Artist;
    className?: string;
    frameSize?: number;
    textSize?: number;
    gapSize?: number;
    paddingSize?: number;
    isSelected?: boolean;
    onSelect?: (artist: Artist) => void;
}

export default function ArtistSelector({
    artist,
    className = "",
    frameSize = 55,
    textSize = 15,
    gapSize = 10,
    paddingSize = 10,
    isSelected = false,
    onSelect,
}: ArtistSelectorProps) {
    const [isLocalSelected, setIsLocalSelected] = useState(isSelected);
    const selected = isSelected || isLocalSelected;

    const frameSizeClass = getResponsiveClass(frameSize).frameClass;
    const textSizeClass = getResponsiveClass(textSize).textClass;

    const handleClick = () => {
        if (onSelect) {
            onSelect(artist);
        } else {
            setIsLocalSelected(!isLocalSelected);
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center cursor-pointer",
                "transition-all duration-500",
                selected && "mx-3",
                className
            )}
            onClick={handleClick}
        >
            <div
                className={cn(
                    "relative",
                    "rounded-full",
                    frameSizeClass,
                    selected &&
                        "scale-[1.2] z-30 transition-all duration-300 mb-[12px] sm:mb-[14px] md:mb-[16px] lg:mb-[18px] xl:mb-[20px]"
                )}
            >
                <div
                    className={cn(
                        "absolute inset-0",
                        "rounded-full",
                        selected &&
                            "bg-transparent -m-[8px] sm:-m-[9px] md:-m-[10px] lg:-m-[11px] xl:-m-[12px] border-[1px] border-[rgba(255,255,255,1)]",
                        "transition-all duration-300"
                    )}
                >
                    {selected && (
                        <div className="absolute left-0 top-0">
                            <div className="origin-center-bottom spin-scale-3x">
                                <El03Icon className="w-4 h-4 sm:w-5 sm:h-4 md:w-6 md:h-5 lg:w-6 lg:h-6" />
                            </div>
                        </div>
                    )}
                </div>
                <Image
                    src={artist.imageUrl ?? ""}
                    alt={artist.name}
                    width={frameSize * 5}
                    height={frameSize * 5}
                    className={cn(
                        "rounded-full object-cover",
                        "border-[1px] border-[rgba(255,255,255,1)]",
                        "relative",
                        frameSizeClass
                    )}
                    style={{
                        boxShadow: selected
                            ? `0px 0px 12px 2px ${ArtistBG(artist, 2, 100)}`
                            : "none",
                    }}
                />
                <div
                    className={cn(
                        "absolute inset-0",
                        "flex items-center justify-center m-[1px]",
                        "bg-[rgba(0,0,0,0.4)] rounded-full"
                    )}
                >
                    {artist.logoUrl && (
                        <Image
                            src={artist.logoUrl}
                            alt={`${artist.name} logo`}
                            width={frameSize / 2}
                            height={frameSize / 2}
                            className={cn("object-contain")}
                        />
                    )}
                </div>
            </div>
            <h3
                className={cn(
                    "text-center text-xs mt-[4px] mb-[4px]",
                    "transition-all duration-500",
                    textSizeClass,
                    selected && "font-semibold"
                )}
            >
                {artist.name}
            </h3>
        </div>
    );
}

function El03Icon({ className = "" }) {
    return (
        <svg
            width="17"
            height="28"
            viewBox="0 0 17 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M8.5 28C8.5 28 8.65305 20.8234 10.796 17.7816C12.6168 15.197 17 14 17 14C17 14 12.6168 12.803 10.796 10.2184C8.65305 7.17663 8.5 1.98382e-06 8.5 1.98382e-06C8.5 1.98382e-06 8.34695 7.17663 6.20402 10.2184C4.38317 12.803 -1.22392e-06 14 -1.22392e-06 14C-1.22392e-06 14 4.38317 15.197 6.20402 17.7816C8.34695 20.8234 8.5 28 8.5 28Z"
                fill="white"
            />
        </svg>
    );
}
