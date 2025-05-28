/// components/organisms/Footer.tsx

import FollowUs from "./FollowUs";
import { Paragraph } from "../atoms/Typography";

interface FooterProps {
    followUsVisible?: boolean;
    followUsMinimal?: boolean;
    followUsFrameSize?: number;
    followUsTextSize?: number;
    followUsGapSize?: number;
}

export default function Footer({
    followUsVisible = true,
    followUsMinimal = false,
    followUsFrameSize = 30,
    followUsTextSize = 10,
    followUsGapSize = 40,
}: FooterProps) {
    return (
        <div className="bg-gradient-to-br from-[rgba(22,22,22,1)] to-[rgba(5,5,5,1)] pb-[50px] lg:pb-[0px]">
            <div
                className={`
            flex bg-gradient-to-b from-[rgba(0,0,0,0.4)] to-[rgba(0,0,0,0)]
            ${
                followUsMinimal
                    ? "flex-col justify-start items-start"
                    : "justify-between items-center"
            }
            px-[36px] py-[32px] gap-[20px]
            sm:px-[40px] sm:py-[38px]
            md:px-[60px] md:py-[44px]
            lg:px-[80px] lg:py-[56px]
            xl:px-[120px] xl:py-[60px]
        `}
            >
                {/* Logo */}
                <div className={`flex flex-col gap-3 items-start`}>
                    <img
                        src="/logo/lt-row.svg"
                        alt="Starglow"
                        className="
                            w-[120px] h-auto
                            sm:w-[140px]
                            md:w-[160px]
                            lg:w-[180px]
                            xl:w-[220px]
                        "
                    />

                    <Paragraph
                        className="font-body font-extralight
                    text-[0.6rem] sm:text-[0.6rem] md:text-[0.7rem] lg:text-[0.7rem] xl:text-[0.8rem]
                "
                    >
                        Copyright ©Starglow. All rights reserved.
                    </Paragraph>
                </div>

                {/* Follow Us */}
                {followUsVisible && (
                    <FollowUs
                        frameSize={followUsFrameSize}
                        textSize={followUsTextSize}
                        gapSize={followUsGapSize}
                        minimal={followUsMinimal}
                    />
                )}
            </div>
        </div>
    );
}
