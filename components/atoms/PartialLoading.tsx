/// atoms/PartialLoading.tsx

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";
import { useEffect, useState } from "react";

interface PartialLoadingProps {
    text: string;
    className?: string;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "primary" | "secondary";
    fullScreen?: boolean;
    delay?: number;
}

export default function PartialLoading({
    text,
    className = "",
    size = "md",
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
            <div className="flex flex-col items-center justify-center">
                <div className="relative">
                    <Loader2
                        className={cn(
                            "animate-spin mb-4",
                            sizeClasses[size],
                            variantClasses[variant]
                        )}
                    />
                    <div className="absolute inset-0 animate-pulse opacity-50">
                        <Loader2
                            className={cn(
                                sizeClasses[size],
                                variantClasses[variant]
                            )}
                        />
                    </div>
                </div>
                <p className="text-lg text-muted-foreground animate-fade-in">
                    {text}
                </p>
            </div>
        </div>
    );
}
