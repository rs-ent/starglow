/// components/atoms/Funds.tsx

import {memo, useMemo} from "react";

import Image from "next/image";
import CountUp from "react-countup";

import {getResponsiveClass} from "@/lib/utils/responsiveClass";
import {cn} from "@/lib/utils/tailwind";

interface FundsProps {
    funds: number;
    fundsLabel?: string;
    fundsIcon?: string;
    frameSize?: number;
    textSize?: number;
    gapSize?: number;
    paddingSize?: number;
    className?: string;
    onClick?: () => void;
    preserveValue?: boolean;
    duration?: number;
    formatter?: (value: number) => string;
}

/**
 * 자금 금액과 아이콘을 표시하는 컴포넌트
 * 반응형 크기 조정과 애니메이션 숫자 표시 지원
 * 
 * @param funds - 표시할 금액
 * @param fundsLabel - 금액 라벨 (alt 텍스트에 사용)
 * @param fundsIcon - 아이콘 이미지 경로
 * @param frameSize - 아이콘 프레임 크기
 * @param textSize - 텍스트 크기
 * @param gapSize - 아이콘과 텍스트 사이 간격
 * @param paddingSize - 컴포넌트 내부 패딩
 * @param className - 추가 CSS 클래스
 * @param onClick - 클릭 이벤트 핸들러
 * @param preserveValue - 컴포넌트 리렌더링 시 애니메이션 유지 여부
 * @param duration - 애니메이션 지속 시간(초)
 * @param formatter - 숫자 포맷팅 함수
 */
function Funds({
    funds = 0,
    fundsLabel = "Funds",
    fundsIcon,
    frameSize = 20,
    textSize = 20,
    gapSize = 20,
    paddingSize = 10,
    className = "",
    onClick,
    preserveValue = true,
    duration = 0.7,
    formatter,
}: FundsProps) {
    // 반응형 클래스 계산 - 메모이제이션 적용
    const responsiveClasses = useMemo(() => {
        const { textClass } = getResponsiveClass(textSize);
        const { frameClass } = getResponsiveClass(frameSize);
        const { gapClass } = getResponsiveClass(gapSize);
        const { paddingClass } = getResponsiveClass(paddingSize);

        return { textClass, frameClass, gapClass, paddingClass };
    }, [textSize, frameSize, gapSize, paddingSize]);

    const { textClass, frameClass, gapClass, paddingClass } = responsiveClasses;

    // 이미지 렌더링 최적화
    const renderIcon = useMemo(() => {
        if (!fundsIcon) return null;

        return fundsIcon.endsWith(".svg") ? (
            <img
                src={fundsIcon}
                alt={`${fundsLabel} logo`}
                className={cn(frameClass)}
                style={{
                    width: `${frameSize}px`,
                    height: "auto",
                }}
                loading="lazy"
            />
        ) : (
            <Image
                src={fundsIcon}
                alt={`${fundsLabel} logo`}
                width={frameSize}
                height={frameSize}
                className={cn(frameClass)}
                style={{ objectFit: "contain" }}
                priority={false}
            />
        );
    }, [fundsIcon, fundsLabel, frameClass, frameSize]);

    // 숫자 포맷팅 처리
    const formattedValue = useMemo(() => {
        if (formatter) {
            return formatter(funds);
        }
        return undefined;
    }, [funds, formatter]);

    return (
        <div
            className={cn(
                "flex items-center justify-center bg-muted rounded-full transition-all shadow-lg",
                paddingClass,
                className,
                onClick ? "cursor-pointer hover:brightness-110 active:scale-95" : ""
            )}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            aria-label={onClick ? `${fundsLabel}: ${funds}` : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
        >
            <div className={cn("flex items-center justify-between", gapClass)}>
                {renderIcon && (
                    <div className="rounded-full flex items-center justify-center">
                        {renderIcon}
                    </div>
                )}
                <h6
                    className={cn(
                        textClass,
                        "mr-1 text-foreground flex items-center justify-center text-right"
                    )}
                >
                    <CountUp
                        end={funds}
                        duration={duration}
                        separator=","
                        preserveValue={preserveValue}
                        formattingFn={formattedValue ? () => formattedValue : undefined}
                        decimals={Number.isInteger(funds) ? 0 : 2}
                        decimal="."
                    />
                </h6>
            </div>
        </div>
    );
}

export default memo(Funds);
