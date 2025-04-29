/// components\atoms\Polls.Bar.tsx

"use client";

import { PollOptionResult } from "@/app/actions/polls";
import Image from "next/image";

export default function PollBar({
    result,
    isBlurred,
    rank,
    totalItems,
}: {
    result: PollOptionResult;
    isBlurred: boolean;
    rank: number;
    totalItems: number;
}) {
    const opacity = isBlurred ? 1 : 1 - (0.6 * rank) / totalItems;
    const displayValue = isBlurred ? 99 : result.voteRate;
    const displayText = isBlurred ? "??%" : `${Math.round(result.voteRate)}%`;

    return (
        <div className="mb-2">
            <div className="flex items-center gap-2 mb-0.5">
                {result.imgUrl && (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden">
                        <Image
                            src={result.imgUrl || ""}
                            alt={result.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}
                <h1 className="text-sm text-[rgba(255,255,255,0.85)]">
                    {result.name}
                </h1>
            </div>
            <div className="relative h-[34px] w-full">
                <div
                    className="absolute h-full bg-[rgb(132,94,238)] rounded-r transition-all duration-300"
                    style={{
                        width: `${displayValue}%`,
                        opacity,
                    }}
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[0.75rem] text-[rgba(255,255,255,0.8)]">
                    {displayText}
                </span>
            </div>
        </div>
    );
}
