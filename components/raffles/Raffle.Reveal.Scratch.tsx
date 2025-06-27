/// components/raffles/Raffle.Reveal.Scratch.tsx

"use client";

import { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Star, Sparkles, Gem, Crown } from "lucide-react";
import Image from "next/image";
import confetti from "canvas-confetti";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

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

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d", {
            // 모바일 성능 최적화 옵션
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

            // 스크래치 레이어를 완전히 불투명하게 만들어 아래 내용을 완전히 가림
            ctx.fillStyle = scratchColor;
            ctx.fillRect(0, 0, width, height);

            // 그라디언트로 더 매력적인 스크래치 표면 만들기
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, scratchColor);
            gradient.addColorStop(0.5, "#E5E7EB");
            gradient.addColorStop(1, scratchColor);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // 스크래치 힌트 텍스트 추가 (반응형 폰트 크기)
            ctx.fillStyle = "#4B5563";
            const fontSize = Math.max(12, Math.min(16, width * 0.05)); // 카드 크기에 따른 폰트 크기
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🎁 Scratch to reveal! 🎁", width / 2, height / 2);
        }
    }, [width, height, scratchColor]);

    const scratch = useCallback(
        (clientX: number, clientY: number) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (canvas && ctx && !isComplete) {
                const rect = canvas.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;

                // 고해상도 디스플레이를 고려한 좌표 계산
                const scaleX = canvas.width / dpr / rect.width;
                const scaleY = canvas.height / dpr / rect.height;

                const x = (clientX - rect.left) * scaleX;
                const y = (clientY - rect.top) * scaleY;

                ctx.globalCompositeOperation = "destination-out";
                ctx.beginPath();
                // 모바일에서 더 부드러운 스크래치를 위해 크기 조정
                const brushSize = window.innerWidth < 768 ? 25 : 50;
                ctx.arc(x, y, brushSize, 0, Math.PI * 2);
                ctx.fill();
            }
        },
        [isComplete]
    );

    const checkCompletion = useCallback(() => {
        if (isComplete) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) {
            const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );
            const pixels = imageData.data;
            let transparentPixels = 0;

            for (let i = 3; i < pixels.length; i += 4) {
                if (pixels[i] < 128) transparentPixels++;
            }

            const totalPixels = canvas.width * canvas.height;
            const scratchPercentage = (transparentPixels / totalPixels) * 100;

            if (scratchPercentage > 50) {
                setIsComplete(true);

                // 부드러운 fadeOut 애니메이션 (CSS opacity 사용)
                let alpha = 1;
                const fadeStep = 0.045; // 페이드 속도 조절 (더 빠르게)

                const fadeOut = () => {
                    alpha -= fadeStep;

                    if (alpha <= 0) {
                        // 완전히 투명해지면 캔버스 완전 제거
                        setCanvasOpacity(0);
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        if (onComplete) {
                            setTimeout(onComplete, 100);
                        }
                        return;
                    }

                    // CSS opacity 조절
                    setCanvasOpacity(alpha);

                    // 다음 프레임에서 계속 페이드
                    requestAnimationFrame(fadeOut);
                };

                // 페이드아웃 시작
                fadeOut();
            }
        }
    }, [isComplete, onComplete]);

    // 마우스 이벤트
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsScratching(true);
            scratch(e.clientX, e.clientY);
        },
        [scratch]
    );

    // 터치 이벤트
    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            e.preventDefault();
            setIsScratching(true);
            const touch = e.touches[0];
            scratch(touch.clientX, touch.clientY);
        },
        [scratch]
    );

    // 전역 이벤트 리스너로 자연스러운 드래그 지원
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (isScratching) {
                scratch(e.clientX, e.clientY);
                checkCompletion();
            }
        };

        const handleGlobalMouseUp = () => {
            setIsScratching(false);
        };

        const handleGlobalTouchMove = (e: TouchEvent) => {
            if (isScratching && e.touches.length > 0) {
                e.preventDefault();
                const touch = e.touches[0];
                scratch(touch.clientX, touch.clientY);
                checkCompletion();
            }
        };

        const handleGlobalTouchEnd = () => {
            setIsScratching(false);
        };

        if (isScratching) {
            document.addEventListener("mousemove", handleGlobalMouseMove);
            document.addEventListener("mouseup", handleGlobalMouseUp);
            document.addEventListener("touchmove", handleGlobalTouchMove, {
                passive: false,
            });
            document.addEventListener("touchend", handleGlobalTouchEnd);
        }

        return () => {
            document.removeEventListener("mousemove", handleGlobalMouseMove);
            document.removeEventListener("mouseup", handleGlobalMouseUp);
            document.removeEventListener("touchmove", handleGlobalTouchMove);
            document.removeEventListener("touchend", handleGlobalTouchEnd);
        };
    }, [isScratching, scratch, checkCompletion]);

    // 자동 reveal 함수
    const autoReveal = useCallback(() => {
        if (isComplete) return;

        setIsComplete(true);

        // 부드러운 fadeOut 애니메이션 (수동 스크래치와 동일)
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
    }, [isComplete, onComplete]);

    // 부모 컴포넌트에 autoReveal 함수 전달
    useEffect(() => {
        if (onAutoReveal) {
            onAutoReveal(autoReveal);
        }
    }, [onAutoReveal, autoReveal]);

    return (
        <div className="relative select-none" style={{ width, height }}>
            {/* 결과 콘텐츠 (아래에 숨김) */}
            {children}

            {/* 스크래치 레이어 (위에 덮음) */}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className={cn(
                    "absolute top-0 left-0 cursor-crosshair rounded-2xl transition-opacity duration-75",
                    // 모바일 터치 최적화
                    "touch-manipulation select-none"
                )}
                style={{
                    touchAction: "none",
                    userSelect: "none",
                    zIndex: 10, // 확실히 위에 오도록
                    opacity: canvasOpacity,
                    // 모바일 렌더링 최적화
                    WebkitBackfaceVisibility: "hidden",
                    backfaceVisibility: "hidden",
                    transform: "translateZ(0)",
                    willChange: "opacity",
                    // 고해상도 디스플레이 대응
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

// 티어별 색상 및 스타일 정의
const getTierInfo = (order: number) => {
    const tier = Math.floor(order / 10);

    const tierMap = {
        0: {
            name: "COMMON",
            gradient: ["#94A3B8", "#64748B", "#475569"],
            glowColor: "rgba(148,163,184,0.6)",
            borderColor: "rgba(148,163,184,0.4)",
        },
        1: {
            name: "UNCOMMON",
            gradient: ["#10B981", "#059669", "#047857"],
            glowColor: "rgba(16,185,129,0.6)",
            borderColor: "rgba(16,185,129,0.4)",
        },
        2: {
            name: "RARE",
            gradient: ["#3B82F6", "#2563EB", "#1D4ED8"],
            glowColor: "rgba(59,130,246,0.6)",
            borderColor: "rgba(59,130,246,0.4)",
        },
        3: {
            name: "EPIC",
            gradient: ["#8B5CF6", "#7C3AED", "#6D28D9"],
            glowColor: "rgba(139,92,246,0.6)",
            borderColor: "rgba(139,92,246,0.4)",
        },
        4: {
            name: "LEGENDARY",
            gradient: ["#F59E0B", "#D97706", "#B45309"],
            glowColor: "rgba(245,158,11,0.6)",
            borderColor: "rgba(245,158,11,0.4)",
        },
        5: {
            name: "CELESTIAL",
            gradient: ["#06B6D4", "#0891B2", "#0E7490"],
            glowColor: "rgba(6,182,212,0.6)",
            borderColor: "rgba(6,182,212,0.4)",
        },
        6: {
            name: "STELLAR",
            gradient: ["#EC4899", "#DB2777", "#BE185D"],
            glowColor: "rgba(236,72,153,0.6)",
            borderColor: "rgba(236,72,153,0.4)",
        },
        7: {
            name: "COSMIC",
            gradient: ["#EAB308", "#CA8A04", "#A16207"],
            glowColor: "rgba(234,179,8,0.6)",
            borderColor: "rgba(234,179,8,0.4)",
        },
    };

    return tierMap[tier as keyof typeof tierMap] || tierMap[0];
};

export default memo(function RaffleScratchCard({
    prize,
    onReveal,
    className,
    cardSize = { width: 300, height: 200 },
}: RaffleScratchCardProps) {
    const [isComplete, setIsComplete] = useState(false);
    const autoRevealRef = useRef<(() => void) | null>(null);

    const { tierInfo, tier } = useMemo(() => {
        const tierInfo = prize ? getTierInfo(prize.order) : null;
        const tier = prize ? Math.floor(prize.order / 10) : 0;
        return { tierInfo, tier };
    }, [prize]);

    // 카드 크기에 따른 반응형 스케일 계산
    const scale = useMemo(() => {
        const baseWidth = 300; // 기본 카드 너비
        return cardSize.width / baseWidth;
    }, [cardSize.width]);

    // 스케일에 따른 텍스트와 아이콘 크기 계산
    const responsiveSize = useMemo(() => {
        const baseScale = Math.min(Math.max(scale, 0.8), 1.5); // 0.8 ~ 1.5 사이로 제한

        return {
            titleText: Math.round(18 * baseScale),
            subtitleText: Math.round(14 * baseScale),
            hintText: Math.round(14 * baseScale),
            iconSize: Math.round(40 * baseScale),
            spacing: Math.round(16 * baseScale),
        };
    }, [scale]);

    const handleConfetti = useCallback(() => {
        const defaults = {
            particleCount: 60 * tier,
            spread: 360,
            ticks: 800,
            decay: 0.96,
            startVelocity: 20,
            scalar: 1,
            zIndex: 20,
        };

        const shoot = () => {
            try {
                confetti({
                    ...defaults,
                })?.catch((error) => {
                    console.error("Failed to shoot confetti:", error);
                });
            } catch (error) {
                console.error("Failed to shoot confetti:", error);
            }
        };

        shoot();
    }, [tier]);

    const handleRevealComplete = useCallback(() => {
        setIsComplete(true);
        if (onReveal) {
            handleConfetti();
            setTimeout(() => {
                onReveal();
            }, 500);
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
                                        fontSize: `${responsiveSize.iconSize}px`,
                                        marginBottom: `${responsiveSize.spacing}px`,
                                    }}
                                >
                                    😔
                                </div>
                                <h3
                                    className="font-bold text-gray-600 dark:text-gray-400 mb-2"
                                    style={{
                                        fontSize: `${responsiveSize.titleText}px`,
                                    }}
                                >
                                    Better Luck Next Time
                                </h3>
                                <p
                                    className="text-gray-500 dark:text-gray-500"
                                    style={{
                                        fontSize: `${responsiveSize.subtitleText}px`,
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
                        ? `0 0px 80px ${tierInfo.glowColor}`
                        : undefined,
                }}
            >
                <CustomScratchCard
                    width={cardSize.width}
                    height={cardSize.height}
                    onComplete={handleRevealComplete}
                    onAutoReveal={handleAutoReveal}
                    scratchColor={tierInfo?.gradient[0] || "#A97CF8"}
                >
                    <div
                        className={cn(
                            "w-full h-full flex flex-col items-center justify-center relative rounded-2xl"
                        )}
                        style={{
                            background: tierInfo
                                ? `linear-gradient(135deg, ${tierInfo.gradient[0]}15, ${tierInfo.gradient[1]}15, ${tierInfo.gradient[2]}15)`
                                : "linear-gradient(135deg, rgba(167,139,250,0.1), rgba(243,140,184,0.1))",
                        }}
                    >
                        {/* 배경 효과 - 항상 보이게 */}
                        <div className="absolute inset-0 overflow-hidden rounded-2xl">
                            {/* 반짝이는 파티클 효과 - 24개 고정 위치 */}
                            {[
                                { top: "88%", left: "85%" },
                                { top: "52%", left: "85%" },
                                { top: "20%", left: "85%" },
                                { top: "38%", left: "50%" },
                                { top: "82%", left: "15%" },
                                { top: "58%", left: "10%" },
                                { top: "40%", left: "30%" },
                                { top: "15%", left: "45%" },
                                { top: "45%", left: "80%" },
                                { top: "85%", left: "65%" },
                                { top: "60%", left: "40%" },
                                { top: "25%", left: "25%" },
                                { top: "80%", left: "25%" },
                                { top: "50%", left: "60%" },
                                { top: "18%", left: "65%" },
                                { top: "30%", left: "90%" },
                                { top: "55%", left: "20%" },
                                { top: "75%", left: "55%" },
                                { top: "12%", left: "75%" },
                                { top: "70%", left: "35%" },
                                { top: "35%", left: "10%" },
                                { top: "10%", left: "15%" },
                                { top: "65%", left: "75%" },
                                { top: "32%", left: "70%" },
                            ].map((position, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-[rgba(255,255,255,0.6)] rounded-full"
                                    style={{
                                        top: position.top,
                                        left: position.left,
                                    }}
                                    animate={{
                                        opacity: [0, 1, 0],
                                        scale: [0, 0.7, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.08, // 24개이므로 더 짧은 간격
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
                                        background: `linear-gradient(135deg, ${tierInfo.gradient[0]}, ${tierInfo.gradient[1]})`,
                                    }}
                                >
                                    {tier >= 4 && <Crown className="w-3 h-3" />}
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
                                                    ? `conic-gradient(from 0deg, ${tierInfo.gradient[0]}, ${tierInfo.gradient[1]}, ${tierInfo.gradient[2]}, ${tierInfo.gradient[0]})`
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
                                                        className={cn(
                                                            getResponsiveClass(
                                                                40
                                                            ).frameClass
                                                        )}
                                                        style={{
                                                            color:
                                                                tierInfo?.glowColor ||
                                                                "#A855F7",
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
                                                ? `linear-gradient(135deg, ${tierInfo.gradient[0]}10, ${tierInfo.gradient[1]}10)`
                                                : "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(59,130,246,0.1))",
                                        }}
                                    >
                                        {prize.asset?.iconUrl ? (
                                            <Image
                                                src={prize.asset.iconUrl}
                                                alt={prize.title}
                                                width={1000}
                                                height={1000}
                                                className={cn(
                                                    getResponsiveClass(70)
                                                        .frameClass,
                                                    "object-contain"
                                                )}
                                                quality={100}
                                                priority={true}
                                                unoptimized={false}
                                            />
                                        ) : (
                                            <Star
                                                className={cn(
                                                    getResponsiveClass(40)
                                                        .frameClass
                                                )}
                                                style={{
                                                    color:
                                                        tierInfo?.glowColor ||
                                                        "#A855F7",
                                                }}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 상품 정보 */}
                            <h3
                                className={cn(
                                    "font-bold text-white mb-2 text-center drop-shadow-lg",
                                    getResponsiveClass(30).textClass
                                )}
                            >
                                {prize.title}
                            </h3>

                            {/* 축하 메시지 */}
                            <div className="flex items-center justify-center gap-2">
                                <Sparkles className="w-4 h-4 text-yellow-300" />
                                <p
                                    className={cn(
                                        "text-white font-medium drop-shadow-lg",
                                        getResponsiveClass(20).textClass
                                    )}
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
                    "mt-2",
                    "transition-opacity duration-500",
                    isComplete
                        ? "opacity-0 pointer-events-none"
                        : "opacity-100",
                    getResponsiveClass(10).textClass
                )}
            >
                Reveal!
            </button>
        </div>
    );
});
