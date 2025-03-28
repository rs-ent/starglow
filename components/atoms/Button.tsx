/// components\atoms\Button.tsx

import { Button as ShadcnButton } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";

interface ButtonProps {
    children: React.ReactNode;
    icon?: LucideIcon;
    onClick?: () => void;
    disabled?: boolean;
    variant?: "default" | "space" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    className?: string;
}

export default function Button({ 
    children, 
    icon: Icon, 
    onClick, 
    disabled = false, 
    variant = "default",
    className = "",
}: ButtonProps) {
    return (
        <ShadcnButton
            onClick={onClick}
            variant={variant}
            disabled={disabled}
            className={cn("flex items-center", className)}
        >
            {Icon && <Icon className="w-4 h-4 mr-2" />}
            {children}
        </ShadcnButton>
    )
}