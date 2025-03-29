/// components/molecules/FollowUs.tsx

import { H3 } from "../atoms/Typography";
import LinkButton from "../atoms/LinkButton";
import Image from "next/image";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface FollowUsProps {
    frameSize?: number;
    textSize?: number;
    gapSize?: number;
    minimal?: boolean;
    className?: string;
}

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
            {minimal ? (
                <div className={cn("flex items-center justify-center", gapClass)}>
                    <LinkButton href="https://docs.starglow.io" target="_blank" frameSize={frameSize} paddingSize={0}>
                        <Image
                            src="/icons/gitbook-black-round.svg"
                            alt="Gitbook"
                            width={frameSize}
                            height={frameSize}
                        />
                    </LinkButton>

                    <LinkButton href="https://x.com/StarglowP" target="_blank" frameSize={frameSize} paddingSize={0}>
                        <Image
                            src="/icons/x-black-round.svg"
                            alt="X"
                            width={frameSize}
                            height={frameSize}
                        />
                    </LinkButton>

                    <LinkButton href="https://t.me/StarglowP_Ann" target="_blank" frameSize={frameSize} paddingSize={0}>
                        <Image
                            src="/icons/telegram-black-round.svg"
                            alt="Telegram"
                            width={frameSize}
                            height={frameSize}
                        />
                    </LinkButton>

                    <LinkButton href="https://medium.com/@starglowP" target="_blank" frameSize={frameSize} paddingSize={0}>
                        <Image
                            src="/icons/medium-black-round.svg"
                            alt="Medium"
                            width={frameSize}
                            height={frameSize}
                        />
                    </LinkButton>
                </div>
            ) : (
                <>
                    <H3 className={cn("font-main text-foreground", textClass, "mb-1")}>
                        FOLLOW US ON SOCIAL MEDIA
                    </H3>
                    <div className={cn("flex items-center justify-center", gapClass)}>
                        <LinkButton href="https://docs.starglow.io" target="_blank" frameSize={frameSize}>
                            <Image
                                src="/icons/gitbook-black-round.svg"
                                alt="Gitbook"
                                width={frameSize}
                                height={frameSize}
                            />
                        </LinkButton>

                        <LinkButton href="https://x.com/StarglowP" target="_blank" frameSize={frameSize}>
                            <Image
                                src="/icons/x-black-round.svg"
                                alt="X"
                                width={frameSize}
                                height={frameSize}
                            />
                        </LinkButton>

                        <LinkButton href="https://t.me/StarglowP_Ann" target="_blank" frameSize={frameSize}>
                            <Image
                                src="/icons/telegram-black-round.svg"
                                alt="Telegram"
                                width={frameSize}
                                height={frameSize}
                            />
                        </LinkButton>

                        <LinkButton href="https://medium.com/@starglowP" target="_blank" frameSize={frameSize}>
                            <Image
                                src="/icons/medium-black-round.svg"
                                alt="Medium"
                                width={frameSize}
                                height={frameSize}
                            />
                        </LinkButton>
                    </div>
                </>
            )}
        </div>
    );
}
