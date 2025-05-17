/// components/user/User.Contents.MyAssets.NFT.tsx

"use client";

import UserMyAssetsNFTList from "./User.Contents.MyAssets.NFT.List";
import { User } from "next-auth";
import { Player } from "@prisma/client";

interface UserContentsMyAssetsNFTProps {
    user: User | null;
    player: Player | null;
}

export default function UserContentsMyAssetsNFT({
    user,
    player,
}: UserContentsMyAssetsNFTProps) {
    return (
        <div className="w-full">
            <UserMyAssetsNFTList user={user} player={player} />
        </div>
    );
}
