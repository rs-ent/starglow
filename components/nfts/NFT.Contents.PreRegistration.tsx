/// components/nfts/NFT.Contents.SaleDetail.tsx

import { CollectionParticipantType } from "@prisma/client";
import { useMemo } from "react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { formatDate } from "@/lib/utils/format";
import Countdown from "../atoms/Countdown";
import React from "react";
import { SPG } from "@/app/story/spg/actions";
interface NFTContentsPreRegistrationProps {
    spg: SPG;
    participantsType: CollectionParticipantType;
    status: string;
}

export default React.memo(function NFTContentsPreRegistration({
    spg,
    participantsType,
    status,
}: NFTContentsPreRegistrationProps) {
    const { saleLabel, date } = useMemo(() => {
        if (participantsType === CollectionParticipantType.PUBLICSALE) {
            return { saleLabel: "Sale End", date: spg.saleEnd };
        }

        return {
            saleLabel: "Sale Open",
            date: spg.saleStart,
        };
    }, [participantsType, spg.saleEnd, spg.saleStart]);

    if (!date) return null;

    return (
        <div className="w-full bg-card/40 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 p-6">
            <div
                className={cn(
                    "flex flex-col items-center justify-center",
                    "text-center"
                )}
            >
                <h2 className={cn(getResponsiveClass(45).textClass)}>
                    {saleLabel}
                </h2>
                <h3
                    className={cn(
                        getResponsiveClass(35).textClass,
                        "text-glow-white-smooth animate-pulse"
                    )}
                >
                    {formatDate(date)}
                </h3>

                <div
                    className={cn(
                        "flex flex-col items-center justify-center",
                        "bg-[#471ca9] rounded-sm w-full",
                        "border border-white/40 font-main p-5 my-[30px]"
                    )}
                >
                    <Countdown endDate={date} className="opacity-80" />
                </div>

                <h3 className={cn(getResponsiveClass(20).textClass)}>
                    NOW OR NEVER!
                </h3>
                <h3
                    className={cn(
                        getResponsiveClass(20).textClass,
                        "text-[rgba(255,255,255,0.7)] text-center"
                    )}
                >
                    {participantsType === CollectionParticipantType.PUBLICSALE
                        ? "PURCHASE NOW AND GET YOURS"
                        : "PRE-ORDER TO GET YOURS"}
                </h3>
                <h3
                    className={cn(
                        "button-feather-purple !font-main my-[30px] text-center",
                        "hover:scale-120 transition-all duration-500",
                        getResponsiveClass(30).textClass
                    )}
                >
                    Pre-Order
                </h3>
            </div>
        </div>
    );
});
