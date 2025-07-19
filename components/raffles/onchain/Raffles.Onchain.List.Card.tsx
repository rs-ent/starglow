/// components/raffles/web3/Raffles.Onchain.List.Card.tsx

"use client";

import { memo } from "react";
import { useOnchainRaffles } from "@/app/actions/raffles/onchain/hooks";
import Image from "next/image";
import { maxUint256 } from "viem";
import { useAssetsGet } from "@/app/actions/assets/hooks";

interface RafflesOnchainListCardProps {
    contractAddress: string;
    raffleId: string;
}

const INFINITE = maxUint256;

function RafflesOnchainListCard({
    contractAddress,
    raffleId,
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

    if (isRaffleCoreInfoForListCardLoading) {
        return <div>Loading...</div>;
    }
    if (isRaffleCoreInfoForListCardError) {
        return <div>Error</div>;
    }

    const coreData = raffleCoreInfoForListCard?.data;

    return (
        <div>
            <div>
                {coreData?.imageUrl && (
                    <Image
                        src={coreData?.imageUrl || ""}
                        alt={coreData?.title || ""}
                        width={100}
                        height={100}
                        priority={true}
                        unoptimized={false}
                    />
                )}
            </div>
            <div>
                <p>{coreData?.title}</p>
                <p>
                    {coreData?.startDate
                        ? new Date(
                              Number(coreData.startDate) * 1000
                          ).toLocaleString()
                        : ""}
                </p>
                <p>
                    {coreData?.endDate
                        ? new Date(
                              Number(coreData.endDate) * 1000
                          ).toLocaleString()
                        : ""}
                </p>
                <p>
                    {coreData?.drawDate
                        ? new Date(
                              Number(coreData.drawDate) * 1000
                          ).toLocaleString()
                        : ""}
                </p>
                <p>{coreData?.instantDraw ? "Yes" : "No"}</p>
                <p>
                    {coreData?.participationLimit
                        ? coreData.participationLimit >= INFINITE
                            ? "Infinite"
                            : coreData.participationLimit.toString()
                        : "0"}
                </p>
                <p>
                    {coreData?.participationLimitPerPlayer
                        ? coreData.participationLimitPerPlayer >= INFINITE
                            ? "Infinite"
                            : coreData.participationLimitPerPlayer.toString()
                        : "0"}
                </p>
                {asset?.iconUrl && (
                    <Image
                        src={asset?.iconUrl || ""}
                        alt={asset?.name || ""}
                        width={100}
                        height={100}
                        priority={false}
                        unoptimized={false}
                    />
                )}
                <p>{asset?.name}</p>
                <p>{coreData?.participationFeeAmount?.toString() || "0"}</p>
                <p>{coreData?.participationCount?.toString() || "0"}</p>
                <p>{coreData?.totalQuantity?.toString() || "0"}</p>
                <p>{coreData?.isActive ? "Yes" : "No"}</p>
                <p>{coreData?.isDrawn ? "Yes" : "No"}</p>
            </div>
        </div>
    );
}

export default memo(RafflesOnchainListCard);
