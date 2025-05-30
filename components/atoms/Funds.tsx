/// components/atoms/Funds.tsx

import {memo, useMemo} from "react";
import Image from "next/image";
import {getResponsiveClass} from "@/lib/utils/responsiveClass";
import {cn} from "@/lib/utils/tailwind";
import CountUp from "react-countup";

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
}

/**
 * 자금 금액과 아이콘을 표시하는 컴포넌트
 * 반응형 크기 조정과 애니메이션 숫자 표시 지원
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

    return (
        <div
            className={cn(
                "flex items-center justify-center bg-muted rounded-full transition-all shadow-lg",
                paddingClass,
                className,
                onClick ? "cursor-pointer hover:brightness-110" : ""
            )}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            aria-label={onClick ? `${fundsLabel}: ${funds}` : undefined}
            tabIndex={onClick ? 0 : undefined}
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
                        duration={0.7}
                        separator=","
                        preserveValue={true}
                    />
                </h6>
            </div>
        </div>
    );
}

export default memo(Funds);
