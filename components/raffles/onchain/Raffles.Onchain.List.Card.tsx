/// components/raffles/web3/Raffles.Onchain.List.Card.tsx

"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Users, Gift, Target } from "lucide-react";
import { useOnchainRaffles } from "@/app/actions/raffles/onchain/hooks";
import Image from "next/image";
import Link from "next/link";
import { useAssetsGet } from "@/app/actions/assets/hooks";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import RaffleOnchainHero from "./Raffle.Onchain.Hero";

interface RafflesOnchainListCardProps {
    contractAddress: string;
    raffleId: string;
    index: number;
}

const DEFAULT_TITLE = "Untitled Raffle";

const getTimeUntilEnd = (endDate: string | number | bigint): string => {
    if (!endDate) return "N/A";

    const endTimestamp =
        typeof endDate === "bigint" ? Number(endDate) : Number(endDate);
    const endDateObj = new Date(endTimestamp * 1000);
    const now = new Date();
    const diff = endDateObj.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h left`;
};

function RafflesOnchainListCard({
    contractAddress,
    raffleId,
    index,
}: RafflesOnchainListCardProps) {
    const {
        raffleCoreInfoForListCard,
        isRaffleCoreInfoForListCardLoading,
        isRaffleCoreInfoForListCardError,
    } = useOnchainRaffles({
        getRaffleCoreInfoForListCardInput: {
            contractAddress,
            raffleId,
        },
    });

    const { asset } = useAssetsGet({
        getAssetInput: {
            id: raffleCoreInfoForListCard?.data?.participationFeeAssetId || "",
        },
    });

    const coreData = useMemo(() => {
        return raffleCoreInfoForListCard?.data;
    }, [raffleCoreInfoForListCard]);

    console.log("Core Data", coreData);

    return (
        <RaffleOnchainHero
            raffleData={{
                basicInfo: {
                    title: coreData?.title,
                    description: "",
                    imageUrl: coreData?.imageUrl || "",
                },
            }}
            showAsListCard
            listCardInfo={{
                startDate: coreData?.startDate?.toString(),
                endDate: coreData?.endDate?.toString(),
                participationLimit: coreData?.participationLimit?.toString(),
                participationCount: coreData?.participationCount?.toString(),
                participationFeeAsset: {
                    symbol: asset?.symbol || "",
                    iconUrl: asset?.iconUrl || "",
                },
                participationFeeAmount:
                    coreData?.participationFeeAmount?.toString(),
            }}
            contractAddress={contractAddress}
            raffleId={raffleId}
        />
    );
}

/*
raffleData?: {
        basicInfo?: {
            title?: string;
            description?: string;
            imageUrl?: string;
        };
    };
    contractAddress?: string;
    raffleId?: string;
*/

const OnchainRaffleCardSkeleton = memo(function OnchainRaffleCardSkeleton() {
    return (
        <motion.div
            className={cn(
                "morp-glass-1 inner-shadow rounded-[12px]",
                getResponsiveClass(30).paddingClass
            )}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
        >
            <div className="flex flex-col gap-2 md:flex-row p-2 w-full">
                <div className="w-full h-[200px] md:w-[400px] md:h-[300px] bg-white/10 rounded-[12px]" />
                <div className="flex-1 space-y-4">
                    <div className="h-6 bg-white/20 rounded w-3/4" />
                    <div className="h-4 bg-white/15 rounded w-1/2" />
                    <div className="grid grid-cols-2 gap-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-4 bg-white/10 rounded" />
                        ))}
                    </div>
                    <div className="h-12 bg-white/20 rounded" />
                </div>
            </div>
        </motion.div>
    );
});

export default memo(RafflesOnchainListCard);
