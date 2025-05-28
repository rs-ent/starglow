/// components/molecules/RewardPanel.tsx

"use client";

import { useMemo, useState } from "react";
import { usePlayerAssetsGet } from "@/app/hooks/usePlayerAssets";
import Funds from "@/components/atoms/Funds";
import { Loader2 } from "lucide-react";
import { PlayerAsset, Asset } from "@prisma/client";
import UserRewardsModal from "../user/User.Rewards.Modal";
import type { PlayerAssetWithAsset } from "../user/User.Rewards.Inventory";

interface RewardPanelProps {
    playerId: string;
    assetNames: string[];
}

export default function RewardPanel({
    playerId,
    assetNames,
}: RewardPanelProps) {
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [selectedReward, setSelectedReward] =
        useState<PlayerAssetWithAsset | null>(null);

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

    const handleRewardClick = (asset: PlayerAsset & { asset: Asset }) => {
        setSelectedReward(asset);
        setShowRewardModal(true);
    };

    return (
        <div className="relative">
            {showRewardModal && (
                <UserRewardsModal
                    playerId={playerId}
                    showModal={showRewardModal}
                    setShowModal={setShowRewardModal}
                    selectedReward={selectedReward}
                    rewards={displayPlayerAssets}
                />
            )}
            <div className="flex gap-2">
                {displayPlayerAssets?.map((asset) => {
                    return (
                        <div
                            key={asset.id}
                            onClick={() => handleRewardClick(asset)}
                        >
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
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
