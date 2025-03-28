/// components\atoms\Icon.tsx

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";

interface IconProps {
    icon: LucideIcon;
    size?: number;
    className?: string;
    strokeWidth?: number;
}

export default function Icon({
    icon: IconComponent,
    size = 20,
    strokeWidth = 2,
    className,
}: IconProps) {
    return (
        <IconComponent
            size={size}
            strokeWidth={strokeWidth}
            className={cn("text-foreground", className)}
        />
    );
}