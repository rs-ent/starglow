/// components\atoms\Icon.tsx

import type { LucideIcon } from "lucide-react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface IconProps {
    icon: LucideIcon;
    size?: number;
    className?: string;
    strokeWidth?: number;
    onClick?: () => void;
}

export default function Icon({
    icon: IconComponent,
    size = 20,
    strokeWidth = 2,
    className,
    onClick,
}: IconProps) {

    const { frameClass } = getResponsiveClass(size);

    return (
        <IconComponent
            size={size}
            strokeWidth={strokeWidth}
            onClick={onClick}
            className={cn("text-foreground", frameClass, className)}
        />
    );
}