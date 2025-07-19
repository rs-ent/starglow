/// components/raffles/web3/Raffles.Onchain.List.Card.tsx

"use client";

import { memo } from "react";
import { useOnchainRaffles } from "@/app/actions/raffles/web3/hooks";
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

    return (
        <div>
            <div>
                <Image
                    src={raffleCoreInfoForListCard?.data?.imageUrl || ""}
                    alt={raffleCoreInfoForListCard?.data?.title || ""}
                    width={100}
                    height={100}
                />
            </div>
            <div>
                <p>{raffleCoreInfoForListCard?.data?.title}</p>
                <p>
                    {new Date(
                        Number(raffleCoreInfoForListCard?.data?.startDate) *
                            1000
                    ).toLocaleString()}
                </p>
                <p>
                    {new Date(
                        Number(raffleCoreInfoForListCard?.data?.endDate) * 1000
                    ).toLocaleString()}
                </p>
                <p>
                    {new Date(
                        Number(raffleCoreInfoForListCard?.data?.drawDate) * 1000
                    ).toLocaleString()}
                </p>
                <p>
                    {raffleCoreInfoForListCard?.data?.instantDraw
                        ? "Yes"
                        : "No"}
                </p>
                <p>
                    {raffleCoreInfoForListCard?.data?.participationLimit
                        ? raffleCoreInfoForListCard?.data?.participationLimit >=
                          INFINITE
                            ? "Infinite"
                            : raffleCoreInfoForListCard?.data?.participationLimit.toLocaleString()
                        : "0"}
                </p>
                <p>
                    {raffleCoreInfoForListCard?.data
                        ?.participationLimitPerPlayer
                        ? raffleCoreInfoForListCard?.data
                              ?.participationLimitPerPlayer >= INFINITE
                            ? "Infinite"
                            : raffleCoreInfoForListCard?.data?.participationLimitPerPlayer.toLocaleString()
                        : "0"}
                </p>
                <Image
                    src={asset?.iconUrl || ""}
                    alt={asset?.name || ""}
                    width={100}
                    height={100}
                />
                <p>{asset?.name}</p>
                <p>{raffleCoreInfoForListCard?.data?.participationFeeAmount}</p>
                <p>{raffleCoreInfoForListCard?.data?.participationCount}</p>
                <p>{raffleCoreInfoForListCard?.data?.totalQuantity}</p>
                <p>
                    {raffleCoreInfoForListCard?.data?.isActive ? "Yes" : "No"}
                </p>
                <p>{raffleCoreInfoForListCard?.data?.isDrawn ? "Yes" : "No"}</p>
            </div>
        </div>
    );
}

export default memo(RafflesOnchainListCard);
