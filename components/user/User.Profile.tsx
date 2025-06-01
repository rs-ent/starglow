/// components/user/User.Profile.tsx

import React from "react";
import { User } from "next-auth";
import ProfileImage from "@/components/atoms/ProfileImage";
import ProfileName from "@/components/atoms/ProfileName";
import { Player } from "@prisma/client";

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
