/// app/components/molecules/PublicPrivateTab.tsx

"use client";

import {memo} from "react";

import PublicPrivateButton from "@/components/atoms/PublicPrivateButton";
import {cn} from "@/lib/utils/tailwind";

interface PublicPrivateTabProps {
    isPublic: boolean;
    onPublic: () => void;
    onPrivate: () => void;
    className?: string;
    textSize?: number;
    frameSize?: number;
    gapSize?: number;
    paddingSize?: number;
    publicText?: string;
    privateText?: string;
    publicIcon?: string;
    privateIcon?: string;
}

function PublicPrivateTab({
    isPublic,
    onPublic,
    onPrivate,
    className = "",
    textSize = 20,
    frameSize = 20,
    gapSize = 10,
    paddingSize = 0,
    publicText = "World",
    privateText = "Exclusive",
    publicIcon = "/icons/world.svg",
    privateIcon = "/icons/lock.svg",
}: PublicPrivateTabProps) {
    // 마스크 스타일 객체를 미리 정의하여 렌더링 시 계산 비용 감소
    const maskStyle = {
        WebkitMaskImage: `url(/elements/el-long-star.svg)`,
        maskImage: `url(/elements/el-long-star.svg)`,
        WebkitMaskSize: "100%",
        maskSize: "100%",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
    };

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center",
                className
            )}
        >
            <div className="grid grid-cols-2 gap-[20px] cursor-pointer">
                <PublicPrivateButton
                    title={publicText}
                    isPublic={true}
                    onClick={onPublic}
                    textSize={textSize}
                    frameSize={frameSize}
                    gapSize={gapSize}
                    paddingSize={paddingSize}
                    isActive={isPublic}
                    publicIcon={publicIcon}
                    className="justify-self-end"
                />

                <PublicPrivateButton
                    title={privateText}
                    isPublic={false}
                    onClick={onPrivate}
                    textSize={textSize}
                    frameSize={frameSize}
                    gapSize={gapSize}
                    paddingSize={paddingSize}
                    isActive={!isPublic}
                    privateIcon={privateIcon}
                    className="justify-self-start"
                />
            </div>

            <div
                className={cn(
                    "flex justify-center items-center",
                    "w-[230px] sm:w-[320px] md:w-[400px] lg:w-[450px]"
                )}
            >
                <div className="w-[95%] relative h-[20px]">
                    <div
                        className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ${
                            isPublic ? "opacity-100" : "opacity-0"
                        }`}
                        style={{
                            ...maskStyle,
                            background:
                                "linear-gradient(to right,rgba(245,225,255,1) 20%, rgba(139, 92, 246, 0) 70%)",
                        }}
                    />

                    <div
                        className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ${
                            isPublic ? "opacity-0" : "opacity-100"
                        }`}
                        style={{
                            ...maskStyle,
                            background:
                                "linear-gradient(to left, rgba(245,225,255,1) 20%, rgba(139, 92, 246, 0) 70%)",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default memo(PublicPrivateTab);
