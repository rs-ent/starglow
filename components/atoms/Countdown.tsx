/// components/atoms/Countdown.tsx

import { useState, useEffect } from "react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface CountdownProps {
    endDate: Date;
    size?: number;
    blinkingThreshold?: number;
    onTick?: (timeLeft: number) => void;
    onComplete?: () => void;
    className?: string;
}

export default function Countdown({
    endDate,
    size = 40,
    blinkingThreshold = 60 * 5, // 5분
    onTick,
    onComplete,
    className,
}: CountdownProps) {
    const [isBlinking, setIsBlinking] = useState(false);
    const [timeLeft, setTimeLeft] = useState("00:00:00");

    const responsiveClass = getResponsiveClass(size);

    useEffect(() => {
        const timer = setInterval(() => {
            const today = new Date(
                new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
            );

            let diffSec = Math.floor(
                (endDate.getTime() - today.getTime()) / 1000
            );
            if (diffSec <= 0) {
                diffSec = 0;
            }

            if (diffSec <= blinkingThreshold) {
                setIsBlinking(true);
            } else {
                setIsBlinking(false);
            }

            const hours = Math.floor(diffSec / 3600);
            const minutes = Math.floor((diffSec % 3600) / 60);
            const seconds = diffSec % 60;

            const hh = String(hours).padStart(2, "0");
            const mm = String(minutes).padStart(2, "0");
            const ss = String(seconds).padStart(2, "0");

            if (onTick) {
                onTick(diffSec);
            }

            setTimeLeft(`${hh}:${mm}:${ss}`);
        }, 1000);

        return () => clearInterval(timer);
    }, [endDate, onTick]);

    return (
        <div
            className={cn(
                isBlinking && "blink",
                responsiveClass.textClass,
                className
            )}
        >
            {timeLeft}
        </div>
    );
}
