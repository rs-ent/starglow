/// components/user/User.Profile.tsx

"use client";

import React from "react";

import ProfileImage from "@/components/atoms/ProfileImage";
import ProfileName from "@/components/atoms/ProfileName";

import type { Player } from "@prisma/client";
import type { User } from "next-auth";

interface UserProfileProps {
    user: User;
    player: Player;
}

export default React.memo(function UserProfile({
    user,
    player,
}: UserProfileProps) {
    return (
        <div className="flex flex-col gap-[15px] items-center justify-center">
            <ProfileImage user={user} player={player} size={65} />
            <ProfileName user={user} player={player} size={20} />
        </div>
    );
});
