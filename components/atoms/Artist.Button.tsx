/// components/atoms/Artist.Button.tsx

"use client";

import { Artist } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import Image from "next/image";

interface ArtistButtonProps {
    artist: Artist;
    index: number;
    frameSize?: number;
    textSize?: number;
    gapSize?: number;
    paddingSize?: number;
    className?: string;
    hasNewActivity?: boolean;
}

export default function ArtistButton({
    artist,
    index,
    frameSize = 55,
    textSize = 30,
    gapSize = 35,
    paddingSize = 65,
    className,
    hasNewActivity = false,
}: ArtistButtonProps) {
    const frameClass = getResponsiveClass(frameSize).frameClass;
    const textClass = getResponsiveClass(textSize).textClass;
    const gapClass = getResponsiveClass(gapSize).gapClass;
    const paddingClass = getResponsiveClass(paddingSize).paddingClass;
    const dotFrameClass = getResponsiveClass(5).frameClass;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{
                    duration: 0.7,
                    ease: [0.2, 1, 0.4, 1],
                    delay: index * 0.1,
                }}
                className={className}
            >
                <div
                    className={cn(
                        "flex flex-row items-center justify-between rounded-3xl",
                        "cursor-pointer backdrop-blur-xs",
                        "gradient-border morp-glass-1",
                        paddingClass,
                        "px-[15px]"
                    )}
                >
                    <div
                        className={cn(
                            "flex flex-row items-center justify-center",
                            gapClass
                        )}
                    >
                        <div
                            className={cn(
                                "relative",
                                "flex-shrink-0",
                                "rounded-full",
                                "border-[2px]",
                                "overflow-hidden",
                                artist.backgroundColors.length > 0
                                    ? `border-[${artist.backgroundColors[0]}] bg-[${artist.backgroundColors[0]}]`
                                    : "border-[rgba(255,255,255,1)] bg-[rgba(255,255,255,1)]",
                                frameClass
                            )}
                        >
                            <Image
                                src={artist.imageUrl ?? ""}
                                alt={artist.name}
                                width={frameSize * 5}
                                height={frameSize * 5}
                                className={cn(
                                    "object-cover",
                                    "absolute inset-0 w-full h-full"
                                )}
                            />
                            <div
                                className={cn(
                                    "absolute inset-0 w-full h-full",
                                    "flex items-center justify-center",
                                    "bg-[rgba(0,0,0,0.8)] rounded-full"
                                )}
                            >
                                {artist.logoUrl && (
                                    <Image
                                        src={artist.logoUrl}
                                        alt={`${artist.name} logo`}
                                        width={frameSize / 2.5}
                                        height={frameSize / 2.5}
                                        className={cn("object-contain")}
                                    />
                                )}
                            </div>
                        </div>
                        <h2 className={cn(textClass)}>{artist.name}</h2>
                    </div>
                    <div
                        className={cn(
                            "flex items-center justify-center",
                            "relative",
                            "transition-opacity duration-1000",
                            hasNewActivity ? "opacity-100" : "opacity-0",
                            dotFrameClass
                        )}
                    >
                        <span
                            className={cn(
                                "absolute w-full h-full",
                                "animate-ping",
                                "rounded-full",
                                "bg-red-500",
                                "z-10"
                            )}
                        />
                        <span
                            className={cn(
                                "absolute w-full h-full",
                                "rounded-full",
                                "bg-red-500",
                                "z-10"
                            )}
                        />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
