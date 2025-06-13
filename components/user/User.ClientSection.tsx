"use client";
import React, { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import UserMenu, { Tab } from "./User.Menu";
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
const UserSettings = dynamic(() => import("./User.Settings"), {
    loading: () => {
        return (
            <div className="flex items-center justify-center h-full">
                <PartialLoading text="Loading Settings..." size="sm" />
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
    const [selectedTab, setSelectedTab] = useState<Tab>("mystar");

    const handleTabChange = useCallback((tab: Tab) => {
        setSelectedTab(tab);
    }, []);

    const renderContent = useMemo(() => {
        if (selectedTab === "mystar") {
            return (
                <UserMyStar
                    user={user}
                    player={player}
                    userVerifiedSPGs={userVerifiedSPGs ?? []}
                />
            );
        } else if (selectedTab === "rewards") {
            return <UserRewards user={user} player={player} />;
        } else if (selectedTab === "yap") {
            return <div>YAP</div>;
        } else if (selectedTab === "settings") {
            return <UserSettings user={user} player={player} />;
        }
    }, [selectedTab, user, player, userVerifiedSPGs]);

    return (
        <>
            <UserMenu onTabChange={handleTabChange} />
            {renderContent}
        </>
    );
});

export default UserClientSection;
