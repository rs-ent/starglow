/// components/molecules/FollowUs.tsx

import { H3 } from "../atoms/Typography";
import LinkButton from "../atoms/LinkButton";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface FollowUsProps {
    frameSize?: number;
    textSize?: number;
    gapSize?: number;
    minimal?: boolean;
    className?: string;
}

const socialLinks = [
    { href: "https://docs.starglow.io", icon: "/icons/gitbook-black-round.svg", alt: "Gitbook" },
    { href: "https://x.com/StarglowP", icon: "/icons/x-black-round.svg", alt: "X" },
    { href: "https://t.me/StarglowP_Ann", icon: "/icons/telegram-black-round.svg", alt: "Telegram" },
    { href: "https://medium.com/@starglowP", icon: "/icons/medium-black-round.svg", alt: "Medium" },
];

export default function FollowUs({
    frameSize = 20,
    textSize = 15,
    gapSize = 15,
    minimal = false,
    className = "",
}: FollowUsProps) {
    const { gapClass } = getResponsiveClass(gapSize);
    const { textClass } = getResponsiveClass(textSize);

    return (
        <div className={cn("flex flex-col items-center justify-center text-center", className)}>
            {!minimal && (
                <H3 className={cn("font-main text-foreground", textClass, "mb-1")}>
                    FOLLOW US ON SOCIAL MEDIA
                </H3>
            )}

            <div className={cn("flex items-center justify-center", gapClass)}>
                {socialLinks.map(({ href, icon, alt }) => (
                    <LinkButton key={alt} href={href} target="_blank" frameSize={frameSize} paddingSize={minimal ? 0 : undefined}>
                        <img
                            src={icon}
                            alt={alt}
                            style={{ width: `${frameSize}px`, height: "auto" }}
                        />
                    </LinkButton>
                ))}
            </div>
        </div>
    );
}
