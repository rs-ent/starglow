/// components/main/FollowUs.tsx

import { memo } from "react";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import LinkButton from "../atoms/LinkButton";

interface FollowUsProps {
    frameSize?: number;
    textSize?: number;
    gapSize?: number;
    minimal?: boolean;
    className?: string;
}

// 소셜 링크 데이터 - 컴포넌트 외부로 이동
const socialLinks = [
    {
        href: "https://discord.gg/starglow",
        icon: "/icons/discord-black-round.svg",
        alt: "Discord",
    },
    {
        href: "https://docs.starglow.io",
        icon: "/icons/gitbook-black-round.svg",
        alt: "Gitbook",
    },
    {
        href: "https://x.com/StarglowP",
        icon: "/icons/x-black-round.svg",
        alt: "X",
    },
    {
        href: "https://t.me/starglow_official",
        icon: "/icons/telegram-black-round.svg",
        alt: "Telegram",
    },
    {
        href: "https://medium.com/@Starglow",
        icon: "/icons/medium-black-round.svg",
        alt: "Medium",
    },
];

// 소셜 링크 아이템 컴포넌트
const SocialLinkItem = memo(
    ({
        href,
        icon,
        alt,
        frameSize,
        minimal,
    }: {
        href: string;
        icon: string;
        alt: string;
        frameSize: number;
        minimal?: boolean;
    }) => (
        <LinkButton
            href={href}
            target="_blank"
            frameSize={frameSize}
            paddingSize={minimal ? 0 : undefined}
            aria-label={`Follow us on ${alt}`}
        >
            <img
                src={icon}
                alt={alt}
                style={{ width: `${frameSize}px`, height: "auto" }}
                loading="lazy"
            />
        </LinkButton>
    )
);
SocialLinkItem.displayName = "SocialLinkItem";

// 메모이제이션된 FollowUs 컴포넌트
const FollowUs = memo(function FollowUs({
    frameSize = 20,
    textSize = 15,
    gapSize = 15,
    minimal = false,
    className = "",
}: FollowUsProps) {
    const { gapClass } = getResponsiveClass(gapSize);
    const { textClass } = getResponsiveClass(textSize);

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center text-center",
                className
            )}
        >
            {!minimal && (
                <h3
                    className={cn(
                        "font-main text-foreground",
                        textClass,
                        "mb-1"
                    )}
                >
                    FOLLOW US ON SOCIAL MEDIA
                </h3>
            )}

            <div className={cn("flex items-center justify-center", gapClass)}>
                {socialLinks.map(({ href, icon, alt }) => (
                    <SocialLinkItem
                        key={alt}
                        href={href}
                        icon={icon}
                        alt={alt}
                        frameSize={frameSize}
                        minimal={minimal}
                    />
                ))}
            </div>
        </div>
    );
});

export default FollowUs;
