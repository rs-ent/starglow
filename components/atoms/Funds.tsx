/// components/atoms/Funds.tsx

import Image from "next/image";
import { H3 } from "./Typography";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import CountUp from "react-countup";

interface FundsProps {
    funds: number;
    fundsLabel?: string;
    fundsIcon?: string;
    frameSize?: number;
    textSize?: number;
    gapSize?: number;
    className?: string;
}

export default function Funds({
    funds = 0,
    fundsLabel = "Funds",
    fundsIcon,
    frameSize = 20,
    textSize = 20,
    gapSize = 20,
    className = "",
}: FundsProps) {

    const { textClass } = getResponsiveClass(textSize);
    const { frameClass } = getResponsiveClass(frameSize);
    const { gapClass } = getResponsiveClass(gapSize);

    return (
        <div className={cn("flex items-center justify-center cursor-pointer bg-muted rounded-full transition-all py-1 px-2 shadow-lg", className)}>
            <div className={cn("flex items-center justify-center", gapClass)}>
                {fundsIcon && (
                    <div className="p-1 bg-gradient-to-br from-[rgba(0,0,0,0.7)] to-[rgba(255,255,255,0.3)] rounded-full flex items-center justify-center">
                        {fundsIcon.endsWith('.svg') ? (
                            <img
                                src={fundsIcon}
                                alt={`${fundsLabel} logo`}
                                className={cn(frameClass)}
                                style={{ width: `${frameSize}px`, height: 'auto' }}
                            />
                        ) : (
                            <Image
                                src={fundsIcon}
                                alt={`${fundsLabel} logo`}
                                width={frameSize}
                                height={frameSize}
                                className={cn(frameClass)}
                                style={{ objectFit: 'contain' }}
                            />
                        )}
                    </div>
                )}
                <H3 className={cn(textClass, "mt-1 mr-2 text-foreground flex items-center justify-center")}>
                    <CountUp
                        end={funds}
                        duration={0.7}
                        separator=","
                    />
                </H3>
            </div>
        </div>
    )
}
