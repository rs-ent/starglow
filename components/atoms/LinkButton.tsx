/// components\atoms\LinkButton.tsx

import Link from "next/link";
import Image from "next/image";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface LinkButtonProps {
    href: string;
    children: React.ReactNode;
    className?: string;
    target?: string;
    frameSize?: number;
    paddingSize?: number;
    textSize?: number;
    gapSize?: number;
    img?: string;
    imgSpinning?: boolean;
    imgLeft?: boolean;
    onClick?: () => void;
}

export default function LinkButton({
    href,
    children,
    className,
    target = "_self",
    frameSize = 20,
    paddingSize = 20,
    textSize = 20,
    gapSize = 20,
    img,
    imgSpinning = false,
    imgLeft = true,
    onClick,
}: LinkButtonProps) {

    const { textClass } = getResponsiveClass(textSize);
    const { paddingClass } = getResponsiveClass(paddingSize);
    const { frameClass } = getResponsiveClass(frameSize);
    const { gapClass } = getResponsiveClass(gapSize);

    return (
        <Link
            href={href}
            target={target}
            className={cn(
                "flex text-base font-main text-foreground hover:text-accent transition-all items-center", textClass, paddingClass, gapClass, className
            )}
            onClick={onClick}
        >
            {img && imgLeft && (
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

            {children}
            {img && !imgLeft && (
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

        </Link>
    );
}