/// components/raffles/Raffle.Reveal.Scratch.tsx

"use client";

import { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Star, Sparkles, Gem, Crown } from "lucide-react";
import Image from "next/image";
import confetti from "canvas-confetti";

import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { tierMap } from "./raffle-tier";

interface Prize {
    id: string;
    title: string;
    prizeType: "NFT" | "ASSET" | "EMPTY";
    order: number;
    rarity?: number;
    quantity: number;
    spg?: {
        imageUrl?: string;
        metadata?: {
            image?: string;
        };
    };
    asset?: {
        iconUrl?: string;
        symbol?: string;
    };
}

interface RaffleScratchCardProps {
    prize?: Prize | null;
    onReveal?: () => void;
    className?: string;
    cardSize?: {
        width: number;
        height: number;
    };
}

// 직접 구현한 스크래치 카드 컴포넌트 - 근본적 개선 버전
const CustomScratchCard = memo(function CustomScratchCard({
    width,
    height,
    onComplete,
    onAutoReveal,
    children,
    scratchColor = "#C0C0C0",
}: {
    width: number;
    height: number;
    onComplete?: () => void;
    onAutoReveal?: (autoRevealFn: () => void) => void;
    children: React.ReactNode;
    scratchColor?: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScratching, setIsScratching] = useState(false);
    const [canvasOpacity, setCanvasOpacity] = useState(1);

    // 성능 최적화를 위한 상태 관리
    const completionStateRef = useRef({
        isCompleted: false,
        isProcessing: false,
        scratchCount: 0,
        lastCheckTime: 0,
    });

    // 🚀 성능 최적화: 값들을 캐싱해서 불필요한 재계산 방지
    const cachedValuesRef = useRef({
        brushSize: 0,
        canvasRect: null as DOMRect | null,
        lastResizeTime: 0,
    });

    // 디바운스된 완료 체크
    const checkCompletionDebounced = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d", {
            // 성능 최적화 옵션
            alpha: true,
            desynchronized: true,
            willReadFrequently: false,
        });

        if (canvas && ctx) {
            // 고해상도 디스플레이 대응
            const dpr = window.devicePixelRatio || 1;

            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);

            // 스크래치 레이어 생성
            ctx.fillStyle = scratchColor;
            ctx.fillRect(0, 0, width, height);

            // 그라디언트로 더 매력적인 스크래치 표면 만들기
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, scratchColor);
            gradient.addColorStop(0.5, "#E5E7EB");
            gradient.addColorStop(1, scratchColor);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // 🚀 반응형 최적화: 스크래치 힌트 텍스트
            ctx.fillStyle = "#4B5563";
            // 카드 크기에 따른 동적 폰트 크기 (더 정교한 계산)
            const baseSize = Math.min(width, height);
            const fontSize =
                baseSize < 300
                    ? Math.max(10, baseSize * 0.04) // 작은 카드
                    : baseSize < 400
                    ? Math.max(12, baseSize * 0.045) // 중간 카드
                    : Math.max(14, baseSize * 0.05); // 큰 카드

            ctx.font = `bold ${Math.round(fontSize)}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // 텍스트가 카드에 맞게 조정
            const text = "🎁 Scratch to reveal! 🎁";
            ctx.fillText(text, width / 2, height / 2);

            // 상태 초기화
            completionStateRef.current = {
                isCompleted: false,
                isProcessing: false,
                scratchCount: 0,
                lastCheckTime: 0,
            };
        }

        // cleanup
        return () => {
            if (checkCompletionDebounced.current) {
                clearTimeout(checkCompletionDebounced.current);
            }
        };
    }, [width, height, scratchColor]);

    // 🚀 성능 최적화: resize 이벤트로 캐시 무효화
    useEffect(() => {
        const handleResize = () => {
            // 캐시 무효화 (새 크기로 재계산하도록)
            cachedValuesRef.current.brushSize = 0;
            cachedValuesRef.current.canvasRect = null;
            cachedValuesRef.current.lastResizeTime = 0;
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // 🚀 성능 최적화: 브러시 크기 계산 및 캐싱
    const calculateBrushSize = useCallback(() => {
        const now = Date.now();

        // 100ms 쓰로틀링으로 불필요한 재계산 방지
        if (
            now - cachedValuesRef.current.lastResizeTime < 100 &&
            cachedValuesRef.current.brushSize > 0
        ) {
            return cachedValuesRef.current.brushSize;
        }

        const screenWidth = window.innerWidth;
        const canvasWidth = width;
        let brushSize: number;

        // 화면 크기와 캔버스 크기에 따른 동적 브러시 크기
        if (screenWidth < 400) {
            brushSize = Math.max(24, canvasWidth * 0.055);
        } else if (screenWidth < 600) {
            brushSize = Math.max(30, canvasWidth * 0.065);
        } else if (screenWidth < 768) {
            brushSize = Math.max(30, canvasWidth * 0.065);
        } else if (screenWidth < 1024) {
            brushSize = Math.max(35, canvasWidth * 0.075);
        } else if (screenWidth < 1440) {
            brushSize = Math.max(40, canvasWidth * 0.085);
        } else {
            brushSize = Math.max(45, canvasWidth * 0.095);
        }

        // 캐시 업데이트
        cachedValuesRef.current.brushSize = brushSize;
        cachedValuesRef.current.lastResizeTime = now;

        return brushSize;
    }, [width]);

    // 🚀 캐싱된 캔버스 영역 정보 가져오기
    const getCanvasRect = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        // 캐시된 값이 있고 여전히 유효한 경우 사용
        const now = Date.now();
        if (
            cachedValuesRef.current.canvasRect &&
            now - cachedValuesRef.current.lastResizeTime < 500
        ) {
            return cachedValuesRef.current.canvasRect;
        }

        // 새로 계산하고 캐시
        const rect = canvas.getBoundingClientRect();
        cachedValuesRef.current.canvasRect = rect;
        cachedValuesRef.current.lastResizeTime = now;

        return rect;
    }, []);

    const scratch = useCallback(
        (clientX: number, clientY: number) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");

            if (canvas && ctx && !completionStateRef.current.isCompleted) {
                // 🚀 성능 최적화: 캐싱된 rect 사용
                const rect = getCanvasRect();
                if (!rect) return;

                const dpr = window.devicePixelRatio || 1;

                // 고해상도 디스플레이를 고려한 좌표 계산
                const scaleX = canvas.width / dpr / rect.width;
                const scaleY = canvas.height / dpr / rect.height;

                const x = (clientX - rect.left) * scaleX;
                const y = (clientY - rect.top) * scaleY;

                ctx.globalCompositeOperation = "destination-out";
                ctx.beginPath();
                // 🚀 성능 최적화: 캐싱된 브러시 크기 사용
                const brushSize = calculateBrushSize();
                ctx.arc(x, y, brushSize, 0, Math.PI * 2);
                ctx.fill();

                // 스크래치 횟수 증가
                completionStateRef.current.scratchCount++;
            }
        },
        [calculateBrushSize, getCanvasRect]
    );

    // 🚀 근본적 개선: 샘플링 기반 완료 체크 (성능 최적화)
    const checkCompletionOptimized = useCallback(() => {
        if (
            completionStateRef.current.isCompleted ||
            completionStateRef.current.isProcessing
        ) {
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");

        if (!canvas || !ctx) return;

        // 최소 스크래치 횟수 체크 (너무 빨리 완료되는 것 방지)
        if (completionStateRef.current.scratchCount < 3) return;

        // 쓰로틀링: 100ms 간격으로만 체크
        const now = Date.now();
        if (now - completionStateRef.current.lastCheckTime < 100) return;

        completionStateRef.current.lastCheckTime = now;
        completionStateRef.current.isProcessing = true;

        try {
            // 🎯 핵심 최적화: 샘플링으로 픽셀 체크 (전체의 10%만 검사)
            const sampleRate = 10; // 10픽셀마다 1개씩 검사
            const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );
            const pixels = imageData.data;

            let sampleCount = 0;
            let transparentSamples = 0;

            for (let i = 3; i < pixels.length; i += 4 * sampleRate) {
                sampleCount++;
                if (pixels[i] < 128) {
                    transparentSamples++;
                }
            }

            const scratchPercentage = (transparentSamples / sampleCount) * 100;

            if (scratchPercentage > 50) {
                // 완료 상태 설정
                completionStateRef.current.isCompleted = true;

                // 한 번만 실행되는 fadeOut 애니메이션
                let alpha = 1;
                const fadeStep = 0.045;

                const fadeOut = () => {
                    alpha -= fadeStep;

                    if (alpha <= 0) {
                        setCanvasOpacity(0);
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // onComplete 콜백을 단 한 번만 호출
                        if (onComplete) {
                            setTimeout(onComplete, 100);
                        }
                        return;
                    }

                    setCanvasOpacity(alpha);
                    requestAnimationFrame(fadeOut);
                };

                fadeOut();
            }
        } finally {
            completionStateRef.current.isProcessing = false;
        }
    }, [onComplete]);

    // 🚀 디바운스된 완료 체크 함수
    const scheduleCompletionCheck = useCallback(() => {
        if (checkCompletionDebounced.current) {
            clearTimeout(checkCompletionDebounced.current);
        }

        // 150ms 디바운스로 불필요한 체크 방지
        checkCompletionDebounced.current = setTimeout(() => {
            checkCompletionOptimized();
        }, 150);
    }, [checkCompletionOptimized]);

    // 이벤트 핸들러들
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsScratching(true);
            scratch(e.clientX, e.clientY);
        },
        [scratch]
    );

    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            // 🚀 passive event listener 오류 방지
            try {
                e.preventDefault();
            } catch (error) {
                console.error(error);
            }
            setIsScratching(true);
            const touch = e.touches[0];
            scratch(touch.clientX, touch.clientY);
        },
        [scratch]
    );

    // 🚀 최적화된 전역 이벤트 리스너
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (isScratching && !completionStateRef.current.isCompleted) {
                scratch(e.clientX, e.clientY);
                // 매번 체크하지 않고 디바운스된 체크 스케줄링
                scheduleCompletionCheck();
            }
        };

        const handleGlobalMouseUp = () => {
            if (isScratching) {
                setIsScratching(false);
                // 마우스 업 시 한 번 더 체크
                scheduleCompletionCheck();
            }
        };

        const handleGlobalTouchMove = (e: TouchEvent) => {
            if (
                isScratching &&
                e.touches.length > 0 &&
                !completionStateRef.current.isCompleted
            ) {
                const canvas = canvasRef.current;
                const touch = e.touches[0];

                // 🚀 캔버스 영역 내의 터치만 처리 (캐싱된 rect 사용)
                if (canvas) {
                    const rect = getCanvasRect();
                    if (rect) {
                        const isInCanvas =
                            touch.clientX >= rect.left &&
                            touch.clientX <= rect.right &&
                            touch.clientY >= rect.top &&
                            touch.clientY <= rect.bottom;

                        if (isInCanvas) {
                            // 🚀 passive event listener 오류 방지
                            try {
                                e.preventDefault();
                            } catch (error) {
                                console.error(error);
                            }
                            scratch(touch.clientX, touch.clientY);
                            scheduleCompletionCheck();
                        }
                    }
                }
            }
        };

        const handleGlobalTouchEnd = () => {
            if (isScratching) {
                setIsScratching(false);
                scheduleCompletionCheck();
            }
        };

        if (isScratching) {
            document.addEventListener("mousemove", handleGlobalMouseMove);
            document.addEventListener("mouseup", handleGlobalMouseUp);

            // 🚀 모바일 터치 이벤트 안전 처리
            try {
                document.addEventListener("touchmove", handleGlobalTouchMove, {
                    passive: false,
                });
            } catch (error) {
                console.error(error);
                document.addEventListener("touchmove", handleGlobalTouchMove);
            }
            document.addEventListener("touchend", handleGlobalTouchEnd);
        }

        return () => {
            document.removeEventListener("mousemove", handleGlobalMouseMove);
            document.removeEventListener("mouseup", handleGlobalMouseUp);
            document.removeEventListener("touchmove", handleGlobalTouchMove);
            document.removeEventListener("touchend", handleGlobalTouchEnd);
        };
    }, [isScratching, scratch, scheduleCompletionCheck, getCanvasRect]);

    // 자동 reveal 함수
    const autoReveal = useCallback(() => {
        if (completionStateRef.current.isCompleted) return;

        completionStateRef.current.isCompleted = true;

        // 부드러운 fadeOut 애니메이션
        let alpha = 1;
        const fadeStep = 0.045;

        const fadeOut = () => {
            alpha -= fadeStep;

            if (alpha <= 0) {
                setCanvasOpacity(0);
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext("2d");
                if (canvas && ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                if (onComplete) {
                    setTimeout(onComplete, 100);
                }
                return;
            }

            setCanvasOpacity(alpha);
            requestAnimationFrame(fadeOut);
        };

        fadeOut();
    }, [onComplete]);

    useEffect(() => {
        if (onAutoReveal) {
            onAutoReveal(autoReveal);
        }
    }, [onAutoReveal, autoReveal]);

    return (
        <div
            className="relative select-none overflow-hidden rounded-2xl"
            style={{
                width,
                height,
                // 🚀 컨테이너 레벨에서도 터치 동작 제어
                touchAction: "none",
                WebkitTouchCallout: "none",
                userSelect: "none",
            }}
        >
            {/* 결과 콘텐츠 (아래에 숨김) */}
            {children}

            {/* 스크래치 레이어 (위에 덮음) */}
            <canvas
                ref={canvasRef}
                className={cn(
                    "absolute top-0 left-0 cursor-crosshair rounded-2xl transition-opacity duration-75",
                    "touch-manipulation select-none"
                )}
                style={{
                    // 🚀 Canvas 크기를 정확히 컨테이너에 맞춤
                    width: `${width}px`,
                    height: `${height}px`,
                    // 🚀 모바일 터치 최적화 - 브라우저 기본 터치 동작 완전 차단
                    touchAction: "none",
                    WebkitTouchCallout: "none",
                    WebkitUserSelect: "none",
                    userSelect: "none",
                    MozUserSelect: "none",
                    msUserSelect: "none",
                    // 터치 스크롤 방지
                    overscrollBehavior: "none",
                    zIndex: 10,
                    opacity: canvasOpacity,
                    // 모바일 렌더링 최적화
                    WebkitBackfaceVisibility: "hidden",
                    backfaceVisibility: "hidden",
                    transform: "translateZ(0)",
                    willChange: "opacity",
                    imageRendering: "pixelated",
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            />

            <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer z-50"
                style={{
                    animation: "shimmer 2s infinite",
                    background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                    transform: "translateX(-100%) skewX(-12deg)",
                }}
            />
        </div>
    );
});

export default memo(function RaffleScratchCard({
    prize,
    onReveal,
    className,
    cardSize = { width: 300, height: 200 },
}: RaffleScratchCardProps) {
    const [isComplete, setIsComplete] = useState(false);
    const autoRevealRef = useRef<(() => void) | null>(null);

    // 🚀 근본적 개선: 완료 상태를 한 곳에서 관리
    const revealStateRef = useRef({
        isCompleted: false,
        isProcessing: false,
    });

    // 컴포넌트 마운트 시 상태 초기화
    useEffect(() => {
        revealStateRef.current = {
            isCompleted: false,
            isProcessing: false,
        };
    }, [prize?.id]); // prize가 바뀔 때마다 초기화

    // 🎯 성능 최적화: 티어 정보를 안정적으로 메모이제이션
    const tierInfo = useMemo(() => {
        if (!prize) return null;

        const tier = prize.rarity ? prize.rarity : Math.floor(prize.order / 10);
        const tierData = tierMap[tier as keyof typeof tierMap] || tierMap[0];

        return {
            tier,
            name: tierData.name,
            colors: tierData.colors,
            colorsCover: tierData.colorsCover,
            glow: tierData.glow,
            bg: tierData.bg,
            border: tierData.border,
            gradient: tierData.gradient,
        };
    }, [prize]);

    // 🚀 반응형 크기 클래스들 (5의 배수로 최적화)
    const responsiveStyles = useMemo(() => {
        return {
            // 텍스트 크기
            titleSize: 40,
            subtitleSize: 20,
            // 아이콘/이미지 크기
            imageSize: 70,
            // 티어 배지 크기
            badgeTextSize: 10,
            badgePadding: 5,
            // 간격들
            containerGap: 20,
            elementGap: 20,
            // 패딩
            containerPadding: 25,
        };
    }, []);

    // 🎯 콘페티 핸들러 - 의존성 최소화
    const handleConfetti = useCallback(() => {
        if (!prize) return;

        const tier = Math.floor(prize.order / 10);
        const particleCount =
            prize.prizeType === "EMPTY"
                ? 3
                : Math.min(600, 15 * (tier * 4 + 1));

        try {
            confetti({
                particleCount,
                spread: 360,
                ticks: 800,
                decay: 0.96,
                startVelocity: 20,
                zIndex: 3000,
            })?.catch((error) => {
                console.warn("Confetti animation failed:", error);
            });
        } catch (error) {
            console.warn("Confetti initialization failed:", error);
        }
    }, [prize]);

    // 🚀 근본적 개선: 완료 처리를 원자적으로 수행
    const handleRevealComplete = useCallback(() => {
        // 이미 처리 중이거나 완료된 경우 즉시 리턴
        if (
            revealStateRef.current.isCompleted ||
            revealStateRef.current.isProcessing
        ) {
            return;
        }

        // 원자적 상태 변경
        revealStateRef.current.isProcessing = true;
        revealStateRef.current.isCompleted = true;
        setIsComplete(true);

        if (onReveal) {
            handleConfetti();
            setTimeout(() => {
                onReveal();
                revealStateRef.current.isProcessing = false;
            }, 500);
        } else {
            revealStateRef.current.isProcessing = false;
        }
    }, [onReveal, handleConfetti]);

    const handleAutoReveal = useCallback((autoRevealFn: () => void) => {
        autoRevealRef.current = autoRevealFn;
    }, []);

    // 🚀 Skip 버튼 로직 최적화
    const handleSkipClick = useCallback(() => {
        // 이미 완료되었거나 처리 중인 경우 스킵 불가
        if (
            revealStateRef.current.isCompleted ||
            revealStateRef.current.isProcessing
        ) {
            return;
        }

        // 자동 reveal 함수가 있는 경우 실행
        if (autoRevealRef.current) {
            autoRevealRef.current();
        }
    }, []);

    // 동적 스타일 계산 (메모이제이션)
    const dynamicStyles = useMemo(() => {
        if (!tierInfo) return {};

        return {
            gradient: `linear-gradient(135deg, ${tierInfo.colors[0]}, ${tierInfo.colors[1]})`,
            gradientCover: `linear-gradient(135deg, ${tierInfo.colorsCover[0]}, ${tierInfo.colorsCover[1]})`,
            borderColor: `${tierInfo.colors[0]}40`,
        };
    }, [tierInfo]);

    // 상품이 없는 경우 (꽝)
    if (!prize) {
        return (
            <div
                className={cn("flex flex-col items-center", className)}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                        "relative rounded-2xl overflow-hidden",
                        "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900",
                        "border-2 border-gray-300 dark:border-gray-600"
                    )}
                    style={{ width: cardSize.width, height: cardSize.height }}
                >
                    <CustomScratchCard
                        width={cardSize.width}
                        height={cardSize.height}
                        onComplete={handleRevealComplete}
                        onAutoReveal={handleAutoReveal}
                        scratchColor="#9CA3AF"
                    >
                        <div
                            className={cn(
                                "w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl",
                                getResponsiveClass(
                                    responsiveStyles.containerPadding
                                ).paddingClass
                            )}
                        >
                            {/* 🚀 반응형 최적화: 결과 표시 */}
                            <div
                                className={cn(
                                    "text-center",
                                    getResponsiveClass(
                                        responsiveStyles.elementGap
                                    ).gapClass
                                )}
                            >
                                <div
                                    className={cn(
                                        getResponsiveClass(
                                            responsiveStyles.imageSize
                                        ).textClass,
                                        getResponsiveClass(
                                            responsiveStyles.elementGap
                                        ).marginYClass
                                    )}
                                >
                                    😔
                                </div>
                                <h3
                                    className={cn(
                                        "font-bold text-gray-600 dark:text-gray-400",
                                        getResponsiveClass(
                                            responsiveStyles.titleSize
                                        ).textClass,
                                        getResponsiveClass(
                                            responsiveStyles.elementGap
                                        ).marginYClass
                                    )}
                                >
                                    Better Luck Next Time
                                </h3>
                                <p
                                    className={cn(
                                        "text-gray-500 dark:text-gray-500",
                                        getResponsiveClass(
                                            responsiveStyles.subtitleSize
                                        ).textClass
                                    )}
                                >
                                    Try again!
                                </p>
                            </div>

                            {/* 🚀 반응형 최적화: 완료 시 추가 애니메이션 */}
                            {isComplete && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3, type: "spring" }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]"
                                >
                                    <div
                                        className={cn(
                                            "animate-bounce",
                                            getResponsiveClass(
                                                responsiveStyles.imageSize
                                            ).textClass
                                        )}
                                    >
                                        💔
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </CustomScratchCard>
                </motion.div>
            </div>
        );
    }

    return (
        <div
            className={cn("flex flex-col items-center", className)}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "relative rounded-2xl overflow-hidden",
                    "shadow-2xl"
                )}
                style={{
                    width: cardSize.width,
                    height: cardSize.height,
                    boxShadow: tierInfo
                        ? `0 0px 80px ${tierInfo.glow}`
                        : undefined,
                }}
            >
                <CustomScratchCard
                    width={cardSize.width}
                    height={cardSize.height}
                    onComplete={handleRevealComplete}
                    onAutoReveal={handleAutoReveal}
                    scratchColor={tierInfo?.colorsCover?.[0] || "#A97CF8"}
                >
                    <div
                        className={cn(
                            "w-full h-full flex flex-col items-center justify-center relative rounded-2xl"
                        )}
                        style={{
                            background: tierInfo
                                ? dynamicStyles.gradient
                                : "linear-gradient(135deg, rgba(167,139,250,0.1), rgba(243,140,184,0.1))",
                        }}
                    >
                        {/* Holographic shimmer */}
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"
                            style={{
                                animation: "shimmer 2s infinite",
                                background:
                                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                                transform: "translateX(-100%) skewX(-12deg)",
                                zIndex: 5, // 스크래치 레이어보다 낮게
                            }}
                        />
                        <div className="absolute inset-0 overflow-hidden opacity-50">
                            {/* 🚀 반응형 최적화: 별빛 파티클 효과 */}
                            {[
                                { top: "7%", left: "18%" },
                                { top: "12%", left: "43%" },
                                { top: "9%", left: "67%" },
                                { top: "15%", left: "84%" },
                                { top: "26%", left: "12%" },
                                { top: "96%", left: "11%" },
                                { top: "28%", left: "56%" },
                                { top: "23%", left: "78%" },
                                { top: "21%", left: "92%" },
                                { top: "88%", left: "21%" },
                                { top: "38%", left: "22%" },
                                { top: "44%", left: "41%" },
                                { top: "35%", left: "63%" },
                                { top: "42%", left: "88%" },
                                { top: "78%", left: "41%" },
                                { top: "55%", left: "15%" },
                                { top: "62%", left: "34%" },
                                { top: "58%", left: "49%" },
                                { top: "88%", left: "91%" },
                                { top: "64%", left: "71%" },
                                { top: "59%", left: "85%" },
                                { top: "73%", left: "16%" },
                                { top: "81%", left: "38%" },
                                { top: "76%", left: "61%" },
                                { top: "79%", left: "79%" },
                                { top: "89%", left: "22%" },
                                { top: "92%", left: "8%" },
                            ].map((position, i) => (
                                <div
                                    key={i}
                                    className="absolute bg-white/80 rounded-full animate-pulse"
                                    style={{
                                        top: position.top,
                                        left: position.left,
                                        // 🚀 반응형 파티클 크기
                                        width: (() => {
                                            const baseSize =
                                                cardSize.width < 350
                                                    ? 0.8
                                                    : cardSize.width < 400
                                                    ? 1
                                                    : 1.2;
                                            return i % 4 === 0
                                                ? `${3 * baseSize}px`
                                                : i % 3 === 0
                                                ? `${2 * baseSize}px`
                                                : `${1 * baseSize}px`;
                                        })(),
                                        height: (() => {
                                            const baseSize =
                                                cardSize.width < 350
                                                    ? 0.8
                                                    : cardSize.width < 400
                                                    ? 1
                                                    : 1.2;
                                            return i % 4 === 0
                                                ? `${3 * baseSize}px`
                                                : i % 3 === 0
                                                ? `${2 * baseSize}px`
                                                : `${1 * baseSize}px`;
                                        })(),
                                        animationDelay: `${
                                            i * 0.08 + Math.random() * 0.5
                                        }s`,
                                        animationDuration: `${
                                            1.2 + (i % 4) * 0.4
                                        }s`,
                                        boxShadow:
                                            i % 4 === 0
                                                ? "0 0 6px rgba(255,255,255,0.9)"
                                                : "0 0 3px rgba(255,255,255,0.7)",
                                    }}
                                />
                            ))}
                        </div>

                        {/* 🚀 반응형 최적화: 티어 배지 */}
                        {tierInfo && (
                            <div
                                className={cn(
                                    "absolute z-[1]",
                                    getResponsiveClass(
                                        responsiveStyles.badgePadding
                                    ).paddingClass
                                )}
                                style={{ top: 5, right: 5 }}
                            >
                                <div
                                    className={cn(
                                        "rounded-full text-white font-bold flex items-center",
                                        getResponsiveClass(
                                            responsiveStyles.badgeTextSize
                                        ).textClass,
                                        getResponsiveClass(
                                            responsiveStyles.badgePadding
                                        ).paddingClass,
                                        getResponsiveClass(5).gapClass
                                    )}
                                    style={{
                                        background: tierInfo.gradient,
                                    }}
                                >
                                    {tierInfo.tier >= 4 && (
                                        <Crown
                                            className={cn(
                                                getResponsiveClass(10)
                                                    .frameClass
                                            )}
                                        />
                                    )}
                                    {tierInfo.name}
                                </div>
                            </div>
                        )}

                        {/* 🚀 반응형 최적화: 메인 콘텐츠 */}
                        <div
                            className={cn(
                                "text-center z-[1]",
                                getResponsiveClass(
                                    responsiveStyles.containerGap
                                ).gapClass
                            )}
                        >
                            {/* 🚀 반응형 최적화: 상품 이미지 */}
                            <div
                                className={cn(
                                    "mx-auto relative",
                                    getResponsiveClass(
                                        responsiveStyles.imageSize
                                    ).frameClass,
                                    getResponsiveClass(
                                        responsiveStyles.elementGap
                                    ).marginYClass
                                )}
                            >
                                {prize.prizeType === "NFT" ? (
                                    <div className="relative w-full h-full rounded-xl overflow-hidden">
                                        {/* 홀로그램 테두리 효과 */}
                                        <div
                                            className="absolute inset-0 rounded-xl animate-spin"
                                            style={{
                                                animationDuration: "3s",
                                                background: tierInfo
                                                    ? `conic-gradient(from 0deg, ${tierInfo.gradient})`
                                                    : "conic-gradient(from 0deg, #a855f7, #3b82f6, #06b6d4, #10b981, #eab308, #ef4444, #a855f7)",
                                                padding: "2px",
                                            }}
                                        />
                                        <div className="relative w-full h-full overflow-hidden bg-black">
                                            {prize.spg?.imageUrl ||
                                            prize.spg?.metadata?.image ? (
                                                <Image
                                                    src={
                                                        prize.spg.imageUrl ||
                                                        prize.spg?.metadata
                                                            ?.image ||
                                                        ""
                                                    }
                                                    alt={prize.title}
                                                    fill
                                                    className="object-contain"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Gem
                                                        className={cn(
                                                            getResponsiveClass(
                                                                responsiveStyles.titleSize
                                                            ).frameClass
                                                        )}
                                                        style={{
                                                            color: tierInfo?.glow,
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : prize.prizeType === "EMPTY" ? (
                                    <div
                                        className="w-full h-full rounded-xl border-2 flex items-center justify-center p-4"
                                        style={{
                                            borderColor:
                                                dynamicStyles.borderColor ||
                                                "rgba(168,85,247,0.3)",
                                            background: tierInfo
                                                ? dynamicStyles.gradient
                                                : "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(59,130,246,0.1))",
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                "text-red-400 mb-1 text-center",
                                                getResponsiveClass(
                                                    responsiveStyles.imageSize -
                                                        5
                                                ).textClass
                                            )}
                                        >
                                            💔
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="w-full h-full rounded-xl border-2 flex items-center justify-center p-2"
                                        style={{
                                            borderColor:
                                                dynamicStyles.borderColor ||
                                                "rgba(168,85,247,0.3)",
                                            background: tierInfo
                                                ? dynamicStyles.gradient
                                                : "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(59,130,246,0.1))",
                                        }}
                                    >
                                        {prize.asset?.iconUrl ? (
                                            <div
                                                className={cn(
                                                    "relative",
                                                    getResponsiveClass(
                                                        responsiveStyles.imageSize
                                                    ).frameClass
                                                )}
                                            >
                                                <Image
                                                    src={prize.asset.iconUrl}
                                                    alt={prize.title}
                                                    fill
                                                    className="object-contain"
                                                    quality={100}
                                                    priority={true}
                                                    unoptimized={false}
                                                />
                                            </div>
                                        ) : (
                                            <Star
                                                className={cn(
                                                    getResponsiveClass(
                                                        responsiveStyles.imageSize
                                                    ).frameClass
                                                )}
                                                style={{
                                                    color: tierInfo?.glow,
                                                }}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 🚀 반응형 최적화: 상품 정보 */}
                            <h3
                                className={cn(
                                    "font-bold text-white text-center drop-shadow-lg",
                                    getResponsiveClass(
                                        responsiveStyles.titleSize
                                    ).textClass,
                                    getResponsiveClass(
                                        responsiveStyles.elementGap
                                    ).marginYClass
                                )}
                            >
                                {prize.title}
                            </h3>

                            {/* 🚀 반응형 최적화: 축하 메시지 */}
                            {prize.prizeType !== "EMPTY" && (
                                <div
                                    className={cn(
                                        "flex items-center justify-center",
                                        getResponsiveClass(
                                            responsiveStyles.elementGap
                                        ).gapClass
                                    )}
                                >
                                    <Sparkles
                                        className={cn(
                                            "text-yellow-300",
                                            getResponsiveClass(15).frameClass
                                        )}
                                    />
                                    <p
                                        className={cn(
                                            "text-white font-medium drop-shadow-lg",
                                            getResponsiveClass(
                                                responsiveStyles.subtitleSize
                                            ).textClass
                                        )}
                                    >
                                        Congratulations!
                                    </p>
                                    <Sparkles
                                        className={cn(
                                            "text-yellow-300",
                                            getResponsiveClass(15).frameClass
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </CustomScratchCard>
            </motion.div>

            {/* 🚀 반응형 최적화: Skip 버튼 */}
            <button
                onClick={handleSkipClick}
                className={cn(
                    "text-white/70 hover:text-white transition-all duration-300",
                    "transition-opacity duration-500",
                    getResponsiveClass(responsiveStyles.subtitleSize).textClass,
                    getResponsiveClass(responsiveStyles.elementGap)
                        .marginYClass,
                    getResponsiveClass(10).paddingClass,
                    // React 상태로 표시 조건 관리
                    isComplete ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
                disabled={isComplete}
            >
                Reveal!
            </button>
        </div>
    );
});
