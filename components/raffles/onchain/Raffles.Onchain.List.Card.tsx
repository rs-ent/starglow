/// components/raffles/web3/Raffles.Onchain.List.Card.tsx

"use client";

import { memo, useMemo } from "react";
import { useOnchainRafflesV2 } from "@/app/actions/raffles/onchain/hooks-v2";
import Link from "next/link";
import { useAssetsGet } from "@/app/actions/assets/hooks";
import RaffleOnchainHero from "./Raffle.Onchain.Hero";
import PartialLoading from "@/components/atoms/PartialLoading";

interface RafflesOnchainListCardProps {
    contractAddress: string;
    raffleId: string;
}

function RafflesOnchainListCard({
    contractAddress,
    raffleId,
}: RafflesOnchainListCardProps) {
    const { raffleCardInfo, isRaffleCardInfoLoading } = useOnchainRafflesV2({
        getRaffleCardInfoInput: {
            contractAddress,
            raffleId,
        },
    });

    const coreData = useMemo(() => {
        return raffleCardInfo?.data;
    }, [raffleCardInfo]);

    const { asset } = useAssetsGet({
        getAssetInput: {
            id: coreData?.participationFeeAssetId || "",
        },
    });

    if (isRaffleCardInfoLoading) {
        return (
            <div className="relative flex w-full h-32 overflow-hidden items-center justify-center">
                <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
                <PartialLoading />
            </div>
        );
    }

    return (
        <Link
            className="gpu-animate cursor-pointer scale-95 hover:scale-100 transition-all duration-300"
            href={`/raffles/onchain/${contractAddress}/${raffleId}`}
        >
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
                    drawDate: coreData?.drawDate?.toString(),
                    startDate: coreData?.startDate?.toString(),
                    endDate: coreData?.endDate?.toString(),
                    instantDraw: coreData?.instantDraw?.toString(),
                    participationLimit:
                        coreData?.participationLimit?.toString(),
                    participationCount:
                        coreData?.totalParticipations?.toString(),
                    participationFeeAsset: {
                        symbol: asset?.symbol || "",
                        iconUrl: asset?.iconUrl || "",
                    },
                    participationFeeAmount:
                        coreData?.participationFeeAmount?.toString(),
                    uniqueParticipants:
                        coreData?.uniqueParticipants?.toString(),
                }}
                raffleId={raffleId}
            />
        </Link>
    );
}

export default memo(RafflesOnchainListCard);
