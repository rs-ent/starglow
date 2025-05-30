/// components/atoms/CustomCarousel.tsx

"use client";

import { useState, useRef, useCallback, ReactNode, Children } from "react";
import { cn } from "@/lib/utils/tailwind";

type CarouselDirection = "horizontal" | "vertical";

interface CustomCarouselProps {
    children: ReactNode;
    direction?: CarouselDirection;
    onIndexChange?: (index: number) => void;
    initialIndex?: number;
    className?: string;
    containerClassName?: string;
    showIndicators?: boolean;
    indicatorClassName?: string;
    swipeThreshold?: number;
}

export default function CustomCarousel({
    children,
    direction = "horizontal",
    onIndexChange,
    initialIndex = 0,
    className,
    containerClassName,
    showIndicators = true,
    indicatorClassName,
    swipeThreshold = 50,
}: CustomCarouselProps) {
    // Children을 배열로 변환하고 개수 계산
    const childrenArray = Children.toArray(children);
    const totalItems = childrenArray.length;

    // 최소한의 상태만
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(0);
    const [dragCurrent, setDragCurrent] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const isHorizontal = direction === "horizontal";

    // 인덱스 변경 (확실한 경계 체크)
    const goToIndex = useCallback(
        (newIndex: number) => {
            const safeIndex = Math.max(0, Math.min(newIndex, totalItems - 1));

            if (safeIndex !== currentIndex) {
                setCurrentIndex(safeIndex);
                onIndexChange?.(safeIndex);
            }
        },
        [currentIndex, totalItems, onIndexChange]
    );

    // 이전/다음으로 이동
    const moveTo = useCallback(
        (direction: "prev" | "next") => {
            const newIndex =
                direction === "prev" ? currentIndex - 1 : currentIndex + 1;

            goToIndex(newIndex);
        },
        [currentIndex, goToIndex]
    );

    // 드래그 시작
    const handleDragStart = useCallback(
        (pos: number) => {
            if (totalItems <= 1) {
                return;
            }

            setIsDragging(true);
            setDragStart(pos);
            setDragCurrent(pos);
        },
        [totalItems, isHorizontal]
    );

    // 드래그 중
    const handleDragMove = useCallback(
        (pos: number) => {
            if (!isDragging) {
                return;
            }

            setDragCurrent(pos);
        },
        [isDragging, dragStart]
    );

    // 드래그 끝
    const handleDragEnd = useCallback(() => {
        if (!isDragging) {
            return;
        }

        setIsDragging(false);
        const diff = dragCurrent - dragStart;

        // 임계값 체크
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                moveTo("prev");
            } else {
                moveTo("next");
            }
        }

        // 드래그 상태 초기화
        setDragStart(0);
        setDragCurrent(0);
    }, [isDragging, dragCurrent, dragStart, swipeThreshold, moveTo]);

    // 터치 이벤트
    const handleTouchStart = (e: React.TouchEvent) => {
        const pos = isHorizontal ? e.touches[0].clientX : e.touches[0].clientY;
        handleDragStart(pos);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const pos = isHorizontal ? e.touches[0].clientX : e.touches[0].clientY;
        handleDragMove(pos);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        handleDragEnd();
    };

    // 마우스 이벤트
    const handleMouseDown = (e: React.MouseEvent) => {
        const pos = isHorizontal ? e.clientX : e.clientY;
        handleDragStart(pos);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const pos = isHorizontal ? e.clientX : e.clientY;
        handleDragMove(pos);
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        handleDragEnd();
    };

    const handleMouseLeave = () => {
        if (isDragging) handleDragEnd();
    };

    // 현재 translate 계산 (드래그 중 미리보기 포함)
    const getCurrentTranslate = () => {
        // 올바른 계산: 각 아이템이 차지하는 비율만큼 이동
        let baseTranslate = -currentIndex * (100 / totalItems);

        if (isDragging && containerRef.current) {
            const diff = dragCurrent - dragStart;
            const containerSize = isHorizontal
                ? containerRef.current.clientWidth
                : containerRef.current.clientHeight;

            if (containerSize > 0) {
                // 드래그 퍼센트도 아이템 크기에 맞게 조정
                const dragPercent = (diff / containerSize) * (100 / totalItems);
                baseTranslate += dragPercent;

                // 경계에서 저항감 (옵션)
                const maxTranslate = 0;
                const minTranslate = -(totalItems - 1) * (100 / totalItems);

                if (baseTranslate > maxTranslate) {
                    const overflow = baseTranslate - maxTranslate;
                    baseTranslate = maxTranslate + overflow * 0.3;
                } else if (baseTranslate < minTranslate) {
                    const overflow = baseTranslate - minTranslate;
                    baseTranslate = minTranslate + overflow * 0.3;
                }
            }
        }

        return baseTranslate;
    };

    const translateProperty = isHorizontal ? "translateX" : "translateY";
    const currentTranslate = getCurrentTranslate();

    return (
        <div
            className={cn(
                "relative",
                isHorizontal ? "w-full" : "h-full",
                className
            )}
        >
            <div
                ref={containerRef}
                className={cn(
                    "relative overflow-hidden cursor-grab active:cursor-grabbing",
                    isHorizontal ? "w-full" : "h-full",
                    containerClassName
                )}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                <div
                    className={cn(
                        "flex transition-transform ease-out",
                        isHorizontal
                            ? "w-full h-full flex-row"
                            : "w-full h-full flex-col"
                    )}
                    style={{
                        transform: `${translateProperty}(${currentTranslate}%)`,
                        [isHorizontal ? "width" : "height"]: `${
                            totalItems * 100
                        }%`,
                        transitionDuration: isDragging ? "0ms" : "300ms",
                        transitionTimingFunction:
                            "cubic-bezier(0.25, 1, 0.5, 1)",
                    }}
                >
                    {childrenArray.map((child, index) => {
                        return (
                            <div
                                key={index}
                                className="flex items-center justify-center flex-shrink-0"
                                style={{
                                    [isHorizontal ? "width" : "height"]: `${
                                        100 / totalItems
                                    }%`,
                                }}
                            >
                                {child}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 인디케이터 */}
            {showIndicators && totalItems > 1 && (
                <div
                    className={cn(
                        "absolute z-10",
                        isHorizontal
                            ? "w-full flex items-center justify-center gap-1 bottom-4"
                            : "h-full flex flex-col items-center justify-center gap-1 right-4",
                        indicatorClassName
                    )}
                >
                    {Array.from({ length: totalItems }, (_, index) => (
                        <div
                            key={index}
                            className={cn(
                                "rounded-full transition-all duration-300",
                                isHorizontal ? "h-1" : "w-1",
                                index === currentIndex
                                    ? isHorizontal
                                        ? "w-6 bg-white"
                                        : "h-6 bg-white"
                                    : isHorizontal
                                    ? "w-1 bg-white/50"
                                    : "h-1 bg-white/50"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
