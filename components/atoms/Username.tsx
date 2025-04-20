/// components\atoms\Username.tsx
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";

interface UsernameProps {
    name: string;
    className?: string;
    size?: number;
    truncate?: boolean;
}

export default function Username({
    name = "",
    className,
    size = 20,
    truncate = false,
}: UsernameProps) {
    const responsiveClass = getResponsiveClass(size);
    const textClass = responsiveClass.textClass;
    return (
        <h2
            className={cn(
                "text-lg font-semibold w-full",
                className,
                textClass,
                truncate ? "truncate" : ""
            )}
        >
            {name}
        </h2>
    );
}
