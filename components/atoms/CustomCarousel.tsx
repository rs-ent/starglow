/// components/atoms/CustomCarousel.tsx

"use client";

import type { ReactNode } from "react";
import React, {
    useState,
    useRef,
    useCallback,
    Children,
    useMemo,
    useEffect,
    memo,
} from "react";

import { cn } from "@/lib/utils/tailwind";

type CarouselDirection = "horizontal" | "vertical";

interface CustomCarouselProps {
    children: ReactNode;
    direction?: CarouselDirection;
    onIndexChange?: (index: number) => void;
    initialIndex?: number;
    currentIndex?: number;
    totalItems?: number;
    className?: string;
    containerClassName?: string;
    showIndicators?: boolean;
    indicatorClassName?: string;
    swipeThreshold?: number;
    speed?: number;
}

// 자식 컴포넌트를 메모이제이션
const CarouselItem = memo(
    ({ child, style }: { child: ReactNode; style: any }) => (
        <div
            className="flex items-start justify-center flex-shrink-0"
            style={style}
        >
            {child}
        </div>
    )
);
CarouselItem.displayName = "CarouselItem";

export default React.memo(function CustomCarousel({
    children,
    direction = "horizontal",
    onIndexChange,
    initialIndex = 0,
    currentIndex: externalCurrentIndex,
    totalItems: externalTotalItems,
    className,
    containerClassName,
    showIndicators = true,
    indicatorClassName,
    swipeThreshold = 50,
    speed = 700,
}: CustomCarouselProps) {
    const childrenArray = Children.toArray(children);
    const totalItems = externalTotalItems || childrenArray.length;

    // 최소한의 상태만
    const [internalCurrentIndex, setInternalCurrentIndex] =
        useState(initialIndex);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(0);
    const [dragCurrent, setDragCurrent] = useState(0);

    // 외부에서 제어되는지 확인
    const isControlled = externalCurrentIndex !== undefined;
    const currentIndex = isControlled
        ? externalCurrentIndex
        : internalCurrentIndex;

    // 외부 currentIndex 변경 시 내부 상태 동기화
    useEffect(() => {
        if (isControlled && externalCurrentIndex !== internalCurrentIndex) {
            setInternalCurrentIndex(externalCurrentIndex);
        }
    }, [externalCurrentIndex, isControlled, internalCurrentIndex]);

    const containerRef = useRef<HTMLDivElement>(null);
    const isHorizontal = direction === "horizontal";

    // 인덱스 변경 (확실한 경계 체크)
    const goToIndex = useCallback(
        (newIndex: number) => {
            const safeIndex = Math.max(0, Math.min(newIndex, totalItems - 1));

            if (safeIndex !== currentIndex) {
                if (!isControlled) {
                    setInternalCurrentIndex(safeIndex);
                }
                onIndexChange?.(safeIndex);
            }
        },
        [currentIndex, totalItems, onIndexChange, isControlled]
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
        [totalItems]
    );

    // 드래그 중
    const handleDragMove = useCallback(
        (pos: number) => {
            if (!isDragging) {
                return;
            }

            setDragCurrent(pos);
        },
        [isDragging]
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

    // 이벤트 핸들러들을 useMemo로 최적화
    const eventHandlers = useMemo(
        () => ({
            onTouchMove: (e: React.TouchEvent) => {
                const pos = isHorizontal
                    ? e.touches[0].clientX
                    : e.touches[0].clientY;
                handleDragMove(pos);
            },
            onTouchEnd: (e: React.TouchEvent) => {
                e.preventDefault();
                handleDragEnd();
            },
            onMouseDown: (e: React.MouseEvent) => {
                e.preventDefault();
                const pos = isHorizontal ? e.clientX : e.clientY;
                handleDragStart(pos);
            },
            onMouseMove: (e: React.MouseEvent) => {
                e.preventDefault();
                if (!isDragging) return;
                const pos = isHorizontal ? e.clientX : e.clientY;
                handleDragMove(pos);
            },
            onMouseUp: (e: React.MouseEvent) => {
                e.preventDefault();
                handleDragEnd();
            },
            onMouseLeave: () => {
                if (isDragging) handleDragEnd();
            },
            onWheel: (e: React.WheelEvent) => {
                if (!isHorizontal && !isDragging) {
                    e.preventDefault(); // 페이지 스크롤 방지

                    // 디바운스를 위한 타임아웃
                    if (wheelTimeoutRef.current) {
                        clearTimeout(wheelTimeoutRef.current);
                    }

                    wheelTimeoutRef.current = setTimeout(() => {
                        if (e.deltaY > 0) {
                            moveTo("next");
                        } else if (e.deltaY < 0) {
                            moveTo("prev");
                        }
                    }, 50);
                }
            },
        }),
        [
            isHorizontal,
            isDragging,
            handleDragStart,
            handleDragMove,
            handleDragEnd,
            moveTo,
        ]
    );

    // 휠 이벤트 디바운스를 위한 ref 추가
    const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // cleanup
    useEffect(() => {
        return () => {
            if (wheelTimeoutRef.current) {
                clearTimeout(wheelTimeoutRef.current);
            }
        };
    }, []);

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

    // 메모리 누수 방지 - 이벤트 리스너 정리
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDragging) handleDragEnd();
        };

        if (isDragging) {
            window.addEventListener("mouseup", handleGlobalMouseUp);
            window.addEventListener("touchend", handleGlobalMouseUp);
        }

        return () => {
            window.removeEventListener("mouseup", handleGlobalMouseUp);
            window.removeEventListener("touchend", handleGlobalMouseUp);
        };
    }, [isDragging, handleDragEnd]);

    // touchstart와 wheel 이벤트를 패시브로 설정
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleTouchStart = (e: TouchEvent) => {
            const pos = isHorizontal
                ? e.touches[0].clientX
                : e.touches[0].clientY;
            handleDragStart(pos);
        };

        // 패시브 리스너로 성능 향상
        container.addEventListener("touchstart", handleTouchStart, {
            passive: true,
        });

        return () => {
            container.removeEventListener("touchstart", handleTouchStart);
        };
    }, [isHorizontal, handleDragStart]);

    // virtualization: 앞뒤 2개만 렌더
    const visibleRange = 2;
    const visibleIndexes = useMemo(() => {
        // 항상 0~currentIndex까지는 렌더
        const indexes = [];
        for (let i = 0; i <= currentIndex; i++) {
            indexes.push(i);
        }
        // 그리고 currentIndex+1~currentIndex+visibleRange까지 추가
        for (
            let i = currentIndex + 1;
            i <= Math.min(totalItems - 1, currentIndex + visibleRange);
            i++
        ) {
            indexes.push(i);
        }
        return indexes;
    }, [currentIndex, totalItems]);

    return (
        <div
            className={cn(
                "relative",
                isHorizontal ? "w-full" : "h-full",
                className
            )}
            style={{
                userSelect: isDragging ? "none" : undefined,
                // 터치 액션 최적화
                touchAction: isHorizontal ? "pan-y" : "pan-x",
            }}
        >
            <div
                ref={containerRef}
                className={cn(
                    "relative overflow-hidden cursor-grab active:cursor-grabbing",
                    isHorizontal ? "w-full" : "h-full",
                    containerClassName
                )}
                style={{
                    contain: "layout style paint",
                }}
                {...eventHandlers}
            >
                <div
                    className={cn(
                        "flex transition-transform ease-out",
                        isHorizontal
                            ? "w-full h-full flex-row"
                            : "w-full h-full flex-col"
                    )}
                    style={{
                        transform: `${translateProperty}(${currentTranslate}%) translateZ(0)`,
                        [isHorizontal ? "width" : "height"]: `${
                            totalItems * 100
                        }%`,
                        transitionDuration: isDragging ? "0ms" : `${speed}ms`,
                        transitionTimingFunction:
                            "cubic-bezier(0.25, 1, 0.5, 1)",
                        willChange: isDragging ? "transform" : "auto",
                    }}
                >
                    {childrenArray.map((child, index) =>
                        visibleIndexes.includes(index) ? (
                            <CarouselItem
                                key={index}
                                child={child}
                                style={{
                                    [isHorizontal ? "width" : "height"]: `${
                                        100 / totalItems
                                    }%`,
                                }}
                            />
                        ) : null
                    )}
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
});
