/// components/user/User.Contents.MyAssets.tsx

"use client";

import UserContentsMyAssetsNFT from "./User.Contents.MyAssets.NFT";
import UserContentsMyAssetsRewards from "./User.Contents.MyAssets.Rewards";

import { cn } from "@/lib/utils/tailwind";
import { useState } from "react";

const assetsTab = [
    {
        id: "nft",
        label: "Stars",
    },
    {
        id: "rewards",
        label: "Rewards",
    },
];

export default function UserContentsMyAssets() {
    const [selectedTab, setSelectedTab] = useState<string>(assetsTab[0].id);

    return (
        <div className="w-full">
            <div
                className={cn(
                    "mx-2 gap-0 justify-around",
                    "mb-[10px] sm:mb-[15px] md:mb-[20px] lg:mb-[25px]",
                    `grid grid-cols-${assetsTab.length}`
                )}
            >
                {assetsTab.map((tab) => (
                    <button
                        key={tab.id}
                        className={cn(
                            "py-2",
                            "transition-all duration-500",
                            selectedTab === tab.id
                                ? "border-b-1 border-[rgba(255,255,255,1)]"
                                : "border-b-1 border-[rgba(255,255,255,0.3)]"
                        )}
                        onClick={() => setSelectedTab(tab.id)}
                    >
                        <h2>{tab.label}</h2>
                    </button>
                ))}
            </div>
            {selectedTab === "nft" && <UserContentsMyAssetsNFT />}
            {selectedTab === "rewards" && <UserContentsMyAssetsRewards />}
        </div>
    );
}
