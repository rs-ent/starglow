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
                    {/* 외부 회전 링 */}
                    <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 animate-spin">
                        <div className="absolute inset-1 rounded-full bg-background" />
                    </div>

                    {/* 글로우 효과 */}
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500/30 via-pink-500/10 to-cyan-500/15 blur-sm animate-pulse" />
                </div>
                {/* Web3 스타일 텍스트 */}
                {text && (
                    <p
                        className={cn(
                            "mt-1 text-sm font-medium bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-pulse",
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
