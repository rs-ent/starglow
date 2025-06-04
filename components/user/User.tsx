/// components/user/User.tsx

import UserProfile from "./User.Profile";
import UserClientSection from "./User.ClientSection";
import { Player } from "@prisma/client";
import type { User } from "next-auth";
import { VerifiedSPG } from "@/app/story/interaction/actions";

interface UserProps {
    user: User;
    player: Player;
    userVerifiedSPGs: VerifiedSPG[];
}

export default function User({ user, player, userVerifiedSPGs }: UserProps) {
    return (
        <div className="overflow-hidden">
            <div className="flex items-center justify-center">
                <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
                <div className="mt-[60px] lg:mt-[30px] flex flex-col items-center justify-center">
                    <UserProfile user={user} player={player} />
                    <UserClientSection
                        user={user}
                        player={player}
                        userVerifiedSPGs={userVerifiedSPGs}
                    />
                </div>
            </div>
        </div>
    );
}
