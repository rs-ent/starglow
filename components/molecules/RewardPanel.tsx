/// components/molecules/RewardPanel.tsx

import { usePlayerAssetsGet } from "@/app/hooks/usePlayerAssets";
import { useAssetsGet } from "@/app/hooks/useAssets";
import Funds from "@/components/atoms/Funds";
import { Loader2 } from "lucide-react";

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

    const { assets, isAssetsLoading, assetsError } = useAssetsGet();
    const filteredAssets =
        assets?.assets?.filter((asset) =>
            displayAssetNames.includes(asset.name)
        ) || [];

    const assetIds = filteredAssets.map((asset) => asset.id);

    const { playerAssets, isPlayerAssetsLoading } = usePlayerAssetsGet({
        getPlayerAssetsInput: {
            filter: {
                playerId,
                assetIds,
            },
        },
    });

    // 4. 렌더링
    if (isAssetsLoading || isPlayerAssetsLoading) {
        return <Loader2 className="w-4 h-4 animate-spin" />;
    }

    return (
        <div className="flex gap-2">
            {filteredAssets.map((asset) => {
                const playerAsset = playerAssets?.data.find(
                    (pa) => pa.assetId === asset.id
                );
                return (
                    <Funds
                        key={asset.id}
                        funds={playerAsset?.balance ?? 0}
                        fundsLabel={asset.symbol}
                        fundsIcon={asset.iconUrl ?? undefined}
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
