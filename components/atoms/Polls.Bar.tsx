/// components\atoms\Polls.Bar.tsx

"use client";

import Image from "next/image";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import type { PollOptionResult } from "@/app/actions/polls";

export default function PollBar({
    result,
    isBlurred,
    rank,
    totalItems,
    showOptionName = true,
    showOptionImage = true,
    fillContainer = false,
    fgColorFrom = "rgba(112,74,218,0.1)",
    fgColorTo = "rgba(152,124,258,0.7)",
}: {
    result: PollOptionResult;
    isBlurred: boolean;
    rank: number;
    totalItems: number;
    showOptionName?: boolean;
    showOptionImage?: boolean;
    fillContainer?: boolean;
    fgColorFrom?: string;
    fgColorTo?: string;
}) {
    const opacity = isBlurred ? 1 : 1 - (0.6 * rank) / totalItems;
    const displayValue = isBlurred ? 99 : result.voteRate;
    const displayText = isBlurred ? "??%" : `${Math.round(result.voteRate)}%`;

    return (
        <div
            className={cn("mb-2", fillContainer && "h-full")}
            style={{
                opacity,
            }}
        >
            <div className="flex items-center gap-2 mb-0.5">
                {showOptionImage && result.imgUrl && (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden">
                        <Image
                            src={result.imgUrl || ""}
                            alt={result.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                        />
                    </div>
                )}
                {showOptionName && (
                    <h1 className="text-sm text-[rgba(255,255,255,0.85)]">
                        {result.name}
                    </h1>
                )}
            </div>
            <div
                className={cn(
                    "relative w-full mt-1 mb-3",
                    fillContainer ? "h-full" : "h-[20px] md:h-[25px]"
                )}
            >
                <div
                    className={cn("absolute h-full rounded-r")}
                    style={{
                        background: `linear-gradient(to right, ${fgColorFrom}, ${fgColorTo})`,
                        width: `${displayValue}%`,
                        animation:
                            displayValue > 0
                                ? `fillBar 1s cubic-bezier(0, 0, 0.1, 1) forwards`
                                : "none",
                        transformOrigin: "left",
                    }}
                />
                <span
                    className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 text-[0.75rem] text-[rgba(255,255,255,0.8)]",
                        getResponsiveClass(10).textClass
                    )}
                >
                    {displayText}
                </span>
            </div>

            <style jsx>{`
                @keyframes fillBar {
                    from {
                        transform: scaleX(0);
                    }
                    to {
                        transform: scaleX(1);
                    }
                }
            `}</style>
        </div>
    );
}
