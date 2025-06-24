/// components/main/Main.Partners.tsx

import { memo } from "react";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

// 파트너 정보 타입 정의
interface Partner {
    name: string;
    image: string;
}

// 파트너 목록
const partners: Partner[] = [
    { name: "nh", image: "/logo/partners/nh.png" },
    { name: "kodit", image: "/logo/partners/kodit.png" },
    { name: "bandolabs", image: "/logo/partners/bandolabs.png" },
    { name: "yarche", image: "/logo/partners/yarche.png" },
    { name: "unicorn", image: "/logo/partners/unicorn.png" },
    { name: "yellowpunch", image: "/logo/partners/yellowpunch.png" },
    { name: "makestar", image: "/logo/partners/makestar.png" },
    { name: "220ent", image: "/logo/partners/220.png" },
    { name: "hiuaa", image: "/logo/partners/hiuaa.png" },
    { name: "hans-biomed", image: "/logo/partners/hans-biomed.png" },
    { name: "ayaeoeo", image: "/logo/partners/ayaeoeo.png" },
    { name: "kto", image: "/logo/partners/kto.png" },
    { name: "kocca", image: "/logo/partners/kocca.png" },
    { name: "seoulmunhwa", image: "/logo/partners/seoulmunhwa.png" },
    { name: "kams", image: "/logo/partners/kams.png" },
    { name: "seoul", image: "/logo/partners/seoul.png" },
];

// 메모이제이션된 파트너 로고 컴포넌트
const PartnerLogo = memo(({ partner }: { partner: Partner }) => (
    <div
        className={cn(
            "aspect-square relative",
            "bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0)]",
            "rounded-[12px]",
            "w-full"
        )}
    >
        <img
            src={partner.image}
            alt={partner.name}
            className={cn(
                "absolute inset-0 w-full h-full",
                "object-contain",
                "p-[15px] sm:p-[12px] md:p-[14px] lg:p-[16px] xl:p-[18px]"
            )}
            style={{
                filter: "brightness(0) invert(1)",
                opacity: 0.92,
            }}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
        />
    </div>
));
PartnerLogo.displayName = "PartnerLogo";

// 메인 컴포넌트
export default function MainPartners() {
    return (
        <div className="flex flex-col items-center justify-center w-full">
            <h2
                className={cn(getResponsiveClass(40).textClass)}
                style={{
                    textShadow: "0 0 12px rgba(255,255,255,0.3)",
                }}
            >
                Partners
            </h2>
            <div
                className={cn(
                    "w-full max-w-[900px]",
                    "mt-[30px]",
                    "grid",
                    "grid-cols-4",
                    "gap-[8px] sm:gap-[10px] md:gap-[12px] lg:gap-[14px] xl:gap-[16px]",
                    "px-[60px] sm:px-[80px] md:px-[26px] lg:px-[28px] xl:px-[30px]"
                )}
            >
                {partners.map((partner) => (
                    <PartnerLogo key={partner.name} partner={partner} />
                ))}
            </div>
        </div>
    );
}
