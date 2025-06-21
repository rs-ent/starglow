import * as React from "react";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils/tailwind";

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
    size?: "sm" | "default" | "lg";
}

export function Spinner({
    className,
    size = "default",
    ...props
}: SpinnerProps) {
    return (
        <Loader2
            className={cn(
                "animate-spin text-muted-foreground",
                {
                    "h-4 w-4": size === "sm",
                    "h-5 w-5": size === "default",
                    "h-6 w-6": size === "lg",
                },
                className
            )}
            {...props}
        />
    );
}
