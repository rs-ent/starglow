/// components/molecules/RewardPanel.tsx

"use client";

import { useMemo } from "react";
import { usePlayerAssetsGet } from "@/app/hooks/usePlayerAssets";
import { useAssetsGet } from "@/app/hooks/useAssets";
import Funds from "@/components/atoms/Funds";
import { Loader2 } from "lucide-react";
import { PlayerAsset, Asset } from "@prisma/client";

interface RewardPanelProps {
    playerId: string;
    assetNames: string[];
}

export default function RewardPanel({
    playerId,
    assetNames,
}: RewardPanelProps) {
    // SGP를 항상 포함
    const displayAssetNames = Array.from(new Set([...assetNames, "SGP"]));

    const { playerAssets, isPlayerAssetsLoading } = usePlayerAssetsGet({
        getPlayerAssetsInput: {
            filter: {
                playerId,
            },
        },
    });

    const displayPlayerAssets = useMemo(() => {
        const result = (
            playerAssets?.data as Array<PlayerAsset & { asset: Asset }>
        )?.filter((pa) => displayAssetNames.includes(pa.asset.name));

        return result;
    }, [playerAssets, displayAssetNames]);

    if (isPlayerAssetsLoading) {
        return <Loader2 className="w-4 h-4 animate-spin" />;
    }

    return (
        <div className="flex gap-2">
            {displayPlayerAssets?.map((asset) => {
                return (
                    <Funds
                        key={asset.id}
                        funds={asset?.balance ?? 0}
                        fundsLabel={asset.asset.symbol}
                        fundsIcon={asset.asset.iconUrl ?? undefined}
                        frameSize={20}
                        textSize={15}
                        gapSize={10}
                        paddingSize={5}
                    />
                );
            })}
        </div>
    );
}
