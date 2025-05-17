/// components/user/User.Contents.MyAssets.Rewards.tsx

"use client";

import { User } from "next-auth";
import { Player } from "@prisma/client";

interface UserContentsMyAssetsRewardsProps {
    user: User | null;
    player: Player | null;
}
export default function UserContentsMyAssetsRewards({
    user,
    player,
}: UserContentsMyAssetsRewardsProps) {
    return <div>UserContentsMyAssetsRewards</div>;
}
