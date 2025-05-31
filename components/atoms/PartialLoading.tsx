/// components/atoms/PartialLoading.tsx

import {Loader2} from "lucide-react";
import {getResponsiveClass} from "@/lib/utils/responsiveClass";
import {cn} from "@/lib/utils/tailwind";
import {memo, useEffect, useMemo, useState} from "react";
import {AnimatePresence, motion} from "framer-motion";

interface PartialLoadingProps {
    text: string;
    className?: string;
    size?: "xs" | "sm" | "md" | "lg";
    textSize?: number;
    gapSize?: number;
    variant?: "default" | "primary" | "secondary" | "ghost";
    fullScreen?: boolean;
    delay?: number;
    showSpinner?: boolean;
    progress?: number;
    animated?: boolean;
    onVisible?: () => void;
}

/**
 * 부분 로딩 컴포넌트 - 로딩 상태를 표시합니다.
 * 
 * @param text - 로딩 텍스트
 * @param className - 추가 CSS 클래스
 * @param size - 로딩 스피너 크기
 * @param textSize - 텍스트 크기
 * @param gapSize - 스피너와 텍스트 사이 간격
 * @param variant - 색상 변형
 * @param fullScreen - 전체 화면 오버레이 여부
 * @param delay - 표시 지연 시간(ms)
 * @param showSpinner - 스피너 표시 여부
 * @param progress - 진행률(0-100)
 * @param animated - 애니메이션 효과 적용 여부
 * @param onVisible - 컴포넌트가 표시될 때 호출될 콜백
 */
function PartialLoading({
    text,
    className = "",
    size = "md",
    textSize = 15,
    gapSize = 5,
    variant = "default",
    fullScreen = false,
    delay = 100,
    showSpinner = true,
    progress,
    animated = true,
    onVisible,
}: PartialLoadingProps) {
    const [isVisible, setIsVisible] = useState(delay === 0);

    // 지연 표시 처리
    useEffect(() => {
        if (delay > 0) {
            const timer = setTimeout(() => {
                setIsVisible(true);
                onVisible?.();
            }, delay);
            return () => clearTimeout(timer);
        } else if (delay === 0 && !isVisible) {
            setIsVisible(true);
            onVisible?.();
        }
    }, [delay, isVisible, onVisible]);

    // 스타일 클래스 메모이제이션
    const styles = useMemo(() => {
        const sizeClasses = {
            xs: "w-4 h-4",
            sm: "w-8 h-8",
            md: "w-12 h-12",
            lg: "w-16 h-16",
        };

        const variantClasses = {
            default: "text-white",
            primary: "text-primary",
            secondary: "text-secondary",
            ghost: "text-muted-foreground",
        };

        const containerClasses = cn(
            "flex items-center justify-center",
            fullScreen
                ? "fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                : "w-full h-full",
            className
        );

        return {
            sizeClass: sizeClasses[size],
            variantClass: variantClasses[variant],
            containerClass: containerClasses,
            textClass: getResponsiveClass(textSize).textClass,
            gapClass: getResponsiveClass(gapSize).gapClass,
        };
    }, [size, variant, fullScreen, className, textSize, gapSize]);

    // 진행률 표시 계산
    const progressValue = useMemo(() => {
        if (progress === undefined) return undefined;
        return Math.max(0, Math.min(100, progress));
    }, [progress]);

    if (!isVisible) return null;

    // 애니메이션 효과 적용
    const content = (
        <div
            className={styles.containerClass}
            role="status"
            aria-label={text}
            aria-live="polite"
            data-testid="partial-loading"
        >
            <div
                className={cn(
                    "flex flex-col items-center justify-center p-10",
                    styles.gapClass
                )}
            >
                {showSpinner && (
                    <div className="relative">
                        {progressValue !== undefined ? (
                            // 진행률 표시 스피너
                            <div className="relative">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    {/* 배경 원 */}
                                    <circle
                                        className="text-muted-foreground/20"
                                        strokeWidth="8"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="42"
                                        cx="50"
                                        cy="50"
                                    />
                                    {/* 진행률 원 */}
                                    <circle
                                        className={styles.variantClass}
                                        strokeWidth="8"
                                        strokeDasharray={264}
                                        strokeDashoffset={264 - (progressValue / 100) * 264}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="42"
                                        cx="50"
                                        cy="50"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={cn("text-xs font-medium", styles.variantClass)}>
                                        {progressValue}%
                                    </span>
                                </div>
                            </div>
                        ) : (
                            // 기본 스피너
                            <Loader2
                                className={cn(
                                    "animate-spin",
                                    styles.sizeClass,
                                    styles.variantClass
                                )}
                            />
                        )}
                    </div>
                )}
                <p
                    className={cn(
                        "text-muted-foreground",
                        styles.textClass
                    )}
                >
                    {text}
                </p>
            </div>
        </div>
    );

    // 애니메이션 적용 여부에 따라 다른 렌더링
    return animated ? (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
            >
                {content}
            </motion.div>
        </AnimatePresence>
    ) : (
        content
    );
}

export default memo(PartialLoading);