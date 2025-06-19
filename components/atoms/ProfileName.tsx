/// components/atoms/ProfileName.tsx

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { User } from "next-auth";
import { Player } from "@prisma/client";
import { useMemo } from "react";
import { getProviderIdentity } from "@/lib/utils/get/provider-identity";
import { ProviderType } from "@/app/types/auth";
import UserSettingsProfileModal from "../user/User.Settings.Profile.Modal";

interface ProfileNameProps {
    user: User;
    player: Player;
    size?: number;
}

export default React.memo(function ProfileName({
    user,
    player,
    size = 20,
}: ProfileNameProps) {
    const [showUserSettings, setShowUserSettings] = useState(false);

    const { provider, icon, color, nickname } = useMemo(() => {
        const provider = (user as any).provider as ProviderType | undefined;
        const { icon, color } = getProviderIdentity(provider);
        const nickname = player?.nickname || user?.name || user?.email || "";
        return { provider, icon, color, nickname };
    }, []);

    const { textClass, frameClass, iconClass } = useMemo(() => {
        return {
            textClass: getResponsiveClass(size).textClass,
            frameClass: getResponsiveClass(size + 5).frameClass,
            iconClass: getResponsiveClass(size - 5).frameClass,
        };
    }, [size]);

    return (
        <>
            {showUserSettings && (
                <UserSettingsProfileModal
                    player={player}
                    user={user}
                    showNickname={true}
                    showImage={false}
                    onClose={() => setShowUserSettings(false)}
                />
            )}
            <div
                className="flex flex-row gap-[5px] items-center justify-center group cursor-pointer"
                onClick={() => setShowUserSettings(true)}
            >
                {icon && (
                    <>
                        {provider !== "telegram" &&
                        provider !== "io.metamask" &&
                        provider !== "metaMaskSDK" ? (
                            <div
                                className={cn(
                                    "rounded-full",
                                    "flex items-center justify-center",
                                    color,
                                    frameClass
                                )}
                            >
                                <img
                                    src={icon}
                                    alt={`${provider} icon`}
                                    className={iconClass}
                                />
                            </div>
                        ) : (
                            <img
                                src={icon}
                                alt={`${provider} icon`}
                                className={iconClass}
                            />
                        )}
                    </>
                )}
                <p className={cn("text-[rgba(255,255,255,0.7)]", textClass)}>
                    {nickname}
                </p>
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <img
                        src="/ui/edit.svg"
                        alt="Edit"
                        className={getResponsiveClass(5).frameClass}
                    />
                </div>
            </div>
        </>
    );
});
