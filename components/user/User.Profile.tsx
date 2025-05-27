/// components/user/User.Profile.tsx

import { User } from "next-auth";
import ProfileImage from "@/components/atoms/ProfileImage";
import ProfileName from "@/components/atoms/ProfileName";
import { Player } from "@prisma/client";

interface UserProfileProps {
    user: User;
    player: Player;
}

export default function UserProfile({ user, player }: UserProfileProps) {
    console.log("User", user);
    console.log("Player", player);

    return (
        <div className="flex flex-col gap-[15px] items-center justify-center">
            <ProfileImage image={user.image} size={65} />
            <ProfileName user={user} player={player} size={20} />
        </div>
    );
}
