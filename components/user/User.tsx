/// components/user/User.tsx

"use client";

import { Player } from "@prisma/client";
import type { User } from "next-auth";
import UserProfile from "./User.Profile";
import PublicPrivateTab from "../molecules/PublicPrivateTab";
import { useState } from "react";
import UserRewards from "./User.Rewards";
import UserMyStar from "./User.MyStar";
import { cn } from "@/lib/utils/tailwind";
import { useCollectionGet } from "@/app/hooks/useCollectionV2";

interface UserProps {
    user: User;
    player: Player;
}

export default function User({ user, player }: UserProps) {
    const [isPublic, setIsPublic] = useState(true);

    const {
        userVerifiedCollections,
        isUserVerifiedCollectionsLoading,
        userVerifiedCollectionsError,
        refetchUserVerifiedCollections,
    } = useCollectionGet({
        getUserVerifiedCollectionsInput: {
            userId: user.id ?? "",
        },
    });

    return (
        <div className="overflow-hidden">
            <div className="flex items-center justify-center">
                <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
                <div
                    className={cn(
                        "mt-[60px] lg:mt-[30px]",
                        "flex flex-col items-center justify-center"
                    )}
                >
                    <UserProfile user={user} player={player} />
                    <PublicPrivateTab
                        isPublic={isPublic}
                        onPublic={() => setIsPublic(true)}
                        onPrivate={() => setIsPublic(false)}
                        className="mt-[50px] mb-[10px]"
                        frameSize={20}
                        textSize={30}
                        gapSize={5}
                        paddingSize={10}
                        publicText="My Star"
                        publicIcon="/ui/user/user-mystar.svg"
                        privateText="Rewards"
                        privateIcon="/ui/user/user-rewards.svg"
                    />
                    {isPublic ? (
                        <UserMyStar
                            user={user}
                            player={player}
                            userVerifiedCollections={
                                userVerifiedCollections ?? []
                            }
                        />
                    ) : (
                        <UserRewards user={user} player={player} />
                    )}
                </div>
            </div>
        </div>
    );
}
