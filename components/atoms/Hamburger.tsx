/// components\atoms\Hamburger.tsx

"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/tailwind";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import animationData from "../../public/ui/menu-to-x.json";

interface HamburgerProps {
    isOpen: boolean;
    toggle: () => void;
    size?: number;
    className?: string;
}

export default function Hamburger({
    isOpen,
    toggle,
    size = 50,
    className = "",
}: HamburgerProps) {
    const lottieRef = useRef<LottieRefCurrentProps>(null);

    useEffect(() => {
        if (lottieRef.current) {
            if (isOpen) {
                lottieRef.current.playSegments([0, 45], true);
            } else {
                lottieRef.current.playSegments([45, 97], true);
            }
        }
    }, [isOpen]);

    return (
        <button
            onClick={toggle}
            className={cn("flex cursor-pointer items-center justify-center", className)}
            aria-label="Toggle menu"
            style={{ width: size, height: size }}
        >
            <Lottie
                lottieRef={lottieRef}
                animationData={animationData}
                loop={false}
                autoplay={false}
                style={{ width: size * 3, height: size * 3, filter: "invert(1) brightness(2)" }}
            />
        </button>
    );
}