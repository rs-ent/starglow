/// app/components/molecules/PublicPrivateTab.tsx

"use client";

import { cn } from "@/lib/utils/tailwind";
import PublicPrivateButton from "@/components/atoms/PublicPrivateButton";

interface PublicPrivateTabProps {
    isPublic: boolean;
    onPublic: () => void;
    onPrivate: () => void;
    className?: string;
    textSize?: number;
    frameSize?: number;
    gapSize?: number;
    paddingSize?: number;
}

export default function PublicPrivateTab({
    isPublic,
    onPublic,
    onPrivate,
    className = "",
    textSize = 20,
    frameSize = 20,
    gapSize = 10,
    paddingSize = 0,
}: PublicPrivateTabProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center",
                className
            )}
        >
            <div className="grid grid-cols-2 gap-[15px] cursor-pointer">
                <PublicPrivateButton
                    title="World"
                    isPublic={true}
                    onClick={onPublic}
                    textSize={textSize}
                    frameSize={frameSize}
                    gapSize={gapSize}
                    paddingSize={paddingSize}
                    isActive={isPublic}
                    className="justify-self-end"
                />

                <PublicPrivateButton
                    title="Exclusive"
                    isPublic={false}
                    onClick={onPrivate}
                    textSize={textSize}
                    frameSize={frameSize}
                    gapSize={gapSize}
                    paddingSize={paddingSize}
                    isActive={!isPublic}
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
                            WebkitMaskImage: `url(/elements/el-long-star.svg)`,
                            maskImage: `url(/elements/el-long-star.svg)`,
                            WebkitMaskSize: "100%",
                            maskSize: "100%",
                            WebkitMaskRepeat: "no-repeat",
                            maskRepeat: "no-repeat",
                            WebkitMaskPosition: "center",
                            maskPosition: "center",
                            background:
                                "linear-gradient(to right,rgba(245,225,255,1) 20%, rgba(139, 92, 246, 0) 70%)",
                        }}
                    />

                    {/* 오른쪽에서 왼쪽으로 그라디언트 (Private) */}
                    <div
                        className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ${
                            isPublic ? "opacity-0" : "opacity-100"
                        }`}
                        style={{
                            WebkitMaskImage: `url(/elements/el-long-star.svg)`,
                            maskImage: `url(/elements/el-long-star.svg)`,
                            WebkitMaskSize: "100%",
                            maskSize: "100%",
                            WebkitMaskRepeat: "no-repeat",
                            maskRepeat: "no-repeat",
                            WebkitMaskPosition: "center",
                            maskPosition: "center",
                            background:
                                "linear-gradient(to left, rgba(245,225,255,1) 20%, rgba(139, 92, 246, 0) 70%)",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
