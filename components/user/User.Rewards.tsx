/// components/user/User.Rewards.tsx

"use client";

import { Player } from "@prisma/client";
import { User } from "next-auth";

interface UserRewardsProps {
    user: User;
    player: Player;
}

export default function UserRewards({ user, player }: UserRewardsProps) {
    return <div>UserRewards</div>;
}
