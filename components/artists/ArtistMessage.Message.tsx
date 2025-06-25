"use client";

import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { motion } from "framer-motion";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface ArtistMessageMessageProps {
    message: string;
    className?: string;
}

// 애니메이션 설정
const MOTION_VARIANTS = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
} as const;

const MOTION_TRANSITION = {
    duration: 0.6,
    ease: "easeOut" as const,
} as const;

// 마퀴 설정
const MARQUEE_CONFIG = {
    MIN_SPACING: 40, // 최소 간격 (px)
    MAX_SPACING: 200, // 최대 간격 (px)
    BASE_SPEED: 30, // 기본 속도 (초)
    MIN_SPEED: 20, // 최소 속도 (초)
    MAX_SPEED: 60, // 최대 속도 (초)
    COPIES: 5, // 텍스트 복사본 개수
} as const;

const ArtistMessageMessage = memo(function ArtistMessageMessage({
    message,
    className,
}: ArtistMessageMessageProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const [shouldScroll, setShouldScroll] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [animationDuration, setAnimationDuration] = useState<number>(
        MARQUEE_CONFIG.BASE_SPEED
    );
    const [dynamicSpacing, setDynamicSpacing] = useState<number>(
        MARQUEE_CONFIG.MIN_SPACING
    );

    // 동적 간격 및 속도 계산
    const calculateMarqueeSettings = useCallback(() => {
        if (!containerRef.current || !textRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.scrollWidth;
        const needsScroll = textWidth > containerWidth;

        setShouldScroll(needsScroll);

        if (needsScroll) {
            // 텍스트 길이와 컨테이너 너비 기반 간격 계산
            const textLength = message.length;
            const widthRatio = textWidth / containerWidth;

            // 동적 간격: 텍스트가 길수록, 컨테이너 대비 비율이 클수록 더 큰 간격
            const baseSpacing = Math.max(
                MARQUEE_CONFIG.MIN_SPACING,
                Math.min(
                    MARQUEE_CONFIG.MAX_SPACING,
                    containerWidth * 0.2 + textLength * 0.5
                )
            );

            // 컨테이너 너비 고려한 최종 간격
            const finalSpacing = Math.round(
                baseSpacing * Math.min(widthRatio, 2)
            );
            setDynamicSpacing(finalSpacing);

            // 동적 속도: 텍스트가 길수록 느리게, 간격이 클수록 조금 더 빠르게
            const speedMultiplier = 1 + textLength / 200 - finalSpacing / 100;
            const calculatedSpeed = Math.max(
                MARQUEE_CONFIG.MIN_SPEED,
                Math.min(
                    MARQUEE_CONFIG.MAX_SPEED,
                    MARQUEE_CONFIG.BASE_SPEED * speedMultiplier
                )
            );

            setAnimationDuration(Math.round(calculatedSpeed));
        }
    }, [message]);

    // 스크롤 필요 여부 및 설정 업데이트
    useEffect(() => {
        // 초기 계산
        calculateMarqueeSettings();

        // 폰트 로딩 등을 고려한 지연 재계산
        const timer = setTimeout(calculateMarqueeSettings, 300);

        // ResizeObserver로 반응형 처리
        const resizeObserver = new ResizeObserver(() => {
            // 디바운스 효과
            clearTimeout(timer);
            setTimeout(calculateMarqueeSettings, 100);
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
            clearTimeout(timer);
        };
    }, [calculateMarqueeSettings]);

    // 이벤트 핸들러 최적화
    const handleMouseEnter = useCallback(() => {
        setIsPaused(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsPaused(false);
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        setIsPaused((prev) => !prev);
    }, []);

    // 마퀴 애니메이션 스타일 메모이제이션 (shorthand 충돌 방지)
    const marqueeAnimationStyle = useMemo(() => {
        if (!shouldScroll) return {};

        return {
            animationName: "marqueeFlow",
            animationDuration: `${animationDuration}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationPlayState: isPaused ? "paused" : "running",
            willChange: "transform",
        };
    }, [shouldScroll, animationDuration, isPaused]);

    // 컨테이너 마스크 스타일 메모이제이션
    const containerMaskStyle = useMemo(() => {
        if (!shouldScroll) return {};

        return {
            maskImage:
                "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
            WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        };
    }, [shouldScroll]);

    // 텍스트 복사본 생성 (동적 간격 적용)
    const textCopies = useMemo(() => {
        if (!shouldScroll) return null;

        return Array.from({ length: MARQUEE_CONFIG.COPIES }, (_, index) => (
            <span
                key={index}
                className="inline-block"
                style={{ paddingRight: `${dynamicSpacing}px` }}
                aria-hidden={index > 0 ? "true" : undefined}
            >
                {message}
            </span>
        ));
    }, [shouldScroll, message, dynamicSpacing]);

    // 반응형 텍스트 클래스
    const textClass = useMemo(() => getResponsiveClass(20).textClass, []);

    const paddingClass = useMemo(() => getResponsiveClass(30).paddingClass, []);

    return (
        <>
            {/* 최적화된 키프레임 정의 */}
            <style>{`
                @keyframes marqueeFlow {
                    0% {
                        transform: translateX(100%);
                    }
                    100% {
                        transform: translateX(-100%);
                    }
                }
                
                .marquee-container {
                    contain: layout style paint;
                }
                
                .marquee-text {
                    backface-visibility: hidden;
                    perspective: 1000px;
                }
            `}</style>

            <motion.div
                initial={MOTION_VARIANTS.initial}
                animate={MOTION_VARIANTS.animate}
                exit={MOTION_VARIANTS.exit}
                transition={MOTION_TRANSITION}
                className={cn("relative w-full", className)}
            >
                {/* 메시지 컨테이너 */}
                <div
                    className={cn(
                        "relative bg-gradient-to-r from-white/10 to-white/5",
                        "backdrop-blur-lg border border-white/20",
                        "rounded-full shadow-2xl morp-glass-3",
                        "hover:shadow-white/20 hover:border-white/30",
                        "transition-all duration-300",
                        paddingClass
                    )}
                >
                    {/* 텍스트 영역 */}
                    <div
                        ref={containerRef}
                        className={cn(
                            "relative overflow-hidden marquee-container",
                            shouldScroll && "cursor-pointer"
                        )}
                        style={containerMaskStyle}
                        onMouseEnter={
                            shouldScroll ? handleMouseEnter : undefined
                        }
                        onMouseLeave={
                            shouldScroll ? handleMouseLeave : undefined
                        }
                        onTouchStart={
                            shouldScroll ? handleTouchStart : undefined
                        }
                    >
                        {shouldScroll ? (
                            // 스크롤이 필요한 경우 - 최적화된 마퀴 효과
                            <div className="relative w-full">
                                <div
                                    ref={textRef}
                                    className={cn(
                                        "text-white font-medium whitespace-nowrap marquee-text",
                                        textClass
                                    )}
                                    style={marqueeAnimationStyle}
                                >
                                    {textCopies}
                                </div>
                            </div>
                        ) : (
                            // 스크롤이 필요하지 않은 경우 - 중앙 정렬
                            <div
                                ref={textRef}
                                className={cn(
                                    "text-white font-medium text-center",
                                    textClass
                                )}
                            >
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    );
});

ArtistMessageMessage.displayName = "ArtistMessageMessage";

export default ArtistMessageMessage;
