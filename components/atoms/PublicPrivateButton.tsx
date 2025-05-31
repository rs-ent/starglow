/// components/atoms/PublicPrivateButton.tsx

"use client";

import {memo, useCallback} from "react";
import {getResponsiveClass} from "@/lib/utils/responsiveClass";
import {cn} from "@/lib/utils/tailwind";

interface PublicPrivateButtonProps {
    title: string;
    isPublic: boolean;
    onClick: () => void;
    className?: string;
    frameSize?: number;
    textSize?: number;
    gapSize?: number;
    paddingSize?: number;
    isActive?: boolean;
    publicIcon?: string;
    privateIcon?: string;
}

function PublicPrivateButton({
    title,
    isPublic,
    onClick,
    className = "",
    textSize = 20,
    frameSize = 20,
    gapSize = 10,
    paddingSize = 0,
    isActive = false,
    publicIcon = "/icons/lock.svg",
    privateIcon = "/icons/world.svg",
}: PublicPrivateButtonProps) {
    // 반응형 클래스 계산 - 메모이제이션 기회가 있음
    const textSizeClass = getResponsiveClass(textSize).textClass;
    const frameSizeClass = getResponsiveClass(frameSize).frameClass;
    const gapSizeClass = getResponsiveClass(gapSize).gapClass;
    const paddingSizeClass = getResponsiveClass(paddingSize).paddingClass;

    // 현재 아이콘 결정
    const currentIcon = isPublic ? publicIcon : privateIcon;
    
    // 클릭 핸들러 메모이제이션
    const handleClick = useCallback(() => {
        onClick();
    }, [onClick]);

    // 컨테이너 클래스 계산
    const containerClasses = cn(
        isActive ? "opacity-100" : "opacity-40",
        "hover:opacity-100",
        "transition-opacity duration-500",
        "flex flex-row",
        isPublic ? "justify-end" : "justify-start"
    );
    
    // 버튼 클래스 계산
    const buttonClasses = cn(
        "flex items-center justify-baseline",
        "cursor-pointer",
        paddingSizeClass,
        textSizeClass,
        gapSizeClass,
        className
    );
    
    // 이미지 클래스 계산
    const imageClasses = cn(
        frameSizeClass,
        isActive ? "purple-glow" : ""
    );

    return (
        <div className={containerClasses}>
            <button
                type="button"
                onClick={handleClick}
                className={buttonClasses}
            >
                <h3 className={cn(isActive ? "text-glow-purple" : "")}>
                    {title}
                </h3>
                <img
                    src={currentIcon}
                    alt={title}
                    className={imageClasses}
                    width={frameSize}
                    height={frameSize}
                    loading="lazy"
                />
            </button>
        </div>
    );
}

export default memo(PublicPrivateButton);
