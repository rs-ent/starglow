/// templates/User.tsx

"use client";

import UserNavigation from "@/components/user/User.Navigation";
import UserContents from "@/components/user/User.Contents";
import { cn } from "@/lib/utils/tailwind";
import { useState, useMemo } from "react";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

const tabs = [
    {
        id: "storage",
        label: "Storage",
    },
    {
        id: "settings",
        label: "Settings",
    },
    {
        id: "sign-out",
        label: "Sign Out",
    },
];

export default function User() {
    const [selectedTab, setSelectedTab] = useState<string>(tabs[0].id);
    const { data: session } = useSession();

    const { user, player } = useMemo(() => {
        return {
            user: session?.user ?? null,
            player: session?.player ?? null,
        };
    }, [session]);

    const handleSelect = (tab: string) => {
        if (tab === "sign-out") {
            signOut({ callbackUrl: "/?signedOut=true" });
            return;
        }

        setSelectedTab(tab);
    };

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center",
                "overflow-x-hidden"
            )}
        >
            <div
                className={cn(
                    "fixed inset-0 w-screen h-screen -z-50",
                    "bg-gradient-to-b from-[#09021B] to-[#311473]"
                )}
            />
            <div className="mt-[100px] lg:mt-[50px] mb-[50px]">
                <UserNavigation tabs={tabs} onSelect={handleSelect} />
            </div>

            <div className="relative">
                <UserContents
                    selectedTab={selectedTab}
                    user={user}
                    player={player}
                />
            </div>
        </div>
    );
}
