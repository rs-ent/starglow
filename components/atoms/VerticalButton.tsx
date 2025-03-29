/// components/atoms/VerticalButton.tsx

import { Button as ShadcnButton } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { Paragraph } from "./Typography";
import Image from "next/image";

interface VerticalButtonProps {
    icon?: LucideIcon;
    iconSpinning?: boolean;
    img?: string;
    imgSpinning?: boolean;
    label: string;
    textSize?: number;
    paddingSize?: number;
    frameSize?: number;
    gapSize?: number;
    isActive?: boolean;
    variant?: "default" | "space" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    onClick?: () => void;
    className?: string;
}

export default function VerticalButton({
    icon: Icon,
    iconSpinning = false,
    img,
    imgSpinning = false,
    label,
    textSize = 15,
    paddingSize = 10,
    frameSize = 25,
    gapSize = 5,
    isActive = false,
    variant = "ghost",
    onClick,
    className = "",
}: VerticalButtonProps) {
    const { textClass } = getResponsiveClass(textSize);
    const { paddingClass } = getResponsiveClass(paddingSize);
    const { frameClass } = getResponsiveClass(frameSize);
    const { gapClass } = getResponsiveClass(gapSize);

    return (
        <ShadcnButton
            variant={variant}
            onClick={isActive ? undefined : onClick}
            className={cn(
                "flex flex-col h-auto items-center justify-center transition-all",
                isActive ? "opacity-100" : "cursor-point opacity-50",
                paddingClass,
                gapClass,
                className,
            )}
        >
            {Icon && !img && (
                <div className={cn(frameClass, "flex items-center justify-center")}>
                    <Icon
                        strokeWidth={2}
                        className={cn("w-full h-full min-w-full min-h-full", iconSpinning && "animate-spin")}
                    />
                </div>
            )}

            {img && !Icon && (
                img.endsWith('.svg') ? (
                    <img
                        src={img}
                        alt="Button Image"
                        className={cn(frameClass, imgSpinning && "animate-spin")}
                        style={{ width: `${frameSize}px`, height: 'auto' }}
                    />
                ) : (
                    <Image
                        src={img}
                        alt="Button Image"
                        width={frameSize}
                        height={frameSize}
                        className={cn(frameClass, imgSpinning && "animate-spin")}
                        style={{ objectFit: 'contain' }}
                    />
                )
            )}

            {label && (
                <Paragraph className={cn(textClass, "text-center")}>
                    {label}
                </Paragraph>
            )}
        </ShadcnButton>
    )
}
