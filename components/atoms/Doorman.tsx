"use client";

import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";

interface DoormanProps {
    text?: string;
}

export default function Doorman({ text }: DoormanProps) {
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
            <div className="flex flex-col items-center gap-4">
                <img
                    src="/icons/lock.svg"
                    alt="lock"
                    className={cn(
                        getResponsiveClass(70).frameClass,
                        "aspect-square"
                    )}
                />
                <p
                    className={cn(
                        getResponsiveClass(20).textClass,
                        "text-center whitespace-break-spaces"
                    )}
                >
                    {text || "NFT Holder can only access to it."}
                </p>
            </div>
        </div>
    );
}
