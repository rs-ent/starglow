"use client";
import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import PublicPrivateTab from "../atoms/PublicPrivateTab";
import { Player } from "@prisma/client";
import type { User } from "next-auth";
import { VerifiedCollection } from "@/app/actions/collectionContracts";

const UserMyStar = dynamic(() => import("./User.MyStar"), {
    loading: () => <div>Loading...</div>,
    ssr: false,
});
const UserRewards = dynamic(() => import("./User.Rewards"), {
    loading: () => <div>Loading...</div>,
    ssr: false,
});

interface Props {
    user: User;
    player: Player;
    userVerifiedCollections: VerifiedCollection[];
}

const UserClientSection = React.memo(function UserClientSection({
    user,
    player,
    userVerifiedCollections,
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
                    userVerifiedCollections={userVerifiedCollections ?? []}
                />
            ) : (
                <UserRewards user={user} player={player} />
            )}
        </>
    );
});

export default UserClientSection;
