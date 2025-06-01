/// components/atoms/ProfileName.tsx

"use client";

import React from "react";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { User } from "next-auth";
import { Player } from "@prisma/client";
import { useMemo, useState } from "react";
import UserSettings from "../user/User.Settings";
import { getProviderIdentity } from "@/lib/utils/get/provider-identity";
import { ProviderType } from "@/app/types/auth";

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
                <UserSettings
                    user={user}
                    player={player}
                    onClose={() => setShowUserSettings(false)}
                    showImage={false}
                />
            )}
            <div
                className="flex flex-row gap-[5px] items-center justify-center group cursor-pointer"
                onClick={() => setShowUserSettings(true)}
            >
                {icon && (
                    <>
                        {provider !== "telegram" ? (
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
