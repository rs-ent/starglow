/// components/raffles/web3/Raffles.Onchain.List.Card.tsx

"use client";

import { memo, useMemo } from "react";
import { useOnchainRaffles } from "@/app/actions/raffles/onchain/hooks";
import Link from "next/link";
import { useAssetsGet } from "@/app/actions/assets/hooks";
import RaffleOnchainHero from "./Raffle.Onchain.Hero";

interface RafflesOnchainListCardProps {
    contractAddress: string;
    raffleId: string;
}

function RafflesOnchainListCard({
    contractAddress,
    raffleId,
}: RafflesOnchainListCardProps) {
    const { raffleCoreInfoForListCard } = useOnchainRaffles({
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
                        coreData?.participationCount?.toString(),
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
        </Link>
    );
}

export default memo(RafflesOnchainListCard);
