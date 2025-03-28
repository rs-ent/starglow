/// templates\UserTemplate.tsx

"use client";

import { useState } from "react";
import UserHeader from "@/components/organisms/UserHeader";
import UserSidebar from "@/components/organisms/UserSidebar";
import UserContent from "@/components/organisms/UserContent";
import type { User } from "@prisma/client";

export interface UserTemplateProps {
    userData: User;
    owner: boolean;
}

export default function UserTemplate({ userData, owner }: UserTemplateProps) {
    const [contentType, setContentType] = useState("mynfts");

    return (
        <div className="min-h-screen bg-background">
            <UserHeader src={userData.image as string} name={userData.name as string} isOwner={owner} />
            <div className="flex">
                <UserSidebar onSectionClick={setContentType} />
                <UserContent contentType={contentType} />
            </div>
        </div>
    );
}
