/// components/main/Main.Partners.Modal.tsx

import { memo } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

// 파트너 정보 타입
interface Partner {
    name: string;
    image: string;
    title: string;
    purpose?: string;
    description: string;
}

interface PartnerModalProps {
    partner: Partner | null;
    isOpen: boolean;
    onClose: () => void;
}

// 메인 모달 컴포넌트
export default memo(function PartnerModal({
    partner,
    isOpen,
    onClose,
}: PartnerModalProps) {
    if (!isOpen || !partner) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-50",
                "flex items-center justify-center",
                "bg-black/80 backdrop-blur-sm",
                "animate-in fade-in-0 duration-300"
            )}
            onClick={onClose}
        >
            <div
                className={cn(
                    "relative",
                    "w-full max-w-[600px] mx-4",
                    "bg-gradient-to-br from-[rgba(255,255,255,0.1)] to-[rgba(255,255,255,0.05)]",
                    "backdrop-blur-xl",
                    "border border-white/20",
                    "rounded-[12px]",
                    "p-6 md:p-12",
                    "animate-in zoom-in-95 duration-300",
                    "shadow-2xl shadow-black/50"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className={cn(
                        "absolute top-2 right-2",
                        "p-2",
                        "bg-white/10 hover:bg-white/20",
                        "border border-white/20",
                        "rounded-full",
                        "flex items-center justify-center",
                        "transition-all duration-200",
                        "hover:scale-110"
                    )}
                >
                    <X
                        className={cn(
                            "text-white",
                            getResponsiveClass(10).frameClass
                        )}
                    />
                </button>

                {/* 헤더 섹션 */}
                <div
                    className={cn(
                        "flex items-center mb-4 md:mb-8",
                        "gap-3 md:gap-6",
                        "flex-col sm:flex-row",
                        "text-left"
                    )}
                >
                    {/* 파트너 로고 */}
                    <div
                        className={cn(
                            "relative",
                            "bg-gradient-to-br from-[rgba(255,255,255,0.15)] to-[rgba(255,255,255,0.05)]",
                            "border border-white/20",
                            "rounded-[16px]",
                            "flex-shrink-0 p-2 md:p-4",
                            "flex items-center justify-center"
                        )}
                    >
                        <Image
                            src={partner.image}
                            alt={partner.name}
                            width={256}
                            height={256}
                            className={cn(
                                "object-contain",
                                getResponsiveClass(70).frameClass
                            )}
                            style={{
                                filter: "brightness(0) invert(1)",
                                opacity: 0.95,
                            }}
                        />
                    </div>

                    {/* 제목과 Purpose */}
                    <div className="w-full flex-1 flex flex-col items-start">
                        <h2
                            className={cn(
                                "text-2xl font-bold text-white mb-0.5",
                                "tracking-tight leading-0",
                                getResponsiveClass(30).textClass
                            )}
                        >
                            {partner.title}
                        </h2>
                        {partner.purpose && (
                            <div
                                className={cn(
                                    "inline-flex items-center",
                                    "bg-gradient-to-r from-blue-500/20 to-purple-500/20",
                                    "border border-blue-400/30",
                                    "rounded-full",
                                    "text-sm font-medium text-blue-200",
                                    getResponsiveClass(5).textClass,
                                    getResponsiveClass(15).paddingClass
                                )}
                            >
                                {partner.purpose}
                            </div>
                        )}
                    </div>
                </div>

                {/* 구분선 */}
                <div
                    className={cn(
                        "h-px w-full mb-4 md:mb-8",
                        "bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    )}
                />

                {/* 설명 섹션 */}
                <div>
                    <p
                        className={cn(
                            "text-white/70 leading-relaxed",
                            "text-base",
                            getResponsiveClass(10).textClass
                        )}
                    >
                        {partner.description}
                    </p>
                </div>
            </div>
        </div>
    );
});
