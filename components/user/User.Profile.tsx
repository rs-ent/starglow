/// components/user/User.Profile.tsx

"use client";

import React from "react";

import ProfileImage from "@/components/atoms/ProfileImage";
import ProfileName from "@/components/atoms/ProfileName";

export default React.memo(function UserProfile() {
    return (
        <div className="flex flex-col gap-[15px] items-center justify-center">
            <ProfileImage size={65} />
            <ProfileName size={20} />
        </div>
    );
});
