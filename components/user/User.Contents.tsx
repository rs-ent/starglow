/// components/organisms/User/User.Contents.tsx

"use client";

import UserContentsMyAssets from "@/components/user/User.Contents.MyAssets";

interface UserContentsProps {
    selectedTab: string;
}

export default function UserContents({ selectedTab }: UserContentsProps) {
    return (
        <div className="max-w-[1000px] w-screen">
            {selectedTab === "storage" && <UserContentsMyAssets />}
        </div>
    );
}
