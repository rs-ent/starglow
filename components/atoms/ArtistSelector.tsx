/// components/atoms/ArtistSelector.tsx

"use client";

import { memo, useCallback, useMemo } from "react";

import Image from "next/image";

import { ArtistBG } from "@/lib/utils/get/artist-colors";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import type { Artist } from "@prisma/client";

interface ArtistSelectorProps {
    artist: Artist;
    className?: string;
    frameSize?: number;
    textSize?: number;
    isSelected?: boolean;
    onSelect?: (artist: Artist) => void;
}

// memo로 컴포넌트 자체를 최적화
const ArtistSelector = memo(function ArtistSelector({
    artist,
    className = "",
    frameSize = 55,
    textSize = 15,
    isSelected = false,
    onSelect,
}: ArtistSelectorProps) {
    // 선택 상태 계산 최적화
    const selected = useMemo(() => isSelected, [isSelected]);

    // 반응형 클래스 계산 최적화
    const frameSizeClass = useMemo(
        () => getResponsiveClass(frameSize).frameClass,
        [frameSize]
    );

    const textSizeClass = useMemo(
        () => getResponsiveClass(textSize).textClass,
        [textSize]
    );

    // 클릭 핸들러 최적화
    const handleClick = useCallback(() => {
        onSelect?.(artist);
    }, [artist, onSelect]);

    // 그림자 스타일 최적화
    const shadowStyle = useMemo(
        () => ({
            boxShadow: selected
                ? `0px 0px 12px 2px ${ArtistBG(artist, 2, 100)}`
                : "none",
        }),
        [selected, artist]
    );

    // 선택된 상태의 클래스 계산 최적화
    const selectedFrameClass = useMemo(
        () =>
            selected
                ? "scale-[1.2] z-30 transition-all duration-300 mb-[12px] sm:mb-[14px] md:mb-[16px] lg:mb-[18px] xl:mb-[20px]"
                : "",
        [selected]
    );

    const selectedBorderClass = useMemo(
        () =>
            selected
                ? "bg-transparent -m-[8px] sm:-m-[9px] md:-m-[10px] lg:-m-[11px] xl:-m-[12px] border-[1px] border-[rgba(255,255,255,1)]"
                : "",
        [selected]
    );

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
                    selectedFrameClass
                )}
            >
                <div
                    className={cn(
                        "absolute inset-0",
                        "rounded-full",
                        selectedBorderClass,
                        "transition-all duration-300"
                    )}
                >
                    {selected && (
                        <div className="absolute left-0 top-0">
                            <div className="origin-center-bottom spin-scale-3x">
                                <El03Icon />
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
                    style={shadowStyle}
                    priority={isSelected} // 선택된 아티스트 이미지 우선 로드
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
                            loading="lazy" // 로고는 지연 로드
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
});

// El03Icon도 memo로 최적화
const El03Icon = memo(function El03Icon() {
    return (
        <svg
            width="17"
            height="28"
            viewBox="0 0 17 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 sm:w-5 sm:h-4 md:w-6 md:h-5 lg:w-6 lg:h-6"
        >
            <path
                d="M8.5 28C8.5 28 8.65305 20.8234 10.796 17.7816C12.6168 15.197 17 14 17 14C17 14 12.6168 12.803 10.796 10.2184C8.65305 7.17663 8.5 1.98382e-06 8.5 1.98382e-06C8.5 1.98382e-06 8.34695 7.17663 6.20402 10.2184C4.38317 12.803 -1.22392e-06 14 -1.22392e-06 14C-1.22392e-06 14 4.38317 15.197 6.20402 17.7816C8.34695 20.8234 8.5 28 8.5 28Z"
                fill="white"
            />
        </svg>
    );
});

export default ArtistSelector;
