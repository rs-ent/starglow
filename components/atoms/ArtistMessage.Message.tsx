/// components/atoms/ArtistMessage.Message.tsx

"use client";

import React, { useRef, useEffect, useState } from "react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { motion, AnimatePresence } from "framer-motion";

interface ArtistMessageMessageProps {
    message: string;
    size?: number;
    animationDuration?: number;
    animationDelay?: number;
    className?: string;
}

export default function ArtistMessageMessage({
    message,
    size = 30,
    animationDuration = 25,
    animationDelay = 100,
    className,
}: ArtistMessageMessageProps) {
    const spanRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [messageWidth, setMessageWidth] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (spanRef.current) {
            setMessageWidth(spanRef.current.offsetWidth);
        }
        if (containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth);
        }
    }, [message, size]);

    const gap = animationDelay;

    const handleMouseEnter = () => setIsPaused(true);
    const handleMouseLeave = () => setIsPaused(false);
    const handleTouchStart = () => setIsPaused(!isPaused);

    const marqueeStyle =
        messageWidth > 0 && containerWidth > 0
            ? {
                  animation: `marquee ${animationDuration}s linear infinite`,
                  minWidth: messageWidth * 2 + gap,
                  animationPlayState: isPaused ? "paused" : "running",
              }
            : {};

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -100 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="shadow-lg rounded-full mb-5"
                style={{
                    boxShadow: `
                    0 5px 1px rgba(0,0,0,0.15),
                    0 0 24px 6px rgba(255,255,255,0.2) inset
                `,
                    background: "transparent",
                    display: "inline-block",
                    position: "relative",
                }}
            >
                <div className="absolute right-0 top-0 z-10 rotate-[15deg]">
                    <El03Icon className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                </div>
                <div
                    ref={containerRef}
                    className={cn(
                        "text-sm rounded-full overflow-hidden whitespace-nowrap py-4",
                        "backdrop-blur-xs",
                        getResponsiveClass(size).textClass,
                        className
                    )}
                    style={{
                        position: "relative",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.75)",
                        WebkitMaskImage: `
    linear-gradient(to right, transparent 0%, black 15%, black 100%),
    linear-gradient(to left, transparent 0%, black 15%, black 100%)
`,
                        maskImage: `
    linear-gradient(to right, transparent 0%, black 15%, black 100%),
    linear-gradient(to left, transparent 0%, black 15%, black 100%)
`,
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskSize: "50% 100%, 50% 100%",
                        maskSize: "50% 100%, 50% 100%",
                        WebkitMaskPosition: "left, right",
                        maskPosition: "left, right",
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                >
                    <div
                        style={{
                            ...marqueeStyle,
                            display: "inline-block",
                            whiteSpace: "nowrap",
                        }}
                    >
                        <span ref={spanRef} style={{ display: "inline-block" }}>
                            {message}
                        </span>
                        <span
                            aria-hidden="true"
                            style={{
                                display: "inline-block",
                                marginLeft: gap,
                            }}
                        >
                            {message}
                        </span>
                    </div>
                    {messageWidth > 0 && containerWidth > 0 && (
                        <style>{`
                    @keyframes marquee {
                        0% {
                            transform: translateX(${containerWidth}px);
                        }
                        100% {
                            transform: translateX(-${messageWidth * 2 + gap}px);
                        }
                    }
                `}</style>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function El03Icon({ className = "" }) {
    return (
        <svg
            width="17"
            height="28"
            viewBox="0 0 17 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M8.5 28C8.5 28 8.65305 20.8234 10.796 17.7816C12.6168 15.197 17 14 17 14C17 14 12.6168 12.803 10.796 10.2184C8.65305 7.17663 8.5 1.98382e-06 8.5 1.98382e-06C8.5 1.98382e-06 8.34695 7.17663 6.20402 10.2184C4.38317 12.803 -1.22392e-06 14 -1.22392e-06 14C-1.22392e-06 14 4.38317 15.197 6.20402 17.7816C8.34695 20.8234 8.5 28 8.5 28Z"
                fill="white"
            />
        </svg>
    );
}
