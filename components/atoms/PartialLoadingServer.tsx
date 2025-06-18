/// components/atoms/PartialLoadingServer.tsx

import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";

interface PartialLoadingProps {
    text?: string;
    loadingSize?: number;
    textSize?: number;
}

export default function PartialLoadingServer({
    text,
    loadingSize = 50,
    textSize = 5,
}: PartialLoadingProps) {
    return (
        <div
            className="flex items-center justify-center w-full h-full"
            role="status"
            aria-label={text}
            aria-live="polite"
            data-testid="partial-loading"
        >
            <div className="flex flex-col items-center justify-center">
                {/* Web3 스타일 로딩 스피너 */}
                <div
                    className={cn(
                        "relative",
                        getResponsiveClass(loadingSize).frameClass
                    )}
                >
                    {/* 글로우 효과 */}
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 blur-sm animate-pulse" />

                    {/* 외부 회전 링 - 이미지로 마스킹 */}
                    <div
                        className="absolute inset-0 border-2 border-transparent"
                        style={{
                            mask: "url(/logo/l-gradient-purple.svg) no-repeat center",
                            maskSize: "contain",
                            WebkitMask:
                                "url(/logo/l-gradient-purple.svg) no-repeat center",
                            WebkitMaskSize: "contain",
                            filter: "blur(15px)",
                        }}
                    >
                        {/* 회전하는 그라데이션 배경 */}
                        <div className="absolute inset-0 scale-125 bg-gradient-to-r from-purple-200 via-pink-200 to-cyan-200 animate-spin" />
                    </div>
                </div>
                {/* Web3 스타일 텍스트 */}
                {text && (
                    <p
                        className={cn(
                            "mt-1 text-sm font-medium bg-gradient-to-r from-purple-400 via-pink-300 to-cyan-300 bg-clip-text text-transparent animate-pulse",
                            getResponsiveClass(textSize).textClass
                        )}
                    >
                        {text}
                    </p>
                )}
            </div>
        </div>
    );
}
