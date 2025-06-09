"use client";
import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import PublicPrivateTab from "../atoms/PublicPrivateTab";
import { Player } from "@prisma/client";
import type { User } from "next-auth";
import { VerifiedSPG } from "@/app/story/interaction/actions";
import PartialLoading from "../atoms/PartialLoading";

const UserMyStar = dynamic(() => import("./User.MyStar"), {
    loading: () => {
        return (
            <div className="flex items-center justify-center h-full">
                <PartialLoading text="Loading My Star..." size="sm" />
            </div>
        );
    },
    ssr: false,
});
const UserRewards = dynamic(() => import("./User.Rewards"), {
    loading: () => {
        return (
            <div className="flex items-center justify-center h-full">
                <PartialLoading text="Loading Rewards..." size="sm" />
            </div>
        );
    },
    ssr: false,
});

interface Props {
    user: User;
    player: Player;
    userVerifiedSPGs: VerifiedSPG[];
}

const UserClientSection = React.memo(function UserClientSection({
    user,
    player,
    userVerifiedSPGs,
}: Props) {
    const [isPublic, setIsPublic] = useState(true);

    const handlePublic = useCallback(() => setIsPublic(true), []);
    const handlePrivate = useCallback(() => setIsPublic(false), []);

    return (
        <>
            <PublicPrivateTab
                isPublic={isPublic}
                onPublic={handlePublic}
                onPrivate={handlePrivate}
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
                    userVerifiedSPGs={userVerifiedSPGs ?? []}
                />
            ) : (
                <UserRewards user={user} player={player} />
            )}
        </>
    );
});

export default UserClientSection;
