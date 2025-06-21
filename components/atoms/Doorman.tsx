"use client";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface DoormanProps {
    text?: string;
    iconSize?: number;
    textSize?: number;
    row?: boolean;
}

export default function Doorman({
    text,
    iconSize = 70,
    textSize = 20,
    row,
}: DoormanProps) {
    return (
        <div
            className="absolute inset-0 z-30 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className={cn(
                    "absolute inset-0 -z-10 blur-lg",
                    "bg-gradient-to-br from-[rgba(22,11,59,0.2)] to-[rgba(104,77,153,0.2)]"
                )}
            />
            <div
                className={cn(
                    "flex items-center gap-4",
                    row ? "flex-row" : "flex-col"
                )}
            >
                <img
                    src="/icons/lock.svg"
                    alt="lock"
                    className={cn(
                        getResponsiveClass(iconSize).frameClass,
                        "aspect-square"
                    )}
                />
                <p
                    className={cn(
                        getResponsiveClass(textSize).textClass,
                        "text-center whitespace-break-spaces"
                    )}
                >
                    {text || "NFT Holder can only access to it."}
                </p>
            </div>
        </div>
    );
}
