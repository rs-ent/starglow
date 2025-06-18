/// components/atoms/PartialLoading.tsx

import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { memo } from "react";

interface PartialLoadingProps {
    text: string;
}

function PartialLoading({ text }: PartialLoadingProps) {
    return (
        <div
            className="flex items-center justify-center w-full h-full"
            role="status"
            aria-label={text}
            aria-live="polite"
            data-testid="partial-loading"
        >
            <div className="flex flex-col items-center justify-center gap-6 p-10">
                {/* Web3 스타일 로딩 스피너 */}
                <div
                    className={cn(
                        "relative",
                        getResponsiveClass(40).frameClass
                    )}
                >
                    {/* 외부 회전 링 */}
                    <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 animate-spin">
                        <div className="absolute inset-1 rounded-full bg-background" />
                    </div>

                    {/* 내부 펄스 원 */}
                    <div className="absolute inset-3 rounded-full bg-gradient-to-r from-purple-400/50 via-pink-400/50 to-cyan-400/50 animate-pulse" />

                    {/* 중앙 코어 */}
                    <div className="absolute inset-6 rounded-full bg-gradient-to-r from-purple-300 to-cyan-300 animate-ping opacity-75" />

                    {/* 글로우 효과 */}
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 blur-lg animate-pulse" />

                    {/* 파티클 효과 */}
                    <div className="absolute -inset-1">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full animate-bounce opacity-60"
                                style={{
                                    top: `${
                                        50 + 35 * Math.sin((i * Math.PI) / 4)
                                    }%`,
                                    left: `${
                                        50 + 35 * Math.cos((i * Math.PI) / 4)
                                    }%`,
                                    animationDelay: `${i * 0.1}s`,
                                    animationDuration: "1.5s",
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Web3 스타일 텍스트 */}
                <p
                    className={cn(
                        "text-sm font-medium bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-pulse",
                        getResponsiveClass(10).textClass
                    )}
                >
                    {text}
                </p>
            </div>
        </div>
    );
}

export default memo(PartialLoading);
