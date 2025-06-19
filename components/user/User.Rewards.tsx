/// components/user/User.Rewards.tsx

"use client";

import { Player, PlayerAsset, Asset } from "@prisma/client";
import { usePlayerAssetsGet } from "@/app/hooks/usePlayerAssets";
import { cn } from "@/lib/utils/tailwind";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import PartialLoading from "../atoms/PartialLoading";

interface UserRewardsProps {
    player: Player | null;
    playerAssets: PlayerAsset[];
}

export type PlayerAssetWithAsset = PlayerAsset & { asset: Asset };

const UserRewardModalCardV2 = dynamic(
    () => import("./User.Reward.Modal.Card.V2"),
    {
        loading: () => {
            return (
                <div className="flex items-center justify-center w-full h-full">
                    <PartialLoading text="Loading..." />
                </div>
            );
        },
        ssr: false,
    }
);

export default function UserRewards({
    player,
    playerAssets,
}: UserRewardsProps) {
    const { playerAssetList, slots } = useMemo(() => {
        const playerAssetList = (playerAssets ??
            []) as Array<PlayerAssetWithAsset>;
        const length = playerAssetList.length;
        const rest = length % 3 === 0 ? 0 : 3 - (length % 3);
        const slots = Array.from({ length: length + rest }).map((_, idx) =>
            idx < length ? playerAssetList[idx] : null
        );

        return { playerAssetList, slots };
    }, [playerAssets]);

    return (
        <>
            <div
                className={cn(
                    "flex flex-col items-center justify-center w-screen max-w-[1000px] mx-auto",
                    "py-4 px-6 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-12",
                    "gap-[15px]"
                )}
            >
                <UserRewardModalCardV2
                    playerId={player?.id}
                    reward={playerAssetList[0]}
                    closeModal={() => {}}
                />
            </div>
        </>
    );
}
