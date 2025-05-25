/// components/user/User.Rewards.tsx

"use client";

import { Player, PlayerAsset, Asset } from "@prisma/client";
import { User } from "next-auth";
import { usePlayerAssetsGet } from "@/app/hooks/usePlayerAssets";
import { cn } from "@/lib/utils/tailwind";
import RewardButton from "@/components/atoms/Reward.Button";
import { useMemo, useState } from "react";
import UserRewardsModal from "./User.Rewards.Modal";
interface UserRewardsProps {
    user: User;
    player: Player | null;
}

export type PlayerAssetWithAsset = PlayerAsset & { asset: Asset };

export default function UserRewards({ user, player }: UserRewardsProps) {
    const { playerAssets, isPlayerAssetsLoading, playerAssetsError } =
        usePlayerAssetsGet({
            getPlayerAssetsInput: {
                filter: {
                    playerId: player?.id ?? "",
                },
            },
        });

    const { playerAssetList, slots } = useMemo(() => {
        const playerAssetList = (playerAssets?.data ??
            []) as Array<PlayerAssetWithAsset>;
        const length = playerAssetList.length;
        const rest = length % 3 === 0 ? 0 : 3 - (length % 3);
        const slots = Array.from({ length: length + rest }).map((_, idx) =>
            idx < length ? playerAssetList[idx] : null
        );

        return { playerAssetList, slots };
    }, [playerAssets]);

    const [selectedReward, setSelectedReward] =
        useState<PlayerAssetWithAsset | null>(null);
    const [showModal, setShowModal] = useState(false);

    const handleRewardClick = (asset: PlayerAssetWithAsset) => {
        setSelectedReward(asset);
        setShowModal(true);
    };

    return (
        <>
            <UserRewardsModal
                showModal={showModal}
                setShowModal={setShowModal}
                selectedReward={selectedReward}
                rewards={playerAssetList}
                player={player}
            />
            <div
                className={cn(
                    "grid grid-cols-3 gap-4 w-screen max-w-[1000px]",
                    "py-4 px-6 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-12",
                    "mb-[100px]"
                )}
            >
                {slots.map((asset: PlayerAssetWithAsset | null, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "w-full aspect-square relative",
                            "border-2 border-[rgba(255,255,255,0.2)] rounded-[18px]",
                            "bg-[rgba(255,255,255,0.05)] flex items-center justify-center",
                            "morp-glass-1",
                            asset ? "cursor-pointer" : "cursor-auto"
                        )}
                        onClick={() => {
                            if (asset) {
                                handleRewardClick(asset);
                            }
                        }}
                    >
                        {asset && (
                            <RewardButton
                                index={idx}
                                balance={asset?.balance ?? 0}
                                icon={asset?.asset?.iconUrl ?? ""}
                                name={asset?.asset?.name ?? ""}
                                className={""}
                            />
                        )}
                    </div>
                ))}
            </div>
        </>
    );
}
