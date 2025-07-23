"use client";

import { cn } from "@/lib/utils/tailwind";

export const ShimmerEffect = ({ className }: { className?: string }) => (
    <div
        className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent animate-shimmer -skew-x-12",
            className
        )}
    />
);
