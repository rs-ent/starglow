/// components/nfts/NFT.Contents.SaleDetail.tsx

import React, { useMemo } from "react";

import { CollectionParticipantType } from "@prisma/client";

import { formatDate } from "@/lib/utils/format";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import Countdown from "../atoms/Countdown";

import type { SPG } from "@/app/story/spg/actions";
interface NFTContentsPreRegistrationProps {
    spg: SPG;
    participantsType: CollectionParticipantType;
}

export default React.memo(function NFTContentsPreRegistration({
    spg,
    participantsType,
}: NFTContentsPreRegistrationProps) {
    const { saleLabel, date } = useMemo(() => {
        if (participantsType === CollectionParticipantType.PUBLICSALE) {
            return { saleLabel: "Sale End", date: spg.saleEnd };
        }

        return {
            saleLabel: "Coming Soon",
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
                <h3
                    className={cn(
                        "button-feather-purple !font-main my-[30px] text-center",
                        "hover:scale-120 transition-all duration-500",
                        getResponsiveClass(25).textClass
                    )}
                >
                    COMING SOON
                </h3>
            </div>
        </div>
    );
});
