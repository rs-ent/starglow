/// atoms/PartialLoading.tsx

import { Loader2 } from "lucide-react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useEffect, useState } from "react";

interface PartialLoadingProps {
    text: string;
    className?: string;
    size?: "xs" | "sm" | "md" | "lg";
    textSize?: number;
    gapSize?: number;
    variant?: "default" | "primary" | "secondary";
    fullScreen?: boolean;
    delay?: number;
}

export default function PartialLoading({
    text,
    className = "",
    size = "md",
    textSize = 15,
    gapSize = 5,
    variant = "default",
    fullScreen = false,
    delay = 100,
}: PartialLoadingProps) {
    const [isVisible, setIsVisible] = useState(delay === 0);

    useEffect(() => {
        if (delay > 0) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [delay]);

    if (!isVisible) return null;

    const sizeClasses = {
        xs: "w-4 h-4",
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16",
    };

    const variantClasses = {
        default: "text-white",
        primary: "text-primary",
        secondary: "text-secondary",
    };

    const containerClasses = cn(
        "flex items-center justify-center",
        fullScreen
            ? "fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            : "w-full h-full",
        className
    );

    return (
        <div className={containerClasses} role="status" aria-label={text}>
            <div
                className={cn(
                    "flex flex-col items-center justify-center",
                    getResponsiveClass(gapSize).gapClass
                )}
            >
                <div className="relative">
                    <Loader2
                        className={cn(
                            "animate-spin",
                            sizeClasses[size],
                            variantClasses[variant]
                        )}
                    />
                </div>
                <p
                    className={cn(
                        "text-muted-foreground animate-fade-in",
                        getResponsiveClass(textSize).textClass
                    )}
                >
                    {text}
                </p>
            </div>
        </div>
    );
}
