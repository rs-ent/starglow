"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
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
                <PartialLoading text="Loading My Star..." />
            </div>
        );
    },
    ssr: false,
});
const UserRewards = dynamic(() => import("./User.Rewards"), {
    loading: () => {
        return (
            <div className="flex items-center justify-center h-full">
                <PartialLoading text="Loading Rewards..." />
            </div>
        );
    },
    ssr: false,
});

const UserTweets = dynamic(() => import("./User.Tweets"), {
    loading: () => {
        return (
            <div className="flex items-center justify-center h-full">
                <PartialLoading text="Loading..." />
            </div>
        );
    },
    ssr: false,
});

const UserSettings = dynamic(() => import("./User.Settings"), {
    loading: () => {
        return (
            <div className="flex items-center justify-center h-full">
                <PartialLoading text="Loading Settings..." />
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

    // URL 해시를 감지해서 해당 탭으로 자동 전환
    useEffect(() => {
        const hash = window.location.hash.replace("#", "");

        if (
            hash === "tweets" ||
            hash === "mystar" ||
            hash === "rewards" ||
            hash === "settings"
        ) {
            setSelectedTab(hash as Tab);
            window.history.replaceState(
                null,
                "",
                window.location.pathname + window.location.search
            );
        }
    }, []);

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
        } else if (selectedTab === "tweets") {
            return <UserTweets user={user} player={player} />;
        } else if (selectedTab === "settings") {
            return <UserSettings user={user} player={player} />;
        }
    }, [selectedTab, user, player, userVerifiedSPGs]);

    return (
        <>
            <UserMenu selectedTab={selectedTab} onTabChange={handleTabChange} />
            {renderContent}
        </>
    );
});

export default UserClientSection;
