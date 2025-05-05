/// components/atoms/PublicPrivateButton.tsx

"use client";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface PublicPrivateButtonProps {
    title: string;
    isPublic: boolean;
    onClick: () => void;
    className?: string;
    frameSize?: number;
    textSize?: number;
    gapSize?: number;
    paddingSize?: number;
    isActive?: boolean;
}

export default function PublicPrivateButton({
    title,
    isPublic,
    onClick,
    className = "",
    textSize = 20,
    frameSize = 20,
    gapSize = 10,
    paddingSize = 0,
    isActive = false,
}: PublicPrivateButtonProps) {
    const textSizeClass = getResponsiveClass(textSize).textClass;
    const frameSizeClass = getResponsiveClass(frameSize).frameClass;
    const gapSizeClass = getResponsiveClass(gapSize).gapClass;
    const paddingSizeClass = getResponsiveClass(paddingSize).paddingClass;

    return (
        <div
            className={cn(
                isActive ? "opacity-100" : "opacity-40",
                "hover:opacity-100",
                "transition-opacity duration-500"
            )}
        >
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    "flex items-center justify-baseline",
                    "cursor-pointer",
                    paddingSizeClass,
                    textSizeClass,
                    gapSizeClass,
                    className
                )}
            >
                <h3 className={cn(isActive ? "text-glow-purple" : "")}>
                    {title}
                </h3>
                {isPublic ? (
                    <img
                        src="/icons/world.svg"
                        alt={title}
                        className={cn(
                            frameSizeClass,
                            isActive ? "purple-glow" : ""
                        )}
                    />
                ) : (
                    <img
                        src="/icons/lock.svg"
                        alt={title}
                        className={cn(
                            frameSizeClass,
                            isActive ? "purple-glow" : ""
                        )}
                    />
                )}
            </button>
        </div>
    );
}
