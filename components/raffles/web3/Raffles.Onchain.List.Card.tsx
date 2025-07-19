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

export default memo(function RafflesOnchainListCard({
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
});

/*
data
: 
currentBestPrize
: 
assetId
: 
"cmcq98cyn00vpjt0vlxsb9esn"
collectionAddress
: 
"0x0000000000000000000000000000000000000000"
description
: 
""
iconUrl
: 
""
imageUrl
: 
"https://pv9tnti4kdvwxlot.public.blob.vercel-storage.com/b0d17873-ae14-4089-be8d-adad56a6b57b_1088x1088-qNk4bjkCafc39pzNTMReS2UJLlOBFm.webp"
order
: 
3n
pickedTicketQuantity
: 
0n
prizeQuantity
: 
2n
prizeType
: 
1
rarity
: 
2n
registeredTicketQuantity
: 
100n
startTicketNumber
: 
850n
title
: 
"SGP x2"
tokenIds
: 
[]
[[Prototype]]
: 
Object
defaultBestPrize
: 
assetId
: 
"cmcq98cyn00vpjt0vlxsb9esn"
collectionAddress
: 
"0x0000000000000000000000000000000000000000"
description
: 
""
iconUrl
: 
""
imageUrl
: 
"https://pv9tnti4kdvwxlot.public.blob.vercel-storage.com/b0d17873-ae14-4089-be8d-adad56a6b57b_1088x1088-qNk4bjkCafc39pzNTMReS2UJLlOBFm.webp"
order
: 
3n
pickedTicketQuantity
: 
0n
prizeQuantity
: 
2n
prizeType
: 
1
rarity
: 
2n
registeredTicketQuantity
: 
100n
startTicketNumber
: 
0n
title
: 
"SGP x2"
tokenIds
: 
[]
[[Prototype]]
: 
Object
drawDate
: 
1756064880n
endDate
: 
1756063080n
iconUrl
: 
"https://w3s.link/ipfs/bafkreibaa6y5aojsncvtinj2xdssvfqsbteywn273vda5kughqasdjl4lm"
imageUrl
: 
"https://w3s.link/ipfs/bafkreibaa6y5aojsncvtinj2xdssvfqsbteywn273vda5kughqasdjl4lm"
instantDraw
: 
true
isActive
: 
true
isDrawn
: 
false
participationCount
: 
0n
participationFeeAmount
: 
1n
participationFeeAssetId
: 
"cmcq98cyn00vpjt0vlxsb9esn"
participationLimit
: 
1000n
participationLimitPerPlayer
: 
115792089237316195423570985008687907853269984665640564039457584007913129639935n
raffleId
: 
1n
startDate
: 
1752813581n
title
: 
"BEPOLIA RAFFLE"
totalQuantity
: 
1000n
[[Prototype]]
: 
Object
success
: 
true
*/
