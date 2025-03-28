/// components/atoms/Badge.tsx

import { cn } from "@/lib/utils/tailwind";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "primary" | "secondary" | "success" | "danger";
    className?: string;
}

const variants = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    success: "bg-accent text-accent-foreground",
    danger: "bg-destructive text-card-foreground",
};

export default function Badge({
    children,
    variant = "default",
    className,
}: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                variants[variant],
                className
            )}
        >
            {children}
        </span>
    );
}