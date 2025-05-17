/// components/organisms/User/User.Contents.tsx

"use client";

import UserContentsMyAssets from "@/components/user/User.Contents.MyAssets";
import { User } from "next-auth";
import { Player } from "@prisma/client";
interface UserContentsProps {
    selectedTab: string;
    user: User | null;
    player: Player | null;
}

export default function UserContents({
    selectedTab,
    user,
    player,
}: UserContentsProps) {
    return (
        <div className="max-w-[1000px] w-screen">
            {selectedTab === "storage" && (
                <UserContentsMyAssets user={user} player={player} />
            )}
        </div>
    );
}
