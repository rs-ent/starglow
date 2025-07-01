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
    prizeType: "NFT" | "ASSET";
    order: number;
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

// 직접 구현한 스크래치 카드 컴포넌트
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
    const [isComplete, setIsComplete] = useState(false);
    const [canvasOpacity, setCanvasOpacity] = useState(1);

    // 성능 최적화를 위한 ref들
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const lastCheckTime = useRef(0);
    const scratchedPixels = useRef(0);
    const totalPixels = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d", {
            alpha: true,
            desynchronized: true,
            willReadFrequently: true, // 픽셀 검사를 위해 true로 변경
        });

        if (ctx) {
            contextRef.current = ctx;

            // 고해상도 디스플레이 대응
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            totalPixels.current = canvas.width * canvas.height;

            ctx.scale(dpr, dpr);

            // 색상 유효성 검증 및 기본값 설정
            const validScratchColor = scratchColor || "#C0C0C0";

            // 초기 스크래치 레이어 그리기
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            try {
                gradient.addColorStop(0, validScratchColor);
                gradient.addColorStop(0.5, "#E5E7EB");
                gradient.addColorStop(1, validScratchColor);
                ctx.fillStyle = gradient;
            } catch (error) {
                // 그라디언트 생성 실패 시 단일 색상 사용
                console.warn(
                    "Gradient creation failed, using solid color:",
                    error
                );
                ctx.fillStyle = "#C0C0C0";
            }
            ctx.fillRect(0, 0, width, height);

            // 스크래치 힌트 텍스트
            ctx.fillStyle = "#4B5563";
            const fontSize = Math.max(12, Math.min(16, width * 0.05));
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🎁 Scratch to reveal! 🎁", width / 2, height / 2);
        }
    }, [width, height, scratchColor]);

    // 성능 최적화된 스크래치 함수
    const scratch = useCallback(
        (clientX: number, clientY: number) => {
            const canvas = canvasRef.current;
            const ctx = contextRef.current;

            if (!canvas || !ctx || isComplete) return;

            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const scaleX = canvas.width / dpr / rect.width;
            const scaleY = canvas.height / dpr / rect.height;

            const x = (clientX - rect.left) * scaleX;
            const y = (clientY - rect.top) * scaleY;

            ctx.globalCompositeOperation = "destination-out";
            ctx.beginPath();
            const brushSize = window.innerWidth < 768 ? 25 : 50;
            ctx.arc(x, y, brushSize, 0, Math.PI * 2);
            ctx.fill();

            // 스크래치된 픽셀 수 추정 (정확한 계산 대신 근사값 사용)
            const brushArea = Math.PI * brushSize * brushSize;
            scratchedPixels.current += brushArea;
        },
        [isComplete]
    );

    // 성능 최적화된 완료 검사 (throttling 적용)
    const checkCompletion = useCallback(() => {
        if (isComplete) return;

        const now = Date.now();
        // 300ms마다만 검사 (기존보다 빈도 감소)
        if (now - lastCheckTime.current < 300) return;
        lastCheckTime.current = now;

        const canvas = canvasRef.current;
        const ctx = contextRef.current;

        if (!canvas || !ctx) return;

        // 전체 픽셀 검사 대신 샘플링 방식 사용
        const sampleSize = 100; // 100개 포인트만 샘플링
        const step = Math.floor(Math.sqrt(totalPixels.current / sampleSize));
        let transparentCount = 0;
        let totalSamples = 0;

        try {
            // 샘플링으로 투명도 검사
            for (let y = 0; y < canvas.height; y += step) {
                for (let x = 0; x < canvas.width; x += step) {
                    const pixel = ctx.getImageData(x, y, 1, 1).data;
                    if (pixel[3] < 128) transparentCount++;
                    totalSamples++;
                }
            }

            const scratchPercentage = (transparentCount / totalSamples) * 100;

            if (scratchPercentage > 50) {
                setIsComplete(true);

                // 최적화된 페이드 아웃
                const fadeOut = () => {
                    setCanvasOpacity(0);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    if (onComplete) {
                        setTimeout(onComplete, 100);
                    }
                };

                requestAnimationFrame(fadeOut);
            }
        } catch (error) {
            console.warn("Scratch completion check failed:", error);
        }
    }, [isComplete, onComplete]);

    // 이벤트 핸들러들 (최적화)
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
            e.preventDefault();
            setIsScratching(true);
            const touch = e.touches[0];
            scratch(touch.clientX, touch.clientY);
        },
        [scratch]
    );

    // 전역 이벤트 리스너 최적화
    useEffect(() => {
        if (!isScratching) return;

        let animationId: number;
        let lastMoveTime = 0;
        const throttleMs = 16; // 60fps 제한

        const handleMove = (clientX: number, clientY: number) => {
            const now = Date.now();
            if (now - lastMoveTime < throttleMs) return;
            lastMoveTime = now;

            scratch(clientX, clientY);

            // requestAnimationFrame으로 completion 체크 최적화
            if (animationId) cancelAnimationFrame(animationId);
            animationId = requestAnimationFrame(checkCompletion);
        };

        const handleMouseMove = (e: MouseEvent) =>
            handleMove(e.clientX, e.clientY);
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                e.preventDefault();
                const touch = e.touches[0];
                handleMove(touch.clientX, touch.clientY);
            }
        };

        const handleEnd = () => setIsScratching(false);

        document.addEventListener("mousemove", handleMouseMove, {
            passive: false,
        });
        document.addEventListener("mouseup", handleEnd);
        document.addEventListener("touchmove", handleTouchMove, {
            passive: false,
        });
        document.addEventListener("touchend", handleEnd);

        return () => {
            if (animationId) cancelAnimationFrame(animationId);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleEnd);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleEnd);
        };
    }, [isScratching, scratch, checkCompletion]);

    // 자동 reveal 함수 최적화
    const autoReveal = useCallback(() => {
        if (isComplete) return;

        setIsComplete(true);
        setCanvasOpacity(0);

        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (onComplete) {
            setTimeout(onComplete, 100);
        }
    }, [isComplete, onComplete]);

    useEffect(() => {
        if (onAutoReveal) {
            onAutoReveal(autoReveal);
        }
    }, [onAutoReveal, autoReveal]);

    return (
        <div className="relative select-none" style={{ width, height }}>
            {children}

            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className={cn(
                    "absolute top-0 left-0 cursor-crosshair rounded-2xl",
                    "touch-manipulation select-none transition-opacity duration-200"
                )}
                style={{
                    touchAction: "none",
                    userSelect: "none",
                    zIndex: 10,
                    opacity: canvasOpacity,
                    transform: "translateZ(0)", // GPU 가속
                    willChange: "opacity",
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
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

    // 티어 정보 최적화 (계산 최소화)
    const tierInfo = useMemo(() => {
        if (!prize) return null;

        const tier = Math.floor(prize.order / 10);
        const tierData = tierMap[tier as keyof typeof tierMap] || tierMap[0];
        return {
            ...tierData,
            tier,
            gradient: `linear-gradient(135deg, ${tierData.colors[0]}, ${tierData.colors[1]})`,
            gradientCover: `linear-gradient(135deg, ${tierData.colorsCover[0]}, ${tierData.colorsCover[1]})`,
            borderColor: `${tierData.colors[0]}40`,
        };
    }, [prize]);

    // 반응형 크기 최적화 (단순화)
    const sizes = useMemo(() => {
        const baseScale = Math.min(Math.max(cardSize.width / 300, 0.8), 1.5);
        return {
            title: Math.round(18 * baseScale),
            subtitle: Math.round(14 * baseScale),
            icon: Math.round(40 * baseScale),
        };
    }, [cardSize.width]);

    // 콘페티 핸들러 최적화
    const handleConfetti = useCallback(() => {
        if (!tierInfo) return;

        const particleCount = 15 * (tierInfo.tier * 4 + 1);

        try {
            confetti({
                particleCount,
                spread: 360,
                ticks: 800,
                decay: 0.96,
                startVelocity: 20,
                zIndex: 3000,
            })?.catch((error) => {
                console.warn("Confetti failed:", error);
            });
        } catch (error) {
            console.warn("Confetti failed:", error);
        }
    }, [tierInfo]);

    const handleRevealComplete = useCallback(() => {
        setIsComplete(true);
        if (onReveal) {
            handleConfetti();
            setTimeout(onReveal, 500);
        }
    }, [onReveal, handleConfetti]);

    const handleAutoReveal = useCallback((autoRevealFn: () => void) => {
        autoRevealRef.current = autoRevealFn;
    }, []);

    const handleSkipClick = useCallback(() => {
        if (autoRevealRef.current && !isComplete) {
            autoRevealRef.current();
        }
    }, [isComplete]);

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
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl">
                            {/* 결과는 항상 보이게 - 스크래치할 때마다 드러남 */}
                            <div className="text-center">
                                <div
                                    style={{
                                        fontSize: `${sizes.icon}px`,
                                        marginBottom: "16px",
                                    }}
                                >
                                    😔
                                </div>
                                <h3
                                    className="font-bold text-gray-600 dark:text-gray-400 mb-2"
                                    style={{
                                        fontSize: `${sizes.title}px`,
                                    }}
                                >
                                    Better Luck Next Time
                                </h3>
                                <p
                                    className="text-gray-500 dark:text-gray-500"
                                    style={{
                                        fontSize: `${sizes.subtitle}px`,
                                    }}
                                >
                                    Try again!
                                </p>
                            </div>

                            {/* 완료 시 추가 애니메이션 */}
                            {isComplete && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3, type: "spring" }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                >
                                    <div className="text-6xl animate-bounce">
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
                    scratchColor={tierInfo?.gradientCover || "#A97CF8"}
                >
                    <div
                        className={cn(
                            "w-full h-full flex flex-col items-center justify-center relative rounded-2xl"
                        )}
                        style={{
                            background: tierInfo
                                ? tierInfo.gradient
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
                                zIndex: 1000,
                            }}
                        />
                        <div className="absolute inset-0 overflow-hidden opacity-50">
                            {/* 자연스러운 별빛 파티클 효과 - 24개 */}
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
                                        width:
                                            i % 4 === 0
                                                ? "3px"
                                                : i % 3 === 0
                                                ? "2px"
                                                : "1px",
                                        height:
                                            i % 4 === 0
                                                ? "3px"
                                                : i % 3 === 0
                                                ? "2px"
                                                : "1px",
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

                        {/* 티어 배지 - 항상 보이게 */}
                        {tierInfo && (
                            <div className="absolute top-4 right-4 z-10">
                                <div
                                    className="px-3 py-1 rounded-full text-white font-bold text-xs flex items-center gap-1"
                                    style={{
                                        background: tierInfo.gradient,
                                    }}
                                >
                                    {tierInfo.tier >= 4 && (
                                        <Crown className="w-3 h-3" />
                                    )}
                                    {tierInfo.name}
                                </div>
                            </div>
                        )}

                        {/* 메인 콘텐츠 - 항상 보이게 */}
                        <div className="text-center z-10">
                            {/* 상품 이미지 */}
                            <div
                                className={cn(
                                    "mb-4 mx-auto relative",
                                    getResponsiveClass(70).frameClass
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
                                        <div className="relative w-full h-full rounded-xl overflow-hidden bg-black">
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
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Gem
                                                        className="w-8 h-8"
                                                        style={{
                                                            color: tierInfo?.glow,
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="w-full h-full rounded-xl border-2 flex items-center justify-center p-3"
                                        style={{
                                            borderColor:
                                                tierInfo?.borderColor ||
                                                "rgba(168,85,247,0.3)",
                                            background: tierInfo
                                                ? tierInfo.gradient
                                                : "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(59,130,246,0.1))",
                                        }}
                                    >
                                        {prize.asset?.iconUrl ? (
                                            <Image
                                                src={prize.asset.iconUrl}
                                                alt={prize.title}
                                                width={60}
                                                height={60}
                                                className="object-contain"
                                                quality={100}
                                                priority={true}
                                                unoptimized={false}
                                            />
                                        ) : (
                                            <Star
                                                className="w-8 h-8"
                                                style={{
                                                    color: tierInfo?.glow,
                                                }}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 상품 정보 */}
                            <h3
                                className="font-bold text-white mb-2 text-center drop-shadow-lg"
                                style={{ fontSize: `${sizes.title}px` }}
                            >
                                {prize.title}
                            </h3>

                            {/* 축하 메시지 */}
                            <div className="flex items-center justify-center gap-2">
                                <Sparkles className="w-4 h-4 text-yellow-300" />
                                <p
                                    className="text-white font-medium drop-shadow-lg"
                                    style={{ fontSize: `${sizes.subtitle}px` }}
                                >
                                    Congratulations!
                                </p>
                                <Sparkles className="w-4 h-4 text-yellow-300" />
                            </div>
                        </div>
                    </div>
                </CustomScratchCard>
            </motion.div>

            {/* Skip 버튼 */}
            <button
                onClick={handleSkipClick}
                className={cn(
                    "mt-2 text-sm text-white/70 hover:text-white transition-all duration-300",
                    "transition-opacity duration-500",
                    isComplete ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
            >
                Reveal!
            </button>
        </div>
    );
});
