/// components\atoms\Icon.tsx

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import type { LucideIcon } from "lucide-react";

interface IconProps {
    icon?: LucideIcon;
    svg?: string;
    size?: number;
    className?: string;
    strokeWidth?: number;
    onClick?: () => void;
}

const isSvgFile = (url: string) => /\.svg$/i.test(url);

export default function Icon({
    icon: IconComponent,
    svg,
    size = 20,
    strokeWidth = 2,
    className,
    onClick,
}: IconProps) {
    const { frameClass } = getResponsiveClass(size);

    if (svg) {
        if (!isSvgFile(svg)) {
            console.error(
                "[Icon Component] Invalid file type provided. Only SVG files are allowed."
            );
            return null;
        }

        return (
            <img
                src={svg}
                width={size}
                height={size}
                alt="icon"
                className={cn("text-foreground", frameClass, className)}
                onClick={onClick}
            />
        );
    }

    if (!IconComponent) {
        console.error("[Icon Component] No valid icon or SVG source provided.");
        return null;
    }

    return (
        <IconComponent
            size={size}
            strokeWidth={strokeWidth}
            onClick={onClick}
            className={cn("text-foreground", frameClass, className)}
        />
    );
}
