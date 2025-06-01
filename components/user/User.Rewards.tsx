/// components/user/User.Rewards.tsx

"use client";

import { Player, PlayerAsset, Asset } from "@prisma/client";
import { User } from "next-auth";
import { usePlayerAssetsGet } from "@/app/hooks/usePlayerAssets";
import { cn } from "@/lib/utils/tailwind";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import PartialLoading from "../atoms/PartialLoading";

interface UserRewardsProps {
    user: User;
    player: Player | null;
}

export type PlayerAssetWithAsset = PlayerAsset & { asset: Asset };

const UserRewardModalCardV2 = dynamic(
    () => import("./User.Reward.Modal.Card.V2"),
    {
        loading: () => <div>Loading...</div>,
        ssr: false,
    }
);

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

    return (
        <>
            <div
                className={cn(
                    "w-screen max-w-[800px] mx-auto flex flex-col gap-4 mb-[100px] lg:mb-[50px]"
                )}
            >
                {isPlayerAssetsLoading ? (
                    <PartialLoading text="Loading..." size="sm" />
                ) : (
                    <UserRewardModalCardV2
                        playerId={player?.id}
                        reward={playerAssetList[0]}
                        closeModal={() => {}}
                    />
                )}
            </div>
        </>
    );
}
