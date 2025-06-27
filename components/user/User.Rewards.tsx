/// components/user/User.Rewards.tsx

"use client";

import { cn } from "@/lib/utils/tailwind";
import type { Player } from "@prisma/client";
import UserRewardsInventory from "./User.Rewards.Inventory";

interface UserRewardsProps {
    player: Player | null;
}

export default function UserRewards({ player }: UserRewardsProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center w-screen max-w-[1000px] mx-auto",
                "px-4 sm:px-3 md:px-4 lg:px-6",
                "gap-[15px]"
            )}
        >
            <UserRewardsInventory player={player} />
        </div>
    );
}
