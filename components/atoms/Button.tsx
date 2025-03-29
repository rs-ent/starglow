/// components\atoms\Button.tsx

import { Button as ShadcnButton } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import Image from "next/image";

interface ButtonProps {
    children: React.ReactNode;
    frameSize?: number;
    textSize?: number;
    paddingSize?: number;
    gapSize?: number;
    img?: string;
    imgSpinning?: boolean;
    imgLeft?: boolean;
    icon?: LucideIcon;
    iconSpinning?: boolean;
    iconLeft?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    variant?: "default" | "space" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    className?: string;
}

export default function Button({
    children,
    frameSize = 20,
    textSize = 20,
    paddingSize = 20,
    gapSize = 20,
    img,
    imgSpinning = false,
    imgLeft = true,
    icon: Icon,
    iconSpinning = false,
    iconLeft = true,
    onClick,
    disabled = false,
    variant = "default",
    className = "",
}: ButtonProps) {

    const { textClass } = getResponsiveClass(textSize);
    const { paddingClass } = getResponsiveClass(paddingSize);
    const { frameClass } = getResponsiveClass(frameSize);
    const { gapClass } = getResponsiveClass(gapSize);

    return (
        <ShadcnButton
            onClick={onClick}
            variant={variant}
            disabled={disabled}
            className={cn("flex items-center justify-center cursor-pointer transition-all", textClass, paddingClass, gapClass, className)}
        >
            {(Icon && iconLeft) && (
                <div className={cn(frameClass, "flex items-center justify-center")}>
                    <Icon
                        strokeWidth={2}
                        className={cn("w-full h-full min-w-full min-h-full", iconSpinning && "animate-spin")}
                    />
                </div>
            )}

            {(img && imgLeft) && (
                <Image
                    src={img}
                    alt="Button Image"
                    width={frameSize}
                    height={frameSize}
                    className={cn(frameClass, imgSpinning && "animate-spin")}
                />
            )}

            {children}

            {(Icon && !iconLeft) && (
                <div className={cn(frameClass, "flex items-center justify-center")}>
                    <Icon
                        strokeWidth={2}
                        className={cn("w-full h-full min-w-full min-h-full", iconSpinning && "animate-spin")}
                    />
                </div>
            )}

            {(img && !imgLeft) && (
                <Image
                    src={img}
                    alt="Button Image"
                    width={frameSize}
                    height={frameSize}
                    className={cn(frameClass, imgSpinning && "animate-spin")}
                />
            )}
        </ShadcnButton>
    );

}