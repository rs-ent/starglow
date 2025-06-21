/// components/organisms/Footer.tsx

import {memo} from "react";

import {cn} from "@/lib/utils/tailwind";

import FollowUs from "./FollowUs";

interface FooterProps {
    followUsVisible?: boolean;
    followUsMinimal?: boolean;
    followUsFrameSize?: number;
    followUsTextSize?: number;
    followUsGapSize?: number;
}

// 메모이제이션된 로고 및 저작권 컴포넌트
const LogoAndCopyright = memo(() => (
    <div className="flex flex-col gap-3 items-start">
        <img
            src="/logo/lt-row.svg"
            alt="Starglow"
            className="w-[120px] h-auto sm:w-[140px] md:w-[160px] lg:w-[180px] xl:w-[220px]"
            fetchPriority="low"
        />

        <p className="font-body font-extralight text-[0.6rem] sm:text-[0.6rem] md:text-[0.7rem] lg:text-[0.7rem] xl:text-[0.8rem]">
            Copyright ©{new Date().getFullYear()} Starglow. All rights reserved.
        </p>
    </div>
));
LogoAndCopyright.displayName = 'LogoAndCopyright';

// 메모이제이션된 Footer 컴포넌트
const Footer = memo(function Footer({
    followUsVisible = true,
    followUsMinimal = false,
    followUsFrameSize = 30,
    followUsTextSize = 10,
    followUsGapSize = 40,
}: FooterProps) {
    return (
        <footer
            className="bg-gradient-to-br from-[#161616] to-[#050505] pb-[50px] lg:pb-0"
            aria-label="Footer"
        >
            <div
                className={cn(
                    "flex bg-gradient-to-b from-black/40 to-transparent",
                    "gap-[20px] px-[36px] py-[32px]",
                    "sm:px-[40px] sm:py-[38px]",
                    "md:px-[60px] md:py-[44px]",
                    "lg:px-[80px] lg:py-[56px]",
                    "xl:px-[120px] xl:py-[60px]",
                    followUsMinimal
                        ? "flex-col justify-start items-start"
                        : "justify-between items-center"
                )}
            >
                <LogoAndCopyright />

                {followUsVisible && (
                    <FollowUs
                        frameSize={followUsFrameSize}
                        textSize={followUsTextSize}
                        gapSize={followUsGapSize}
                        minimal={followUsMinimal}
                    />
                )}
            </div>
        </footer>
    );
});

export default Footer;