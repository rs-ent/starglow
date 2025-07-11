/// components/main/Main.Partners.tsx

import { memo, useState } from "react";
import Image from "next/image";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import PartnerModal from "./Main.Partners.Modal";

// 파트너 정보 타입 정의
interface Partner {
    name: string;
    image: string;
    title: string;
    purpose?: string;
    description: string;
}

// 파트너 목록
const partners: Partner[] = [
    {
        name: "Berachain",
        image: "/logo/partners/berachain.png",
        title: "Berachain",
        purpose: "Financial Partnership",
        description:
            "Berachain is a global Web3.0 platform that provides a comprehensive suite of services for the Web3.0 ecosystem",
    },
    {
        name: "nh",
        image: "/logo/partners/nh.png",
        title: "NH Bank",
        purpose: "Financial Partnership",
        description:
            "Leading Korean agricultural cooperative bank providing financial partnership for innovative Web3 ventures",
    },
    {
        name: "kodit",
        image: "/logo/partners/kodit.png",
        title: "Korea Credit Guarantee Fund",
        purpose: "Financial Partnership",
        description:
            "Government credit guarantee fund supporting innovative startups with financial backing and credit solutions",
    },
    {
        name: "bandolabs",
        image: "/logo/partners/bandolabs.png",
        title: "BANDOLABS",
        purpose: "Strategic Partnership",
        description:
            "Premier Web3.0 innovation partner driving blockchain strategy, tokenomics design, and global expansion for next-generation Web3.0 platforms",
    },
    {
        name: "yarche",
        image: "/logo/partners/yarche.png",
        title: "Y & ARCHER",
        purpose: "Financial Partnership",
        description:
            "Innovation-focused startup accelerator specializing in ventures with top-tier talent and ecosystem leadership",
    },
    {
        name: "unicorn",
        image: "/logo/partners/unicorn.png",
        title: "Unicorn Guild Partners",
        purpose: "Financial Partnership",
        description:
            "Venture capital firm managing private equity investments in high-growth startups with plans to expand institutional funding",
    },
    {
        name: "yellowpunch",
        image: "/logo/partners/yellowpunch.png",
        title: "Yello Punch",
        purpose: "Strategic Partnership",
        description:
            "Global expansion accelerator specializing in e-commerce, media content, and trade technology startups with international market expertise",
    },
    {
        name: "makestar",
        image: "/logo/partners/makestar.png",
        title: "MAKESTAR",
        purpose: "Industry Partnership",
        description:
            "Global K-pop platform connecting artists and fans worldwide with innovative content creation and eco-friendly album solutions",
    },
    {
        name: "220ent",
        image: "/logo/partners/220.png",
        title: "220 Entertainment",
        purpose: "Industry Partnership",
        description:
            "Korean entertainment agency with extensive K-pop production experience including 2PM, BEAST, SISTAR, EXID, KNK management",
    },
    {
        name: "hiuaa",
        image: "/logo/partners/hiuaa.png",
        title: "HIUAA",
        purpose: "Strategic Partnership",
        description:
            "Network organization fostering innovative startups and building entrepreneurial ecosystems through business connections",
    },
    {
        name: "hans-biomed",
        image: "/logo/partners/hans-biomed.png",
        title: "Hans Biomed",
        purpose: "Strategic Partnership",
        description:
            "Global biotech company providing strategic insights for innovation-driven business expansion",
    },
    {
        name: "ayaeoeo",
        image: "/logo/partners/ayaeoeo.png",
        title: "Ayaeoeo",
        purpose: "Strategic Partnership",
        description:
            "Social enterprise specializing in cultural event planning and supporting young artists through creative community projects",
    },
    {
        name: "kto",
        image: "/logo/partners/kto.png",
        title: "Korea Tourism Organization",
        purpose: "Government Partnership",
        description:
            "Korea Tourism Organization promoting Korean culture and tourism industry through K-pop and Hallyu content initiatives",
    },
    {
        name: "kocca",
        image: "/logo/partners/kocca.png",
        title: "Korea Creative Content Agency",
        purpose: "Government Partnership",
        description:
            "Korea Creative Content Agency supporting music and entertainment content production, distribution, and global expansion initiatives",
    },
    {
        name: "seoulmunhwa",
        image: "/logo/partners/seoulmunhwa.png",
        title: "Seoul Culture Foundation",
        purpose: "Government Partnership",
        description:
            "Seoul Foundation for Arts and Culture supporting creative arts, cultural festivals, and artist development programs in Seoul",
    },
    {
        name: "kams",
        image: "/logo/partners/kams.png",
        title: "Korea Art Management Service",
        purpose: "Government Partnership",
        description:
            "Supporting Korean arts organizations, international promotion, and arts-related startup development",
    },
    {
        name: "seoul",
        image: "/logo/partners/seoul.png",
        title: "Seoul Metropolitan Government",
        purpose: "Government Partnership",
        description:
            "Seoul Metropolitan Government supporting cultural innovation, startup ecosystem, and K-pop industry development initiatives",
    },
];

// 메모이제이션된 파트너 로고 컴포넌트
const PartnerLogo = memo(
    ({ partner, onClick }: { partner: Partner; onClick: () => void }) => (
        <div
            className={cn(
                "aspect-square relative",
                "bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0)]",
                "rounded-[12px]",
                "w-full",
                "cursor-pointer",
                "hover:bg-gradient-to-br hover:from-[rgba(255,255,255,0.1)] hover:to-[rgba(255,255,255,0.05)]",
                "transition-all duration-300",
                "hover:scale-105",
                "hover:border hover:border-white/20"
            )}
            onClick={onClick}
        >
            <Image
                src={partner.image}
                alt={partner.name}
                fill
                className={cn(
                    "object-contain",
                    "p-[15px] sm:p-[12px] md:p-[14px] lg:p-[16px] xl:p-[18px]"
                )}
                style={{
                    filter: "brightness(0) invert(1)",
                    opacity: 0.92,
                }}
                loading="lazy"
                sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
        </div>
    )
);
PartnerLogo.displayName = "PartnerLogo";

// 메인 컴포넌트
export default function MainPartners() {
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(
        null
    );
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handlePartnerClick = (partner: Partner) => {
        setSelectedPartner(partner);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPartner(null);
    };

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
                    "grid-cols-3 md:grid-cols-4",
                    "gap-[8px] sm:gap-[10px] md:gap-[12px] lg:gap-[14px] xl:gap-[16px]",
                    "px-[30px] sm:px-[50px] md:px-[26px] lg:px-[28px] xl:px-[30px]"
                )}
            >
                {partners.map((partner) => (
                    <PartnerLogo
                        key={partner.name}
                        partner={partner}
                        onClick={() => handlePartnerClick(partner)}
                    />
                ))}
            </div>

            {/* 파트너 모달 */}
            <PartnerModal
                partner={selectedPartner}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </div>
    );
}
