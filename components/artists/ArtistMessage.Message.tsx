"use client";

import React, {memo, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {getResponsiveClass} from "@/lib/utils/responsiveClass";
import {cn} from "@/lib/utils/tailwind";
import {motion} from "framer-motion";

interface ArtistMessageMessageProps {
    message: string;
    size?: number;
    animationDuration?: number;
    animationDelay?: number;
    className?: string;
}

// 애니메이션 설정을 상수로 분리
const MOTION_VARIANTS = {
    initial: { opacity: 0, y: 100 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -100 }
};

const MOTION_TRANSITION = {
    duration: 0.9,
    ease: "easeOut"
};

// 아이콘 컴포넌트 메모이제이션
const El03Icon = memo(({  }) => {
    return (
        <svg
            width="17"
            height="28"
            viewBox="0 0 17 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
        >
            <path
                d="M8.5 28C8.5 28 8.65305 20.8234 10.796 17.7816C12.6168 15.197 17 14 17 14C17 14 12.6168 12.803 10.796 10.2184C8.65305 7.17663 8.5 1.98382e-06 8.5 1.98382e-06C8.5 1.98382e-06 8.34695 7.17663 6.20402 10.2184C4.38317 12.803 -1.22392e-06 14 -1.22392e-06 14C-1.22392e-06 14 4.38317 15.197 6.20402 17.7816C8.34695 20.8234 8.5 28 8.5 28Z"
                fill="white"
            />
        </svg>
    );
});

El03Icon.displayName = 'El03Icon';

interface MarqueeStyle {
    animation?: string;
    minWidth?: number;
    animationPlayState?: 'paused' | 'running';
}

const ArtistMessageMessage = memo(function ArtistMessageMessage({
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

    // 크기 측정 로직 최적화
    useEffect(() => {
        // ResizeObserver를 사용하여 크기 변화 감지
        if (spanRef.current && containerRef.current) {
            const updateWidths = () => {
                if (spanRef.current && containerRef.current) {
                    setMessageWidth(spanRef.current.offsetWidth);
                    setContainerWidth(containerRef.current.offsetWidth);
                }
            };

            // 초기 측정
            updateWidths();

            // ResizeObserver 설정
            const resizeObserver = new ResizeObserver(updateWidths);
            resizeObserver.observe(spanRef.current);
            resizeObserver.observe(containerRef.current);

            return () => {
                resizeObserver.disconnect();
            };
        }
    }, [message, size]);

    // 이벤트 핸들러 최적화
    const handleMouseEnter = useCallback(() => setIsPaused(true), []);
    const handleMouseLeave = useCallback(() => setIsPaused(false), []);
    const handleTouchStart = useCallback(() => setIsPaused(prev => !prev), []);

    // 마퀴 스타일 메모이제이션
    const marqueeStyle = useMemo<MarqueeStyle>(() => {
        if (messageWidth <= 0 || containerWidth <= 0) return {};

        return {
            animation: `marquee ${animationDuration}s linear infinite`,
            minWidth: messageWidth * 2 + animationDelay,
            animationPlayState: isPaused ? "paused" : "running",
        };
    }, [messageWidth, containerWidth, animationDuration, animationDelay, isPaused]);

    // 컨테이너 스타일 메모이제이션
    const containerStyle = useMemo(() => ({
        position: "relative" as const,
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
    }), []);

    // 모션 스타일 메모이제이션
    const motionStyle = useMemo(() => ({
        boxShadow: `
            0 5px 1px rgba(0,0,0,0.15),
            0 0 24px 6px rgba(255,255,255,0.2) inset
        `,
        background: "transparent",
        display: "inline-block",
        position: "relative" as const,
    }), []);

    // 애니메이션 키프레임 메모이제이션
    const keyframesStyle = useMemo(() => {
        if (messageWidth <= 0 || containerWidth <= 0) return null;

        return `
            @keyframes marquee {
                0% {
                    transform: translateX(${containerWidth}px);
                }
                100% {
                    transform: translateX(-${messageWidth * 2 + animationDelay}px);
                }
            }
        `;
    }, [messageWidth, containerWidth, animationDelay]);

    // 반응형 클래스 메모이제이션
    const responsiveClass = useMemo(() =>
            getResponsiveClass(size).textClass,
        [size]);

    return (
        <motion.div
            initial={MOTION_VARIANTS.initial}
            animate={MOTION_VARIANTS.animate}
            exit={MOTION_VARIANTS.exit}
            transition={MOTION_TRANSITION}
            className="shadow-lg rounded-full mb-5"
            style={motionStyle}
        >
            <div className="absolute right-0 top-0 z-10 rotate-[15deg]">
                <El03Icon />
            </div>
            <div
                ref={containerRef}
                className={cn(
                    "text-sm rounded-full overflow-hidden whitespace-nowrap py-4",
                    "backdrop-blur-xs",
                    responsiveClass,
                    className
                )}
                style={containerStyle}
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
                            marginLeft: animationDelay,
                        }}
                    >
                        {message}
                    </span>
                </div>
                {keyframesStyle && <style>{keyframesStyle}</style>}
            </div>
        </motion.div>
    );
});

ArtistMessageMessage.displayName = 'ArtistMessageMessage';

export default ArtistMessageMessage;