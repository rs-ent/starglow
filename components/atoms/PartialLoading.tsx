/// components/atoms/PartialLoading.tsx

"use client";

import { memo } from "react";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface PartialLoadingProps {
    text?: string;
    loadingSize?: number;
    textSize?: number;
    className?: string;
}

function PartialLoading({
    text,
    loadingSize = 40,
    textSize = 5,
    className,
}: PartialLoadingProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center w-full h-full",
                className
            )}
            role="status"
            aria-label={text}
            aria-live="polite"
            data-testid="partial-loading"
        >
            <div
                className={cn(
                    "animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4",
                    getResponsiveClass(loadingSize).frameClass
                )}
            />
            {text && (
                <p
                    className={cn(
                        "mt-1 text-muted-foreground animate-pulse text-center",
                        getResponsiveClass(textSize).textClass
                    )}
                >
                    {text}
                </p>
            )}
        </div>
    );
}

export default memo(PartialLoading);
